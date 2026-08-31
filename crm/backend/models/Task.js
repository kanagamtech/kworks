const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { 
    type: String, 
    enum: ['Follow-up', 'Call', 'Meeting', 'Email', 'Demo', 'Contract', 'General'], 
    default: 'Follow-up' 
  },
  dueDate: { type: String, required: true },
  dueTime: { type: String, default: '17:00' },
  reminder: { type: Boolean, default: true },
  reminderDate: { type: String, default: '' },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'Completed', 'Overdue', 'Cancelled'], default: 'Pending' },
  assignedTo: { type: String, default: 'Admin' },
  relatedToType: { type: String, enum: ['Lead', 'Contact', 'Deal', 'Company', 'None'], default: 'None' },
  relatedToId: { type: String, default: '' },
  relatedToName: { type: String, default: '' },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Task || mongoose.model('Task', TaskSchema);
