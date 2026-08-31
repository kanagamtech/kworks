import React, { useState, useEffect } from 'react';
import { Email, EmailFolder, EmailTemplate, EmailAttachment, Contact, Lead, Deal } from '../types/crm';
import { COLORS, themeStyles } from '../styles/theme';
import { Modal } from '../components/Modal';

interface EmailPageProps {
  emails: Email[];
  templates: EmailTemplate[];
  contacts: Contact[];
  leads: Lead[];
  deals: Deal[];
  onSendEmail: (payload: {
    to: string;
    toName?: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    templateId?: string;
    linkedType?: string;
    linkedId?: string;
    linkedName?: string;
    attachments?: EmailAttachment[];
  }) => Promise<void>;
  onSimulateInbound: (payload: {
    from: string;
    fromName?: string;
    subject: string;
    body: string;
    attachments?: EmailAttachment[];
  }) => Promise<void>;
  onUpdateEmail: (id: string, updates: Partial<Email>) => Promise<void>;
  onDeleteEmail: (id: string) => Promise<void>;
  onMarkAsLead?: (emailId: string) => Promise<void>;
  composeModalOpen: boolean;
  onCloseCompose: () => void;
  onOpenCompose: () => void;
  prefillEmail?: { to: string; toName?: string; linkedId?: string; subject?: string; body?: string } | null;
}

