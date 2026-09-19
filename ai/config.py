"""
Configuration centralisée du service AI.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # Prediction
    PREDICTION_MIN_DATA_POINTS = 6      # Minimum 6 mois d'historique
    PREDICTION_HORIZON_DEFAULT = 6      # Prédire 6 mois par défaut
    PREDICTION_HORIZON_MAX = 12
    PREDICTION_POLY_DEGREE = 2

    # Sentiment
    SENTIMENT_POSITIVE_THRESHOLD = 0.65
    SENTIMENT_NEGATIVE_THRESHOLD = 0.35
    SENTIMENT_NEGATION_WINDOW = 3       # Nombre de mots avant un mot clé pour la négation

    # Anomaly
    ANOMALY_ZSCORE_THRESHOLD = 1.5
    ANOMALY_MIN_DATA_POINTS = 4
    ANOMALY_STOCK_CRITICAL_RATIO = 0.10  # < 10% du stock initial → critique
    ANOMALY_STOCK_HIGH_RATIO = 0.25      # < 25% du stock initial → haute

    # Recommendation
    RECOMMENDATION_NEGATIVE_REVIEW_THRESHOLD = 0.20  # 20% d'avis négatifs → alerte
    RECOMMENDATION_HIGH_IMPACT_MIN = 10000           # DA/mois