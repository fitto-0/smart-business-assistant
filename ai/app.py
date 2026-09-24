"""
Point d'entrée du service AI.
Expose une API REST via Flask.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import Config
from core.exceptions import AIException, ValidationError
from core.validator import (
    require_payload, require_numeric_list, require_text,
    require_non_empty_list,
)
from core.data_loader import prepare_sales_series, prepare_products_list
from models.prediction import SalesPredictionModel
from models.sentiment import SentimentAnalyzer
from models.anomaly import AnomalyDetector
from models.recommendation import RecommendationEngine
from services.llm_chatbot import LLMChatbot
from services.csv_service import CSVAnalyzer

app = Flask(__name__)
CORS(app)

# Instanciation unique (singleton pattern)
predictor = SalesPredictionModel(degree=Config.PREDICTION_POLY_DEGREE)
sentiment_analyzer = SentimentAnalyzer(
    positive_threshold=Config.SENTIMENT_POSITIVE_THRESHOLD,
    negative_threshold=Config.SENTIMENT_NEGATIVE_THRESHOLD,
    negation_window=Config.SENTIMENT_NEGATION_WINDOW,
)
anomaly_detector = AnomalyDetector(
    zscore_threshold=Config.ANOMALY_ZSCORE_THRESHOLD,
    min_data_points=Config.ANOMALY_MIN_DATA_POINTS,
)
recommendation_engine = RecommendationEngine()
chatbot = LLMChatbot()
csv_analyzer = CSVAnalyzer()


# ---------- Gestion globale des erreurs ----------
@app.errorhandler(AIException)
def handle_ai_exception(e):
    return jsonify({"error": e.message, **e.details}), e.status_code


@app.errorhandler(Exception)
def handle_generic_exception(e):
    app.logger.exception("Unhandled error")
    return jsonify({"error": "Erreur interne", "details": str(e)}), 500


# ---------- Health check ----------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ---------- Prédiction ----------
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    require_payload(data)

    sales = require_numeric_list(data, "sales", min_length=Config.PREDICTION_MIN_DATA_POINTS)
    horizon = int(data.get("horizon", Config.PREDICTION_HORIZON_DEFAULT))
    horizon = max(1, min(horizon, Config.PREDICTION_HORIZON_MAX))
    months_labels = data.get("months_labels")

    result = predictor.predict(sales, horizon=horizon, months_labels=months_labels)
    return jsonify(result), 200


# ---------- Sentiment ----------
@app.route("/sentiment", methods=["POST"])
def sentiment():
    data = request.get_json(silent=True)
    require_payload(data)
    text = require_text(data, "text", min_length=2)
    return jsonify(sentiment_analyzer.analyze(text)), 200


# ---------- Anomalies ----------
@app.route("/anomalies", methods=["POST"])
def anomalies():
    data = request.get_json(silent=True)
    require_payload(data)

    sales_anomalies = []
    stock_anomalies = []
    lang = data.get("lang", "en") if isinstance(data.get("lang"), str) else "en"

    if "sales" in data and isinstance(data["sales"], list) and len(data["sales"]) >= Config.ANOMALY_MIN_DATA_POINTS:
        sales_series = prepare_sales_series(data["sales"])
        sales_anomalies = anomaly_detector.detect_sales_anomalies(sales_series.tolist(), lang=lang)

    if "products" in data and isinstance(data["products"], list):
        stock_anomalies = anomaly_detector.detect_stock_anomalies(data["products"], lang=lang)

    return jsonify({
        "sales_anomalies": sales_anomalies,
        "stock_anomalies": stock_anomalies,
        "total": len(sales_anomalies) + len(stock_anomalies),
    }), 200


# ---------- Recommandations ----------
@app.route("/recommendations", methods=["POST"])
def recommendations():
    data = request.get_json(silent=True)
    require_payload(data)

    anomalies = data.get("anomalies", [])
    products = data.get("products", [])
    sales_stats = data.get("sales_stats")
    reviews_stats = data.get("reviews_stats")
    lang = data.get("lang", "en") if isinstance(data.get("lang"), str) else "en"

    recs = recommendation_engine.generate(
        anomalies=anomalies,
        products=products,
        sales_stats=sales_stats,
        reviews_stats=reviews_stats,
        lang=lang,
    )
    return jsonify({"recommendations": recs, "total": len(recs)}), 200


# ---------- Chatbot ----------
@app.route("/chatbot", methods=["POST"])
def chatbot_route():
    data = request.get_json(silent=True)
    require_payload(data)
    question = require_text(data, "question", min_length=2)

    products = data.get("products", [])
    sales_stats = data.get("sales_stats")
    history = data.get("history", [])

    return jsonify(
        chatbot.respond(question, products, sales_stats, history)
    ), 200


# ---------- CSV ----------
@app.route("/analyze-csv", methods=["POST"])
def analyze_csv():
    if "file" not in request.files:
        raise ValidationError("Aucun fichier n'a été fourni.")

    file = request.files["file"]
    if not file.filename.lower().endswith(".csv"):
        raise ValidationError("Seuls les fichiers .csv sont acceptés.")

    content = file.read()
    result = csv_analyzer.analyze(content)
    return jsonify(result), 200


# ---------- Point d'entrée ----------
if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)