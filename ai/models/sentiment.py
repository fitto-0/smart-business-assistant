"""
Analyse de sentiments basée sur des mots-clés pondérés.

Améliorations vs version initiale :
- Détection de négation ("pas bon" → négatif)
- Pondération par intensité ("très mauvais" > "mauvais")
- Normalisation des accents et de la ponctuation
- Support français + anglais
- Confidence heuristic explicite
"""
from utils.text_utils import (
    normalize, tokenize, has_negation_before, get_intensifier
)


class SentimentAnalyzer:
    POSITIVE_WORDS = {
        # Français
        "excellent", "parfait", "magnifique", "super", "genial", "formidable",
        "extraordinaire", "exceptionnel", "remarquable", "impeccable",
        "satisfait", "content", "heureux", "ravi", "enchante",
        "bon", "bien", "agreable", "plaisant", "sympathique",
        "rapide", "efficace", "fiable", "solide", "durable",
        "recommande", "recommander", "adore", "aime", "top", "nickel",
        # Anglais
        "great", "good", "excellent", "amazing", "awesome", "wonderful",
        "fantastic", "perfect", "superb", "outstanding", "brilliant",
        "happy", "satisfied", "pleased", "love", "like", "recommend",
        "fast", "reliable", "quality", "worth",
    }

    NEGATIVE_WORDS = {
        # Français
        "decu", "mauvais", "terrible", "horrible", "catastrophique",
        "nul", "mediocre", "insuffisant", "defectueux", "casse",
        "lent", "cher", "trop cher", "inutile", "inefficace",
        "faux", "trompeur", "arnaque", "escroquerie",
        "deteste", "naime pas", "regrette", "plaindre",
        "probleme", "erreur", "defaut", "panne", "retard",
        # Anglais
        "bad", "terrible", "awful", "horrible", "disappointing",
        "poor", "useless", "broken", "slow", "expensive", "overpriced",
        "fake", "scam", "hate", "dislike", "regret", "complaint",
        "problem", "issue", "defect", "failure", "delay",
    }

    def __init__(self, positive_threshold: float = 0.65,
                 negative_threshold: float = 0.35,
                 negation_window: int = 3):
        self.pos_threshold = positive_threshold
        self.neg_threshold = negative_threshold
        self.negation_window = negation_window

    def analyze(self, text: str) -> dict:
        """
        Analyse un texte et retourne :
        - sentiment : "positif" | "négatif" | "neutre"
        - score : float entre 0 et 1
        - confidence : float entre 0 et 1 (heuristique)
        - details : décomposition (mots positifs/négatifs détectés)
        """
        if not text or not isinstance(text, str):
            return self._empty_result()

        tokens = tokenize(text)

        if not tokens:
            return self._empty_result()

        positive_score = 0.0
        negative_score = 0.0
        positive_matches = []
        negative_matches = []

        for i, token in enumerate(tokens):
            negated = has_negation_before(tokens, i, self.negation_window)
            intensifier = get_intensifier(tokens, i)

            if token in self.POSITIVE_WORDS:
                if negated:
                    negative_score += 1.0 * intensifier
                    negative_matches.append(f"not_{token}")
                else:
                    positive_score += 1.0 * intensifier
                    positive_matches.append(token)

            elif token in self.NEGATIVE_WORDS:
                if negated:
                    positive_score += 1.0 * intensifier
                    positive_matches.append(f"not_{token}")
                else:
                    negative_score += 1.0 * intensifier
                    negative_matches.append(token)

        total = positive_score + negative_score

        # Aucun mot-clé détecté → neutre avec confiance faible
        if total == 0:
            return {
                "sentiment": "neutre",
                "score": 0.5,
                "confidence": 0.2,
                "details": {
                    "positive_matches": [],
                    "negative_matches": [],
                    "tokens_analyzed": len(tokens),
                },
            }

        score = positive_score / total

        if score >= self.pos_threshold:
            sentiment = "positif"
        elif score <= self.neg_threshold:
            sentiment = "négatif"
        else:
            sentiment = "neutre"

        # Confidence heuristique : plus on a de mots-clés, plus on est sûr
        # Plus le score s'éloigne de 0.5, plus on est sûr
        distance_from_neutral = abs(score - 0.5) * 2
        keyword_density = min(total / max(len(tokens) * 0.2, 1), 1.0)
        confidence = round(min(0.4 + distance_from_neutral * 0.4 + keyword_density * 0.2, 1.0), 3)

        return {
            "sentiment": sentiment,
            "score": round(score, 3),
            "confidence": confidence,
            "details": {
                "positive_matches": positive_matches,
                "negative_matches": negative_matches,
                "tokens_analyzed": len(tokens),
            },
        }

    def _empty_result(self):
        return {
            "sentiment": "neutre",
            "score": 0.5,
            "confidence": 0.0,
            "details": {
                "positive_matches": [],
                "negative_matches": [],
                "tokens_analyzed": 0,
            },
        }