const mongoose = require('mongoose');

const AutomationRuleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  triggerEvent: { 
    type: String, 
    enum: [
      'LEAD_CREATED', 
      'DEAL_CREATED', 
      'DEAL_WON', 
      'NO_RESPONSE_3_DAYS', 
      'TASK_DUE_TOMORROW', 
      'WEBSITE_FORM_SUBMITTED'
    ],
    required: true
  },
  actionType: { 
    type: String, 
    enum: ['SEND_EMAIL', 'CREATE_TASK', 'UPDATE_STATUS', 'NOTIFY_USER'],
    default: 'SEND_EMAIL'
  },
  templateId: { type: String, default: '' },
  emailSubject: { type: String, default: '' },
  emailBody: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  executionsCount: { type: Number, default: 0 },
  lastExecutedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const AutomationLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  ruleId: { type: String, required: true },
  ruleName: { type: String, required: true },
  triggerEvent: { type: String, required: true },
  targetType: { type: String, default: '' },
  targetId: { type: String, default: '' },
  targetName: { type: String, default: '' },
  targetEmail: { type: String, default: '' },
  status: { type: String, enum: ['Success', 'Failed', 'Skipped'], default: 'Success' },
  message: { type: String, default: '' },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  executedAt: { type: Date, default: Date.now }
});

const AutomationRule = mongoose.models.AutomationRule || mongoose.model('AutomationRule', AutomationRuleSchema);
const AutomationLog = mongoose.models.AutomationLog || mongoose.model('AutomationLog', AutomationLogSchema);

module.exports = {
  AutomationRule,
  AutomationLog
};
