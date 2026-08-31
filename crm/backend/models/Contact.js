const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  company: { type: String, default: '' },
  companyId: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  department: { type: String, default: '' },
  avatar: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Lead', 'Customer', 'Archived'], default: 'Active' },
  owner: { type: String, default: 'Admin' },
  address: { type: String, default: '' },
  notes: { type: String, default: '' },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
