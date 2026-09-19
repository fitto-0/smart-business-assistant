"""
Moteur de recommandations multi-facteurs.

Combine plusieurs signaux :
- niveau de stock (rupture, faible)
- tendance des ventes (baisse anormale)
- avis clients (négatifs > seuil)
- catégories (promotion)
"""
from config import Config


class RecommendationEngine:
    """
    Génère des recommandations à partir des anomalies, produits et avis.
    Chaque recommandation contient : priorité, catégorie, action, impact.
    """

    def generate(self, anomalies: list, products: list,
                 sales_stats: dict = None, reviews_stats: dict = None) -> list:
        recommendations = []

        recommendations.extend(self._stock_recommendations(anomalies, products))
        recommendations.extend(self._sales_recommendations(anomalies, sales_stats))
        recommendations.extend(self._review_recommendations(reviews_stats))

        # Trier par priorité
        order = {"critique": 0, "haute": 1, "moyenne": 2, "basse": 3}
        recommendations.sort(key=lambda r: order.get(r["priority"], 99))

        return recommendations

    # ---------- Stock ----------
    def _stock_recommendations(self, anomalies: list, products: list) -> list:
        recs = []
        for anomaly in anomalies:
            if anomaly.get("type") == "rupture_stock":
                recs.append({
                    "priority": "critique",
                    "category": "stock",
                    "icon": "📦",
                    "title": f"Réapprovisionner {anomaly.get('product_name', 'le produit')}",
                    "description": f"Rupture de stock détectée pour {anomaly.get('product_name')}. "
                                   "Chaque jour sans stock représente une perte de chiffre d'affaires.",
                    "action": "Commander immédiatement",
                    "impact": "Éviter la perte de ventes",
                })

            elif anomaly.get("type") == "stock_faible":
                severity = anomaly.get("severity", "haute")
                priority = "haute" if severity == "haute" else "moyenne"
                recs.append({
                    "priority": priority,
                    "category": "stock",
                    "icon": "📦",
                    "title": f"Planifier le réapprovisionnement de {anomaly.get('product_name')}",
                    "description": f"Stock actuel : {anomaly.get('stock')} unités. "
                                   "Anticiper la commande pour éviter une rupture.",
                    "action": "Créer un bon de commande",
                    "impact": "Continuité des ventes",
                })
        return recs

    # ---------- Ventes ----------
    def _sales_recommendations(self, anomalies: list, sales_stats: dict) -> list:
        recs = []
        for anomaly in anomalies:
            if anomaly.get("type") == "baisse_anormale":
                recs.append({
                    "priority": "haute",
                    "category": "analyse",
                    "icon": "📉",
                    "title": "Baisse anormale des ventes détectée",
                    "description": anomaly.get("explanation", "Une baisse significative a été détectée."),
                    "action": "Analyser les causes et lancer une promotion",
                    "impact": "Redresser la tendance",
                })

            elif anomaly.get("type") == "pic_anormal":
                recs.append({
                    "priority": "moyenne",
                    "category": "promotion",
                    "icon": "🚀",
                    "title": "Pic de ventes inattendu",
                    "description": anomaly.get("explanation", "Un pic important a été détecté."),
                    "action": "Vérifier le stock et capitaliser sur cette tendance",
                    "impact": "Maximiser l'opportunité",
                })
        return recs

    # ---------- Avis ----------
    def _review_recommendations(self, reviews_stats: dict) -> list:
        recs = []
        if not reviews_stats:
            return recs

        negative_pct = reviews_stats.get("negative_percentage", 0) / 100.0
        threshold = Config.RECOMMENDATION_NEGATIVE_REVIEW_THRESHOLD

        if negative_pct > threshold:
            recs.append({
                "priority": "haute",
                "category": "service_client",
                "icon": "⭐",
                "title": "Taux d'avis négatifs élevé",
                "description": f"{reviews_stats.get('negative_percentage')} % des avis sont négatifs. "
                               "Analyser les retours clients pour identifier les points à améliorer.",
                "action": "Améliorer la qualité du produit ou du service",
                "impact": "Fidélisation client",
            })

        return recs