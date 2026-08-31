import React, { useState } from 'react';
import { Contact, Company, Deal, Email, Quotation, Task } from '../types/crm';
import { COLORS, themeStyles, formatINR } from '../styles/theme';
import { Modal } from '../components/Modal';

interface AccountsContactsPageProps {
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  emails: Email[];
  quotes?: Quotation[];
  tasks?: Task[];
  onAddContact: (contact: Partial<Contact>) => Promise<void>;
  onUpdateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  onAddCompany: (company: Partial<Company>) => Promise<void>;
  onUpdateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  onDeleteCompany: (id: string) => Promise<void>;
  onOpenComposeEmail: (toEmail: string, toName: string, linkedId?: string) => void;
  onOpenNewDealForCompany?: (company: Company) => void;
  onOpenNewQuoteForCompany?: (company: Company, contact?: Contact) => void;
}

export const AccountsContactsPage: React.FC<AccountsContactsPageProps> = ({
  contacts,
  companies,
  deals,
  emails,
  quotes = [],
  tasks = [],
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
  onOpenComposeEmail,
  onOpenNewDealForCompany,
  onOpenNewQuoteForCompany,
}) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'contacts' | 'companies'>('contacts');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Selected Company for 360° Drill-down (When user clicks on a Contact or Company)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(companies[0]?.id || null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Modals State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // Form: Contact
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactTitle, setContactTitle] = useState('Director / VP');
  const [contactDepartment, setContactDepartment] = useState('Executive Management');
  const [contactStatus, setContactStatus] = useState<'Active' | 'Lead' | 'Customer'>('Active');
  const [contactNotes, setContactNotes] = useState('');

  // Form: Company
  const [compName, setCompName] = useState('');
  const [compDomain, setCompDomain] = useState('');
  const [compIndustry, setCompIndustry] = useState('Enterprise Technology');
  const [compTier, setCompTier] = useState<'Enterprise' | 'Mid-Market' | 'Startup' | 'SMB'>('Enterprise');
  const [compRevenue, setCompRevenue] = useState('50000000');
  const [compLocation, setCompLocation] = useState('Bengaluru, India');
  const [compNotes, setCompNotes] = useState('');

  // Filtered lists
  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.jobTitle.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCompanies = companies.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    );
  });

  // Find active selected company object
  const activeCompany = companies.find((c) => c.id === selectedCompanyId) || 
    (selectedCompanyId ? companies.find(c => c.name.toLowerCase() === selectedCompanyId.toLowerCase()) : null) ||
    companies[0] || null;

  // Linked items for selected company
  const companyDeals = activeCompany ? deals.filter((d) => 
    (d.companyId && d.companyId === activeCompany.id) || 
    (d.company && d.company.toLowerCase() === activeCompany.name.toLowerCase())
  ) : [];

  const companyContacts = activeCompany ? contacts.filter((c) => 
    (c.companyId && c.companyId === activeCompany.id) || 
    (c.company && c.company.toLowerCase() === activeCompany.name.toLowerCase())
  ) : [];

  const companyEmails = activeCompany ? emails.filter((e) => {
    const matchedContactEmails = companyContacts.map(c => c.email.toLowerCase());
    return (
      matchedContactEmails.includes(e.from.toLowerCase()) ||
      matchedContactEmails.includes(e.to.toLowerCase()) ||
      (e.linkedName && e.linkedName.toLowerCase().includes(activeCompany.name.toLowerCase()))
    );
  }) : [];

  const companyQuotes = activeCompany ? quotes.filter((q) => 
    (q.companyId && q.companyId === activeCompany.id) || 
    (q.company && q.company.toLowerCase() === activeCompany.name.toLowerCase())
  ) : [];

  const totalWonRevenue = companyDeals
    .filter((d) => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const totalPipelineRevenue = companyDeals
    .filter((d) => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const handleContactClick = (contact: Contact) => {
    setSelectedContactId(contact.id);
    // Find matching company
    const matchingComp = companies.find((c) => 
      (contact.companyId && c.id === contact.companyId) || 
      (contact.company && c.name.toLowerCase() === contact.company.toLowerCase())
    );
    if (matchingComp) {
      setSelectedCompanyId(matchingComp.id);
    }
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompanyId(company.id);
    setSelectedContactId(null);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail) return;

    let matchingComp = companies.find(c => c.name.toLowerCase() === contactCompany.toLowerCase());

    await onAddContact({
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      company: contactCompany,
      companyId: matchingComp ? matchingComp.id : '',
      jobTitle: contactTitle,
      department: contactDepartment,
      status: contactStatus,
      notes: contactNotes,
      tags: ['Corporate Account'],
    });

    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setContactCompany('');
    setIsContactModalOpen(false);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName) return;

    await onAddCompany({
      name: compName,
      domain: compDomain,
      industry: compIndustry,
      tier: compTier,
      annualRevenue: Number(compRevenue) || 0,
      location: compLocation,
      notes: compNotes,
    });

    setCompName('');
    setCompDomain('');
    setIsCompanyModalOpen(false);
  };

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>🏢</span> Accounts, Contacts &amp; Corporate Pipeline
          </h1>
          <div style={themeStyles.pageSubtitle}>
            Unified customer profiles: Click any contact to inspect company details and all associated deals
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setIsContactModalOpen(true)} style={themeStyles.btnPrimary}>
            <span>+</span> Add Contact
          </button>
          <button onClick={() => setIsCompanyModalOpen(true)} style={{ ...themeStyles.btnPrimary, backgroundColor: '#FFFFFF', color: COLORS.textDark }}>
            <span>🏢</span> Add Organization
          </button>
        </div>
      </div>

      {/* Main Split-Screen Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(460px, 1.8fr)', gap: '20px', alignItems: 'start' }}>
        {/* LEFT COLUMN: Master List (Contacts & Organizations) */}
        <div>
          {/* View Mode Switcher & Search */}
          <div style={{ ...themeStyles.panel, padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '3px', border: `1px solid ${COLORS.borderGold}` }}>
                <button
                  onClick={() => setViewMode('contacts')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: viewMode === 'contacts' ? COLORS.goldAccent : 'transparent',
                    color: viewMode === 'contacts' ? COLORS.textDark : '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  👥 Contacts ({contacts.length})
                </button>
                <button
                  onClick={() => setViewMode('companies')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: viewMode === 'companies' ? COLORS.goldAccent : 'transparent',
                    color: viewMode === 'companies' ? COLORS.textDark : '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  🏢 Companies ({companies.length})
                </button>
              </div>

              {viewMode === 'contacts' && (
                <select
                  style={{ ...themeStyles.fieldSelect, width: '130px', padding: '4px 8px', fontSize: '11.5px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Customer">Customer</option>
                  <option value="Lead">Lead</option>
                </select>
              )}
            </div>

            <input
              style={{ ...themeStyles.fieldInput, padding: '8px 12px', fontSize: '12.5px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={viewMode === 'contacts' ? "Search contacts by name, email, company..." : "Search companies by name, domain, industry..."}
            />
          </div>

          {/* List Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
            {viewMode === 'contacts' ? (
              filteredContacts.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#E5D4B8', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                  No contacts found.
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = selectedContactId === c.id || (activeCompany && c.company === activeCompany.name);

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleContactClick(c)}
                      style={{
                        backgroundColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.95)',
                        border: isSelected ? `2.5px solid ${COLORS.goldAccent}` : `1px solid ${COLORS.borderGoldLight}`,
                        borderRadius: '12px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 8px 20px rgba(215, 171, 106, 0.35)' : '0 2px 6px rgba(0,0,0,0.06)',
                        transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '17px', backgroundColor: COLORS.goldAccent, color: COLORS.textDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <strong style={{ fontSize: '14px', color: COLORS.textDark }}>{c.name}</strong>
                            <div style={{ fontSize: '11.5px', color: COLORS.goldDark, fontWeight: 700 }}>
                              🏢 {c.company}
                            </div>
                          </div>
                        </div>

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
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#555', marginTop: '6px', borderTop: `1px solid ${COLORS.borderGoldLight}`, paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{c.jobTitle} &middot; {c.email}</span>
                        <span style={{ fontSize: '11px', color: COLORS.goldDark, fontWeight: 800 }}>View Deals &rarr;</span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* Companies Mode */
              filteredCompanies.map((comp) => {
                const isSelected = activeCompany?.id === comp.id;

                return (
                  <div
                    key={comp.id}
                    onClick={() => handleCompanyClick(comp)}
                    style={{
                      backgroundColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.95)',
                      border: isSelected ? `2.5px solid ${COLORS.goldAccent}` : `1px solid ${COLORS.borderGoldLight}`,
                      borderRadius: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 8px 20px rgba(215, 171, 106, 0.35)' : '0 2px 6px rgba(0,0,0,0.06)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px', color: COLORS.textDark }}>🏢 {comp.name}</strong>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: comp.tier === 'Enterprise' ? 'rgba(147, 51, 234, 0.15)' : 'rgba(215, 171, 106, 0.2)',
                          color: comp.tier === 'Enterprise' ? '#7E22CE' : COLORS.textDark,
                        }}
                      >
                        {comp.tier}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#666', marginBottom: '6px' }}>
                      {comp.industry} &middot; {comp.location || 'India'}
                    </div>

                    <div style={{ fontSize: '11.5px', borderTop: `1px solid ${COLORS.borderGoldLight}`, paddingTop: '6px', display: 'flex', justifyContent: 'space-between', color: COLORS.goldDark, fontWeight: 700 }}>
                      <span>Revenue: {formatINR(comp.annualRevenue)}</span>
                      <span>Inspect 360° &rarr;</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 360° DRILL-DOWN (Company Details & All Deals with Company) */}
        <div>
          {activeCompany ? (
            <div style={themeStyles.panel}>
              {/* Company Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${COLORS.borderGoldLight}`, paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, color: COLORS.textDark }}>
                      🏢 {activeCompany.name}
                    </h2>
                    <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(215, 171, 106, 0.2)', color: COLORS.textDark, padding: '2px 8px', borderRadius: '6px' }}>
                      {activeCompany.tier} Tier
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.goldDark, marginTop: '3px' }}>
                    🌐 {activeCompany.domain || activeCompany.website || 'No domain'} &middot; 📍 {activeCompany.location} &middot; 🏭 {activeCompany.industry}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {onOpenNewDealForCompany && (
                    <button
                      onClick={() => onOpenNewDealForCompany(activeCompany)}
                      style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.goldAccent, color: COLORS.textDark, fontWeight: 800 }}
                    >
                      + New Deal
                    </button>
                  )}
                  {onOpenNewQuoteForCompany && (
                    <button
                      onClick={() => onOpenNewQuoteForCompany(activeCompany)}
                      style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}` }}
                    >
                      + Quote
                    </button>
                  )}
                </div>
              </div>

              {/* Financial Metrics Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div className="stat-card-gold-val" style={{ fontSize: '18px', fontWeight: 900 }}>
                    {formatINR(totalWonRevenue)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase' }}>
                    Closed Won Deals
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div className="stat-card-gold-val" style={{ fontSize: '18px', fontWeight: 900 }}>
                    {formatINR(totalPipelineRevenue)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase' }}>
                    Active Pipeline
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div className="stat-card-gold-val" style={{ fontSize: '18px', fontWeight: 900 }}>
                    {companyDeals.length}
                  </div>
                  <div style={{ fontSize: '10px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase' }}>
                    Total Deals
                  </div>
                </div>
              </div>

              {/* 🌟 SECTION: ALL DEALS WITH THIS COMPANY */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    💼 ALL DEALS WITH {activeCompany.name.toUpperCase()} ({companyDeals.length})
                  </span>
                </div>

                {companyDeals.length === 0 ? (
                  <div style={{ backgroundColor: COLORS.cardChampagne, padding: '16px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic' }}>
                    No deals logged yet for this company. Click "+ New Deal" above to create an opportunity.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {companyDeals.map((deal) => {
                      const isWon = deal.stage === 'Closed Won';
                      const isLost = deal.stage === 'Closed Lost';

                      return (
                        <div
                          key={deal.id}
                          style={{
                            backgroundColor: COLORS.cardChampagne,
                            border: `1.5px solid ${isWon ? '#2E8B57' : COLORS.borderGold}`,
                            borderRadius: '10px',
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '13.5px', color: COLORS.textDark }}>{deal.title}</strong>
                            <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '2px' }}>
                              👤 Rep: <strong>{deal.salesperson}</strong> &middot; 📅 Expected Close: {deal.expectedCloseDate}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <strong style={{ fontSize: '15px', color: isWon ? '#2E8B57' : COLORS.textDark }}>
                              {formatINR(deal.amount)}
                            </strong>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: isWon ? 'rgba(46, 139, 87, 0.15)' : isLost ? 'rgba(224, 80, 80, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: isWon ? '#2E8B57' : isLost ? '#E05050' : '#2563EB',
                              }}
                            >
                              {deal.stage} ({deal.probability}%)
                            </span>

                            {deal.customerEmail && (
                              <button
                                onClick={() => onOpenComposeEmail(deal.customerEmail, deal.customerName, deal.id)}
                                style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.goldAccent, color: COLORS.textDark, padding: '3px 8px', fontSize: '11px' }}
                                title="Send Email / Update"
                              >
                                ✉️ Email
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: ASSOCIATED CONTACTS */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, textTransform: 'uppercase', marginBottom: '8px' }}>
                  👥 KEY CONTACTS &amp; STAKEHOLDERS ({companyContacts.length})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  {companyContacts.map((c) => (
                    <div key={c.id} style={{ backgroundColor: '#FAF6EF', border: `1px solid ${COLORS.borderGold}`, borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', color: COLORS.textDark }}>{c.name}</strong>
                        <button
                          onClick={() => onOpenComposeEmail(c.email, c.name, c.id)}
                          style={{ ...themeStyles.btnSmall, padding: '2px 6px', fontSize: '11px', backgroundColor: COLORS.goldAccent, color: COLORS.textDark }}
                        >
                          ✉️
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: COLORS.textMuted }}>{c.jobTitle}</div>
                      <div style={{ fontSize: '10.5px', color: '#555', marginTop: '2px' }}>{c.email} &middot; {c.phone}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: QUOTATIONS & PROPOSALS */}
              {companyQuotes.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, textTransform: 'uppercase', marginBottom: '8px' }}>
                    📜 COMMERCIAL QUOTATIONS ({companyQuotes.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {companyQuotes.map((q) => (
                      <div key={q.id} style={{ backgroundColor: '#FAF6EF', border: `1px solid ${COLORS.borderGold}`, borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{q.quoteNumber}: {q.title}</strong>
                          <div style={{ fontSize: '11px', color: COLORS.textMuted }}>Valid until: {q.validUntil}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: COLORS.textDark }}>{formatINR(q.grandTotal)}</strong>
                          <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: q.status === 'Accepted' ? 'rgba(46,139,87,0.15)' : 'rgba(215,171,106,0.2)', color: q.status === 'Accepted' ? '#2E8B57' : COLORS.textDark }}>
                            {q.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: COMMUNICATIONS HISTORY */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, textTransform: 'uppercase', marginBottom: '8px' }}>
                  ✉️ EMAIL COMMUNICATIONS TIMELINE ({companyEmails.length})
                </div>

                {companyEmails.length === 0 ? (
                  <div style={{ fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic' }}>
                    No recorded email exchanges with this company yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {companyEmails.map((e) => (
                      <div key={e.id} style={{ backgroundColor: '#FAF6EF', border: `1px solid ${COLORS.borderGoldLight}`, borderRadius: '8px', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '12.5px', color: COLORS.textDark }}>
                            {e.direction === 'inbound' ? '📥 Inbound from' : '📤 Sent to'} {e.direction === 'inbound' ? e.fromName || e.from : e.toName || e.to}
                          </strong>
                          <span style={{ fontSize: '10.5px', color: COLORS.textMuted }}>
                            {new Date(e.sentAt || e.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.goldDark }}>{e.subject}</div>
                        <div style={{ fontSize: '11.5px', color: '#555', marginTop: '2px', whiteSpace: 'pre-line' }}>{e.snippet || e.body.slice(0, 120) + '...'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ ...themeStyles.panel, textAlign: 'center', padding: '40px 20px', color: COLORS.textMuted }}>
              Select a Contact or Company from the left list to view their 360° corporate profile and all active deals.
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="👥 Add Customer Contact"
        subtitle="Create a verified contact record linked to an organization"
      >
        <form onSubmit={handleContactSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>FULL NAME *</label>
              <input
                style={themeStyles.fieldInput}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>COMPANY / ORGANIZATION *</label>
              <input
                style={themeStyles.fieldInput}
                value={contactCompany}
                onChange={(e) => setContactCompany(e.target.value)}
                placeholder="e.g. Apex Global Logistics"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>EMAIL ADDRESS *</label>
              <input
                type="email"
                style={themeStyles.fieldInput}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="ramesh@company.in"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>PHONE NUMBER</label>
              <input
                style={themeStyles.fieldInput}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98400 12345"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>JOB TITLE</label>
              <input
                style={themeStyles.fieldInput}
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
                placeholder="VP of Operations"
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>DEPARTMENT</label>
              <input
                style={themeStyles.fieldInput}
                value={contactDepartment}
                onChange={(e) => setContactDepartment(e.target.value)}
                placeholder="Human Resources & Site Ops"
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              style={{ ...themeStyles.btnSecondary, color: COLORS.textDark, borderColor: COLORS.borderGold, flex: 1 }}
            >
              Cancel
            </button>
            <button type="submit" style={{ ...themeStyles.btnPrimary, flex: 2 }}>
              Save Contact Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Company Modal */}
      <Modal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        title="🏢 Add Organization Account"
        subtitle="Create an enterprise account profile"
      >
        <form onSubmit={handleCompanySubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>COMPANY NAME *</label>
              <input
                style={themeStyles.fieldInput}
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                placeholder="e.g. Reliance Tech Works"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>DOMAIN (WEBSITE)</label>
              <input
                style={themeStyles.fieldInput}
                value={compDomain}
                onChange={(e) => setCompDomain(e.target.value)}
                placeholder="reliancetech.in"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>INDUSTRY</label>
              <input
                style={themeStyles.fieldInput}
                value={compIndustry}
                onChange={(e) => setCompIndustry(e.target.value)}
                placeholder="IT &amp; Telecommunications"
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>ESTIMATED ANNUAL TURNOVER (₹ INR)</label>
              <input
                type="number"
                style={themeStyles.fieldInput}
                value={compRevenue}
                onChange={(e) => setCompRevenue(e.target.value)}
                placeholder="50000000"
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsCompanyModalOpen(false)}
              style={{ ...themeStyles.btnSecondary, color: COLORS.textDark, borderColor: COLORS.borderGold, flex: 1 }}
            >
              Cancel
            </button>
            <button type="submit" style={{ ...themeStyles.btnPrimary, flex: 2 }}>
              Save Organization
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
