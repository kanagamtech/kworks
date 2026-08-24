const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/notices - List all notices / announcements
router.get('/', (req, res) => {
  res.json({ success: true, data: db.getNotices() });
});

// POST /api/notices - Save notices array
router.post('/', (req, res) => {
  const notices = req.body;
  if (!Array.isArray(notices)) {
    return res.status(400).json({ success: false, message: 'Expected array of notices.' });
  }
  const updated = db.saveNotices(notices);
  res.json({ success: true, data: updated });
});

module.exports = router;
