import React, { useState } from 'react';
import { Lead, LeadSource, LeadStatus, UserAccount } from '../types/crm';
import { COLORS, themeStyles, formatINR } from '../styles/theme';
import { Modal } from '../components/Modal';

interface LeadsPageProps {
  leads: Lead[];
  users: UserAccount[];
  currentUser: UserAccount | null;
  onAddLead: (lead: Partial<Lead>) => Promise<void>;
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onConvertLead: (id: string) => Promise<void>;
  onQuickEmail: (lead: Lead) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({
  leads,
  users,
  currentUser,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onConvertLead,
  onQuickEmail,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [repFilter, setRepFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Admin';

  // Form State
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>('Website Form');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [assignedTo, setAssignedTo] = useState(currentUser?.name || 'Rajesh Raman');
  const [estimatedValue, setEstimatedValue] = useState('20000');
  const [notes, setNotes] = useState('');
  const [autoFollowUp, setAutoFollowUp] = useState(true);

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      l.name.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.phone.toLowerCase().includes(q) ||
      l.assignedTo.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || l.source === sourceFilter;
    const matchesRep = repFilter === 'ALL' || l.assignedTo === repFilter;

    return matchesSearch && matchesStatus && matchesSource && matchesRep;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    await onAddLead({
      name,
      company,
      email,
      phone,
      source,
      status,
      assignedTo: isManager ? assignedTo : (currentUser?.name || assignedTo),
      createdBy: currentUser?.name || 'Rajesh Raman',
      estimatedValue: Number(estimatedValue) || 0,
      notes,
      autoFollowUp,
    });

    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setNotes('');
    setIsModalOpen(false);
  };

  const getStatusBadgeStyle = (st: LeadStatus) => {
    switch (st) {
      case 'New':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#2563EB', border: '1px solid #3B82F6' };
      case 'Contacted':
        return { bg: 'rgba(215, 171, 106, 0.15)', color: '#9C7B4E', border: '1px solid #D7AB6A' };
      case 'Qualified':
        return { bg: 'rgba(147, 51, 234, 0.15)', color: '#7E22CE', border: '1px solid #9333EA' };
      case 'Proposal Sent':
        return { bg: 'rgba(234, 88, 12, 0.15)', color: '#C2410C', border: '1px solid #EA580C' };
      case 'Converted':
        return { bg: 'rgba(46, 139, 87, 0.15)', color: '#2E8B57', border: '1px solid #2E8B57' };
      case 'Unqualified':
        return { bg: 'rgba(224, 80, 80, 0.15)', color: '#E05050', border: '1px solid #E05050' };
    }
  };

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>🎯</span> Leads Management
          </h1>
          <div style={themeStyles.pageSubtitle}>
            {isManager
              ? '👑 Manager View: Full company visibility across all sales representatives and inbound pipelines'
              : `👤 Employee View: Showing leads created by or assigned to ${currentUser?.name}`}
          </div>
        </div>

        <button
          onClick={() => {
            setAssignedTo(currentUser?.name || 'Rajesh Raman');
            setIsModalOpen(true);
          }}
          style={themeStyles.btnPrimary}
        >
          <span>+</span> Create New Lead
        </button>
      </div>

      {/* Permission Scope Banner */}
      {!isManager && (
        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3B82F6', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '12.5px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔒</span>
          <span>
            <strong>Employee Account Scope Active:</strong> You are viewing data entered by or assigned to <strong>{currentUser?.name}</strong>. Switch to Manager in top bar to view entire company.
          </span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div style={{ ...themeStyles.panel, padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '2 1 240px' }}>
            <input
              style={themeStyles.fieldInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, email, company, phone, rep..."
            />
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <select
              style={themeStyles.fieldSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Converted">Converted</option>
              <option value="Unqualified">Unqualified</option>
            </select>
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <select
              style={themeStyles.fieldSelect}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="ALL">All Sources</option>
              <option value="Website Form">Website Form</option>
              <option value="Referral">Referral</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Inbound Call">Inbound Call</option>
              <option value="Cold Outreach">Cold Outreach</option>
            </select>
          </div>

          {isManager && (
            <div style={{ flex: '1 1 160px' }}>
              <select
                style={themeStyles.fieldSelect}
                value={repFilter}
                onChange={(e) => setRepFilter(e.target.value)}
              >
                <option value="ALL">All Sales Representatives</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Leads Table Panel */}
      <div style={themeStyles.panel}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: COLORS.goldDark }}>
            SHOWING {filteredLeads.length} OF {leads.length} LEADS
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={themeStyles.table}>
            <thead>
              <tr>
                <th style={themeStyles.th}>Lead Name &amp; ID</th>
                <th style={themeStyles.th}>Company</th>
                <th style={themeStyles.th}>Contact Info</th>
                <th style={themeStyles.th}>Source</th>
                <th style={themeStyles.th}>Status</th>
                <th style={themeStyles.th}>Assigned Rep</th>
                <th style={themeStyles.th}>Est. Value</th>
                <th style={themeStyles.th}>Auto Follow-up</th>
                <th style={{ ...themeStyles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: COLORS.textMuted, fontStyle: 'italic' }}>
                    No leads found in this view.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const badge = getStatusBadgeStyle(lead.status);
                  return (
                    <tr key={lead.id} style={{ borderBottom: `1px solid ${COLORS.borderGoldLight}` }}>
                      <td style={themeStyles.td}>
                        <div style={{ fontWeight: 800, color: COLORS.textDark }}>{lead.name}</div>
                        <div style={{ fontSize: '11px', color: COLORS.goldDark }}>{lead.id}</div>
                      </td>
                      <td style={themeStyles.td}>
                        <strong>{lead.company || '—'}</strong>
                      </td>
                      <td style={themeStyles.td}>
                        <div>{lead.email}</div>
                        <div style={{ fontSize: '11.5px', color: COLORS.textMuted }}>{lead.phone || 'No phone'}</div>
                      </td>
                      <td style={themeStyles.td}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textDark }}>
                          {lead.source}
                        </span>
                      </td>
                      <td style={themeStyles.td}>
                        <select
                          value={lead.status}
                          onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as LeadStatus })}
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: badge.border,
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontWeight: 800,
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Converted">Converted</option>
                          <option value="Unqualified">Unqualified</option>
                        </select>
                      </td>
                      <td style={themeStyles.td}>
                        {isManager ? (
                          <select
                            value={lead.assignedTo}
                            onChange={(e) => onUpdateLead(lead.id, { assignedTo: e.target.value })}
                            style={{
                              ...themeStyles.fieldSelect,
                              fontSize: '11.5px',
                              padding: '4px 6px',
                              border: `1px solid ${COLORS.borderGold}`,
                            }}
                            title="Reassign lead to team member (Manager Privilege)"
                          >
                            {users.map((u) => (
                              <option key={u.id} value={u.name}>{u.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: '12px', color: COLORS.textDark, fontWeight: 700 }}>
                            {lead.assignedTo}
                          </span>
                        )}
                      </td>
                      <td style={themeStyles.td}>
                        <strong style={{ color: COLORS.textDark }}>{formatINR(lead.estimatedValue)}</strong>
                      </td>
                      <td style={themeStyles.td}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          <input
                            type="checkbox"
                            checked={lead.autoFollowUp}
                            onChange={(e) => onUpdateLead(lead.id, { autoFollowUp: e.target.checked })}
                          />
                          <span style={{ color: lead.autoFollowUp ? '#2E8B57' : '#888', fontWeight: 700 }}>
                            {lead.autoFollowUp ? '⚡ Active' : 'Paused'}
                          </span>
                        </label>
                      </td>
                      <td style={{ ...themeStyles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => onQuickEmail(lead)}
                            style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}` }}
                            title="Send Email to Lead"
                          >
                            ✉️ Email
                          </button>

                          {lead.status !== 'Converted' && (
                            <button
                              onClick={() => onConvertLead(lead.id)}
                              style={{ ...themeStyles.btnSmall, backgroundColor: '#2E8B57', color: '#FFFFFF' }}
                              title="Convert to Contact & Create Deal"
                            >
                              ✓ Convert
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (window.confirm(`Delete lead "${lead.name}"?`)) onDeleteLead(lead.id);
                            }}
                            style={themeStyles.btnDelete}
                            title="Delete Lead"
                          >
                            &times;
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lead Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="🎯 Create New Sales Lead"
        subtitle="Creating a lead will trigger the automatic welcome email workflow"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>LEAD FULL NAME *</label>
              <input
                style={themeStyles.fieldInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>COMPANY NAME</label>
              <input
                style={themeStyles.fieldInput}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Malhotra Steel Dynamics"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>WORK EMAIL *</label>
              <input
                type="email"
                style={themeStyles.fieldInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. vikram@malhotrasteel.com"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>PHONE NUMBER</label>
              <input
                style={themeStyles.fieldInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 11223"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>LEAD SOURCE</label>
              <select
                style={themeStyles.fieldSelect}
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
              >
                <option value="Website Form">Website Form</option>
                <option value="Referral">Referral</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Inbound Call">Inbound Call</option>
                <option value="Cold Outreach">Cold Outreach</option>
                <option value="Event / Conference">Event / Conference</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>ASSIGNED SALESPERSON</label>
              {isManager ? (
                <select
                  style={themeStyles.fieldSelect}
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              ) : (
                <input
                  style={{ ...themeStyles.fieldInput, backgroundColor: '#F0F0F0' }}
                  value={currentUser?.name || assignedTo}
                  disabled
                />
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>ESTIMATED DEAL VALUE (₹ INR)</label>
              <input
                type="number"
                style={themeStyles.fieldInput}
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="500000"
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>INITIAL QUALIFICATION STATUS</label>
              <select
                style={themeStyles.fieldSelect}
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal Sent">Proposal Sent</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>LEAD NOTES / REQUIREMENTS</label>
            <textarea
              style={themeStyles.fieldTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter context, background, specific requirements..."
            />
          </div>

          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="leadAutoFollow"
              checked={autoFollowUp}
              onChange={(e) => setAutoFollowUp(e.target.checked)}
            />
            <label htmlFor="leadAutoFollow" style={{ fontSize: '13px', color: COLORS.textDark, fontWeight: 600 }}>
              Enable Automatic 3-Day Follow-Up Workflow for this lead
            </label>
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
              🚀 Save Lead &amp; Trigger Welcome Email
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
