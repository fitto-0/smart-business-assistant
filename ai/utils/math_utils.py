"""
Utilitaires mathématiques et statistiques.
Utilisé pour la détection d'anomalies.
"""
import numpy as np


def safe_mean(values):
    """Moyenne sécurisée (retourne 0 si vide)."""
    if not values:
        return 0.0
    return float(np.mean(values))


def safe_std(values):
    """Écart-type sécurisé (retourne 0 si vide ou une seule valeur)."""
    if not values or len(values) < 2:
        return 0.0
    return float(np.std(values))


def compute_zscore(value, mean, std):
    """
    Calcule le Z-score d'une valeur.
    Retourne 0 si l'écart-type est nul (évite la division par zéro).
    """
    if std == 0:
        return 0.0
    return (value - mean) / std


def compute_deviation_pct(value, mean):
    """Calcule le pourcentage de déviation par rapport à la moyenne."""
    if mean == 0:
        return 0.0
    return ((value - mean) / mean) * 100


def classify_severity(abs_zscore: float) -> str:
    """
    Classifie la sévérité d'une anomalie selon son Z-score absolu.
    """
    if abs_zscore >= 2.5:
        return "critique"
    if abs_zscore >= 2.0:
        return "haute"
    return "moyenne"