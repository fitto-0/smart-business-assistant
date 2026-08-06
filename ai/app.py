"""
Smart Business Assistant - Module IA
Flask API pour les analyses IA : prédictions, sentiment, anomalies
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import mean_absolute_error, r2_score
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ===================== DONNÉES HISTORIQUES =====================
HISTORICAL_SALES = [42000, 38500, 51200, 47800, 55300, 62100, 58900, 49700, 63400, 71200, 84500, 92300]
MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

# ===================== MODULE PRÉDICTION =====================
class SalesPredictionModel:
    def __init__(self):
        self.model = LinearRegression()
        self.poly = PolynomialFeatures(degree=2)
        self.is_trained = False

    def train(self, sales_data: list) -> dict:
        """Entraîne le modèle sur les données historiques"""
        X = np.array(range(len(sales_data))).reshape(-1, 1)
        y = np.array(sales_data)
        X_poly = self.poly.fit_transform(X)
        self.model.fit(X_poly, y)
        self.is_trained = True
        y_pred = self.model.predict(X_poly)
        mae = mean_absolute_error(y, y_pred)
        r2 = r2_score(y, y_pred)
        return { 'mae': round(mae, 2), 'r2': round(r2, 4), 'accuracy': round(r2 * 100, 1) }

    def predict(self, n_periods: int = 6) -> list:
        """Prédit les N prochaines périodes"""
        if not self.is_trained:
            self.train(HISTORICAL_SALES)
        n_hist = len(HISTORICAL_SALES)
        predictions = []
        for i in range(n_periods):
            idx = np.array([[n_hist + i]])
            idx_poly = self.poly.transform(idx)
            pred = self.model.predict(idx_poly)[0]
            # Ajouter variabilité saisonnière
            seasonal_factor = 1 + 0.05 * np.sin((n_hist + i) * np.pi / 6)
            pred = max(pred * seasonal_factor, 0)
            predictions.append(round(pred))
        return predictions

predictor = SalesPredictionModel()
metrics = predictor.train(HISTORICAL_SALES)

# ===================== MODULE ANALYSE SENTIMENT =====================
class SentimentAnalyzer:
    """Analyseur de sentiment simple basé sur des mots-clés français"""
    POSITIVE_WORDS = ['excellent', 'parfait', 'magnifique', 'incroyable', 'rapide', 'satisfait',
                      'super', 'bon', 'bien', 'qualité', 'recommande', 'efficace', 'confortable', 'top']
    NEGATIVE_WORDS = ['déçu', 'mauvais', 'terrible', 'problème', 'cassé', 'défaite', 'incorrect',
                      'insatisfait', 'nul', 'horrible', 'retard', 'inexistant', 'défaut', 'périme']

    def analyze(self, text: str) -> dict:
        text_lower = text.lower()
        pos_count = sum(1 for w in self.POSITIVE_WORDS if w in text_lower)
        neg_count = sum(1 for w in self.NEGATIVE_WORDS if w in text_lower)
        total = pos_count + neg_count
        if total == 0:
            score = 0.5
            sentiment = 'neutre'
        else:
            score = pos_count / total
            if score >= 0.65:
                sentiment = 'positif'
            elif score <= 0.35:
                sentiment = 'négatif'
            else:
                sentiment = 'neutre'
        return {
            'sentiment': sentiment,
            'score': round(score, 3),
            'positive_words': pos_count,
            'negative_words': neg_count,
            'confidence': round(abs(score - 0.5) * 2, 3)
        }

    def analyze_batch(self, reviews: list) -> dict:
        results = [self.analyze(r.get('comment', '')) for r in reviews]
        stats = {'positif': 0, 'neutre': 0, 'négatif': 0}
        for r in results:
            stats[r['sentiment']] += 1
        total = len(results)
        return {
            'results': results,
            'summary': {k: {'count': v, 'percentage': round(v / total * 100, 1)} for k, v in stats.items()},
            'average_score': round(sum(r['score'] for r in results) / total, 3)
        }

analyzer = SentimentAnalyzer()

# ===================== MODULE DÉTECTION D'ANOMALIES =====================
class AnomalyDetector:
    def detect_sales_anomalies(self, sales: list, threshold: float = 1.5) -> list:
        """Détecte les anomalies dans les ventes par méthode IQR"""
        arr = np.array(sales)
        mean = np.mean(arr)
        std = np.std(arr)
        z_scores = np.abs((arr - mean) / std)
        anomalies = []
        for i, (val, z) in enumerate(zip(sales, z_scores)):
            if z > threshold:
                anomalies.append({
                    'index': i,
                    'month': MONTHS[i] if i < len(MONTHS) else f'Mois {i+1}',
                    'value': val,
                    'z_score': round(float(z), 3),
                    'deviation_pct': round(float((val - mean) / mean * 100), 1),
                    'type': 'baisse_anormale' if val < mean else 'pic_anormal'
                })
        return anomalies

    def detect_stock_anomalies(self, products: list) -> list:
        anomalies = []
        for p in products:
            stock = p.get('stock', 0)
            if stock == 0:
                anomalies.append({'product': p['name'], 'type': 'rupture', 'severity': 'critique', 'stock': 0})
            elif stock <= 10:
                anomalies.append({'product': p['name'], 'type': 'stock_faible', 'severity': 'haute', 'stock': stock})
        return anomalies

detector = AnomalyDetector()

# ===================== ROUTES API =====================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'module': 'AI Engine', 'version': '1.0.0', 'timestamp': datetime.now().isoformat()})

@app.route('/predict', methods=['GET', 'POST'])
def predict():
    """Prédit les ventes futures"""
    horizon = int(request.args.get('horizon', 6))
    if request.method == 'POST':
        data = request.get_json()
        sales_data = data.get('sales', HISTORICAL_SALES)
        predictor.train(sales_data)
    predictions_list = predictor.predict(min(horizon, 12))
    future_months = ['Jan 25', 'Fév 25', 'Mar 25', 'Avr 25', 'Mai 25', 'Juin 25',
                     'Juil 25', 'Août 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Déc 25']
    return jsonify({
        'predictions': [{'month': future_months[i], 'value': v} for i, v in enumerate(predictions_list)],
        'model_metrics': metrics,
        'horizon': horizon,
        'total_predicted': sum(predictions_list)
    })

@app.route('/sentiment', methods=['POST'])
def sentiment():
    """Analyse le sentiment d'un texte ou d'une liste d'avis"""
    data = request.get_json()
    if 'text' in data:
        result = analyzer.analyze(data['text'])
        return jsonify(result)
    elif 'reviews' in data:
        result = analyzer.analyze_batch(data['reviews'])
        return jsonify(result)
    return jsonify({'error': 'Fournir text ou reviews'}), 400

