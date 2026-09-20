"""
Chatbot LLM basé sur Groq (modèles actuels).

Améliorations intelligence :
- Contexte business enrichi (tendances, catégories, marges)
- Détection d'intention → température + consigne adaptées
- Prompt avec exemples de raisonnement (few-shot)
- Découverte dynamique des modèles disponibles
"""
import os
import re
from typing import Optional

from services.chatbot_service import BusinessChatbot
from utils.logger import get_logger

logger = get_logger(__name__)


# ----------------------------------------------------------------------
# Intent patterns (FR + EN)
# ----------------------------------------------------------------------
INTENT_PATTERNS = {
    "analysis": [
        r"\b(analyse|analyser|tendance|trend|évolution|evolution|pourquoi|why)\b",
        r"\b(comparer|compare|versus|vs|mieux|better|pire|worse)\b",
        r"\b(stratégie|strategy|conseil|advice|recommand|recommend)\b",
    ],
    "forecast": [
        r"\b(prévision|prevision|forecast|prédire|predict|futur|future|prochain|next)\b",
        r"\b(estimation|estimate|projection|project)\b",
    ],
    "action": [
        r"\b(commander|order|réapprovisionner|restock|acheter|buy)\b",
        r"\b(supprimer|delete|ajouter|add|modifier|edit|créer|create)\b",
    ],
    "lookup": [
        r"\b(combien|how many|combien de|quel|which|liste|list|montre|show)\b",
        r"\b(stock|rupture|out of stock|prix|price|vente|sale)\b",
    ],
}


