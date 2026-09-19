"""
Modèle de prédiction des ventes.

Approche : régression polynomiale de degré 2, avec :
- découpage train/test chronologique
- calcul de MAE, RMSE, R²
- facteur saisonnier
- validation du nombre minimum de points
"""
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from core.preprocessor import (
    build_polynomial_regression,
    predict_future,
    apply_seasonal_factor,
    compute_train_test_split,
)
from core.exceptions import InsufficientDataError


class SalesPredictionModel:
    def __init__(self, degree: int = 2, min_data_points: int = 6):
        self.degree = degree
        self.min_data_points = min_data_points

    def predict(self, sales: list, horizon: int = 6,
                months_labels: list = None) -> dict:
        """
        Génère les prédictions à partir d'une série de ventes.

        Arguments :
        - sales : liste de valeurs numériques (historique)
        - horizon : nombre de mois à prédire
        - months_labels : étiquettes des mois (ex: ["2026-01", "2026-02", ...])

        Retour :
        {
            "predictions": [{"month": "...", "value": ...}, ...],
            "metrics": {"mae": ..., "rmse": ..., "r2": ...},
            "based_on_points": N,
            "model": "Polynomial Regression (degree=2)"
        }
        """
        if len(sales) < self.min_data_points:
            raise InsufficientDataError(
                f"Au moins {self.min_data_points} mois d'historique sont requis "
                f"pour une prédiction fiable (reçu : {len(sales)})."
            )

        y = np.array(sales, dtype=float)
        x = np.arange(len(y))

        # --- Évaluation sur un split train/test chronologique ---
        x_train, y_train, x_test, y_test = compute_train_test_split(x, y, test_size=0.2)
        metrics = self._evaluate(x_train, y_train, x_test, y_test)

        # --- Entraînement final sur toutes les données ---
        model, poly = build_polynomial_regression(x, y, self.degree)

        # --- Prédiction ---
        raw_preds = predict_future(model, poly, last_index=len(y) - 1, horizon=horizon)
        final_preds = apply_seasonal_factor(raw_preds)

        # --- Étiquettes des mois ---
        if not months_labels:
            months_labels = self._default_months_labels(len(y), horizon)

        predictions = [
            {"month": months_labels[i], "value": round(float(final_preds[i]), 2)}
            for i in range(horizon)
        ]

        return {
            "predictions": predictions,
            "metrics": metrics,
            "based_on_points": len(y),
            "model": f"Polynomial Regression (degree={self.degree})",
        }

    def _evaluate(self, x_train, y_train, x_test, y_test) -> dict:
        """Entraîne un modèle sur train et évalue sur test."""
        if len(y_test) < 1:
            return {"mae": None, "rmse": None, "r2": None, "note": "Pas assez de données pour évaluation"}

        model, poly = build_polynomial_regression(x_train, y_train, self.degree)
        x_test_poly = poly.transform(x_test.reshape(-1, 1))
        y_pred = model.predict(x_test_poly)

        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))

        # R² nécessite au moins 2 points
        r2 = float(r2_score(y_test, y_pred)) if len(y_test) >= 2 else None

        return {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2": round(r2, 4) if r2 is not None else None,
        }

    def _default_months_labels(self, history_len: int, horizon: int) -> list:
        """Génère des étiquettes par défaut (ex: 2026-07, 2026-08...)."""
        from datetime import datetime, timedelta

        today = datetime.now().replace(day=1)
        labels = []
        for i in range(1, horizon + 1):
            month = today + timedelta(days=31 * i)
            labels.append(f"{month.year}-{month.month:02d}")
        return labels