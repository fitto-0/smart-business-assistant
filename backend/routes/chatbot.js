const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ai = require("../lib/aiClient");
const agg = require("../lib/dataAggregator");

router.use(auth);
router.use(auth.requireOrganization);

router.post("/", async (req, res) => {
  try {
    const { question, history } = req.body;

    if (!question || question.trim().length < 2) {
      return res.status(400).json({ error: "Question trop courte." });
    }

    const [products, salesStats] = await Promise.all([
      agg.getProductsWithStock(req.organizationId),
      agg.getSalesStats(req.organizationId),
    ]);

    const result = await ai.chatbot({
      question: question.trim(),
      products,
      sales_stats: salesStats,
      history: Array.isArray(history) ? history.slice(-6) : [],
    });

    return res.json(result);
  } catch (err) {
    console.error("[chatbot]", err);
    return res.status(err.statusCode || 500).json({
      error: err.message || "Erreur du chatbot.",
    });
  }
});

module.exports = router;