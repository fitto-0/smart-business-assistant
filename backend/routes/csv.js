const express = require("express");
const multer = require("multer");
const router = express.Router();
const auth = require("../middleware/auth");
const ai = require("../lib/aiClient");
const pool = require("../db/pool");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
});

router.use(auth);
router.use(auth.requireOrganization);

// ---------------------------------------------------------
// POST /api/csv/analyze
// Analyse un CSV via l'IA (sans persistance).
// ---------------------------------------------------------
router.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Fichier requis." });

    // Envoyer au service IA
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([req.file.buffer], { type: "text/csv" }),
      req.file.originalname,
    );

    const response = await fetch(
      `${process.env.AI_SERVICE_URL || "http://ai:8000"}/analyze-csv`,
      { method: "POST", body: formData },
    );

    if (!response.ok) {
      const errText = await response.text();
      return res
        .status(response.status)
        .json({ error: `AI: ${errText || "Erreur"}` });
    }

    const result = await response.json();
    return res.json(result);
  } catch (err) {
    console.error("[csv/analyze]", err);
    return res.status(500).json({ error: "Erreur d'analyse CSV." });
  }
});

// ---------------------------------------------------------
// POST /api/csv/import
// Importe les produits depuis un CSV validé dans PostgreSQL.
// ---------------------------------------------------------
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Fichier requis." });

    const content = req.file.buffer.toString("utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idxName = header.indexOf("name");
    const idxPrice = header.indexOf("price");
    const idxStock = header.indexOf("stock");

    if (idxName < 0 || idxPrice < 0 || idxStock < 0) {
      return res.status(400).json({
        error: "Colonnes 'name', 'price' et 'stock' requises.",
      });
    }

    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const name = cols[idxName]?.trim();
      const price = parseFloat(cols[idxPrice]);
      const stock = parseInt(cols[idxStock], 10);

      if (!name || Number.isNaN(price) || Number.isNaN(stock)) continue;

      await pool.query(
        `INSERT INTO products (organization_id, name, price, stock, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [req.organizationId, name, price, stock],
      );
      imported++;
    }

    return res.json({ imported });
  } catch (err) {
    console.error("[csv/import]", err);
    return res.status(500).json({ error: "Erreur d'import." });
  }
});

module.exports = router;
