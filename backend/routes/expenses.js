const express = require("express");
const router = express.Router();
const { query } = require("../db/pool");
const auth = require("../middleware/auth");

const CATEGORIES = ["loyer", "salaires", "fournitures", "marketing", "transport", "services", "impots", "autre"];
const PAYMENT_METHODS = ["carte", "espèces", "virement", "chèque", "autre"];

router.get("/", auth, async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC, id DESC",
      [req.user.id],
    );
    res.json({ expenses: result.rows });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Error fetching expenses" });
  }
});

router.get("/summary", auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT category, COALESCE(SUM(amount), 0)::numeric AS total
       FROM expenses WHERE user_id = $1
       GROUP BY category ORDER BY total DESC`,
      [req.user.id],
    );
    const totalResult = await query(
      "SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM expenses WHERE user_id = $1",
      [req.user.id],
    );
    res.json({ byCategory: result.rows, total: totalResult.rows[0].total });
  } catch (err) {
    console.error("Error fetching expense summary:", err);
    res.status(500).json({ error: "Error fetching expense summary" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { category, amount, date, description, receipt_url, supplier, payment_method } = req.body;
    if (!category || !amount || !description) {
      return res.status(400).json({ error: "Category, amount and description are required" });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${CATEGORIES.join(", ")}` });
    }
    if (payment_method && !PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ error: `Payment method must be one of: ${PAYMENT_METHODS.join(", ")}` });
    }
    const result = await query(
      `INSERT INTO expenses (user_id, category, amount, date, description, receipt_url, supplier, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, category, amount, date || new Date().toISOString().split("T")[0], description, receipt_url || null, supplier || null, payment_method || "virement"],
    );
    res.status(201).json({ expense: result.rows[0] });
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ error: "Error creating expense" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { category, amount, date, description, receipt_url, supplier, payment_method } = req.body;
    if (category && !CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${CATEGORIES.join(", ")}` });
    }
    const result = await query(
      `UPDATE expenses SET category = COALESCE($3, category),
        amount = COALESCE($4, amount),
        date = COALESCE($5, date),
        description = COALESCE($6, description),
        receipt_url = COALESCE($7, receipt_url),
        supplier = COALESCE($8, supplier),
        payment_method = COALESCE($9, payment_method),
        updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id, category, amount, date, description, receipt_url, supplier, payment_method],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Expense not found" });
    res.json({ expense: result.rows[0] });
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ error: "Error updating expense" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await query("DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id", [req.params.id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Expense not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Error deleting expense" });
  }
});

module.exports = router;
