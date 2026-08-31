const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  threadId: { type: String, default: '' },
  direction: { type: String, enum: ['inbound', 'outbound'], default: 'outbound' },
  from: { type: String, required: true },
  fromName: { type: String, default: '' },
  to: { type: String, required: true },
  toName: { type: String, default: '' },
  cc: { type: String, default: '' },
  bcc: { type: String, default: '' },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  snippet: { type: String, default: '' },
  folder: { type: String, enum: ['inbox', 'sent', 'drafts', 'trash', 'archived'], default: 'sent' },
  isRead: { type: Boolean, default: true },
  isStarred: { type: Boolean, default: false },
  attachments: [{
    name: { type: String },
    size: { type: String },
    type: { type: String },
    data: { type: String }
  }],
  linkedType: { type: String, enum: ['Lead', 'Contact', 'Deal', 'Company', 'None'], default: 'None' },
  linkedId: { type: String, default: '' },
  linkedName: { type: String, default: '' },
  templateUsed: { type: String, default: '' },
  isAutomated: { type: Boolean, default: false },
  automationRule: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now },
  receivedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Email || mongoose.model('Email', EmailSchema);
