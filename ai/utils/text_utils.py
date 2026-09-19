"""
Utilitaires pour le traitement de texte.
Utilisé principalement pour l'analyse de sentiments.
"""
import re
import unicodedata

# Mots de négation en français et anglais
NEGATION_WORDS = {
    "ne", "pas", "plus", "jamais", "rien", "aucun", "aucune",
    "ni", "non", "sans",
    "not", "no", "never", "nothing", "neither", "nor", "without",
}

# Marqueurs d'intensité (amplifient le sentiment)
INTENSIFIERS = {
    "très": 1.5, "vraiment": 1.5, "extrêmement": 2.0, "super": 1.5,
    "trop": 1.3, "tellement": 1.5, "vraiment": 1.5,
    "very": 1.5, "really": 1.5, "extremely": 2.0, "so": 1.3,
    "highly": 1.5, "absolutely": 2.0,
}


def normalize(text: str) -> str:
    """
    Normalise un texte :
    - Retire les accents
    - Convertit en minuscules
    - Remplace la ponctuation par des espaces
    """
    if not text:
        return ""
    # Retirer les accents
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    # Minuscules
    text = text.lower()
    # Remplacer ponctuation par espaces
    text = re.sub(r"[^\w\s]", " ", text)
    # Espaces multiples
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def tokenize(text: str) -> list:
    """Découpe un texte normalisé en mots."""
    return [w for w in normalize(text).split() if len(w) > 1]


def has_negation_before(tokens: list, index: int, window: int = 3) -> bool:
    """
    Vérifie si un mot de négation se trouve dans les `window` mots
    précédant l'index donné.
    """
    start = max(0, index - window)
    return any(tok in NEGATION_WORDS for tok in tokens[start:index])


def get_intensifier(tokens: list, index: int, window: int = 2) -> float:
    """
    Renvoie le multiplicateur d'intensité si un intensifieur précède
    l'index donné, sinon 1.0.
    """
    start = max(0, index - window)
    multiplier = 1.0
    for tok in tokens[start:index]:
        if tok in INTENSIFIERS:
            multiplier *= INTENSIFIERS[tok]
    return multiplier

def simple_stem(word: str) -> str:
    """
    Stemmer anglais simplifié.
    Retire les suffixes courants (s, es, ed, ing) pour matcher les variantes.
    """
    if len(word) <= 4:
        return word

    # Ordre important : plus long d'abord
    for suffix in ("ing", "ies", "ied", "ed", "es", "s"):
        if word.endswith(suffix):
            stem = word[: -len(suffix)]
            # Sécurité : ne pas produire un mot trop court
            if len(stem) >= 3:
                return stem
    return word