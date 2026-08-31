const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['Manager', 'Employee', 'Admin'], default: 'Employee' },
  title: { type: String, default: 'Sales Representative' },
  department: { type: String, default: 'Sales & Business Development' },
  phone: { type: String, default: '' },
  monthlyQuota: { type: Number, default: 50000 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
