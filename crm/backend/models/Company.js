const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  domain: { type: String, default: '' },
  industry: { type: String, default: 'Technology' },
  phone: { type: String, default: '' },
  website: { type: String, default: '' },
  location: { type: String, default: '' },
  annualRevenue: { type: Number, default: 0 },
  employeeCount: { type: String, default: '10-50' },
  tier: { type: String, enum: ['Enterprise', 'Mid-Market', 'Startup', 'SMB'], default: 'SMB' },
  owner: { type: String, default: 'Admin' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Company || mongoose.model('Company', CompanySchema);