@app.route('/anomalies', methods=['POST'])
def anomalies():
    """Détecte les anomalies dans les données"""
    data = request.get_json()
    result = {}
    if 'sales' in data:
        result['sales_anomalies'] = detector.detect_sales_anomalies(data['sales'])
    if 'products' in data:
        result['stock_anomalies'] = detector.detect_stock_anomalies(data['products'])
    return jsonify(result)

@app.route('/analyze', methods=['POST'])
def full_analysis():
    """Analyse complète : prédictions + sentiment + anomalies + recommandations"""
    data = request.get_json()
    sales = data.get('sales', HISTORICAL_SALES)
    products = data.get('products', [])
    reviews = data.get('reviews', [])

    # Réentraîner si nouvelles données
    metrics_result = predictor.train(sales)
    pred_values = predictor.predict(6)

    # Sentiment
    sent_result = analyzer.analyze_batch(reviews) if reviews else None

    # Anomalies
    sales_anomalies = detector.detect_sales_anomalies(sales)
    stock_anomalies = detector.detect_stock_anomalies(products) if products else []

    # Générer recommandations automatiques
    recommendations = generate_recommendations(stock_anomalies, sales_anomalies, sent_result)

    return jsonify({
        'predictions': pred_values,
        'model_accuracy': metrics_result.get('accuracy'),
        'sentiment': sent_result,
        'anomalies': { 'sales': sales_anomalies, 'stock': stock_anomalies },
        'recommendations': recommendations,
        'analyzed_at': datetime.now().isoformat()
    })

def generate_recommendations(stock_anomalies, sales_anomalies, sentiment_data):
    """Génère des recommandations basées sur l'analyse"""
    recs = []
    for a in stock_anomalies:
        if a['type'] == 'rupture':
            recs.append({'priority': 'critique', 'type': 'stock', 'message': f"Réapprovisionnement urgent : {a['product']}", 'action': 'Commander immédiatement'})
        elif a['type'] == 'stock_faible':
            recs.append({'priority': 'haute', 'type': 'stock', 'message': f"Stock faible : {a['product']} ({a['stock']} unités)", 'action': 'Planifier réapprovisionnement'})
    for a in sales_anomalies:
        if a['type'] == 'baisse_anormale':
            recs.append({'priority': 'haute', 'type': 'ventes', 'message': f"Baisse anormale en {a['month']} ({a['deviation_pct']}%)", 'action': 'Analyser causes + lancer promotion'})
    if sentiment_data:
        neg_pct = sentiment_data['summary'].get('négatif', {}).get('percentage', 0)
        if neg_pct > 20:
            recs.append({'priority': 'haute', 'type': 'service', 'message': f"{neg_pct}% d'avis négatifs détectés", 'action': 'Améliorer qualité produit et service client'})
    return recs

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"🤖 Smart Business Assistant AI Engine starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
