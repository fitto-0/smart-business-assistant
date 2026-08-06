const router = require('express').Router();
const auth = require('../middleware/auth');
const mockData = require('../data/mockData');

// GET sentiment analysis results
router.get('/sentiment', auth, (req, res) => {
  res.json({ reviews: mockData.customerReviews, stats: mockData.sentimentStats });
});

// GET anomalies
router.get('/anomalies', auth, (req, res) => {
  const { severity, status } = req.query;
  let result = [...mockData.anomalies];
  if (severity) result = result.filter(a => a.severity === severity);
  if (status) result = result.filter(a => a.status === status);
  res.json({ anomalies: result, total: result.length });
});

// GET recommendations
router.get('/recommendations', auth, (req, res) => {
  res.json({ recommendations: mockData.recommendations });
});

// GET predictions
router.get('/predictions', auth, (req, res) => {
  const { horizon = 6 } = req.query;
  const future = mockData.predictions.filter(p => p.prediction).slice(0, parseInt(horizon));
  res.json({ predictions: future, model: 'LinearRegression', accuracy: 85.3 });
});

// POST analyze CSV (mock)
router.post('/import-csv', auth, (req, res) => {
  // In production, process uploaded CSV and return analysis
  res.json({ message: 'CSV importé avec succès', rows: 245, analyzed: true });
});

module.exports = router;
