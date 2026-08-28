const router = require("express").Router();
const auth = require("../middleware/auth");
const pool = require("../config/db");

const query = (text, params) => pool.query(text, params);
const fallbackColors = ["#E8913C", "#2E6B72", "#6366F1", "#EF4444", "#10B981", "#D946EF", "#F59E0B", "#06B6D4"];

router.get("/", auth, async (req, res) => {
  const result = await query(
    `SELECT c.id, c.name, c.color, COUNT(p.id)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.user_id = c.user_id AND p.category = c.name
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.name`,
    [req.user.id],
  );
  return res.json({ categories: result.rows });
});

router.post("/", auth, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const color = /^#[0-9A-Fa-f]{6}$/.test(req.body.color || "")
    ? req.body.color
    : fallbackColors[Math.floor(Math.random() * fallbackColors.length)];

  if (!name || name.length > 80) {
    return res.status(400).json({ error: "Category name is required and must be 80 characters or fewer" });
  }

  try {
    const result = await query(
      `INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING id, name, color`,
      [req.user.id, name, color],
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Category already exists" });
    throw error;
  }
});

router.delete("/:id", auth, async (req, res) => {
  const result = await query(
    `DELETE FROM categories c
     WHERE c.id = $1 AND c.user_id = $2
     AND NOT EXISTS (SELECT 1 FROM products p WHERE p.user_id = c.user_id AND p.category = c.name)
     RETURNING id`,
    [Number.parseInt(req.params.id, 10), req.user.id],
  );

  if (result.rowCount === 0) {
    const used = await query(
      `SELECT 1 FROM categories c JOIN products p ON p.user_id = c.user_id AND p.category = c.name
       WHERE c.id = $1 AND c.user_id = $2 LIMIT 1`,
      [Number.parseInt(req.params.id, 10), req.user.id],
    );
    return res.status(used.rowCount ? 409 : 404).json({
      error: used.rowCount ? "Move or delete products in this category first" : "Category not found",
    });
  }
  return res.json({ message: "Category deleted" });
});

module.exports = router;