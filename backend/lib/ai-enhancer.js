/**
 * AI Enhancement Library for Storefront Products
 * Handles AI-powered product description enhancement, categorization, and SEO
 */

const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Enhance product description using AI
 */
async function enhanceDescription(product) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/enhance-description`, {
      productName: product.name,
      currentDescription: product.description || "",
      category: product.category,
      price: product.price,
    });

    return {
      success: true,
      enhancedDescription: response.data.enhanced_description,
      originalDescription: product.description,
    };
  } catch (error) {
    console.error("AI description enhancement error:", error);
    return {
      success: false,
      error: "AI service unavailable",
      enhancedDescription: product.description,
    };
  }
}

/**
 * Suggest category for a product using AI
 */
async function suggestCategory(product) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/suggest-category`, {
      productName: product.name,
      description: product.description || "",
      currentCategory: product.category,
    });

    return {
      success: true,
      suggestedCategory: response.data.category,
      confidence: response.data.confidence,
    };
  } catch (error) {
    console.error("AI category suggestion error:", error);
    return {
      success: false,
      error: "AI service unavailable",
      suggestedCategory: product.category,
    };
  }
}

/**
 * Generate SEO keywords for a product
 */
async function generateSEOKeywords(product) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/generate-seo-keywords`, {
      productName: product.name,
      description: product.description || "",
      category: product.category,
    });

    return {
      success: true,
      keywords: response.data.keywords,
    };
  } catch (error) {
    console.error("AI SEO keywords generation error:", error);
    return {
      success: false,
      error: "AI service unavailable",
      keywords: [],
    };
  }
}

/**
 * Batch enhance multiple products
 */
async function batchEnhance(products) {
  const results = [];
  
  for (const product of products) {
    const enhancement = await enhanceProduct(product);
    results.push({
      productId: product.id,
      ...enhancement,
    });
  }
  
  return results;
}

/**
 * Complete product enhancement (description, category, SEO)
 */
async function enhanceProduct(product) {
  try {
    const [descriptionResult, categoryResult, seoResult] = await Promise.all([
      enhanceDescription(product),
      suggestCategory(product),
      generateSEOKeywords(product),
    ]);

    return {
      success: true,
      description: descriptionResult,
      category: categoryResult,
      seo: seoResult,
    };
  } catch (error) {
    console.error("Complete product enhancement error:", error);
    return {
      success: false,
      error: "Enhancement failed",
    };
  }
}

/**
 * Get product recommendations based on similar products
 */
async function getRecommendations(productId, userProducts, limit = 5) {
  try {
    const currentProduct = userProducts.find(p => p.id === productId);
    if (!currentProduct) {
      return { success: false, error: "Product not found" };
    }

    const response = await axios.post(`${AI_SERVICE_URL}/recommend-products`, {
      currentProduct: {
        name: currentProduct.name,
        category: currentProduct.category,
        description: currentProduct.description,
        price: currentProduct.price,
      },
      availableProducts: userProducts
        .filter(p => p.id !== productId)
        .map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          price: p.price,
        })),
      limit,
    });

    return {
      success: true,
      recommendations: response.data.recommendations,
    };
  } catch (error) {
    console.error("AI recommendations error:", error);
    return {
      success: false,
      error: "AI service unavailable",
      recommendations: [],
    };
  }
}

module.exports = {
  enhanceDescription,
  suggestCategory,
  generateSEOKeywords,
  batchEnhance,
  enhanceProduct,
  getRecommendations,
};
