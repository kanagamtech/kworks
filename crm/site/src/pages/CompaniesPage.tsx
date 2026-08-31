import React, { useState } from 'react';
import { Company, Contact, Deal, Email } from '../types/crm';
import { COLORS, themeStyles, formatINR } from '../styles/theme';
import { Modal } from '../components/Modal';

interface CompaniesPageProps {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  emails: Email[];
  onAddCompany: (comp: Partial<Company>) => Promise<void>;
  onUpdateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  onDeleteCompany: (id: string) => Promise<void>;
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({
  companies,
  contacts,
  deals,
  emails,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('5000000');
  const [employeeCount, setEmployeeCount] = useState('50-100');
  const [tier, setTier] = useState<'Enterprise' | 'Mid-Market' | 'Startup' | 'SMB'>('Enterprise');
  const [notes, setNotes] = useState('');

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await onAddCompany({
      name,
      domain,
      industry,
      phone,
      website,
      location,
      annualRevenue: Number(annualRevenue) || 0,
      employeeCount,
      tier,
      notes,
    });

    setName('');
    setDomain('');
    setPhone('');
    setWebsite('');
    setLocation('');
    setNotes('');
    setIsModalOpen(false);
  };

  const companyContacts = selectedCompany
    ? contacts.filter(
        (c) =>
          c.company.toLowerCase() === selectedCompany.name.toLowerCase() ||
          c.companyId === selectedCompany.id ||
          (selectedCompany.domain && c.email.toLowerCase().includes(selectedCompany.domain.toLowerCase()))
      )
    : [];

  const companyDeals = selectedCompany
    ? deals.filter(
        (d) =>
          d.company.toLowerCase() === selectedCompany.name.toLowerCase() ||
          d.companyId === selectedCompany.id
      )
    : [];

  const companyRevenue = companyDeals
    .filter((d) => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>🏢</span> Accounts &amp; Company Organizations
          </h1>
          <div style={themeStyles.pageSubtitle}>
            Corporate accounts, enterprise tiers, multi-contact rollups, and organizational deal values
          </div>
        </div>

        <button onClick={() => setIsModalOpen(true)} style={themeStyles.btnPrimary}>
          <span>+</span> Add Company Account
        </button>
      </div>

      {/* Grid: Company Cards & Detail Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCompany ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Left Side: Directory Table */}
        <div style={themeStyles.panel}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
            <input
              style={{ ...themeStyles.fieldInput, flex: 1 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies by name, domain, industry, location..."
            />
            <span style={{ fontSize: '12px', color: COLORS.goldDark, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {filtered.length} Accounts
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={themeStyles.table}>
              <thead>
                <tr>
                  <th style={themeStyles.th}>Company Name</th>
                  <th style={themeStyles.th}>Industry &amp; Tier</th>
                  <th style={themeStyles.th}>Location</th>
                  <th style={themeStyles.th}>Annual Rev</th>
                  <th style={{ ...themeStyles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((comp) => {
                  const isSelected = selectedCompany?.id === comp.id;
                  return (
                    <tr
                      key={comp.id}
                      onClick={() => setSelectedCompany(comp)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(215, 171, 106, 0.15)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={themeStyles.td}>
                        <div style={{ fontWeight: 800, color: COLORS.textDark }}>{comp.name}</div>
                        <div style={{ fontSize: '11px', color: COLORS.goldDark }}>{comp.domain || comp.website}</div>
                      </td>
                      <td style={themeStyles.td}>
                        <div style={{ fontSize: '12.5px', color: COLORS.textDark }}>{comp.industry}</div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: comp.tier === 'Enterprise' ? 'rgba(147, 51, 234, 0.15)' : 'rgba(215, 171, 106, 0.2)',
                            color: comp.tier === 'Enterprise' ? '#7E22CE' : COLORS.textDark,
                          }}
                        >
                          {comp.tier}
                        </span>
                      </td>
                      <td style={themeStyles.td}>
                        <span style={{ fontSize: '12px', color: COLORS.textDark }}>{comp.location || 'Remote'}</span>
                      </td>
                      <td style={themeStyles.td}>
                        <strong style={{ color: COLORS.textDark }}>{formatINR(comp.annualRevenue)}</strong>
                      </td>
                      <td style={{ ...themeStyles.td, textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete company account "${comp.name}"?`)) onDeleteCompany(comp.id);
                          }}
                          style={themeStyles.btnDelete}
                          title="Delete Account"
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

        {/* Right Side: Company Details & Rollup Activities */}
        {selectedCompany && (
          <div style={themeStyles.panel}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.borderGoldLight}`, paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: COLORS.textDark }}>
                  🏢 {selectedCompany.name}
                </h3>
                <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '2px' }}>
                  {selectedCompany.industry} &middot; {selectedCompany.tier} Tier &middot; {selectedCompany.employeeCount} Employees
                </div>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                style={{ ...themeStyles.btnSmall, backgroundColor: 'transparent', border: 'none', fontSize: '18px' }}
              >
                &times;
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
              <div style={{ backgroundColor: COLORS.cardChampagne, border: `1px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: COLORS.textDark }}>{formatINR(companyRevenue)}</div>
                <div style={{ fontSize: '10.5px', color: COLORS.goldDark, fontWeight: 700 }}>CLOSED WON REVENUE</div>
              </div>
              <div style={{ backgroundColor: COLORS.cardChampagne, border: `1px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: COLORS.textDark }}>{companyContacts.length}</div>
                <div style={{ fontSize: '10.5px', color: COLORS.goldDark, fontWeight: 700 }}>KEY CONTACTS</div>
              </div>
              <div style={{ backgroundColor: COLORS.cardChampagne, border: `1px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: COLORS.textDark }}>{companyDeals.length}</div>
                <div style={{ fontSize: '10.5px', color: COLORS.goldDark, fontWeight: 700 }}>TOTAL DEALS</div>
              </div>
            </div>

            {/* Associated Contacts */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: COLORS.goldDark, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '8px' }}>
                👥 ASSOCIATED CONTACTS ({companyContacts.length})
              </div>
              {companyContacts.length === 0 ? (
                <div style={{ fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic' }}>
                  No contacts linked to this organization yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {companyContacts.map((c) => (
                    <div key={c.id} style={{ backgroundColor: '#FBF8F3', border: `1px solid ${COLORS.borderGold}`, borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: COLORS.textDark }}>{c.name}</strong> &middot; <span style={{ fontSize: '11.5px', color: COLORS.textMuted }}>{c.jobTitle}</span>
                        <div style={{ fontSize: '11px', color: COLORS.goldDark }}>{c.email} &middot; {c.phone}</div>
                      </div>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#2E8B57' }}>{c.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Associated Deals */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: COLORS.goldDark, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '8px' }}>
                💼 ASSOCIATED DEALS &amp; OPPORTUNITIES ({companyDeals.length})
              </div>
              {companyDeals.length === 0 ? (
                <div style={{ fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic' }}>
                  No deals logged under this company.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {companyDeals.map((d) => (
                    <div key={d.id} style={{ backgroundColor: '#FBF8F3', border: `1px solid ${COLORS.borderGold}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: COLORS.textDark }}>{d.title}</strong>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted }}>
                          Stage: <strong>{d.stage}</strong> ({d.probability}%) &middot; Sales Rep: {d.salesperson}
                        </div>
                      </div>
                      <strong style={{ fontSize: '14px', color: COLORS.textDark }}>${d.amount.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="🏢 Add Organization / Company Account"
        subtitle="Track corporate entities, company sizes, and organizational pipeline values"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>COMPANY NAME *</label>
              <input
                style={themeStyles.fieldInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Global Logistics"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>DOMAIN (e.g. company.com)</label>
              <input
                style={themeStyles.fieldInput}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="apexlogistics.io"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>INDUSTRY</label>
              <input
                style={themeStyles.fieldInput}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Supply Chain / Tech"
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>TIER</label>
              <select
                style={themeStyles.fieldSelect}
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
              >
                <option value="Enterprise">Enterprise</option>
                <option value="Mid-Market">Mid-Market</option>
                <option value="Startup">Startup</option>
                <option value="SMB">SMB</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>ESTIMATED ANNUAL REVENUE (₹ INR)</label>
              <input
                type="number"
                style={themeStyles.fieldInput}
                value={annualRevenue}
                onChange={(e) => setAnnualRevenue(e.target.value)}
                placeholder="50000000"
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>LOCATION / HEADQUARTERS</label>
              <input
                style={themeStyles.fieldInput}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>NOTES &amp; BACKGROUND</label>
            <textarea
              style={themeStyles.fieldTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Account background, parent companies..."
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
              Save Organization Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
