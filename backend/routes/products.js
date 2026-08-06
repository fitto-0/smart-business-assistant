const router = require('express').Router();
const auth = require('../middleware/auth');
const mockData = require('../data/mockData');

let products = [...mockData.products];

// GET all products
router.get('/', auth, (req, res) => {
  const { category, status, search } = req.query;
  let result = [...products];
  if (category) result = result.filter(p => p.category === category);
  if (status) result = result.filter(p => p.status === status);
  if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  res.json({ products: result, total: result.length });
});

// GET single product
router.get('/:id', auth, (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
  res.json(product);
});

// POST create product
router.post('/', auth, (req, res) => {
  const { name, category, price, stock } = req.body;
  if (!name || !category || price === undefined || stock === undefined)
    return res.status(400).json({ error: 'Champs requis manquants' });
  const status = stock === 0 ? 'rupture' : stock <= 10 ? 'stock_faible' : 'actif';
  const newProduct = { id: Date.now(), name, category, price: parseFloat(price), stock: parseInt(stock), sold: 0, revenue: 0, trend: 0, status };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT update product
router.put('/:id', auth, (req, res) => {
  const idx = products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Produit non trouvé' });
  const updated = { ...products[idx], ...req.body };
  if (req.body.stock !== undefined) {
    updated.stock = parseInt(req.body.stock);
    updated.status = updated.stock === 0 ? 'rupture' : updated.stock <= 10 ? 'stock_faible' : 'actif';
  }
  products[idx] = updated;
  res.json(updated);
});

// DELETE product
router.delete('/:id', auth, (req, res) => {
  const idx = products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Produit non trouvé' });
  products.splice(idx, 1);
  res.json({ message: 'Produit supprimé' });
});

module.exports = router;
