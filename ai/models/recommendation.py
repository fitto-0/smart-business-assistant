"""
Multi-factor recommendation engine.

Combines several signals:
- stock level (out of stock, low)
- sales trend (abnormal drop)
- customer reviews (negatives above threshold)
- categories (promotion)

Works with both raw AI anomaly types (baisse_anormale, pic_anormal)
and the normalized types stored in PostgreSQL
(baisse_ventes, pic_ventes).
"""
from config import Config


TEMPLATES = {
    "en": {
        "unknown_product": "the product",
        "restock_critical_title": "Restock {name}",
        "restock_critical_desc": (
            "{name} is out of stock. "
            "Every day without stock loses revenue."
        ),
        "restock_critical_action": "Order now",
        "restock_critical_impact": "Avoid lost sales",
        "restock_low_title": "Plan a restock of {name}",
        "restock_low_desc": (
            "Current stock: {stock} units. "
            "Order ahead to avoid running out."
        ),
        "restock_low_action": "Create a purchase order",
        "restock_low_impact": "Keep sales flowing",
        "sales_drop_title": "Abnormal sales drop detected",
        "sales_drop_desc": "A significant drop was detected.",
        "sales_drop_action": "Find the cause and launch a promotion",
        "sales_drop_impact": "Get back on trend",
        "sales_spike_title": "Unexpected sales spike",
        "sales_spike_desc": "A significant spike was detected.",
        "sales_spike_action": "Check stock and ride the trend",
        "sales_spike_impact": "Make the most of it",
        "reviews_title": "High share of negative reviews",
        "reviews_desc": (
            "{pct}% of reviews are negative. "
            "Dig into customer feedback to find what to fix."
        ),
        "reviews_action": "Improve product or service quality",
        "reviews_impact": "Customer loyalty",
    },
    "fr": {
        "unknown_product": "le produit",
        "restock_critical_title": "Réapprovisionner {name}",
        "restock_critical_desc": (
            "Rupture de stock détectée pour {name}. "
            "Chaque jour sans stock représente une perte de chiffre d'affaires."
        ),
        "restock_critical_action": "Commander immédiatement",
        "restock_critical_impact": "Éviter la perte de ventes",
        "restock_low_title": "Planifier le réapprovisionnement de {name}",
        "restock_low_desc": (
            "Stock actuel : {stock} unités. "
            "Anticiper la commande pour éviter une rupture."
        ),
        "restock_low_action": "Créer un bon de commande",
        "restock_low_impact": "Continuité des ventes",
        "sales_drop_title": "Baisse anormale des ventes détectée",
        "sales_drop_desc": "Une baisse significative a été détectée.",
        "sales_drop_action": "Analyser les causes et lancer une promotion",
        "sales_drop_impact": "Redresser la tendance",
        "sales_spike_title": "Pic de ventes inattendu",
        "sales_spike_desc": "Un pic important a été détecté.",
        "sales_spike_action": "Vérifier le stock et capitaliser sur cette tendance",
        "sales_spike_impact": "Maximiser l'opportunité",
        "reviews_title": "Taux d'avis négatifs élevé",
        "reviews_desc": (
            "{pct} % des avis sont négatifs. "
            "Analyser les retours clients pour identifier les points à améliorer."
        ),
        "reviews_action": "Améliorer la qualité du produit ou du service",
        "reviews_impact": "Fidélisation client",
    },
}

# Raw AI types + normalized DB types.
SALES_DROP_TYPES = {"baisse_anormale", "baisse_ventes"}
SALES_SPIKE_TYPES = {"pic_anormal", "pic_ventes"}


class RecommendationEngine:
    """
    Generates recommendations from anomalies, products and reviews.
    Each recommendation holds: priority, category, action, impact.
    """

    def generate(self, anomalies: list, products: list,
                 sales_stats: dict = None, reviews_stats: dict = None,
                 lang: str = "en") -> list:
        t = TEMPLATES.get(lang, TEMPLATES["en"])
        recommendations = []

        recommendations.extend(self._stock_recommendations(t, anomalies, products))
        recommendations.extend(self._sales_recommendations(t, anomalies, sales_stats))
        recommendations.extend(self._review_recommendations(t, reviews_stats))

        # Sort by priority
        order = {"critique": 0, "haute": 1, "moyenne": 2, "basse": 3}
        recommendations.sort(key=lambda r: order.get(r["priority"], 99))

        return recommendations

    # ---------- Stock ----------
    def _stock_recommendations(self, t: dict, anomalies: list, products: list) -> list:
        recs = []
        for anomaly in anomalies:
            name = anomaly.get("product_name") or t["unknown_product"]
            if anomaly.get("type") == "rupture_stock":
                recs.append({
                    "priority": "critique",
                    "category": "stock",
                    "title": t["restock_critical_title"].format(name=name),
                    "description": t["restock_critical_desc"].format(name=name),
                    "action": t["restock_critical_action"],
                    "impact": t["restock_critical_impact"],
                })

            elif anomaly.get("type") == "stock_faible":
                severity = anomaly.get("severity", "haute")
                priority = "haute" if severity == "haute" else "moyenne"
                stock = anomaly.get("stock", "?")
                recs.append({
                    "priority": priority,
                    "category": "stock",
                    "title": t["restock_low_title"].format(name=name),
                    "description": t["restock_low_desc"].format(name=name, stock=stock),
                    "action": t["restock_low_action"],
                    "impact": t["restock_low_impact"],
                })
        return recs

    # ---------- Sales ----------
    def _sales_recommendations(self, t: dict, anomalies: list, sales_stats: dict) -> list:
        recs = []
        for anomaly in anomalies:
            atype = anomaly.get("type")
            if atype in SALES_DROP_TYPES:
                recs.append({
                    "priority": "haute",
                    "category": "analyse",
                    "title": t["sales_drop_title"],
                    "description": anomaly.get("explanation") or t["sales_drop_desc"],
                    "action": t["sales_drop_action"],
                    "impact": t["sales_drop_impact"],
                })

            elif atype in SALES_SPIKE_TYPES:
                recs.append({
                    "priority": "moyenne",
                    "category": "promotion",
                    "title": t["sales_spike_title"],
                    "description": anomaly.get("explanation") or t["sales_spike_desc"],
                    "action": t["sales_spike_action"],
                    "impact": t["sales_spike_impact"],
                })
        return recs

    # ---------- Reviews ----------
    def _review_recommendations(self, t: dict, reviews_stats: dict) -> list:
        recs = []
        if not reviews_stats:
            return recs

        negative_pct = reviews_stats.get("negative_percentage", 0) / 100.0
        threshold = Config.RECOMMENDATION_NEGATIVE_REVIEW_THRESHOLD

        if negative_pct > threshold:
            recs.append({
                "priority": "haute",
                "category": "service_client",
                "title": t["reviews_title"],
                "description": t["reviews_desc"].format(
                    pct=reviews_stats.get("negative_percentage")),
                "action": t["reviews_action"],
                "impact": t["reviews_impact"],
            })

        return recs
