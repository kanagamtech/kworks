const db = require('../db/database');
const { interpolateVariables, sendOutboundEmail } = require('./emailService');

class AutomationEngine {
  /**
   * Handle an event triggered within the CRM
   * @param {string} triggerEvent - e.g. 'LEAD_CREATED', 'DEAL_WON'
   * @param {object} payload - Entity data associated with the event
   */
  async handleEvent(triggerEvent, payload = {}) {
    const rules = db.getAutomationRules().filter(r => r.triggerEvent === triggerEvent && r.isActive);
    const results = [];

    for (const rule of rules) {
      try {
        const result = await this.executeRule(rule, payload);
        results.push(result);
      } catch (err) {
        console.error(`Error executing rule ${rule.name}:`, err);
        db.logAutomation({
          ruleId: rule.id,
          ruleName: rule.name,
          triggerEvent,
          status: 'Failed',
          message: err.message,
          payload
        });
      }
    }

    return results;
  }

  async executeRule(rule, payload) {
    let targetName = '';
    let targetEmail = '';
    let targetId = '';
    let targetType = 'None';
    let context = {};

    switch (rule.triggerEvent) {
      case 'LEAD_CREATED':
      case 'WEBSITE_FORM_SUBMITTED':
      case 'NO_RESPONSE_3_DAYS':
        targetType = 'Lead';
        targetId = payload.id || '';
        targetName = payload.name || 'Valued Lead';
        targetEmail = payload.email || '';
        context = {
          name: payload.name || 'Valued Partner',
          company: payload.company || 'your organization',
          salesperson: payload.assignedTo || 'KwOrKs Executive Team',
          email: payload.email || '',
          source: payload.source || 'Website'
        };
        break;

      case 'DEAL_CREATED':
      case 'DEAL_WON':
        targetType = 'Deal';
        targetId = payload.id || '';
        targetName = payload.title || payload.customerName || 'Valued Client';
        targetEmail = payload.customerEmail || '';
        context = {
          name: payload.customerName || 'Valued Client',
          company: payload.company || 'your company',
          deal_title: payload.title || 'Enterprise Deployment',
          deal_amount: payload.amount ? Number(payload.amount).toLocaleString() : '0',
          salesperson: payload.salesperson || 'KwOrKs Executive Sales'
        };
        break;

      case 'TASK_DUE_TOMORROW':
        targetType = 'Task';
        targetId = payload.id || '';
        targetName = payload.title || 'Task Reminder';
        targetEmail = payload.assignedToEmail || 'assigned@kworks.com';
        context = {
          task_title: payload.title || 'Follow-up Task',
          due_date: payload.dueDate || 'Tomorrow',
          assigned_to: payload.assignedTo || 'Team Member'
        };
        break;

      default:
        context = payload;
    }

    // 1. If Action is SEND_EMAIL
    if (rule.actionType === 'SEND_EMAIL') {
      const template = rule.templateId ? db.getTemplateById(rule.templateId) : null;
      const rawSubject = template ? template.subject : (rule.emailSubject || 'KwOrKs Update');
      const rawBody = template ? template.body : (rule.emailBody || 'KwOrKs Automated Message');

      const subject = interpolateVariables(rawSubject, context);
      const body = interpolateVariables(rawBody, context);

      if (targetEmail) {
        const email = sendOutboundEmail({
          to: targetEmail,
          toName: targetName,
          subject,
          body,
          templateId: rule.templateId,
          linkedType: targetType,
          linkedId: targetId,
          linkedName: targetName,
          isAutomated: true,
          automationRule: `${rule.id} (${rule.name})`
        });

        // Update rule execution stats
        db.updateAutomationRule(rule.id, {
          executionsCount: (rule.executionsCount || 0) + 1,
          lastExecutedAt: new Date().toISOString()
        });

        // Log the automation success
        const log = db.logAutomation({
          ruleId: rule.id,
          ruleName: rule.name,
          triggerEvent: rule.triggerEvent,
          targetType,
          targetId,
          targetName,
          targetEmail,
          status: 'Success',
          message: `Automated email "${subject}" dispatched to ${targetEmail}`,
          payload: { emailId: email.id, subject, targetEmail }
        });

        return { success: true, rule, email, log };
      }
    }

    // 2. If Action is NOTIFY_USER or CREATE_TASK
    if (rule.actionType === 'CREATE_TASK') {
      const task = db.createTask({
        title: `Auto Follow-up for ${targetName}`,
        description: `Automated task created by rule: ${rule.name}`,
        type: 'Follow-up',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        dueTime: '10:00',
        priority: 'High',
        assignedTo: payload.assignedTo || 'Rajesh Raman',
        relatedToType: targetType,
        relatedToId: targetId,
        relatedToName: targetName
      });

      db.updateAutomationRule(rule.id, {
        executionsCount: (rule.executionsCount || 0) + 1,
        lastExecutedAt: new Date().toISOString()
      });

      const log = db.logAutomation({
        ruleId: rule.id,
        ruleName: rule.name,
        triggerEvent: rule.triggerEvent,
        targetType,
        targetId,
        targetName,
        targetEmail,
        status: 'Success',
        message: `Automated Task created: "${task.title}"`,
        payload: { taskId: task.id }
      });

      return { success: true, rule, task, log };
    }

    // Fallback log
    db.updateAutomationRule(rule.id, {
      executionsCount: (rule.executionsCount || 0) + 1,
      lastExecutedAt: new Date().toISOString()
    });

    const log = db.logAutomation({
      ruleId: rule.id,
      ruleName: rule.name,
      triggerEvent: rule.triggerEvent,
      targetType,
      targetId,
      targetName,
      targetEmail,
      status: 'Success',
      message: `Rule ${rule.name} executed for ${targetName}`,
      payload
    });

    return { success: true, rule, log };
  }
}

module.exports = new AutomationEngine();
