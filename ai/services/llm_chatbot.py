"""
Chatbot LLM basé sur Groq (Llama 3.3 70B).

Garde le rule-based en fallback si pas de clé API ou si l'appel échoue.
"""
import os
from typing import Optional

from services.chatbot_service import BusinessChatbot
from utils.logger import get_logger

logger = get_logger(__name__)


class LLMChatbot:
    """
    Chatbot conversationnel avec contexte.
    Utilise Groq si GROQ_API_KEY est présent, sinon fallback rule-based.
    """

    SYSTEM_PROMPT = """Tu es un assistant commercial intelligent intégré dans Smart Business Assistant.

Ton rôle : aider le gérant d'une PME à comprendre son activité commerciale.
Tu as accès à ses données en temps réel (produits, stock, ventes, avis).

STYLE :
- Réponds de façon naturelle et conversationnelle, comme un collègue compétent
- Sois concis : 2-4 phrases en général
- Utilise des chiffres quand c'est pertinent
- Si on te demande quelque chose que tu ne peux pas faire, propose une alternative
- Réponds dans la langue de l'utilisateur (français ou anglais)
- Ne mets pas d'emojis sauf si c'est vraiment utile
- Ne dis JAMAIS "en tant qu'IA" ou "je suis un modèle de langage"

CONTEXTE AFFICHÉ :
Le message utilisateur contient des données business entre balises <data>.
Utilise ces données pour répondre précisément. Ne les invente pas.
Si une donnée manque, dis-le honnêtement.

EXEMPLES DE BONNES RÉPONSES :
- "Vous avez 3 produits en rupture de stock : X, Y, Z. Je recommande de les commander en priorité."
- "Votre chiffre d'affaires est de 516 701 DA, en hausse de 18,4% par rapport au mois dernier."
- "Je ne vois pas de données sur les catégories dans votre compte. Vous pouvez les ajouter dans la section Produits."
"""

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.rule_based = BusinessChatbot()
        self.client = None

        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                logger.info("LLM Chatbot initialisé (Groq / Llama 3.3 70B)")
            except Exception as e:
                logger.warning(f"Groq init failed: {e}, fallback to rule-based")
        else:
            logger.info("Pas de GROQ_API_KEY, fallback rule-based")

    def respond(self, question: str, products: list = None,
                sales_stats: dict = None, history: list = None) -> dict:
        """
        Répond à une question. Utilise le LLM si dispo, sinon le rule-based.
        """
        products = products or []
        history = history or []

        if self.client:
            try:
                return self._llm_respond(question, products, sales_stats, history)
            except Exception as e:
                logger.error(f"LLM error: {e}, fallback rule-based")

        # Fallback : rule-based
        result = self.rule_based.respond(question, products, sales_stats)
        result["mode"] = "rule-based"
        return result

    def _llm_respond(self, question, products, sales_stats, history):
        """Appelle Groq avec contexte et historique."""

        # Construire le contexte business
        context = self._build_context(products, sales_stats)

        # Construire les messages
        messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]

        # Historique conversationnel (max 6 derniers échanges)
        for msg in history[-6:]:
            role = "user" if msg.get("role") == "user" else "assistant"
            content = msg.get("content") or msg.get("text") or ""
            if content:
                messages.append({"role": role, "content": content})

        # Message actuel avec contexte
        user_message = (
            f"<data>\n{context}\n</data>\n\n"
            f"Question de l'utilisateur : {question}"
        )
        messages.append({"role": "user", "content": user_message})

        # Appel LLM
        MODELS_TO_TRY = [
            "llama-3.1-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
        ]

        response = None
        last_error = None

        for model_name in MODELS_TO_TRY:
            try:
                response = self.client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=500,
                    top_p=0.9,
                )
                logger.info(f"Modèle utilisé : {model_name}")
                break
            except Exception as e:
                logger.warning(f"Modèle {model_name} indisponible : {e}")
                last_error = e
                continue

        if response is None:
            raise last_error or Exception("Aucun modèle Groq disponible")

        reply = response.choices[0].message.content.strip()

        return {
            "reply": reply,
            "intent": "llm",
            "confidence": "high",
            "mode": "llm",
        }

    def _build_context(self, products, sales_stats):
        """Construit un résumé compact des données pour le LLM."""
        lines = []

        # Produits et stock
        if products:
            lines.append(f"PRODUITS : {len(products)} au total")

            # Ruptures
            out_of_stock = [p for p in products if p.get("stock", 0) == 0]
            if out_of_stock:
                names = ", ".join(p.get("name", "?") for p in out_of_stock[:5])
                lines.append(f"EN RUPTURE ({len(out_of_stock)}) : {names}")

            # Stocks faibles
            low_stock = [
                p for p in products
                if 0 < p.get("stock", 0) <= 10
            ]
            if low_stock:
                names = ", ".join(
                    f"{p.get('name', '?')} ({p.get('stock')}u)"
                    for p in low_stock[:5]
                )
                lines.append(f"STOCK FAIBLE ({len(low_stock)}) : {names}")

            # Top 3 par valeur
            sorted_by_value = sorted(
                products,
                key=lambda p: (p.get("price", 0) or 0) * (p.get("stock", 0) or 0),
                reverse=True,
            )[:3]
            if sorted_by_value:
                top = ", ".join(
                    f"{p.get('name', '?')} ({p.get('price', 0)} DA)"
                    for p in sorted_by_value
                )
                lines.append(f"TOP 3 VALEUR STOCK : {top}")

        # Stats de vente
        if sales_stats:
            if "total_revenue" in sales_stats:
                lines.append(
                    f"CHIFFRE D'AFFAIRES : {sales_stats['total_revenue']:,.0f} DA".replace(",", " ")
                )
            if "total_sales" in sales_stats:
                lines.append(f"NOMBRE DE VENTES : {sales_stats['total_sales']}")
            if sales_stats.get("top_products"):
                top = ", ".join(
                    f"{p.get('name', '?')} ({p.get('qty', 0)} vendus)"
                    for p in sales_stats["top_products"][:3]
                )
                lines.append(f"TOP PRODUITS VENDUS : {top}")

        return "\n".join(lines) if lines else "Aucune donnée business disponible."