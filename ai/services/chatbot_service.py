"""
Assistant conversationnel basé sur des règles et des mots-clés.

IMPORTANT : ce n'est PAS un LLM. C'est un système d'intents + handlers
qui exploite les données produits/ventes pour répondre.
"""
from utils.text_utils import normalize


class BusinessChatbot:
    def __init__(self):
        # Dictionnaire : intent -> mots-clés déclencheurs
        self.intent_keywords = {
            "greeting": ["hello", "hi", "bonjour", "salut", "hey", "coucou"],
            "stock": ["stock", "inventory", "stock disponible", "quantite"],
            "out_of_stock": ["rupture", "out of stock", "epuise", "indisponible"],
            "low_stock": ["faible", "low stock", "critique", "bientot rupture"],
            "sales": ["vente", "chiffre", "revenue", "sales", "ca", "revenu"],
            "top_products": ["meilleur", "top", "best", "plus vendu", "populaire"],
            "categories": ["categorie", "category", "rayon", "famille"],
            "help": ["aide", "help", "que peux tu", "que sais tu"],
        }

    def respond(self, question: str, products: list = None,
                sales_stats: dict = None) -> dict:
        """
        Retourne une réponse structurée :
        {
          "reply": "...",
          "intent": "...",
          "confidence": "high|medium|low"
        }
        """
        if not question or not isinstance(question, str):
            return self._fallback()

        normalized = normalize(question)
        products = products or []

        intent = self._detect_intent(normalized)

        handler = getattr(self, f"_handle_{intent}", None)
        if handler:
            return handler(question, normalized, products, sales_stats)

        return self._fallback()

    def _detect_intent(self, normalized: str) -> str:
        """Retourne le premier intent dont un mot-clé apparaît."""
        for intent, keywords in self.intent_keywords.items():
            for kw in keywords:
                if normalize(kw) in normalized:
                    return intent
        return "unknown"

    # ---------- Handlers ----------

    def _handle_greeting(self, q, n, products, sales_stats):
        return {
            "reply": (
                "Bonjour ! Je suis votre assistant commercial. "
                "Vous pouvez me demander : l'état du stock, les produits en rupture, "
                "le chiffre d'affaires, ou les meilleurs produits."
            ),
            "intent": "greeting",
            "confidence": "high",
        }

    def _handle_stock(self, q, n, products, sales_stats):
        if not products:
            return {
                "reply": "Je n'ai pas accès aux produits pour le moment.",
                "intent": "stock",
                "confidence": "low",
            }

        total = sum(p.get("stock", 0) for p in products)
        return {
            "reply": f"Vous avez actuellement {total} unités en stock, réparties sur {len(products)} produits.",
            "intent": "stock",
            "confidence": "high",
        }

    def _handle_out_of_stock(self, q, n, products, sales_stats):
        out = [p.get("name", "Produit") for p in products if p.get("stock", 0) == 0]
        if not out:
            return {
                "reply": "Aucun produit n'est en rupture de stock actuellement. 👍",
                "intent": "out_of_stock",
                "confidence": "high",
            }
        return {
            "reply": f"⚠️ {len(out)} produit(s) en rupture : {', '.join(out[:5])}"
                     + ("..." if len(out) > 5 else ""),
            "intent": "out_of_stock",
            "confidence": "high",
        }

    def _handle_low_stock(self, q, n, products, sales_stats):
        low = [
            p for p in products
            if 0 < p.get("stock", 0) <= (p.get("low_stock_threshold") or 10)
        ]
        if not low:
            return {
                "reply": "Aucun produit n'a un stock critique.",
                "intent": "low_stock",
                "confidence": "high",
            }
        names = [p.get("name", "Produit") for p in low[:5]]
        return {
            "reply": f"{len(low)} produit(s) ont un stock faible : {', '.join(names)}"
                     + ("..." if len(low) > 5 else ""),
            "intent": "low_stock",
            "confidence": "high",
        }

    def _handle_sales(self, q, n, products, sales_stats):
        if not sales_stats:
            return {
                "reply": "Je n'ai pas encore de données de ventes à analyser.",
                "intent": "sales",
                "confidence": "low",
            }
        total = sales_stats.get("total_revenue", 0)
        return {
            "reply": f"Le chiffre d'affaires total enregistré est de {total:,.0f} MAD.".replace(",", " "),
            "intent": "sales",
            "confidence": "high",
        }

    def _handle_top_products(self, q, n, products, sales_stats):
        if not sales_stats or not sales_stats.get("top_products"):
            return {
                "reply": "Je n'ai pas encore identifié les produits les plus vendus.",
                "intent": "top_products",
                "confidence": "low",
            }
        top = sales_stats["top_products"][:3]
        names = [p.get("name", "?") for p in top]
        return {
            "reply": f"Les meilleurs produits sont : {', '.join(names)}.",
            "intent": "top_products",
            "confidence": "high",
        }

    def _handle_categories(self, q, n, products, sales_stats):
        if not products:
            return {
                "reply": "Je n'ai pas de produits à catégoriser.",
                "intent": "categories",
                "confidence": "low",
            }
        categories = set(p.get("category") for p in products if p.get("category"))
        return {
            "reply": f"Vous avez {len(categories)} catégorie(s) : {', '.join(sorted(categories))}.",
            "intent": "categories",
            "confidence": "high",
        }

    def _handle_help(self, q, n, products, sales_stats):
        return {
            "reply": (
                "Je peux vous aider sur : "
                "• l'état du stock • les ruptures • les stocks faibles • "
                "le chiffre d'affaires • les meilleurs produits • les catégories."
            ),
            "intent": "help",
            "confidence": "high",
        }

    def _fallback(self):
        return {
            "reply": (
                "Je n'ai pas compris votre question. Essayez par exemple : "
                "\"Quels produits sont en rupture ?\" ou \"Quel est mon chiffre d'affaires ?\"."
            ),
            "intent": "unknown",
            "confidence": "low",
        }