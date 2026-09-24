"""
Détection d'anomalies avec explications et sévérité.
Utilise le Z-score (pas d'IQR, conformément au code actuel).
"""
from utils.math_utils import (
    safe_mean, safe_std, compute_zscore,
    compute_deviation_pct, classify_severity
)
from core.exceptions import InsufficientDataError


EXPLANATION_TEMPLATES = {
    "en": {
        "unknown_product": "Unknown product",
        "below": "below",
        "above": "above",
        "strong": "significantly",
        "mild": "moderately",
        "sales_deviation": "Value {intensity} {direction} the mean ({dev:.1f}% away).",
        "stock_out": "{name} is out of stock.",
        "stock_low": "{name} is running low ({stock} units left).",
        "stock_close": "{name} is near the restock threshold ({stock} units left).",
        "need_data": "At least {n} data points are required.",
    },
    "fr": {
        "unknown_product": "Produit inconnu",
        "below": "inférieur",
        "above": "supérieur",
        "strong": "significativement",
        "mild": "modérément",
        "sales_deviation": "La valeur est {intensity} {direction}e à la moyenne ({dev:.1f} % d'écart).",
        "stock_out": "{name} est en rupture de stock.",
        "stock_low": "{name} a un stock faible ({stock} unités).",
        "stock_close": "{name} approche du seuil de réapprovisionnement ({stock} unités).",
        "need_data": "Au moins {n} points de données sont requis.",
    },
}


class AnomalyDetector:
    def __init__(self, zscore_threshold: float = 1.5,
                 min_data_points: int = 4):
        self.zscore_threshold = zscore_threshold
        self.min_data_points = min_data_points

    def detect_sales_anomalies(self, sales: list, lang: str = "en") -> list:
        """
        Détecte les anomalies dans une série de ventes.
        Retourne une liste d'anomalies avec explications.
        """
        t = EXPLANATION_TEMPLATES.get(lang, EXPLANATION_TEMPLATES["en"])
        if len(sales) < self.min_data_points:
            raise InsufficientDataError(
                t["need_data"].format(n=self.min_data_points)
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
                "explanation": self._explain(t, is_low, deviation, abs(z)),
            })

        return anomalies

    def detect_stock_anomalies(self, products: list, lang: str = "en") -> list:
        """
        Détecte les anomalies de stock.
        Un produit est en anomalie si :
        - rupture (stock = 0) → critique
        - stock faible par rapport au seuil → haute
        """
        t = EXPLANATION_TEMPLATES.get(lang, EXPLANATION_TEMPLATES["en"])
        anomalies = []

        for product in products:
            stock = product.get("stock", 0)
            threshold = product.get("low_stock_threshold") or product.get("min_stock") or 10
            name = product.get("name") or product.get("product_name", t["unknown_product"])

            if stock == 0:
                anomalies.append({
                    "type": "rupture_stock",
                    "severity": "critique",
                    "product_name": name,
                    "stock": 0,
                    "explanation": t["stock_out"].format(name=name),
                })
            elif stock <= threshold * 0.5:
                anomalies.append({
                    "type": "stock_faible",
                    "severity": "haute",
                    "product_name": name,
                    "stock": stock,
                    "threshold": threshold,
                    "explanation": t["stock_low"].format(name=name, stock=stock),
                })
            elif stock <= threshold:
                anomalies.append({
                    "type": "stock_faible",
                    "severity": "moyenne",
                    "product_name": name,
                    "stock": stock,
                    "threshold": threshold,
                    "explanation": t["stock_close"].format(name=name, stock=stock),
                })

        return anomalies

    def _explain(self, t: dict, is_low: bool, deviation: float, abs_z: float) -> str:
        direction = t["below"] if is_low else t["above"]
        intensity = t["strong"] if abs_z >= 2 else t["mild"]
        return t["sales_deviation"].format(
            intensity=intensity, direction=direction, dev=abs(deviation))