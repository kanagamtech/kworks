const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/polls - List all polls
router.get('/', (req, res) => {
  res.json({ success: true, data: db.getPolls() });
});

// POST /api/polls - Save polls array
router.post('/', (req, res) => {
  const polls = req.body;
  if (!Array.isArray(polls)) {
    return res.status(400).json({ success: false, message: 'Expected array of polls.' });
  }
  const updated = db.savePolls(polls);
  res.json({ success: true, data: updated });
});

module.exports = router;
