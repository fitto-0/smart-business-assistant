"""
Chargement et préparation des données avant analyse.
"""
import pandas as pd
import numpy as np
from core.exceptions import InsufficientDataError


def prepare_sales_series(sales: list) -> np.ndarray:
    """
    Convertit une liste de ventes en tableau NumPy propre.
    Ignore les valeurs None/NaN.
    """
    if not sales:
        raise InsufficientDataError("Aucune donnée de vente fournie.")

    cleaned = []
    for value in sales:
        if value is None:
            continue
        try:
            cleaned.append(float(value))
        except (TypeError, ValueError):
            continue

    if len(cleaned) < 2:
        raise InsufficientDataError(
            "Au moins 2 points de données numériques sont requis."
        )

    return np.array(cleaned, dtype=float)


def prepare_products_list(products: list) -> pd.DataFrame:
    """
    Convertit une liste de produits en DataFrame Pandas.
    """
    if not products:
        return pd.DataFrame(columns=["name", "stock", "price", "category"])

    df = pd.DataFrame(products)

    # Assurer les colonnes minimales
    for col in ["name", "stock", "price"]:
        if col not in df.columns:
            df[col] = None

    # Convertir les types
    df["stock"] = pd.to_numeric(df["stock"], errors="coerce").fillna(0).astype(int)
    df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0.0)

    return df


def prepare_reviews_list(reviews: list) -> list:
    """
    Filtre les avis pour ne garder que ceux avec un commentaire exploitable.
    """
    if not reviews:
        return []

    valid = []
    for r in reviews:
        comment = r.get("comment") or r.get("text") or ""
        if isinstance(comment, str) and len(comment.strip()) >= 3:
            valid.append(r)
    return valid