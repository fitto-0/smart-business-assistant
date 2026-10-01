const router = require("express").Router();
const auth = require("../middleware/auth");
const { withOrgContext } = require("../middleware/orgContext");
const { requirePermission } = require("../middleware/permissions");
const pool = require("../config/db");

const query = (text, params) => pool.query(text, params);
const fallbackColors = [
  "#1C352D",
  "#2E6B72",
  "#6366F1",
  "#EF4444",
  "#10B981",
  "#D946EF",
  "#7E9C6B",
  "#06B6D4",
];

/**
 * Categories are shared by the whole organization: the owner decides who may read
 * and who may write them, and two members must not create the same name twice.
 */
router.get(
  "/",
  auth,
  withOrgContext(),
  requirePermission("products", "view"),
  async (req, res) => {
    try {
      const result = await query(
        `SELECT c.id, c.name, c.color, COUNT(p.id)::int AS product_count
           FROM categories c
           LEFT JOIN products p
             ON p.organization_id = c.organization_id
            AND p.category = c.name
            AND p.deleted_at IS NULL
          WHERE c.organization_id = $1
          GROUP BY c.id
          ORDER BY c.name`,
        [req.organizationId],
      );
      return res.json({ categories: result.rows });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({ error: "Error fetching categories" });
    }
  },
);

router.post(
  "/",
  auth,
  withOrgContext(),
  requirePermission("products", "create"),
  async (req, res) => {
    const name = String((req.body && req.body.name) || "").trim();
    const color = /^#[0-9A-Fa-f]{6}$/.test((req.body && req.body.color) || "")
      ? req.body.color
      : fallbackColors[Math.floor(Math.random() * fallbackColors.length)];

    if (!name || name.length > 80) {
      return res.status(400).json({
        error: "Category name is required and must be 80 characters or fewer",
      });
    }

    try {
      const result = await query(
        `INSERT INTO categories (organization_id, user_id, name, color)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING
         RETURNING id, name, color`,
        [req.organizationId, req.user.id, name, color],
      );

      if (result.rowCount === 0) {
        return res.status(409).json({ error: "Category already exists" });
      }
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Category already exists" });
      }
      console.error("Error creating category:", error);
      return res.status(500).json({ error: "Error creating category" });
    }
  },
);

router.delete(
  "/:id",
  auth,
  withOrgContext(),
  requirePermission("products", "delete"),
  async (req, res) => {
    const categoryId = Number.parseInt(req.params.id, 10);

    try {
      const result = await query(
        `DELETE FROM categories c
          WHERE c.id = $1 AND c.organization_id = $2
            AND NOT EXISTS (
              SELECT 1 FROM products p
               WHERE p.organization_id = c.organization_id
                 AND p.category = c.name
                 AND p.deleted_at IS NULL
            )
        RETURNING id`,
        [categoryId, req.organizationId],
      );

      if (result.rowCount === 0) {
        const used = await query(
          `SELECT 1
             FROM categories c
             JOIN products p
               ON p.organization_id = c.organization_id
              AND p.category = c.name
              AND p.deleted_at IS NULL
            WHERE c.id = $1 AND c.organization_id = $2
            LIMIT 1`,
          [categoryId, req.organizationId],
        );
        return res.status(used.rowCount ? 409 : 404).json({
          error: used.rowCount
            ? "Move or delete products in this category first"
            : "Category not found",
        });
      }
      return res.json({ message: "Category deleted" });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.status(500).json({ error: "Error deleting category" });
    }
  },
);

module.exports = router;
