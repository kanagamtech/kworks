const db = require('../db/database');

/**
 * Replace placeholders like {{name}}, {{company}}, {{deal_amount}}, etc. in template body and subject.
 */
function interpolateVariables(templateText, context = {}) {
  if (!templateText) return '';
  return templateText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return context[key] !== undefined && context[key] !== null ? String(context[key]) : match;
  });
}

/**
 * Identify matching Contact, Lead, or Deal from an email address
 */
function identifyCustomerByEmail(emailAddress) {
  if (!emailAddress) return { type: 'None', id: '', name: '', entity: null };
  const clean = emailAddress.trim().toLowerCase();

  // 1. Check Contacts
  const contact = db.getContacts().find(c => (c.email || '').toLowerCase() === clean);
  if (contact) {
    return { type: 'Contact', id: contact.id, name: contact.name, entity: contact };
  }

  // 2. Check Leads
  const lead = db.getLeads().find(l => (l.email || '').toLowerCase() === clean);
  if (lead) {
    return { type: 'Lead', id: lead.id, name: lead.name, entity: lead };
  }

  // 3. Check Deals (customerEmail)
  const deal = db.getDeals().find(d => (d.customerEmail || '').toLowerCase() === clean);
  if (deal) {
    return { type: 'Deal', id: deal.id, name: deal.title, entity: deal };
  }

  return { type: 'None', id: '', name: '', entity: null };
}

/**
 * Send an Outbound Email from CRM (stores to database, links to customer history, triggers threading)
 */
function sendOutboundEmail({
  to,
  toName,
  from = 'crm@kworks.com',
  fromName = 'KwOrKs CRM',
  cc = '',
  bcc = '',
  subject,
  body,
  templateId = '',
  linkedType,
  linkedId,
  linkedName,
  attachments = [],
  isAutomated = false,
  automationRule = ''
}) {
  // If linking was not explicitly specified, auto-identify from recipient email
  if (!linkedId || linkedType === 'None') {
    const identified = identifyCustomerByEmail(to);
    if (identified.type !== 'None') {
      linkedType = identified.type;
      linkedId = identified.id;
      linkedName = identified.name;
    }
  }

  const newEmail = db.createEmail({
    direction: 'outbound',
    from,
    fromName,
    to,
    toName: toName || to,
    cc,
    bcc,
    subject,
    body,
    folder: 'sent',
    isRead: true,
    isStarred: false,
    attachments,
    linkedType: linkedType || 'None',
    linkedId: linkedId || '',
    linkedName: linkedName || '',
    templateUsed: templateId,
    isAutomated,
    automationRule,
    sentAt: new Date().toISOString()
  });

  return newEmail;
}

/**
 * Receive an Inbound Customer Email into CRM Inbox
 * Automatically identifies customer and saves email under their history timeline!
 */
function receiveInboundEmail({
  from,
  fromName,
  to = 'crm@kworks.com',
  toName = 'KwOrKs Support & Sales',
  subject,
  body,
  attachments = []
}) {
  // Auto identify customer
  const identified = identifyCustomerByEmail(from);

  const newEmail = db.createEmail({
    direction: 'inbound',
    from,
    fromName: fromName || (identified.entity ? identified.entity.name : from.split('@')[0]),
    to,
    toName,
    subject,
    body,
    folder: 'inbox',
    isRead: false,
    isStarred: false,
    attachments,
    linkedType: identified.type,
    linkedId: identified.id,
    linkedName: identified.name,
    receivedAt: new Date().toISOString()
  });

  return {
    email: newEmail,
    matchedCustomer: identified
  };
}

module.exports = {
  interpolateVariables,
  identifyCustomerByEmail,
  sendOutboundEmail,
  receiveInboundEmail
};
