const mongoose = require('mongoose');

const QuoteLineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  amount: { type: Number, required: true }
});

const QuoteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  quoteNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  company: { type: String, required: true },
  companyId: { type: String, default: '' },
  dealId: { type: String, default: '' },
  dealTitle: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'], default: 'Draft' },
  items: [QuoteLineItemSchema],
  subtotal: { type: Number, required: true },
  taxPercent: { type: Number, default: 18 }, // 18% GST standard in India
  taxAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  validUntil: { type: String, required: true },
  termsAndConditions: { type: String, default: '1. Quotation validity: 30 days.\n2. Payment terms: 50% advance, 50% on deployment.\n3. GST 18% applicable as per Indian tax norms.\n4. Standard 1-year priority SLA support included.' },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: 'Rajesh Raman' },
  sentAt: { type: Date, default: null },
  acceptedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Quote || mongoose.model('Quote', QuoteSchema);
