const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/leaves - Fetch all leave requests
router.get('/', (req, res) => {
  res.json({ success: true, data: db.getLeaves() });
});

// POST /api/leaves - Update/Save leave requests map
router.post('/', (req, res) => {
  const leaves = req.body;
  if (!leaves || typeof leaves !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid leave data payload.' });
  }
  const updated = db.saveLeaves(leaves);
  res.json({ success: true, data: updated });
});

module.exports = router;
