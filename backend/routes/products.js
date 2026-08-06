/**
 * Routes produits — connectées à PostgreSQL
 * Import adapté à VOTRE config/db.js (Pool)
 */
const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');
const query = (text, params) => pool.query(text, params);

// GET /api/products (avec filtres : category, status, search)
router.get('/', auth, async (req, res) => {
  try {
    const { category, status, search, sortBy = 'id', order = 'ASC', limit = 100, offset = 0 } = req.query;

    const allowedSorts = ['id', 'name', 'price', 'stock', 'sold', 'revenue', 'trend', 'created_at'];
    const sort = allowedSorts.includes(sortBy) ? sortBy : 'id';
    const ord = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let where = [];
    let params = [];
    let idx = 1;

    if (category) { where.push(`category = $${idx++}`); params.push(category); }
    if (status) { where.push(`status = $${idx++}`); params.push(status); }
    if (search) { where.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const sql = `
      SELECT p.id, p.name, p.category, p.price, p.stock, p.sold, p.revenue, p.trend, p.status,
             p.description, p.sku, p.created_at,
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS reviews_count,
             (SELECT COALESCE(AVG(rating), 0)::DECIMAL(2,1) FROM reviews WHERE product_id = p.id) AS avg_rating
      FROM products p
      ${whereClause}
      ORDER BY ${sort} ${ord}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    res.json({ products: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Erreur GET /products:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/products/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS reviews_count,
              (SELECT COALESCE(AVG(rating), 0)::DECIMAL(2,1) FROM reviews WHERE product_id = p.id) AS avg_rating
       FROM products p WHERE p.id = $1`,
      [parseInt(req.params.id)]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur GET /products/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/products
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, price, stock, description, sku } = req.body;
    if (!name || !category || price === undefined || stock === undefined)
      return res.status(400).json({ error: 'Champs requis : name, category, price, stock' });
    if (!['Électronique', 'Vêtements', 'Alimentation', 'Maison', 'Sport', 'Autre'].includes(category))
      return res.status(400).json({ error: 'Catégorie invalide' });

    const result = await query(
      `INSERT INTO products (name, category, price, stock, description, sku)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, category, parseFloat(price), parseInt(stock), description || null, sku || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur POST /products:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/products/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (existing.rowCount === 0) return res.status(404).json({ error: 'Produit non trouvé' });

    const updates = [];
    const params = [];
    let idx = 1;

    const fieldMap = {
      name: 'name', category: 'category', price: 'price', stock: 'stock',
      description: 'description', sku: 'sku', trend: 'trend', revenue: 'revenue',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined) {
        updates.push(`${col} = $${idx++}`);
        params.push(req.body[key]);
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

    params.push(id);
    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur PUT /products/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id, name', [parseInt(req.params.id)]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json({ message: 'Produit supprimé', product: result.rows[0] });
  } catch (err) {
    console.error('Erreur DELETE /products/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/products/:id/restock
router.post('/:id/restock', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantité requise (>0)' });

    const result = await query(
      `UPDATE products SET stock = stock + $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, name, stock, status`,
      [parseInt(quantity), parseInt(req.params.id)]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json({ message: `+${quantity} unités ajoutées`, product: result.rows[0] });
  } catch (err) {
    console.error('Erreur restock:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;