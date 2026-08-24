const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/food - List all food count records
router.get('/', (req, res) => {
  res.json({ success: true, data: db.getFoodCounts() });
});

// POST /api/food - Save food count entry
router.post('/', (req, res) => {
  const { date, user, meals } = req.body;
  if (!date || !user || !meals) {
    return res.status(400).json({ success: false, message: 'Date, user, and meals object are required.' });
  }
  const record = db.saveFoodCount({ date, user, meals });
  res.json({ success: true, data: record });
});

module.exports = router;
