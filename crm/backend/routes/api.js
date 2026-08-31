const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { sendOutboundEmail, receiveInboundEmail, identifyCustomerByEmail } = require('../services/emailService');
const automationEngine = require('../services/automationEngine');

// 1. Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'kworks-crm-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 2. Database Reset
router.post('/db/reset', (req, res) => {
  const fresh = db.reset();
  res.json({ success: true, message: 'CRM Database reset to clean state', data: fresh });
});

// 3. USER ACCOUNTS MANAGEMENT (Manager & Admin Controls)
router.get('/users', (req, res) => {
  res.json({ success: true, data: db.getUsers() });
});

router.post('/users', (req, res) => {
  try {
    const newUser = db.createUser(req.body);
    res.status(201).json({ success: true, data: newUser, message: 'Employee account created successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/users/:id', (req, res) => {
  const updated = db.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: updated, message: 'User account updated successfully.' });
});

router.delete('/users/:id', (req, res) => {
  const remaining = db.deleteUser(req.params.id);
  res.json({ success: true, data: remaining, message: 'User removed from system.' });
});

// 4. Dashboard KPI Aggregator (Supports Scoped View by User / Role)
router.get('/dashboard', (req, res) => {
  const scopedUser = req.query.user || null;
  const leads = db.getLeads(scopedUser);
  const deals = db.getDeals(scopedUser);
  const tasks = db.getTasks(scopedUser);
  const emails = db.getEmails(scopedUser);
  const contacts = db.getContacts(scopedUser);

  const totalRevenue = deals
    .filter(d => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const pipelineValue = deals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const openDealsCount = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length;
  const newLeadsCount = leads.filter(l => l.status === 'New').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === todayStr && t.status !== 'Completed');
  const pendingFollowups = tasks.filter(t => t.type === 'Follow-up' && t.status !== 'Completed');

  const wonDealsCount = deals.filter(d => d.stage === 'Closed Won').length;
  const totalClosed = deals.filter(d => ['Closed Won', 'Closed Lost'].includes(d.stage)).length;
  const winRate = totalClosed > 0 ? Math.round((wonDealsCount / totalClosed) * 100) : 75;

  const conversionRate = leads.length > 0
    ? Math.round((leads.filter(l => ['Qualified', 'Proposal Sent', 'Converted'].includes(l.status)).length / leads.length) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      metrics: {
        totalRevenue,
        pipelineValue,
        openDealsCount,
        newLeadsCount,
        totalLeads: leads.length,
        totalContacts: contacts.length,
        totalDeals: deals.length,
        todayTasksCount: todayTasks.length,
        pendingFollowupsCount: pendingFollowups.length,
        winRate,
        conversionRate,
        emailsCount: emails.length,
        unreadEmailsCount: emails.filter(e => e.folder === 'inbox' && !e.isRead).length
      },
      todayTasks,
      recentLeads: leads.slice(0, 5),
      recentDeals: deals.slice(0, 5),
      recentEmails: emails.slice(0, 5)
    }
  });
});

// --- LEADS ROUTES ---
router.get('/leads', (req, res) => {
  const scopedUser = req.query.user || null;
  res.json({ success: true, data: db.getLeads(scopedUser) });
});

