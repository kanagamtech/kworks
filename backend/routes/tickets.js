const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/tickets - List all tickets
router.get('/', (req, res) => {
  res.json({ success: true, data: db.getTickets() });
});

// POST /api/tickets - Save updated tickets array
router.post('/', (req, res) => {
  const tickets = req.body;
  if (!Array.isArray(tickets)) {
    return res.status(400).json({ success: false, message: 'Expected array of tickets.' });
  }
  const updated = db.saveTickets(tickets);
  res.json({ success: true, data: updated });
});

module.exports = router;