class LLMChatbot:
    """
    Chatbot conversationnel avec contexte.

    Utilise Groq si GROQ_API_KEY est présent, sinon fallback rule-based.
    """

    SYSTEM_PROMPT_BASE = """Tu es un assistant commercial intelligent intégré dans Smart Business Assistant.

Ton rôle : aider le gérant d'une PME à comprendre son activité commerciale.
Tu as accès à ses données en temps réel (produits, stock, ventes, avis, catégories).

STYLE :
- Réponds de façon naturelle et conversationnelle, comme un collègue compétent
- Sois concis : 2-4 phrases en général
- Utilise des chiffres quand c'est pertinent
- Si on te demande quelque chose que tu ne peux pas faire, propose une alternative
- Réponds dans la langue de l'utilisateur (français ou anglais)
- Ne mets pas d'emojis sauf si c'est vraiment utile
- Ne dis JAMAIS "en tant qu'IA" ou "je suis un modèle de langage"

RÈGLES DE FIABILITÉ :
- Ne jamais inventer de chiffres. Si une donnée n'est pas dans <data>, dis-le honnêtement.
- Si la question est ambiguë, pose une question de clarification avant de répondre.
- Quand tu recommandes une action, justifie-la avec les données disponibles.
- Si <data> est vide, dis que tu n'as pas accès aux données business pour le moment.

CONTEXTE AFFICHÉ :
Le message utilisateur contient des données business entre balises <data>.
Utilise ces données pour répondre précisément. Ne les invente pas.

EXEMPLES DE BONNES RÉPONSES :
- "Vous avez 3 produits en rupture de stock : X, Y, Z. Je recommande de les commander en priorité."
- "Votre chiffre d'affaires est de 516 701 DA, en hausse de 18,4% par rapport au mois dernier."
- "Je ne vois pas de données sur les catégories dans votre compte. Vous pouvez les ajouter dans la section Produits."
"""

    # Consignes additionnelles par intention
    INTENT_HINTS = {
        "analysis": (
            "L'utilisateur demande une ANALYSE. Compare les chiffres, identifie "
            "une tendance, et termine par une recommandation actionnable."
        ),
        "forecast": (
            "L'utilisateur demande une PRÉVISION. Base-toi uniquement sur les "
            "données disponibles. Si tu manques d'historique, dis-le et propose "
            "une projection prudente avec les données actuelles."
        ),
        "action": (
            "L'utilisateur veut AGIR. Donne une recommandation claire et ordonnée. "
            "Si l'action n'est pas possible depuis le chatbot, indique où la faire "
            "dans l'application."
        ),
        "lookup": (
            "L'utilisateur veut une INFORMATION précise. Réponds directement avec "
            "les chiffres exacts, sans digression."
        ),
        "general": (
            "Réponds de façon naturelle et utile. Si la question est vague, "
            "demande une précision."
        ),
    }

    # Température par intention : plus bas = plus factuel
    INTENT_TEMPERATURE = {
        "analysis": 0.5,
        "forecast": 0.6,
        "action": 0.3,
        "lookup": 0.2,
        "general": 0.4,
    }

    DEFAULT_MODELS = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile",
    ]

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.rule_based = BusinessChatbot()
        self.client = None
        self._available_models = None
        self.model_candidates = list(self.DEFAULT_MODELS)

        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)

                env_model = os.getenv("GROQ_MODEL", "").strip()
                if env_model:
                    self.model_candidates = [env_model] + self.model_candidates

                logger.info(
                    f"LLM Chatbot initialisé (Groq). Candidats: {self.model_candidates}"
                )
            except Exception as e:
                logger.warning(f"Groq init failed: {e}, fallback to rule-based")
        else:
            logger.info("Pas de GROQ_API_KEY, fallback rule-based")

    # ------------------------------------------------------------------
    # Découverte dynamique des modèles
    # ------------------------------------------------------------------
    def _available_model_ids(self) -> set:
        if self._available_models is None:
            try:
                models = self.client.models.list()
                self._available_models = {m.id for m in models.data}
                logger.info(
                    f"Modèles Groq disponibles: {sorted(self._available_models)}"
                )
            except Exception as e:
                logger.warning(f"Impossible de lister les modèles Groq: {e}")
                self._available_models = set()
        return self._available_models

    def _pick_models(self) -> list:
        available = self._available_model_ids()
        if not available:
            return self.model_candidates
        matched = [m for m in self.model_candidates if m in available]
        if matched:
            return matched
        logger.warning(
            f"Aucun candidat {self.model_candidates} trouvé. "
            "On tente quand même les candidats par défaut."
        )
        return self.model_candidates

    # ------------------------------------------------------------------
    # Détection d'intention
    # ------------------------------------------------------------------
    def _detect_intent(self, question: str) -> str:
        """Retourne l'intention la plus probable de la question."""
        q = question.lower()
        scores = {intent: 0 for intent in INTENT_PATTERNS}
        for intent, patterns in INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, q):
                    scores[intent] += 1
        best = max(scores, key=scores.get)
        if scores[best] == 0:
            return "general"
        return best

    # ------------------------------------------------------------------
    # Point d'entrée public
    # ------------------------------------------------------------------
    def respond(
        self,
        question: str,
        products: list = None,
        sales_stats: dict = None,
        history: list = None,
    ) -> dict:
        products = products or []
        history = history or []

        if self.client:
            try:
                return self._llm_respond(question, products, sales_stats, history)
            except Exception as e:
                logger.error(f"LLM error: {e}, fallback rule-based")

        result = self.rule_based.respond(question, products, sales_stats)
        result["mode"] = "rule-based"
        return result

    # ------------------------------------------------------------------
    # Appel LLM
    # ------------------------------------------------------------------
    def _llm_respond(self, question, products, sales_stats, history):
        context = self._build_context(products, sales_stats)
        intent = self._detect_intent(question)
        temperature = self.INTENT_TEMPERATURE.get(intent, 0.4)
        hint = self.INTENT_HINTS.get(intent, self.INTENT_HINTS["general"])

        system_prompt = (
            f"{self.SYSTEM_PROMPT_BASE}\n\n"
            f"CONSIGNE POUR CETTE RÉPONSE :\n{hint}"
        )

        messages = [{"role": "system", "content": system_prompt}]

        for msg in history[-6:]:
            role = "user" if msg.get("role") == "user" else "assistant"
            content = msg.get("content") or msg.get("text") or ""
            if content:
                messages.append({"role": role, "content": content})

        user_message = (
            f"<data>\n{context}\n</data>\n\n"
            f"Question de l'utilisateur : {question}"
        )
        messages.append({"role": "user", "content": user_message})

        models_to_try = self._pick_models()
        response = None
        last_error = None

        for model_name in models_to_try:
            try:
                response = self.client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=800,
                    top_p=0.9,
                )
                logger.info(
                    f"Modèle utilisé : {model_name} (intent={intent}, temp={temperature})"
                )
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
            "intent": intent,
            "confidence": "high",
            "mode": "llm",
        }

     # ------------------------------------------------------------------
    # Construction du contexte business — version enrichie et robuste
    # ------------------------------------------------------------------
    @staticmethod
    def _as_float(value, default=None):
        """Convertit une valeur en float, ou retourne default si impossible."""
        if value is None:
            return default
        try:
            return float(str(value).replace(",", "").replace(" ", ""))
        except (TypeError, ValueError):
            return default

    def _build_context(self, products, sales_stats):
        """Construit un résumé riche et compact des données pour le LLM."""
        lines = []

        if products:
            lines.append(f"PRODUITS : {len(products)} au total")

            # --- Catégories ---
            categories = {}
            for p in products:
                cat = p.get("category") or p.get("categorie") or "Non classé"
                categories[cat] = categories.get(cat, 0) + 1
            if categories:
                cats = ", ".join(
                    f"{c} ({n})" for c, n in sorted(
                        categories.items(), key=lambda x: -x[1]
                    )[:6]
                )
                lines.append(f"CATÉGORIES : {cats}")

            # --- Ruptures ---
            out_of_stock = [
                p for p in products
                if self._as_float(p.get("stock"), 0) == 0
            ]
            if out_of_stock:
                names = ", ".join(p.get("name", "?") for p in out_of_stock[:5])
                lines.append(f"EN RUPTURE ({len(out_of_stock)}) : {names}")

            # --- Stocks faibles ---
            low_stock = []
            for p in products:
                stock = self._as_float(p.get("stock"), 0)
                if 0 < stock <= 10:
                    low_stock.append((p, stock))
            if low_stock:
                names = ", ".join(
                    f"{p.get('name', '?')} ({int(s)}u)" for p, s in low_stock[:5]
                )
                lines.append(f"STOCK FAIBLE ({len(low_stock)}) : {names}")

            # --- Top 3 par valeur de stock ---
            def _stock_value(p):
                price = self._as_float(p.get("price"), 0) or 0
                stock = self._as_float(p.get("stock"), 0) or 0
                return price * stock

            sorted_by_value = sorted(products, key=_stock_value, reverse=True)[:3]
            if sorted_by_value:
                top = ", ".join(
                    f"{p.get('name', '?')} "
                    f"({self._as_float(p.get('price'), 0) or 0:,.0f} DA)".replace(",", " ")
                    for p in sorted_by_value
                )
                lines.append(f"TOP 3 VALEUR STOCK : {top}")

            # --- Fourchette de prix ---
            prices = [
                self._as_float(p.get("price"))
                for p in products
                if self._as_float(p.get("price")) is not None
                and self._as_float(p.get("price")) > 0
            ]
            if prices:
                lines.append(
                    f"PRIX : min {min(prices):,.0f} DA, "
                    f"max {max(prices):,.0f} DA, "
                    f"moyen {sum(prices) / len(prices):,.0f} DA".replace(",", " ")
                )

            # --- Valeur totale du stock ---
            total_value = sum(_stock_value(p) for p in products)
            if total_value:
                lines.append(
                    f"VALEUR TOTALE STOCK : {total_value:,.0f} DA".replace(",", " ")
                )

        if sales_stats:
            total_revenue = self._as_float(sales_stats.get("total_revenue"))
            if total_revenue is not None:
                lines.append(
                    f"CHIFFRE D'AFFAIRES : {total_revenue:,.0f} DA".replace(",", " ")
                )

            total_sales = sales_stats.get("total_sales")
            if total_sales is not None:
                lines.append(f"NOMBRE DE VENTES : {total_sales}")

            # --- Comparaison période précédente ---
            revenue_previous = self._as_float(sales_stats.get("revenue_previous"))
            if revenue_previous and total_revenue is not None and revenue_previous > 0:
                delta = ((total_revenue - revenue_previous) / revenue_previous) * 100
                sign = "+" if delta >= 0 else ""
                lines.append(
                    f"ÉVOLUTION CA : {sign}{delta:.1f}% vs période précédente"
                )

            # --- Top produits vendus ---
            top_products = sales_stats.get("top_products") or []
            if top_products:
                top = ", ".join(
                    f"{p.get('name', '?')} ({p.get('qty', 0)} vendus)"
                    for p in top_products[:5]
                )
                lines.append(f"TOP PRODUITS VENDUS : {top}")

            # --- Marge moyenne ---
            margin_avg = self._as_float(sales_stats.get("margin_avg"))
            if margin_avg is not None:
                lines.append(f"MARGE MOYENNE : {margin_avg:.1f}%")

        return "\n".join(lines) if lines else "Aucune donnée business disponible."