export const EmailPage: React.FC<EmailPageProps> = ({
  emails,
  templates,
  contacts,
  leads,
  deals,
  onSendEmail,
  onSimulateInbound,
  onUpdateEmail,
  onDeleteEmail,
  onMarkAsLead,
  composeModalOpen,
  onCloseCompose,
  onOpenCompose,
  prefillEmail,
}) => {
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>('inbox');
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isInboundSimModalOpen, setIsInboundSimModalOpen] = useState(false);

  // Composer Form State
  const [to, setTo] = useState('');
  const [toName, setToName] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [linkedType, setLinkedType] = useState<'None' | 'Lead' | 'Contact' | 'Deal' | 'Company'>('None');
  const [linkedId, setLinkedId] = useState('');
  const [linkedName, setLinkedName] = useState('');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Inbound Simulator Form State
  const [simFrom, setSimFrom] = useState('priya.sharma@apexlogistics.io');
  const [simFromName, setSimFromName] = useState('Priya Sharma (Apex Logistics)');
  const [simSubject, setSimSubject] = useState('Updated Driver Count for Next Month shift rollouts');
  const [simBody, setSimBody] = useState('Hello KwOrKs team,\n\nWe would like to add 60 more drivers to the biometric face roster next Monday. Can you confirm if our current subscription tier covers this increase?\n\nThanks,\nPriya');
  const [simHasAttachment, setSimHasAttachment] = useState(true);

  // Prefill hook
  useEffect(() => {
    if (prefillEmail) {
      setTo(prefillEmail.to || '');
      setToName(prefillEmail.toName || '');
      if (prefillEmail.subject) setSubject(prefillEmail.subject);
      if (prefillEmail.body) setBody(prefillEmail.body);
      if (prefillEmail.linkedId) {
        setLinkedId(prefillEmail.linkedId);
        setLinkedType('Contact');
      }
    }
  }, [prefillEmail]);

  // Handle template selection & variable interpolation
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    // Determine target context
    let targetName = toName || (to.split('@')[0] || 'Valued Client');
    let companyName = 'your organization';
    let dealAmount = '25,000';
    let dealTitle = 'Enterprise Solutions';

    const matchedContact = contacts.find((c) => c.email.toLowerCase() === to.toLowerCase());
    const matchedLead = leads.find((l) => l.email.toLowerCase() === to.toLowerCase());

    if (matchedContact) {
      targetName = matchedContact.name;
      companyName = matchedContact.company || companyName;
    } else if (matchedLead) {
      targetName = matchedLead.name;
      companyName = matchedLead.company || companyName;
      if (matchedLead.estimatedValue) dealAmount = matchedLead.estimatedValue.toLocaleString();
    }

    let interpolatedSubject = tpl.subject
      .replace(/\{\{name\}\}/g, targetName)
      .replace(/\{\{company\}\}/g, companyName)
      .replace(/\{\{deal_amount\}\}/g, dealAmount)
      .replace(/\{\{deal_title\}\}/g, dealTitle)
      .replace(/\{\{salesperson\}\}/g, 'KwOrKs Executive Sales');

    let interpolatedBody = tpl.body
      .replace(/\{\{name\}\}/g, targetName)
      .replace(/\{\{company\}\}/g, companyName)
      .replace(/\{\{deal_amount\}\}/g, dealAmount)
      .replace(/\{\{deal_title\}\}/g, dealTitle)
      .replace(/\{\{salesperson\}\}/g, 'KwOrKs Executive Sales');

    setSubject(interpolatedSubject);
    setBody(interpolatedBody);
  };

  // Auto-detect entity when typing "To" email
  const handleToChange = (val: string) => {
    setTo(val);
    const clean = val.trim().toLowerCase();
    const contact = contacts.find((c) => c.email.toLowerCase() === clean);
    if (contact) {
      setToName(contact.name);
      setLinkedType('Contact');
      setLinkedId(contact.id);
      setLinkedName(contact.name);
      return;
    }
    const lead = leads.find((l) => l.email.toLowerCase() === clean);
    if (lead) {
      setToName(lead.name);
      setLinkedType('Lead');
      setLinkedId(lead.id);
      setLinkedName(lead.name);
      return;
    }
  };

  // Attach mock / real files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newAtt: EmailAttachment = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type || 'application/octet-stream',
    };
    setAttachments([...attachments, newAtt]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject) return;

    setIsSending(true);
    await onSendEmail({
      to,
      toName,
      cc,
      bcc,
      subject,
      body,
      templateId: selectedTemplateId,
      linkedType,
      linkedId,
      linkedName,
      attachments,
    });
    setIsSending(false);

    // Reset composer
    setTo('');
    setToName('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    setAttachments([]);
    setSelectedTemplateId('');
    onCloseCompose();
  };

  // Reply handler
  const handleReply = (email: Email) => {
    setTo(email.direction === 'inbound' ? email.from : email.to);
    setToName(email.direction === 'inbound' ? (email.fromName || '') : (email.toName || ''));
    setSubject(email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`);
    setBody(`\n\n--- On ${new Date(email.sentAt || email.receivedAt || Date.now()).toLocaleString()}, ${email.fromName || email.from} wrote:\n> ${email.body.replace(/\n/g, '\n> ')}`);
    setLinkedType(email.linkedType && email.linkedType !== 'None' ? email.linkedType : 'None');
    setLinkedId(email.linkedId || '');
    setLinkedName(email.linkedName || '');
    onOpenCompose();
  };

  // Forward handler
  const handleForward = (email: Email) => {
    setTo('');
    setToName('');
    setSubject(email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`);
    setBody(`\n\n--- Forwarded Message ---\nFrom: ${email.fromName || email.from} <${email.from}>\nSubject: ${email.subject}\n\n${email.body}`);
    setAttachments(email.attachments || []);
    onOpenCompose();
  };

  const handleSimulateInboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simFrom || !simSubject) return;

    const mockAttachments = simHasAttachment
      ? [{ name: 'Shift_Roster_May2026.pdf', size: '1.2 MB', type: 'application/pdf' }]
      : [];

    await onSimulateInbound({
      from: simFrom,
      fromName: simFromName,
      subject: simSubject,
      body: simBody,
      attachments: mockAttachments,
    });

    setIsInboundSimModalOpen(false);
  };

  // Filter emails by folder and search
  const filteredEmails = emails.filter((e) => {
    const matchesFolder =
      currentFolder === 'inbox' ? e.folder === 'inbox' :
      currentFolder === 'sent' ? e.folder === 'sent' :
      currentFolder === 'drafts' ? e.folder === 'drafts' :
      currentFolder === 'trash' ? e.folder === 'trash' : true;

    const q = search.toLowerCase();
    const matchesSearch =
      e.subject.toLowerCase().includes(q) ||
      e.from.toLowerCase().includes(q) ||
      e.to.toLowerCase().includes(q) ||
      (e.body && e.body.toLowerCase().includes(q)) ||
      (e.linkedName && e.linkedName.toLowerCase().includes(q));

    return matchesFolder && matchesSearch;
  });

  const inboxUnread = emails.filter((e) => e.folder === 'inbox' && !e.isRead).length;

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header with Email Actions */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>✉️</span> Enterprise Email System (Send &amp; Receive)
          </h1>
          <div style={themeStyles.pageSubtitle}>
            Full mail client, automated templates, threading, CC/BCC, customer auto-linking, and inbound simulator
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Simulator Trigger */}
          <button
            onClick={() => setIsInboundSimModalOpen(true)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: `1.5px solid ${COLORS.goldAccent}`,
              backgroundColor: 'rgba(215, 171, 106, 0.18)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Simulate receiving an inbound email from a customer to test auto-customer identification and inbox ingestion"
          >
            <span>📥</span> Simulate Customer Inbound Email
          </button>

          <button onClick={onOpenCompose} style={themeStyles.btnPrimary}>
            <span>✏️</span> Compose New Email
          </button>
        </div>
      </div>

      {/* Main Mailbox Interface: 3 Columns (Folders | Message List | Message Viewer) */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 380px 1fr', gap: '16px', minHeight: '680px' }}>
        {/* Column 1: Mail Folders & Templates */}
        <div style={themeStyles.panel}>
          <button
            onClick={onOpenCompose}
            style={{ ...themeStyles.btnPrimary, width: '100%', marginBottom: '18px', padding: '12px' }}
          >
            ✏️ New Message
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'inbox', label: 'Inbox', icon: '📥', count: inboxUnread },
              { id: 'sent', label: 'Sent Mail', icon: '📤', count: emails.filter((e) => e.folder === 'sent').length },
              { id: 'drafts', label: 'Drafts', icon: '📝', count: emails.filter((e) => e.folder === 'drafts').length },
              { id: 'trash', label: 'Trash', icon: '🗑️', count: emails.filter((e) => e.folder === 'trash').length },
            ].map((f) => {
              const active = currentFolder === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setCurrentFolder(f.id as EmailFolder);
                    setSelectedEmail(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: active ? 'rgba(215, 171, 106, 0.2)' : 'transparent',
                    color: active ? COLORS.textDark : '#555',
                    fontWeight: active ? 800 : 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </div>
                  {f.count !== undefined && f.count > 0 && (
                    <span
                      style={{
                        backgroundColor: active ? COLORS.goldAccent : '#E05050',
                        color: active ? COLORS.textDark : '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '10px',
                      }}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: `1px solid ${COLORS.borderGoldLight}`, marginTop: '20px', paddingTop: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: COLORS.goldDark, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '8px' }}>
              ⚡ EMAIL TEMPLATES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {templates.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplateId(t.id);
                    setSubject(t.subject);
                    setBody(t.body);
                    onOpenCompose();
                  }}
                  style={{
                    fontSize: '11.5px',
                    color: COLORS.textDark,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(215, 171, 106, 0.08)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={t.name}
                >
                  📄 {t.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Message List & Search */}
        <div style={{ ...themeStyles.panel, padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {/* Search Box */}
          <div style={{ marginBottom: '12px' }}>
            <input
              style={{ ...themeStyles.fieldInput, padding: '8px 12px', fontSize: '12.5px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, sender, customer..."
            />
          </div>

          <div style={{ fontSize: '11px', fontWeight: 800, color: COLORS.goldDark, marginBottom: '8px', textTransform: 'uppercase' }}>
            {currentFolder} ({filteredEmails.length})
          </div>

          {/* Email Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
            {filteredEmails.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: COLORS.textMuted, fontStyle: 'italic', fontSize: '12.5px' }}>
                No messages in this folder.
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                const isUnread = !email.isRead && email.folder === 'inbox';

                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      if (!email.isRead) {
                        onUpdateEmail(email.id, { isRead: true });
                      }
                    }}
                    style={{
                      backgroundColor: isSelected ? 'rgba(215, 171, 106, 0.25)' : isUnread ? '#FFF8EE' : COLORS.cardChampagne,
                      border: isSelected ? `2px solid ${COLORS.goldAccent}` : `1px solid ${COLORS.borderGold}`,
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isUnread && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#E05050' }} />
                        )}
                        <strong style={{ fontSize: '12.5px', color: COLORS.textDark }}>
                          {email.direction === 'inbound' ? (email.fromName || email.from) : (email.toName || email.to)}
                        </strong>
                      </div>
                      <span style={{ fontSize: '10.5px', color: COLORS.goldDark, fontWeight: 600 }}>
                        {email.sentAt ? new Date(email.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: isUnread ? 800 : 600, color: COLORS.textDark, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.subject}
                    </div>

                    <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                      {email.snippet || email.body.slice(0, 60)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                      {email.linkedType && email.linkedType !== 'None' ? (
                        <span style={{ backgroundColor: 'rgba(46, 139, 87, 0.15)', color: '#2E8B57', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                          🔗 {email.linkedType}: {email.linkedName || email.linkedId}
                        </span>
                      ) : onMarkAsLead ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsLead(email.id);
                          }}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(215, 171, 106, 0.6)',
                            color: COLORS.goldDark,
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          title="Convert this email into a CRM Lead"
                        >
                          🎯 +Mark as Lead
                        </button>
                      ) : (
                        <span />
                      )}

                      {email.attachments && email.attachments.length > 0 && (
                        <span style={{ color: COLORS.goldDark, fontWeight: 700 }}>
                          📎 {email.attachments.length} attachment(s)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Message Viewer & Threading */}
        <div style={{ ...themeStyles.panel, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          {selectedEmail ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Message Top Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.borderGoldLight}`, paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => handleReply(selectedEmail)} style={themeStyles.btnPrimary}>
                    ↩ Reply
                  </button>
                  <button
                    onClick={() => handleForward(selectedEmail)}
                    style={{ ...themeStyles.btnSecondary, color: COLORS.textDark, borderColor: COLORS.borderGold }}
                  >
                    ↪ Forward
                  </button>

                  {onMarkAsLead && (
                    selectedEmail.linkedType === 'Lead' ? (
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#2E8B57', backgroundColor: 'rgba(46, 139, 87, 0.15)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(46, 139, 87, 0.3)' }}>
                        ✅ Lead Ingested ({selectedEmail.linkedName})
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          await onMarkAsLead(selectedEmail.id);
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: `1.5px solid ${COLORS.goldAccent}`,
                          backgroundColor: 'rgba(215, 171, 106, 0.2)',
                          color: COLORS.textDark,
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        }}
                        title="Extract sender details and add as a new Lead in CRM pipeline"
                      >
                        <span>🎯</span> Mark as Lead
                      </button>
                    )
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      onDeleteEmail(selectedEmail.id);
                      setSelectedEmail(null);
                    }}
                    style={{ ...themeStyles.btnSmall, backgroundColor: 'rgba(224, 80, 80, 0.15)', color: '#E05050' }}
                  >
                    🗑️ Move to Trash
                  </button>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    style={{ ...themeStyles.btnSmall, backgroundColor: 'transparent', border: 'none', fontSize: '18px' }}
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Subject & Meta */}
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: COLORS.textDark, marginBottom: '10px' }}>
                {selectedEmail.subject}
              </h2>

              <div style={{ backgroundColor: COLORS.cardChampagne, border: `1px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div>
                    <strong>From:</strong> {selectedEmail.fromName ? `${selectedEmail.fromName} <${selectedEmail.from}>` : selectedEmail.from}
                  </div>
                  <span style={{ color: COLORS.goldDark, fontWeight: 700 }}>
                    {selectedEmail.sentAt ? new Date(selectedEmail.sentAt).toLocaleString() : ''}
                  </span>
                </div>
                <div>
                  <strong>To:</strong> {selectedEmail.toName ? `${selectedEmail.toName} <${selectedEmail.to}>` : selectedEmail.to}
                </div>
                {selectedEmail.cc && (
                  <div><strong>CC:</strong> {selectedEmail.cc}</div>
                )}
                {selectedEmail.bcc && (
                  <div><strong>BCC:</strong> {selectedEmail.bcc}</div>
                )}

                {/* Auto Identification & Entity Association Banner */}
                {selectedEmail.linkedType && selectedEmail.linkedType !== 'None' && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${COLORS.borderGoldLight}`, display: 'flex', alignItems: 'center', gap: '6px', color: '#2E8B57', fontWeight: 800, fontSize: '12px' }}>
                    <span>⭐ AUTO-IDENTIFIED &amp; LINKED TO:</span>
                    <span>{selectedEmail.linkedType} — {selectedEmail.linkedName} ({selectedEmail.linkedId})</span>
                  </div>
                )}

                {selectedEmail.isAutomated && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: COLORS.goldDark, fontWeight: 700 }}>
                    ⚡ Sent automatically by workflow: <em>{selectedEmail.automationRule}</em>
                  </div>
                )}
              </div>

              {/* Email Body */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${COLORS.borderGoldLight}`,
                  borderRadius: '10px',
                  padding: '16px',
                  flex: 1,
                  overflowY: 'auto',
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  color: COLORS.textDark,
                  whiteSpace: 'pre-line',
                  marginBottom: '16px',
                }}
              >
                {selectedEmail.body}
              </div>

              {/* Attachments Section */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div style={{ backgroundColor: COLORS.cardChampagne, border: `1px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '12px', marginTop: 'auto' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: COLORS.goldDark, marginBottom: '8px', textTransform: 'uppercase' }}>
                    📎 ATTACHMENTS ({selectedEmail.attachments.length})
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedEmail.attachments.map((att, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: `1px solid ${COLORS.borderGold}`,
                          borderRadius: '8px',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                        }}
                      >
                        <span>📄</span>
                        <div>
                          <strong>{att.name}</strong> <span style={{ color: '#888', fontSize: '11px' }}>({att.size})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.textMuted, textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>✉️</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: COLORS.textDark }}>Select a message to read</div>
              <p style={{ fontSize: '12px', marginTop: '4px', maxWidth: '300px' }}>
                View communications, customer auto-identifications, reply with templates, or forward attachments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: COMPOSE EMAIL ⭐ */}
      <Modal
        isOpen={composeModalOpen}
        onClose={onCloseCompose}
        title="✉️ Send Email from CRM"
        subtitle="Compose messages with dynamic templates, CC/BCC, customer auto-linking, and file attachments"
        maxWidth="740px"
      >
        <form onSubmit={handleSend}>
          {/* Template Selector */}
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: COLORS.goldDark, whiteSpace: 'nowrap' }}>
              LOAD TEMPLATE:
            </span>
            <select
              style={{ ...themeStyles.fieldSelect, flex: 1, padding: '6px 12px', fontSize: '12.5px' }}
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="">-- Choose Pre-built Email Template --</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  [{tpl.category}] {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
            <div>
              <label style={themeStyles.fieldLabel}>TO (RECIPIENT EMAIL) *</label>
              <input
                type="email"
                style={themeStyles.fieldInput}
                value={to}
                onChange={(e) => handleToChange(e.target.value)}
                placeholder="customer@organization.com"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCcBcc(!showCcBcc)}
              style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}`, marginTop: '22px' }}
            >
              {showCcBcc ? '- Hide CC/BCC' : '+ CC / BCC'}
            </button>
          </div>

          {/* CC & BCC Fields */}
          {showCcBcc && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <div>
                <label style={themeStyles.fieldLabel}>CC</label>
                <input
                  style={themeStyles.fieldInput}
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="manager@company.com"
                />
              </div>
              <div>
                <label style={themeStyles.fieldLabel}>BCC</label>
                <input
                  style={themeStyles.fieldInput}
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="archive@kworks.com"
                />
              </div>
            </div>
          )}

          {/* Subject */}
          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>SUBJECT *</label>
            <input
              style={themeStyles.fieldInput}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. KwOrKs Enterprise Proposal & Commercial Overview"
              required
            />
          </div>

          {/* Link to Entity */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>LINK TO RECORD</label>
              <select
                style={themeStyles.fieldSelect}
                value={linkedType}
                onChange={(e) => setLinkedType(e.target.value as any)}
              >
                <option value="None">None</option>
                <option value="Lead">Lead</option>
                <option value="Contact">Contact</option>
                <option value="Deal">Deal</option>
              </select>
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>LINKED RECORD NAME / ID</label>
              <input
                style={themeStyles.fieldInput}
                value={linkedName}
                onChange={(e) => setLinkedName(e.target.value)}
                placeholder="Auto-detected or enter name..."
              />
            </div>
          </div>

          {/* Body */}
          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>MESSAGE BODY *</label>
            <textarea
              style={{ ...themeStyles.fieldTextarea, minHeight: '160px' }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email here..."
              required
            />
          </div>

          {/* Attachment Upload & List */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={themeStyles.fieldLabel}>ATTACHMENTS</label>
              <label
                style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: COLORS.textDark,
                  cursor: 'pointer',
                  backgroundColor: COLORS.cardChampagne,
                  border: `1px solid ${COLORS.borderGold}`,
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}
              >
                📎 Add Attachment File
                <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {attachments.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(215, 171, 106, 0.15)',
                      border: `1px solid ${COLORS.borderGold}`,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>📄 {att.name} ({att.size})</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: '#E05050', fontWeight: 800, cursor: 'pointer' }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send Buttons */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onCloseCompose}
              style={{ ...themeStyles.btnSecondary, color: COLORS.textDark, borderColor: COLORS.borderGold, flex: 1 }}
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSending}
              style={{ ...themeStyles.btnPrimary, flex: 2 }}
            >
              {isSending ? 'Sending & Dispatching...' : '🚀 Send Outbound Email & Link History'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: INBOUND EMAIL SIMULATOR ⭐ */}
      <Modal
        isOpen={isInboundSimModalOpen}
        onClose={() => setIsInboundSimModalOpen(false)}
        title="📥 Simulate Inbound Customer Email"
        subtitle="Simulates a customer sending an email to the CRM inbox to test auto-customer identification and threading"
        maxWidth="620px"
      >
        <form onSubmit={handleSimulateInboundSubmit}>
          <div style={{ backgroundColor: 'rgba(46, 139, 87, 0.1)', border: '1px dashed #2E8B57', borderRadius: '8px', padding: '10px', fontSize: '12px', color: COLORS.textDark, marginBottom: '14px' }}>
            💡 <strong>Auto Identification Rule:</strong> When an inbound email arrives, the CRM searches for the sender in <strong>Contacts</strong>, <strong>Leads</strong>, and <strong>Deals</strong>. If found, it automatically links the email to their communication history profile.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>CUSTOMER / SENDER EMAIL *</label>
              <input
                style={themeStyles.fieldInput}
                value={simFrom}
                onChange={(e) => setSimFrom(e.target.value)}
                placeholder="customer@domain.com"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>CUSTOMER NAME</label>
              <input
                style={themeStyles.fieldInput}
                value={simFromName}
                onChange={(e) => setSimFromName(e.target.value)}
                placeholder="Priya Sharma"
              />
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>EMAIL SUBJECT *</label>
            <input
              style={themeStyles.fieldInput}
              value={simSubject}
              onChange={(e) => setSimSubject(e.target.value)}
              placeholder="Inquiry or feedback..."
              required
            />
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>EMAIL BODY MESSAGE *</label>
            <textarea
              style={{ ...themeStyles.fieldTextarea, minHeight: '120px' }}
              value={simBody}
              onChange={(e) => setSimBody(e.target.value)}
              placeholder="Customer message content..."
              required
            />
          </div>

          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="simAtt"
              checked={simHasAttachment}
              onChange={(e) => setSimHasAttachment(e.target.checked)}
            />
            <label htmlFor="simAtt" style={{ fontSize: '12.5px', color: COLORS.textDark, fontWeight: 600 }}>
              Include mock PDF attachment (Shift_Roster_May2026.pdf)
            </label>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsInboundSimModalOpen(false)}
              style={{ ...themeStyles.btnSecondary, color: COLORS.textDark, borderColor: COLORS.borderGold, flex: 1 }}
            >
              Cancel
            </button>
            <button type="submit" style={{ ...themeStyles.btnPrimary, flex: 2 }}>
              📥 Ingest Customer Email into CRM
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
