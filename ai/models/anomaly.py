"""
Détection d'anomalies avec explications et sévérité.
Utilise le Z-score (pas d'IQR, conformément au code actuel).
"""
from utils.math_utils import (
    safe_mean, safe_std, compute_zscore,
    compute_deviation_pct, classify_severity
)
from core.exceptions import InsufficientDataError


class AnomalyDetector:
    def __init__(self, zscore_threshold: float = 1.5,
                 min_data_points: int = 4):
        self.zscore_threshold = zscore_threshold
        self.min_data_points = min_data_points

    def detect_sales_anomalies(self, sales: list) -> list:
        """
        Détecte les anomalies dans une série de ventes.
        Retourne une liste d'anomalies avec explications.
        """
        if len(sales) < self.min_data_points:
            raise InsufficientDataError(
                f"Au moins {self.min_data_points} points de données sont requis."
            )

        mean = safe_mean(sales)
        std = safe_std(sales)

        anomalies = []
        for i, value in enumerate(sales):
            z = compute_zscore(value, mean, std)

            if abs(z) <= self.zscore_threshold:
                continue

            deviation = compute_deviation_pct(value, mean)
            is_low = z < 0

            anomalies.append({
                "index": i,
                "type": "baisse_anormale" if is_low else "pic_anormal",
                "severity": classify_severity(abs(z)),
                "z_score": round(z, 2),
                "value": round(value, 2),
                "mean": round(mean, 2),
                "deviation_pct": round(deviation, 1),
                "explanation": self._explain(is_low, deviation, abs(z)),
            })

        return anomalies

    def detect_stock_anomalies(self, products: list) -> list:
        """
        Détecte les anomalies de stock.
        Un produit est en anomalie si :
        - rupture (stock = 0) → critique
        - stock faible par rapport au seuil → haute
        """
        anomalies = []

        for product in products:
            stock = product.get("stock", 0)
            threshold = product.get("low_stock_threshold") or product.get("min_stock") or 10
            name = product.get("name") or product.get("product_name", "Produit inconnu")

            if stock == 0:
                anomalies.append({
                    "type": "rupture_stock",
                    "severity": "critique",
                    "product_name": name,
                    "stock": 0,
                    "explanation": f"{name} est en rupture de stock.",
                })
            elif stock <= threshold * 0.5:
                anomalies.append({
                    "type": "stock_faible",
                    "severity": "haute",
                    "product_name": name,
                    "stock": stock,
                    "threshold": threshold,
                    "explanation": f"{name} a un stock faible ({stock} unités).",
                })
            elif stock <= threshold:
                anomalies.append({
                    "type": "stock_faible",
                    "severity": "moyenne",
                    "product_name": name,
                    "stock": stock,
                    "threshold": threshold,
                    "explanation": f"{name} approche du seuil de réapprovisionnement ({stock} unités).",
                })

        return anomalies

    def _explain(self, is_low: bool, deviation: float, abs_z: float) -> str:
        direction = "inférieur" if is_low else "supérieur"
        intensity = "significativement" if abs_z >= 2 else "modérément"
        return (
            f"La valeur est {intensity} {direction}e à la moyenne "
            f"({abs(deviation):.1f} % d'écart)."
        )