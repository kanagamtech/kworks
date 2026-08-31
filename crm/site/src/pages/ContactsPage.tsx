import React, { useState } from 'react';
import { Contact, Email, Deal, Task } from '../types/crm';
import { COLORS, themeStyles } from '../styles/theme';
import { Modal } from '../components/Modal';

interface ContactsPageProps {
  contacts: Contact[];
  emails: Email[];
  deals: Deal[];
  tasks: Task[];
  onAddContact: (contact: Partial<Contact>) => Promise<void>;
  onUpdateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  onOpenComposeEmail: (toEmail: string, toName: string, linkedId: string) => void;
  onOpenNewTaskForContact: (contact: Contact) => void;
}

export const ContactsPage: React.FC<ContactsPageProps> = ({
  contacts,
  emails,
  deals,
  tasks,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onOpenComposeEmail,
  onOpenNewTaskForContact,
}) => {
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<'Active' | 'Lead' | 'Customer'>('Active');
  const [owner, setOwner] = useState('Rajesh Raman');
  const [notes, setNotes] = useState('');

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.jobTitle.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    await onAddContact({
      name,
      email,
      phone,
      company,
      jobTitle,
      department,
      status,
      owner,
      notes,
    });

    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setJobTitle('');
    setNotes('');
    setIsModalOpen(false);
  };

  // Communications & deals for selected contact
  const contactEmails = selectedContact
    ? emails.filter(
        (e) =>
          e.to.toLowerCase() === selectedContact.email.toLowerCase() ||
          e.from.toLowerCase() === selectedContact.email.toLowerCase() ||
          (e.linkedType === 'Contact' && e.linkedId === selectedContact.id)
      )
    : [];

  const contactDeals = selectedContact
    ? deals.filter((d) => d.customerEmail.toLowerCase() === selectedContact.email.toLowerCase() || d.contactId === selectedContact.id)
    : [];

  const contactTasks = selectedContact
    ? tasks.filter((t) => t.relatedToId === selectedContact.id || (t.relatedToName && t.relatedToName.includes(selectedContact.name)))
    : [];

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>👥</span> Customer Contacts &amp; Profiles
          </h1>
          <div style={themeStyles.pageSubtitle}>
            360-degree customer records, unified email timelines, meetings, and linked deals
          </div>
        </div>

        <button onClick={() => setIsModalOpen(true)} style={themeStyles.btnPrimary}>
          <span>+</span> Add Contact
        </button>
      </div>

      {/* Main Grid: Contacts Directory & 360° Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedContact ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Left Side: Directory Table */}
        <div style={themeStyles.panel}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
            <input
              style={{ ...themeStyles.fieldInput, flex: 1 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name, email, company, job title..."
            />
            <span style={{ fontSize: '12px', color: COLORS.goldDark, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {filtered.length} Contacts
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={themeStyles.table}>
              <thead>
                <tr>
                  <th style={themeStyles.th}>Contact Name</th>
                  <th style={themeStyles.th}>Company &amp; Title</th>
                  <th style={themeStyles.th}>Status</th>
                  <th style={{ ...themeStyles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isSelected = selectedContact?.id === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedContact(c)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(215, 171, 106, 0.15)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={themeStyles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '17px', backgroundColor: COLORS.goldAccent, color: COLORS.textDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: COLORS.textDark }}>{c.name}</div>
                            <div style={{ fontSize: '11.5px', color: COLORS.textMuted }}>{c.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={themeStyles.td}>
                        <div style={{ fontWeight: 600, color: COLORS.textDark }}>{c.company || '—'}</div>
                        <div style={{ fontSize: '11px', color: COLORS.goldDark }}>{c.jobTitle || 'Executive'}</div>
                      </td>

                      <td style={themeStyles.td}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: c.status === 'Customer' ? 'rgba(46, 139, 87, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: c.status === 'Customer' ? '#2E8B57' : '#2563EB',
                          }}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td style={{ ...themeStyles.td, textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenComposeEmail(c.email, c.name, c.id);
                          }}
                          style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}`, marginRight: '6px' }}
                          title="Quick Send Email"
                        >
                          ✉️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete contact "${c.name}"?`)) onDeleteContact(c.id);
                          }}
                          style={themeStyles.btnDelete}
                          title="Delete Contact"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: 360° Customer History & Activity Profile */}
        {selectedContact && (
          <div style={themeStyles.panel}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.borderGoldLight}`, paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: COLORS.goldAccent, color: COLORS.textDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px' }}>
                  {selectedContact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: COLORS.textDark }}>
                    {selectedContact.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                    {selectedContact.jobTitle} &middot; <strong>{selectedContact.company}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onOpenComposeEmail(selectedContact.email, selectedContact.name, selectedContact.id)}
                  style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.goldAccent, color: COLORS.textDark, fontWeight: 800 }}
                >
                  ✉️ Send Email
                </button>
                <button
                  onClick={() => onOpenNewTaskForContact(selectedContact)}
                  style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}` }}
                >
                  + Add Task / Meeting
                </button>
                <button
                  onClick={() => setSelectedContact(null)}
                  style={{ ...themeStyles.btnSmall, backgroundColor: 'transparent', border: 'none', fontSize: '16px' }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Quick Details Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: COLORS.cardChampagne, padding: '12px', borderRadius: '10px', marginBottom: '18px', fontSize: '12.5px' }}>
              <div><strong>Email:</strong> {selectedContact.email}</div>
              <div><strong>Phone:</strong> {selectedContact.phone || 'N/A'}</div>
              <div><strong>Account Owner:</strong> {selectedContact.owner}</div>
              <div><strong>Location:</strong> {selectedContact.address || 'Remote / Unspecified'}</div>
            </div>

            {/* Section 1: Linked Deals */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: COLORS.goldDark, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '8px' }}>
                💼 LINKED DEALS &amp; PIPELINE ({contactDeals.length})
              </div>
              {contactDeals.length === 0 ? (
                <div style={{ fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic', padding: '6px 0' }}>
                  No deals linked to this customer yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {contactDeals.map((d) => (
                    <div key={d.id} style={{ backgroundColor: '#FBF8F3', border: `1px solid ${COLORS.borderGold}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: COLORS.textDark }}>{d.title}</strong>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted }}>Stage: {d.stage} ({d.probability}%) &middot; Close: {d.expectedCloseDate}</div>
                      </div>
                      <strong style={{ fontSize: '14px', color: COLORS.textDark }}>${d.amount.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Tasks & Scheduled Meetings */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: COLORS.goldDark, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '8px' }}>
                ⏰ SCHEDULED TASKS &amp; MEETINGS ({contactTasks.length})
              </div>
              {contactTasks.length === 0 ? (
                <div style={{ fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic', padding: '6px 0' }}>
                  No pending meetings or tasks.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {contactTasks.map((t) => (
                    <div key={t.id} style={{ backgroundColor: '#FBF8F3', border: `1px solid ${COLORS.borderGold}`, borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#E05050', marginRight: '6px' }}>[{t.type}]</span>
                        <strong style={{ fontSize: '12.5px', color: COLORS.textDark }}>{t.title}</strong>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted }}>Due {t.dueDate} at {t.dueTime} &middot; Rep: {t.assignedTo}</div>
                      </div>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: t.status === 'Completed' ? '#2E8B57' : '#D7AB6A' }}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Unified Communication Timeline */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: COLORS.goldDark, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '8px' }}>
                ✉️ PREVIOUS COMMUNICATIONS TIMELINE ({contactEmails.length})
              </div>
              {contactEmails.length === 0 ? (
                <div style={{ fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic', padding: '10px 0' }}>
                  No email history recorded yet. Click "Send Email" above to start a conversation!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {contactEmails.map((e) => (
                    <div key={e.id} style={{ backgroundColor: '#FBF8F3', border: `1px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{e.direction === 'inbound' ? '📥 INBOUND' : '📤 OUTBOUND'}</span>
                          <strong style={{ fontSize: '13px', color: COLORS.textDark }}>{e.subject}</strong>
                        </div>
                        <span style={{ fontSize: '11px', color: COLORS.goldDark }}>
                          {e.sentAt ? new Date(e.sentAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#444', whiteSpace: 'pre-line', lineHeight: 1.4, maxHeight: '90px', overflowY: 'auto' }}>
                        {e.body}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="👥 Add Customer Contact"
        subtitle="Create a customer profile to track communication history, meetings, and linked deals"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>FULL NAME *</label>
              <input
                style={themeStyles.fieldInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meera Nambiar"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>COMPANY NAME</label>
              <input
                style={themeStyles.fieldInput}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Kanagam Technologies"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>EMAIL ADDRESS *</label>
              <input
                type="email"
                style={themeStyles.fieldInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. meera@kanagamtech.com"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>PHONE NUMBER</label>
              <input
                style={themeStyles.fieldInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 94440 12890"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>JOB TITLE</label>
              <input
                style={themeStyles.fieldInput}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Operations Director"
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>STATUS</label>
              <select
                style={themeStyles.fieldSelect}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="Active">Active Contact</option>
                <option value="Customer">Verified Customer</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>CONTACT NOTES &amp; BACKGROUND</label>
            <textarea
              style={themeStyles.fieldTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key priorities, decision authority..."
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{ ...themeStyles.btnSecondary, color: COLORS.textDark, borderColor: COLORS.borderGold, flex: 1 }}
            >
              Cancel
            </button>
            <button type="submit" style={{ ...themeStyles.btnPrimary, flex: 2 }}>
              Save Customer Contact
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
