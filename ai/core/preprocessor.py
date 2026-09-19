"""
Prétraitement des données pour les modèles.
"""
import numpy as np
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression


def build_polynomial_regression(x: np.ndarray, y: np.ndarray, degree: int = 2):
    """
    Construit un modèle de régression polynomiale.
    Retourne (modèle, polynomial_features).
    """
    poly = PolynomialFeatures(degree=degree)
    x_poly = poly.fit_transform(x.reshape(-1, 1))

    model = LinearRegression()
    model.fit(x_poly, y)

    return model, poly


def predict_future(model, poly, last_index: int, horizon: int) -> np.ndarray:
    """
    Génère les prédictions pour les `horizon` prochaines périodes.
    """
    future_x = np.arange(last_index + 1, last_index + horizon + 1)
    future_x_poly = poly.transform(future_x.reshape(-1, 1))
    predictions = model.predict(future_x_poly)

    # Sécurité : pas de valeurs négatives
    predictions = np.maximum(predictions, 0)
    return predictions


def apply_seasonal_factor(predictions: np.ndarray, seasonal_amplitudes=None) -> np.ndarray:
    """
    Applique un facteur saisonnier simple.
    Le facteur alterne entre 1.0 et 1.05 selon le mois.
    Peut être affiné plus tard avec de vraies données saisonnières.
    """
    if seasonal_amplitudes is None:
        seasonal_amplitudes = [1.00, 0.98, 1.02, 1.00, 1.04, 1.06,
                               1.02, 0.99, 1.03, 1.01, 1.05, 1.10]

    adjusted = []
    for i, value in enumerate(predictions):
        factor = seasonal_amplitudes[i % 12]
        adjusted.append(value * factor)

    return np.array(adjusted)


def compute_train_test_split(x: np.ndarray, y: np.ndarray, test_size: float = 0.2):
    """
    Découpe chronologique (pas aléatoire) : les premières valeurs pour
    l'entraînement, les dernières pour le test.
    """
    n = len(y)
    split = max(int(n * (1 - test_size)), 1)
    return x[:split], y[:split], x[split:], y[split:]