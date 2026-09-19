"""Exceptions personnalisées du service AI."""


class AIException(Exception):
    """Exception de base."""
    status_code = 500

    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ValidationError(AIException):
    """Entrée invalide."""
    status_code = 400


class InsufficientDataError(AIException):
    """Pas assez de données pour l'analyse."""
    status_code = 422


class AnalysisError(AIException):
    """Erreur pendant l'analyse."""
    status_code = 500