router.post('/leads', async (req, res) => {
  try {
    const createdBy = req.body.createdBy || req.body.assignedTo || 'Rajesh Raman';
    const newLead = db.createLead(req.body, createdBy);
    // Trigger Automation Event: LEAD_CREATED
    await automationEngine.handleEvent('LEAD_CREATED', newLead);
    res.status(201).json({ success: true, data: newLead });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/leads/:id', (req, res) => {
  const updated = db.updateLead(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Lead not found' });
  res.json({ success: true, data: updated });
});

router.delete('/leads/:id', (req, res) => {
  const remaining = db.deleteLead(req.params.id);
  res.json({ success: true, data: remaining });
});

// Convert Lead to Contact & Deal
router.post('/leads/:id/convert', async (req, res) => {
  const lead = db.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

  // 1. Create or Find Company
  let company = db.getCompanies().find(c => c.name.toLowerCase() === (lead.company || '').toLowerCase());
  if (!company && lead.company) {
    company = db.createCompany({
      name: lead.company,
      domain: (lead.email.split('@')[1] || '').toLowerCase(),
      owner: lead.assignedTo
    }, lead.assignedTo);
  }

  // 2. Create Contact
  const contact = db.createContact({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    companyId: company ? company.id : '',
    owner: lead.assignedTo,
    notes: `Converted from Lead ${lead.id}. ${lead.notes}`
  }, lead.assignedTo);

  // 3. Create Deal
  const deal = db.createDeal({
    title: `${lead.company || lead.name} Enterprise Rollout`,
    customerName: lead.name,
    customerEmail: lead.email,
    contactId: contact.id,
    company: lead.company,
    companyId: company ? company.id : '',
    amount: lead.estimatedValue || 15000,
    stage: 'Discovery',
    salesperson: lead.assignedTo,
    notes: lead.notes
  }, lead.assignedTo);

  // 4. Update Lead status
  db.updateLead(lead.id, { status: 'Converted' });

  // Trigger DEAL_CREATED automation
  await automationEngine.handleEvent('DEAL_CREATED', deal);

  res.json({
    success: true,
    message: 'Lead converted successfully to Contact and Deal!',
    data: { contact, deal, company }
  });
});

// --- CONTACTS ROUTES ---
router.get('/contacts', (req, res) => {
  const scopedUser = req.query.user || null;
  res.json({ success: true, data: db.getContacts(scopedUser) });
});

router.post('/contacts', (req, res) => {
  const createdBy = req.body.owner || 'Rajesh Raman';
  const newContact = db.createContact(req.body, createdBy);
  res.status(201).json({ success: true, data: newContact });
});

router.put('/contacts/:id', (req, res) => {
  const updated = db.updateContact(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true, data: updated });
});

router.delete('/contacts/:id', (req, res) => {
  const remaining = db.deleteContact(req.params.id);
  res.json({ success: true, data: remaining });
});

// --- COMPANIES ROUTES ---
router.get('/companies', (req, res) => {
  res.json({ success: true, data: db.getCompanies() });
});

router.post('/companies', (req, res) => {
  const newComp = db.createCompany(req.body);
  res.status(201).json({ success: true, data: newComp });
});

router.put('/companies/:id', (req, res) => {
  const updated = db.updateCompany(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Company not found' });
  res.json({ success: true, data: updated });
});

router.delete('/companies/:id', (req, res) => {
  const remaining = db.deleteCompany(req.params.id);
  res.json({ success: true, data: remaining });
});

// --- QUOTATIONS ROUTES ⭐ (NEW) ---
router.get('/quotes', (req, res) => {
  const scopedUser = req.query.user || null;
  res.json({ success: true, data: db.getQuotes(scopedUser) });
});

router.post('/quotes', async (req, res) => {
  try {
    const createdBy = req.body.createdBy || 'Rajesh Raman';
    const newQuote = db.createQuote(req.body, createdBy);
    res.status(201).json({ success: true, data: newQuote, message: 'Quotation generated successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/quotes/:id', (req, res) => {
  const updated = db.updateQuote(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Quote not found' });
  res.json({ success: true, data: updated, message: 'Quotation updated successfully.' });
});

router.delete('/quotes/:id', (req, res) => {
  const remaining = db.deleteQuote(req.params.id);
  res.json({ success: true, data: remaining, message: 'Quotation removed.' });
});

// Send Quote to Customer via Email
router.post('/quotes/:id/send', (req, res) => {
  const quote = db.getQuoteById(req.params.id);
  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  const itemsTable = (quote.items || []).map((it, idx) => 
    `${idx + 1}. ${it.description} — Qty: ${it.quantity} x ₹${(it.unitPrice || 0).toLocaleString('en-IN')} = ₹${(it.amount || 0).toLocaleString('en-IN')}`
  ).join('\n');

  const emailBody = `Dear ${quote.customerName},\n\nWe are pleased to submit official commercial quotation ${quote.quoteNumber} for "${quote.title}".\n\n=== SCOPE OF DELIVERABLES ===\n${itemsTable}\n\nSubtotal: ₹${(quote.subtotal || 0).toLocaleString('en-IN')}\nGST (18%): ₹${(quote.taxAmount || 0).toLocaleString('en-IN')}\nGRAND TOTAL: ₹${(quote.grandTotal || 0).toLocaleString('en-IN')} (INR)\n\n=== TERMS & CONDITIONS ===\n${quote.termsAndConditions}\n\nQuotation is valid until ${quote.validUntil}.\nPlease reply to this email to accept or request revisions.\n\nWarm regards,\n${quote.createdBy}\nKwOrKs Enterprise Platform`;

  const email = sendOutboundEmail({
    to: quote.customerEmail,
    toName: quote.customerName,
    subject: `Official Commercial Quotation [${quote.quoteNumber}]: ${quote.title}`,
    body: emailBody,
    linkedType: 'Deal',
    linkedId: quote.dealId || quote.id,
    linkedName: quote.dealTitle || quote.title
  });

  const updatedQuote = db.updateQuote(quote.id, { status: 'Sent', sentAt: new Date().toISOString() });

  res.json({
    success: true,
    data: { quote: updatedQuote, email },
    message: `Quotation ${quote.quoteNumber} dispatched to ${quote.customerEmail}!`
  });
});

// Accept Quote & Win Deal
router.post('/quotes/:id/accept', async (req, res) => {
  const quote = db.getQuoteById(req.params.id);
  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  const updatedQuote = db.updateQuote(quote.id, { status: 'Accepted', acceptedAt: new Date().toISOString() });

  // Update associated deal if present
  let deal = null;
  if (quote.dealId) {
    deal = db.updateDeal(quote.dealId, { stage: 'Closed Won', probability: 100, amount: quote.grandTotal });
    if (deal) {
      await automationEngine.handleEvent('DEAL_WON', deal);
    }
  }

  res.json({
    success: true,
    data: { quote: updatedQuote, deal },
    message: `🎉 Quotation ${quote.quoteNumber} marked as Accepted! Deal moved to Closed Won!`
  });
});

// --- DEALS ROUTES ---
router.get('/deals', (req, res) => {
  const scopedUser = req.query.user || null;
  res.json({ success: true, data: db.getDeals(scopedUser) });
});

router.post('/deals', async (req, res) => {
  const createdBy = req.body.salesperson || 'Rajesh Raman';
  const newDeal = db.createDeal(req.body, createdBy);
  // Trigger DEAL_CREATED automation
  await automationEngine.handleEvent('DEAL_CREATED', newDeal);
  res.status(201).json({ success: true, data: newDeal });
});

router.put('/deals/:id', async (req, res) => {
  const prev = db.getDealById(req.params.id);
  const updated = db.updateDeal(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Deal not found' });

  // If deal was just moved to Closed Won, trigger DEAL_WON automation
  if (req.body.stage === 'Closed Won' && prev && prev.stage !== 'Closed Won') {
    await automationEngine.handleEvent('DEAL_WON', updated);
  }

  res.json({ success: true, data: updated });
});

router.delete('/deals/:id', (req, res) => {
  const remaining = db.deleteDeal(req.params.id);
  res.json({ success: true, data: remaining });
});

// --- TASKS & FOLLOW-UPS ROUTES ---
router.get('/tasks', (req, res) => {
  const scopedUser = req.query.user || null;
  res.json({ success: true, data: db.getTasks(scopedUser) });
});

router.post('/tasks', (req, res) => {
  const createdBy = req.body.assignedTo || 'Rajesh Raman';
  const newTask = db.createTask(req.body, createdBy);
  res.status(201).json({ success: true, data: newTask });
});

router.put('/tasks/:id', (req, res) => {
  const updated = db.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Task not found' });
  res.json({ success: true, data: updated });
});

router.delete('/tasks/:id', (req, res) => {
  const remaining = db.deleteTask(req.params.id);
  res.json({ success: true, data: remaining });
});

// --- EMAIL ENGINE ROUTES ⭐ ---
router.get('/emails', (req, res) => {
  const scopedUser = req.query.user || null;
  res.json({ success: true, data: db.getEmails(scopedUser) });
});

// Outbound Send
router.post('/emails/send', (req, res) => {
  try {
    const { to, toName, cc, bcc, subject, body, templateId, linkedType, linkedId, linkedName, attachments } = req.body;
    if (!to || !subject) {
      return res.status(400).json({ success: false, message: 'Recipient (To) and Subject are required.' });
    }
    const email = sendOutboundEmail({
      to,
      toName,
      cc,
      bcc,
      subject,
      body,
      templateId,
      linkedType,
      linkedId,
      linkedName,
      attachments
    });
    res.status(201).json({ success: true, data: email, message: 'Email sent successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Inbound Customer Email Simulator
router.post('/emails/simulate-inbound', (req, res) => {
  try {
    const { from, fromName, subject, body, attachments } = req.body;
    if (!from || !subject) {
      return res.status(400).json({ success: false, message: 'Sender (From) and Subject are required.' });
    }
    const result = receiveInboundEmail({ from, fromName, subject, body, attachments });
    res.status(201).json({
      success: true,
      data: result.email,
      matchedCustomer: result.matchedCustomer,
      message: `Incoming email received! Auto-linked to ${result.matchedCustomer.type}: ${result.matchedCustomer.name || 'Unmatched'}`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/emails/:id', (req, res) => {
  const updated = db.updateEmail(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Email not found' });
  res.json({ success: true, data: updated });
});

router.delete('/emails/:id', (req, res) => {
  const remaining = db.deleteEmail(req.params.id);
  res.json({ success: true, data: remaining });
});

// Mark Email as Lead ⭐ (NEW)
router.post('/emails/:id/mark-as-lead', async (req, res) => {
  try {
    const email = db.getEmailById(req.params.id);
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

    const contactEmail = email.direction === 'inbound' ? email.from : email.to;
    const contactName = email.direction === 'inbound' 
      ? (email.fromName || contactEmail.split('@')[0])
      : (email.toName || contactEmail.split('@')[0]);

    // Infer company name from email domain or subject
    const domain = (contactEmail.split('@')[1] || '').split('.')[0];
    const companyInfer = domain ? domain.charAt(0).toUpperCase() + domain.slice(1) + ' Inc.' : 'New Enterprise Account';

    const newLead = db.createLead({
      name: contactName,
      company: req.body.company || companyInfer,
      email: contactEmail,
      phone: req.body.phone || '+91 98000 00000',
      source: 'Inbound Call',
      status: 'New',
      assignedTo: req.body.assignedTo || 'Rajesh Raman',
      createdBy: 'Rajesh Raman',
      estimatedValue: req.body.estimatedValue || 2500000,
      notes: `Lead automatically ingested from email thread: "${email.subject}". Initial message:\n${email.body.slice(0, 300)}`,
      autoFollowUp: true,
    });

    // Link email to new lead
    const updatedEmail = db.updateEmail(email.id, {
      linkedType: 'Lead',
      linkedId: newLead.id,
      linkedName: newLead.name,
    });

    // Trigger LEAD_CREATED automation
    await automationEngine.handleEvent('LEAD_CREATED', newLead);

    res.status(201).json({
      success: true,
      data: { lead: newLead, email: updatedEmail },
      message: `🎉 "${contactName}" has been successfully converted to a CRM Lead! Automated Welcome Email dispatched.`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer Identification Lookup helper
router.get('/emails/identify', (req, res) => {
  const emailQuery = req.query.email || '';
  const match = identifyCustomerByEmail(emailQuery);
  res.json({ success: true, data: match });
});

// --- EMAIL TEMPLATES ROUTES ---
router.get('/templates', (req, res) => {
  res.json({ success: true, data: db.getTemplates() });
});

router.post('/templates', (req, res) => {
  const newTpl = db.createTemplate(req.body);
  res.status(201).json({ success: true, data: newTpl });
});

router.put('/templates/:id', (req, res) => {
  const updated = db.updateTemplate(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Template not found' });
  res.json({ success: true, data: updated });
});

router.delete('/templates/:id', (req, res) => {
  const remaining = db.deleteTemplate(req.params.id);
  res.json({ success: true, data: remaining });
});

// --- AUTOMATION RULES & LOGS ROUTES ⭐ ---
router.get('/automations/rules', (req, res) => {
  res.json({ success: true, data: db.getAutomationRules() });
});

router.put('/automations/rules/:id', (req, res) => {
  const updated = db.updateAutomationRule(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Rule not found' });
  res.json({ success: true, data: updated });
});

router.get('/automations/logs', (req, res) => {
  res.json({ success: true, data: db.getAutomationLogs() });
});

router.post('/automations/trigger', async (req, res) => {
  try {
    const { event, payload } = req.body;
    if (!event) return res.status(400).json({ success: false, message: 'Event name is required' });
    const results = await automationEngine.handleEvent(event, payload || {});
    res.json({ success: true, message: `Triggered event ${event}`, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- REPORTS & METRICS ROUTES ---
router.get('/reports', (req, res) => {
  const leads = db.getLeads();
  const deals = db.getDeals();
  const emails = db.getEmails();
  const tasks = db.getTasks();
  const users = db.getUsers();

  const leadsBySource = {};
  leads.forEach(l => {
    leadsBySource[l.source] = (leadsBySource[l.source] || 0) + 1;
  });

  const dealsByStage = {};
  deals.forEach(d => {
    if (!dealsByStage[d.stage]) dealsByStage[d.stage] = { count: 0, totalAmount: 0 };
    dealsByStage[d.stage].count += 1;
    dealsByStage[d.stage].totalAmount += (Number(d.amount) || 0);
  });

  const employeesMap = {};
  users.forEach(u => {
    employeesMap[u.name] = {
      name: u.name,
      role: u.title || u.role,
      userRole: u.role,
      wonRevenue: 0,
      dealsCount: 0,
      leadsCount: 0,
      tasksDone: 0,
      monthlyQuota: u.monthlyQuota || 50000
    };
  });

  deals.forEach(d => {
    const sp = d.salesperson || 'Admin Executive';
    if (!employeesMap[sp]) {
      employeesMap[sp] = { name: sp, role: 'Sales Specialist', userRole: 'Employee', wonRevenue: 0, dealsCount: 0, leadsCount: 0, tasksDone: 0, monthlyQuota: 50000 };
    }
    employeesMap[sp].dealsCount += 1;
    if (d.stage === 'Closed Won') {
      employeesMap[sp].wonRevenue += (Number(d.amount) || 0);
    }
  });

  leads.forEach(l => {
    const sp = l.assignedTo || 'Admin Executive';
    if (employeesMap[sp]) employeesMap[sp].leadsCount += 1;
  });

  tasks.forEach(t => {
    const sp = t.assignedTo || 'Admin Executive';
    if (employeesMap[sp] && t.status === 'Completed') employeesMap[sp].tasksDone += 1;
  });

  const emailStats = {
    totalSent: emails.filter(e => e.folder === 'sent').length,
    totalReceived: emails.filter(e => e.folder === 'inbox').length,
    automatedCount: emails.filter(e => e.isAutomated).length,
    unreadInbox: emails.filter(e => e.folder === 'inbox' && !e.isRead).length
  };

  res.json({
    success: true,
    data: {
      leadsBySource,
      dealsByStage,
      employeePerformance: Object.values(employeesMap),
      emailStats
    }
  });
});

module.exports = router;
