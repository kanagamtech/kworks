const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/employees - List all onboarded employees
router.get('/', (req, res) => {
  res.json({ success: true, data: db.getEmployees() });
});

// POST /api/employees - Onboard new employee
router.post('/', (req, res) => {
  const { name, email, role, department, join_date, photo } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
  }
  const emp = db.addEmployee({ name, email, role, department, join_date, photo });
  res.json({ success: true, data: emp });
});

// DELETE /api/employees/:id - Remove employee
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.deleteEmployee(id);
  res.json({ success: true, data: updated });
});

module.exports = router;
