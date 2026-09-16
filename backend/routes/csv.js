/**
 * Routes CSV - Upload, analyse et import de fichiers CSV via IA
 */

const router = require("express").Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const csvParser = require("csv-parser");
const { Readable } = require("stream");
const pool = require("../config/db");

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

// =====================================================
// POST /api/csv/import
// =====================================================
router.post("/import", auth, upload.single("file"), async (req, res) => {
  console.log("CSV import route hit");
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    if (!req.file.originalname.endsWith(".csv")) {
      return res.status(400).json({ error: "File must be a CSV" });
    }

    // Parse CSV from buffer
    const results = [];
    const readableStream = Readable.from(req.file.buffer.toString('utf-8'));

    await new Promise((resolve, reject) => {
      readableStream
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      return res.status(400).json({ error: "CSV file is empty" });
    }

    // Validate required columns
    const requiredColumns = ['name', 'category', 'price', 'stock'];
    const firstRow = results[0];
    const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));

    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}`,
        requiredColumns,
        foundColumns: Object.keys(firstRow)
      });
    }

    // Process and validate each row
    const validProducts = [];
    const errors = [];
    const warnings = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 2; // +2 because header is row 1

      try {
        // Validate required fields
        if (!row.name || row.name.trim() === '') {
          errors.push({ row: rowNumber, error: 'Name is required' });
          continue;
        }

        if (!row.category || row.category.trim() === '') {
          errors.push({ row: rowNumber, error: 'Category is required' });
          continue;
        }

        const price = parseFloat(row.price);
        if (isNaN(price) || price < 0) {
          errors.push({ row: rowNumber, error: 'Invalid price' });
          continue;
        }

        const stock = parseInt(row.stock);
        if (isNaN(stock) || stock < 0) {
          errors.push({ row: rowNumber, error: 'Invalid stock' });
          continue;
        }

        // Build product object
        const product = {
          name: row.name.trim(),
          category: row.category.trim(),
          price: price,
          stock: stock,
          description: row.description ? row.description.trim() : null,
          sku: row.sku ? row.sku.trim() : null,
          cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
          user_id: req.user.id,
          storefront_enabled: true,
          storefront_order: 0
        };

        // Validate cost price if provided
        if (product.cost_price !== null && (isNaN(product.cost_price) || product.cost_price < 0)) {
          warnings.push({ row: rowNumber, warning: 'Invalid cost price, set to null' });
          product.cost_price = null;
        }

        validProducts.push(product);
      } catch (err) {
        errors.push({ row: rowNumber, error: 'Failed to process row' });
      }
    }

    // Insert valid products into database
    let insertedCount = 0;
    if (validProducts.length > 0) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const product of validProducts) {
          await client.query(
            `INSERT INTO products (name, category, price, cost_price, stock, description, sku, user_id, storefront_enabled, storefront_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
              product.name,
              product.category,
              product.price,
              product.cost_price,
              product.stock,
              product.description,
              product.sku,
              product.user_id,
              product.storefront_enabled,
              product.storefront_order
            ]
          );
          insertedCount++;
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Database insertion error:', err);
        return res.status(500).json({ error: 'Failed to insert products into database' });
      } finally {
        client.release();
      }
    }

    return res.json({
      success: true,
      imported: insertedCount,
      total: results.length,
      errors,
      warnings
    });
  } catch (error) {
    console.error("Erreur POST /csv/import:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
