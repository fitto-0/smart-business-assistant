const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_TIMEOUT = Number(process.env.AI_TIMEOUT_MS || 15000);

const http = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: AI_TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

/**
 * Wrapper générique : log + gestion d'erreur uniforme.
 */
async function callAI(path, payload) {
  try {
    const { data } = await http.post(path, payload);
    return data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.error || error.message;
    console.error(`[AI] ${path} failed (${status || "no status"}):`, detail);

    const err = new Error(detail || "AI service unavailable");
    err.statusCode = status || 503;
    err.aiPath = path;
    throw err;
  }
}

module.exports = {
  predict: (payload) => callAI("/predict", payload),
  sentiment: (payload) => callAI("/sentiment", payload),
  anomalies: (payload) => callAI("/anomalies", payload),
  recommendations: (payload) => callAI("/recommendations", payload),
  chatbot: (payload) => callAI("/chatbot", payload),
};
