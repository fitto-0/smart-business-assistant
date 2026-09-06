/**
 * Routes CSV - Upload et analyse de fichiers CSV via IA
 */

const router = require("express").Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

// Configuration de multer pour le stockage en mémoire
const upload = multer({ storage: multer.memoryStorage() });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// =====================================================
// POST /api/csv/analyze
// =====================================================
router.post("/analyze", auth, upload.single("file"), async (req, res) => {
  console.log("CSV analyze route hit");
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    if (!req.file.originalname.endsWith(".csv")) {
      return res.status(400).json({ error: "File must be a CSV" });
    }

    // Créer FormData pour envoyer à l'AI service
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: "text/csv",
    });

    // Envoyer à l'AI service
    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze-csv`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    return res.json(response.data);
  } catch (error) {
    console.error("Erreur POST /csv/analyze:", error);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
