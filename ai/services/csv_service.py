"""
Service d'analyse de fichiers CSV.

Effectue :
- lecture du fichier
- détection des colonnes
- validation
- statistiques descriptives
- détection de valeurs manquantes
- détection d'anomalies basiques
"""
import io
import pandas as pd
import numpy as np

from core.exceptions import ValidationError


class CSVAnalyzer:
    # Colonnes reconnues automatiquement
    COLUMN_ALIASES = {
        "name": ["name", "product", "produit", "nom", "libelle", "label"],
        "price": ["price", "prix", "prix_unitaire", "unit_price"],
        "stock": ["stock", "quantity", "quantite", "qte", "inventory"],
        "category": ["category", "categorie", "rayon", "famille"],
        "sales": ["sales", "ventes", "qty_sold", "quantite_vendue"],
    }

    def analyze(self, file_bytes: bytes) -> dict:
        """
        Analyse un fichier CSV et retourne un rapport structuré.
        """
        try:
            df = pd.read_csv(io.BytesIO(file_bytes))
        except Exception as e:
            raise ValidationError(f"Impossible de lire le CSV : {str(e)}")

        if df.empty:
            raise ValidationError("Le fichier CSV est vide.")

        # Détection des colonnes
        detected = self._detect_columns(df)

        # Nettoyage minimal
        df = self._clean(df, detected)

        # Statistiques descriptives
        stats = self._compute_stats(df, detected)

        # Valeurs manquantes
        missing = self._missing_values(df)

        # Anomalies simples (valeurs négatives, doublons)
        anomalies = self._detect_anomalies(df, detected)

        return {
            "detected_columns": detected,
            "row_count": int(len(df)),
            "column_count": int(len(df.columns)),
            "preview": df.head(5).to_dict(orient="records"),
            "statistics": stats,
            "missing_values": missing,
            "anomalies": anomalies,
        }

    def _detect_columns(self, df: pd.DataFrame) -> dict:
        """Détecte quelles colonnes correspondent aux champs connus."""
        detected = {}
        cols_lower = {c.lower(): c for c in df.columns}

        for target, aliases in self.COLUMN_ALIASES.items():
            for alias in aliases:
                if alias in cols_lower:
                    detected[target] = cols_lower[alias]
                    break

        return detected

    def _clean(self, df: pd.DataFrame, detected: dict) -> pd.DataFrame:
        """Nettoie les colonnes reconnues."""
        for target, col in detected.items():
            if target in ("price", "stock", "sales"):
                df[col] = pd.to_numeric(df[col], errors="coerce")
            elif target in ("name", "category"):
                df[col] = df[col].astype(str).str.strip()
        return df

    def _compute_stats(self, df: pd.DataFrame, detected: dict) -> dict:
        """Statistiques descriptives pour les colonnes numériques."""
        stats = {}
        for target in ("price", "stock", "sales"):
            if target in detected:
                col = detected[target]
                series = df[col].dropna()
                if not series.empty:
                    stats[target] = {
                        "count": int(series.count()),
                        "mean": round(float(series.mean()), 2),
                        "min": round(float(series.min()), 2),
                        "max": round(float(series.max()), 2),
                        "total": round(float(series.sum()), 2),
                    }
        return stats

    def _missing_values(self, df: pd.DataFrame) -> dict:
        """Compte les valeurs manquantes par colonne."""
        missing = df.isnull().sum()
        return {col: int(count) for col, count in missing.items() if count > 0}

    def _detect_anomalies(self, df: pd.DataFrame, detected: dict) -> list:
        """Détecte les anomalies simples."""
        anomalies = []

        # Valeurs négatives dans les colonnes numériques
        for target in ("price", "stock", "sales"):
            if target in detected:
                col = detected[target]
                negatives = df[df[col] < 0]
                if not negatives.empty:
                    anomalies.append({
                        "type": "valeur_negative",
                        "column": col,
                        "count": int(len(negatives)),
                        "explanation": f"{len(negatives)} valeur(s) négative(s) dans '{col}'.",
                    })

        # Doublons sur la colonne "name"
        if "name" in detected:
            name_col = detected["name"]
            duplicates = df[df.duplicated(subset=[name_col], keep=False)]
            if not duplicates.empty:
                anomalies.append({
                    "type": "doublons",
                    "column": name_col,
                    "count": int(len(duplicates)),
                    "explanation": f"{len(duplicates)} ligne(s) dupliquée(s) sur '{name_col}'.",
                })

        return anomalies