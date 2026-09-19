/**
 * AI Enhancer — utilitaires d'enrichissement de texte.
 *
 * NOTE : ces fonctions sont utilisées par ai-copilot.js.
 * Elles fournissent des fallbacks simples sans dépendance externe.
 *
 * Si tu veux de la vraie génération de texte IA, remplace le contenu
 * par un appel à un service LLM. Pour l'instant, on garde des
 * transformations déterministes et utiles.
 */

/**
 * Enrichit une description produit.
 */
function enhanceDescription(name, description = "") {
  if (!name) return { enhanced: "" };

  const base = (description || "").trim();
  if (base.length > 0) {
    return {
      enhanced: `${name} — ${base}`,
    };
  }

  return {
    enhanced: `${name} — produit de qualité, adapté à un usage professionnel.`,
  };
}

/**
 * Suggère une catégorie à partir du nom du produit.
 * Simple matching de mots-clés.
 */
function suggestCategory(name = "") {
  const lower = name.toLowerCase();

  const map = {
    Électronique: [
      "laptop",
      "pc",
      "ordinateur",
      "écran",
      "souris",
      "clavier",
      "casque",
      "iphone",
      "samsung",
      "macbook",
    ],
    Maison: ["lampe", "chaise", "table", "canapé", "tapis", "cuisine"],
    Vêtements: ["t-shirt", "chemise", "pantalon", "robe", "veste", "chaussure"],
    Alimentation: ["café", "thé", "sucre", "huile", "pain", "lait"],
    Sport: ["ballon", "raquette", "vélo", "tapis de course", "haltère"],
  };

  for (const [category, keywords] of Object.entries(map)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return { category, confidence: 0.8 };
    }
  }

  return { category: "Autre", confidence: 0.3 };
}

/**
 * Génère des mots-clés SEO simples à partir du nom et de la description.
 */
function generateSeoKeywords(name = "", description = "") {
  const text = `${name} ${description}`.toLowerCase();
  const words = text
    .replace(/[^\wàâäéèêëïîôöùûüç\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const unique = [...new Set(words)].slice(0, 10);
  return { keywords: unique };
}

module.exports = {
  enhanceDescription,
  suggestCategory,
  generateSeoKeywords,
};
