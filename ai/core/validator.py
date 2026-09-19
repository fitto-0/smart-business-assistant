"""
Validation des entrées du service AI.
Utilisé par toutes les routes Flask pour valider les payloads.
"""
from .exceptions import ValidationError


def require_payload(data):
    """Vérifie que le payload existe et est un dict."""
    if data is None or not isinstance(data, dict):
        raise ValidationError("Le payload JSON est requis.")


def require_field(data: dict, field: str, field_type=None):
    """Vérifie qu'un champ existe, avec un type optionnel."""
    if field not in data:
        raise ValidationError(f"Champ requis manquant : '{field}'.")
    value = data[field]
    if field_type and not isinstance(value, field_type):
        raise ValidationError(
            f"Le champ '{field}' doit être de type {field_type.__name__}."
        )
    return value


def require_non_empty_list(data: dict, field: str, min_length: int = 1):
    """Vérifie qu'un champ est une liste non vide."""
    value = data.get(field)
    if not isinstance(value, list):
        raise ValidationError(f"Le champ '{field}' doit être une liste.")
    if len(value) < min_length:
        raise ValidationError(
            f"Le champ '{field}' doit contenir au moins {min_length} élément(s)."
        )
    return value


def require_numeric_list(data: dict, field: str, min_length: int = 1):
    """Vérifie qu'un champ est une liste de nombres."""
    value = require_non_empty_list(data, field, min_length)
    for i, v in enumerate(value):
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            raise ValidationError(
                f"Le champ '{field}' contient une valeur non numérique à l'index {i}."
            )
    return value


def require_text(data: dict, field: str, min_length: int = 1):
    """Vérifie qu'un champ est un texte non vide."""
    value = data.get(field)
    if not isinstance(value, str):
        raise ValidationError(f"Le champ '{field}' doit être une chaîne de caractères.")
    if len(value.strip()) < min_length:
        raise ValidationError(f"Le champ '{field}' est trop court.")
    return value.strip()