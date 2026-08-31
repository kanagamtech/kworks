const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  company: { type: String, default: '' },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  source: { 
    type: String, 
    enum: ['Website Form', 'Referral', 'LinkedIn', 'Inbound Call', 'Cold Outreach', 'Event / Conference', 'Other'],
    default: 'Website Form'
  },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted', 'Unqualified'],
    default: 'New' 
  },
  assignedTo: { type: String, default: 'Admin' },
  estimatedValue: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  autoFollowUp: { type: Boolean, default: true },
  lastContactedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
