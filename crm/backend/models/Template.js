const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Welcome', 'Follow-up', 'Quotation', 'Payment Reminder', 'Thank You', 'Meeting Confirmation', 'General'],
    default: 'General'
  },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  variables: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Template || mongoose.model('Template', TemplateSchema);
