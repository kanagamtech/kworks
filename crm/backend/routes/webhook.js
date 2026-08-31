const express = require('express');
const router = express.Router();
const db = require('../db/database');
const automationEngine = require('../services/automationEngine');

/**
 * Public Web-to-Lead Webhook Endpoint
 * Allows external landing pages / marketing websites to send lead inquiries into the CRM.
 */
router.post('/lead', async (req, res) => {
  try {
    const { name, email, company, phone, message, source, estimatedBudget } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and Email are required to submit a lead inquiry.'
      });
    }

    // 1. Create Lead in CRM
    const newLead = db.createLead({
      name: name.trim(),
      email: email.trim(),
      company: (company || '').trim(),
      phone: (phone || '').trim(),
      source: source || 'Website Form',
      status: 'New',
      assignedTo: 'Rajesh Raman',
      estimatedValue: Number(estimatedBudget) || 12000,
      notes: `Inquiry Message from Web Form: ${message || 'Interested in KwOrKs Enterprise platform.'}`,
      autoFollowUp: true
    });

    // 2. Trigger AUTOMATION EVENT: WEBSITE_FORM_SUBMITTED
    const automationResults = await automationEngine.handleEvent('WEBSITE_FORM_SUBMITTED', newLead);

    // 3. Create Immediate Follow-Up Task
    const task = db.createTask({
      title: `⚡ Web Form Inquiry: Contact ${newLead.name}`,
      description: `Customer submitted web form from ${newLead.company || 'Website'}. Inbound Message: "${message || 'Demo Request'}"`,
      type: 'Follow-up',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '12:00',
      priority: 'High',
      assignedTo: newLead.assignedTo,
      relatedToType: 'Lead',
      relatedToId: newLead.id,
      relatedToName: newLead.name
    });

    res.status(201).json({
      success: true,
      message: 'Lead inquiry ingested successfully! Automated welcome email dispatched.',
      data: {
        lead: newLead,
        task,
        automations: automationResults
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
