const router = require("express").Router();
const auth = require("../middleware/auth");
const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai:8000";

router.post("/", auth, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/chatbot`, {
      question: String(req.body.question || "").trim(),
      products: Array.isArray(req.body.products) ? req.body.products : [],
      history: Array.isArray(req.body.history) ? req.body.history.slice(-8) : [],
    }, { timeout: 15000 });

    return res.json(response.data);
  } catch (error) {
    console.error("Erreur POST /chatbot:", error.message);
    return res.status(error.response?.status || 502).json({
      error: "Service IA indisponible",
    });
  }
});

module.exports = router;