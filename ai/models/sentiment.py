"""
Analyse de sentiments basée sur des mots-clés pondérés.

Améliorations vs version initiale :
- Détection de négation ("pas bon" → négatif)
- Pondération par intensité ("très mauvais" > "mauvais")
- Normalisation des accents et de la ponctuation
- Support français + anglais
- Confidence heuristic explicite
Analyse de sentiments basée sur des mots-clés pondérés.
Support français + anglais avec stemming simple.
"""
from utils.text_utils import (
    normalize, tokenize, has_negation_before, get_intensifier, simple_stem
)


class SentimentAnalyzer:
    # Verbes et adjectifs positifs (formes de base)
    POSITIVE_STEMS = {
        # Français
        "excellent", "parfait", "magnifiqu", "super", "genial", "formidabl",
        "extraordinair", "exceptionnel", "remarquabl", "impeccabl",
        "satisfait", "satisf", "content", "heureu", "ravi", "enchant",
        "bon", "bien", "agreabl", "plaisant", "sympathiqu",
        "rapid", "efficac", "fiabl", "solid", "durabl",
        "recommand", "adore", "ador", "aim", "top", "nickel",
        # Anglais
        "great", "good", "excellent", "amaz", "awesom", "wonderful",
        "fantast", "perfect", "superb", "outstand", "brilliant",
        "happi", "satisfi", "pleas", "love", "lov", "like", "lik",
        "recommend", "nice", "qualiti", "worth", "fast", "reliabl",
        "impress", "exceed", "expect", "help", "clean", "beauti",
    }

    # Verbes et adjectifs négatifs (formes de base)
    NEGATIVE_STEMS = {
        # Français
        "decu", "mauvai", "terribl", "horribl", "catastroph",
        "nul", "mediocr", "insuffic", "defectueu", "cass",
        "lent", "cher", "inutil", "inefficac", "faux",
        "trompeur", "arnaqu", "escroqu", "detest", "regrett", "plain",
        "problem", "erreur", "defaut", "pann", "retard",
        # Anglais
        "bad", "terribl", "aw", "horribl", "disappoint", "disappointing",
        "poor", "useless", "broken", "slow", "expensive", "overpric",
        "fake", "scam", "hate", "hat", "dislik", "regret", "complain",
        "problem", "issu", "defect", "fail", "delay", "wrong",
        "uncomfortabl", "unhappi", "confus", "difficult",
    }

    def __init__(self, positive_threshold: float = 0.65,
                 negative_threshold: float = 0.35,
                 negation_window: int = 3):
        self.pos_threshold = positive_threshold
        self.neg_threshold = negative_threshold
        self.negation_window = negation_window

    def analyze(self, text: str) -> dict:
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

            stem = simple_stem(token)

            # Vérifier si le token ou son stem matche les listes
            pos_match = (token in self.POSITIVE_STEMS) or (stem in self.POSITIVE_STEMS)
            neg_match = (token in self.NEGATIVE_STEMS) or (stem in self.NEGATIVE_STEMS)

            if pos_match and not neg_match:
                if negated:
                    negative_score += 1.0 * intensifier
                    negative_matches.append(f"not_{token}")
                else:
                    positive_score += 1.0 * intensifier
                    positive_matches.append(token)

            elif neg_match and not pos_match:
                if negated:
                    positive_score += 1.0 * intensifier
                    positive_matches.append(f"not_{token}")
                else:
                    negative_score += 1.0 * intensifier
                    negative_matches.append(token)

        total = positive_score + negative_score

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