const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/attendance - List all attendance records
router.get('/', (req, res) => {
  res.json({ success: true, data: db.getAttendance() });
});

// POST /api/attendance - Record new attendance entry
router.post('/', (req, res) => {
  const { date, time, user, name, location, photoUri } = req.body;
  if (!date || !user) {
    return res.status(400).json({ success: false, message: 'Date and user email are required.' });
  }
  const record = db.addAttendance({ date, time, user, name, location, photoUri });
  res.json({ success: true, data: record });
});

module.exports = router;
