const router = require('express').Router();
const auth = require('../middleware/auth');
const mockData = require('../data/mockData');

// GET monthly sales
router.get('/monthly', auth, (req, res) => {
  res.json({ data: mockData.monthlySales, total: mockData.monthlySales.reduce((s, m) => s + m.ventes, 0) });
});

// GET category breakdown
router.get('/categories', auth, (req, res) => {
  res.json({ data: mockData.categoryData });
});

// GET KPIs
router.get('/kpis', auth, (req, res) => {
  res.json(mockData.kpis);
});

// GET top products
router.get('/top-products', auth, (req, res) => {
  const sorted = [...mockData.products].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  res.json({ data: sorted });
});

module.exports = router;
