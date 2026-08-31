const mongoose = require('mongoose');

const DealSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  contactId: { type: String, default: '' },
  company: { type: String, default: '' },
  companyId: { type: String, default: '' },
  amount: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'USD' },
  stage: { 
    type: String, 
    enum: ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    default: 'Discovery' 
  },
  probability: { type: Number, default: 20 },
  expectedCloseDate: { type: String, default: '' },
  salesperson: { type: String, default: 'Admin' },
  notes: { type: String, default: '' },
  closedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Deal || mongoose.model('Deal', DealSchema);
