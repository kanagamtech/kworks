import React, { useState } from 'react';
import { Deal, DealStage, UserAccount } from '../types/crm';
import { COLORS, themeStyles, formatINR } from '../styles/theme';
import { Modal } from '../components/Modal';

interface DealsPageProps {
  deals: Deal[];
  users: UserAccount[];
  currentUser: UserAccount | null;
  onAddDeal: (deal: Partial<Deal>) => Promise<void>;
  onUpdateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  onDeleteDeal: (id: string) => Promise<void>;
  onOpenComposeEmail: (toEmail: string, toName: string, dealId: string) => void;
}

const STAGES: { id: DealStage; label: string; color: string; defaultProb: number }[] = [
  { id: 'Discovery', label: 'Discovery / Qualification', color: '#3B82F6', defaultProb: 20 },
  { id: 'Proposal', label: 'Proposal / Quote Sent', color: '#D7AB6A', defaultProb: 50 },
  { id: 'Negotiation', label: 'Negotiation & Legal', color: '#9333EA', defaultProb: 80 },
  { id: 'Closed Won', label: 'Closed Won 🎉', color: '#2E8B57', defaultProb: 100 },
  { id: 'Closed Lost', label: 'Closed Lost', color: '#E05050', defaultProb: 0 },
];

export const DealsPage: React.FC<DealsPageProps> = ({
  deals,
  users,
  currentUser,
  onAddDeal,
  onUpdateDeal,
  onDeleteDeal,
  onOpenComposeEmail,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [repFilter, setRepFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Admin';

  // Form State
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [company, setCompany] = useState('');
  const [amount, setAmount] = useState('35000');
  const [stage, setStage] = useState<DealStage>('Discovery');
  const [probability, setProbability] = useState('20');
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  );
  const [salesperson, setSalesperson] = useState(currentUser?.name || 'Rajesh Raman');
  const [notes, setNotes] = useState('');

  const filtered = deals.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      d.title.toLowerCase().includes(q) ||
      d.customerName.toLowerCase().includes(q) ||
      d.company.toLowerCase().includes(q) ||
      d.salesperson.toLowerCase().includes(q);

    const matchesStage = stageFilter === 'ALL' || d.stage === stageFilter;
    const matchesRep = repFilter === 'ALL' || d.salesperson === repFilter;
    return matchesSearch && matchesStage && matchesRep;
  });

  const totalValue = filtered.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const weightedValue = filtered.reduce(
    (sum, d) => sum + (Number(d.amount) || 0) * ((d.probability || 0) / 100),
    0
  );
  const wonValue = filtered
    .filter((d) => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !customerName) return;

    await onAddDeal({
      title,
      customerName,
      customerEmail,
      company,
      amount: Number(amount) || 0,
      stage,
      probability: Number(probability) || 20,
      expectedCloseDate,
      salesperson: isManager ? salesperson : (currentUser?.name || salesperson),
      createdBy: currentUser?.name || 'Rajesh Raman',
      notes,
    });

    setTitle('');
    setCustomerName('');
    setCustomerEmail('');
    setCompany('');
    setNotes('');
    setIsModalOpen(false);
  };

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    const stageObj = STAGES.find((s) => s.id === newStage);
    const newProb = stageObj ? stageObj.defaultProb : 50;
    await onUpdateDeal(dealId, { stage: newStage, probability: newProb });
  };

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>💼</span> Deals &amp; Sales Pipeline
          </h1>
          <div style={themeStyles.pageSubtitle}>
            {isManager
              ? '👑 Manager View: Monitoring total corporate pipeline, rep deal values & weighted forecasts'
              : `👤 Employee View: Showing pipeline and opportunities assigned to ${currentUser?.name}`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '3px', border: `1px solid ${COLORS.borderGold}` }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'kanban' ? COLORS.goldAccent : 'transparent',
                color: viewMode === 'kanban' ? COLORS.textDark : '#FFFFFF',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              📊 Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'table' ? COLORS.goldAccent : 'transparent',
                color: viewMode === 'table' ? COLORS.textDark : '#FFFFFF',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              📋 Table View
            </button>
          </div>

          <button
            onClick={() => {
              setSalesperson(currentUser?.name || 'Rajesh Raman');
              setIsModalOpen(true);
            }}
            style={themeStyles.btnPrimary}
          >
            <span>+</span> Create New Deal
          </button>
        </div>
      </div>

      {/* Permission Scope Banner */}
      {!isManager && (
        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3B82F6', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '12.5px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔒</span>
          <span>
            <strong>Employee Account Scope Active:</strong> Viewing deals owned by <strong>{currentUser?.name}</strong>. Target Monthly Quota: <strong>{formatINR(currentUser?.monthlyQuota || 500000)}</strong>.
          </span>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '14px', padding: '16px', textAlign: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
          <div className="stat-card-gold-val" style={{ fontSize: '22px', fontWeight: 900, marginBottom: '4px' }}>{formatINR(totalValue)}</div>
          <div style={{ fontSize: '11px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pipeline Value</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '14px', padding: '16px', textAlign: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
          <div className="stat-card-gold-val" style={{ fontSize: '22px', fontWeight: 900, marginBottom: '4px' }}>{formatINR(weightedValue)}</div>
          <div style={{ fontSize: '11px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Weighted Forecast</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '14px', padding: '16px', textAlign: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
          <div className="stat-card-gold-val" style={{ fontSize: '22px', fontWeight: 900, marginBottom: '4px' }}>{formatINR(wonValue)}</div>
          <div style={{ fontSize: '11px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Closed Won Revenue</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '14px', padding: '16px', textAlign: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
          <div className="stat-card-gold-val" style={{ fontSize: '22px', fontWeight: 900, marginBottom: '4px' }}>{filtered.length}</div>
          <div style={{ fontSize: '11px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Opportunities</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ ...themeStyles.panel, padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            style={{ ...themeStyles.fieldInput, flex: 2 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by title, customer, company, salesperson..."
          />
          <select
            style={{ ...themeStyles.fieldSelect, flex: 1 }}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="ALL">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {isManager && (
            <select
              style={{ ...themeStyles.fieldSelect, flex: 1 }}
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
            >
              <option value="ALL">All Sales Representatives</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* View: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(260px, 1fr))', gap: '14px', overflowX: 'auto', paddingBottom: '16px' }}>
          {STAGES.map((stageItem) => {
            const stageDeals = filtered.filter((d) => d.stage === stageItem.id);
            const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

            return (
              <div
                key={stageItem.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `2px solid ${stageItem.color}`,
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '75vh',
                }}
              >
                <div style={{ borderBottom: `2px solid ${stageItem.color}`, paddingBottom: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12.5px', color: COLORS.textDark, textTransform: 'uppercase' }}>
                      {stageItem.label}
                    </strong>
                    <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '8px' }}>
                      {stageDeals.length}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: stageItem.color, marginTop: '4px' }}>
                    {formatINR(stageTotal)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
                  {stageDeals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 6px', color: COLORS.textMuted, fontSize: '12px', fontStyle: 'italic' }}>
                      No deals in this stage
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        style={{
                          backgroundColor: COLORS.cardChampagne,
                          border: `1px solid ${COLORS.borderGold}`,
                          borderRadius: '10px',
                          padding: '12px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, marginBottom: '4px' }}>
                          {deal.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: COLORS.textMuted, marginBottom: '6px' }}>
                          {deal.company || deal.customerName}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '14px', color: COLORS.textDark }}>
                            {formatINR(deal.amount)}
                          </strong>
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: COLORS.goldDark }}>
                            {deal.probability}% Prob
                          </span>
                        </div>

                        <div style={{ fontSize: '10.5px', color: '#666', borderTop: `1px solid ${COLORS.borderGoldLight}`, paddingTop: '6px', marginBottom: '8px' }}>
                          📅 Close: {deal.expectedCloseDate} &middot; 👤 <strong>{deal.salesperson}</strong>
                        </div>

                        {/* Stage Mover Selector */}
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <select
                            value={deal.stage}
                            onChange={(e) => handleStageChange(deal.id, e.target.value as DealStage)}
                            style={{
                              ...themeStyles.fieldSelect,
                              fontSize: '11px',
                              padding: '4px 6px',
                              height: '28px',
                              flex: 1,
                            }}
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>Move: {s.label}</option>
                            ))}
                          </select>

                          {deal.customerEmail && (
                            <button
                              onClick={() => onOpenComposeEmail(deal.customerEmail, deal.customerName, deal.id)}
                              style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.goldAccent, color: COLORS.textDark, height: '28px' }}
                              title="Send Email with Quotation / Update"
                            >
                              ✉️
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (window.confirm(`Delete deal "${deal.title}"?`)) onDeleteDeal(deal.id);
                            }}
                            style={{ ...themeStyles.btnDelete, padding: '2px 4px', fontSize: '14px' }}
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View: TABLE VIEW */
        <div style={themeStyles.panel}>
          <div style={{ overflowX: 'auto' }}>
            <table style={themeStyles.table}>
              <thead>
                <tr>
                  <th style={themeStyles.th}>Deal Title &amp; ID</th>
                  <th style={themeStyles.th}>Customer &amp; Company</th>
                  <th style={themeStyles.th}>Amount</th>
                  <th style={themeStyles.th}>Stage</th>
                  <th style={themeStyles.th}>Probability</th>
                  <th style={themeStyles.th}>Expected Close</th>
                  <th style={themeStyles.th}>Salesperson</th>
                  <th style={{ ...themeStyles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((deal) => {
                  const stageObj = STAGES.find((s) => s.id === deal.stage);
                  const color = stageObj ? stageObj.color : COLORS.goldAccent;

                  return (
                    <tr key={deal.id}>
                      <td style={themeStyles.td}>
                        <div style={{ fontWeight: 800, color: COLORS.textDark }}>{deal.title}</div>
                        <div style={{ fontSize: '11px', color: COLORS.goldDark }}>{deal.id}</div>
                      </td>
                      <td style={themeStyles.td}>
                        <div><strong>{deal.customerName}</strong></div>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted }}>{deal.company}</div>
                      </td>
                      <td style={themeStyles.td}>
                        <strong style={{ fontSize: '14px', color: COLORS.textDark }}>
                          {formatINR(deal.amount)}
                        </strong>
                      </td>
                      <td style={themeStyles.td}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            backgroundColor: `${color}20`,
                            color: color,
                            border: `1px solid ${color}`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {deal.stage}
                        </span>
                      </td>
                      <td style={themeStyles.td}>
                        <strong>{deal.probability}%</strong>
                      </td>
                      <td style={themeStyles.td}>{deal.expectedCloseDate}</td>
                      <td style={themeStyles.td}>
                        {isManager ? (
                          <select
                            value={deal.salesperson}
                            onChange={(e) => onUpdateDeal(deal.id, { salesperson: e.target.value })}
                            style={{ ...themeStyles.fieldSelect, fontSize: '11.5px', padding: '3px 6px' }}
                            title="Reassign deal to salesperson (Manager Privilege)"
                          >
                            {users.map((u) => (
                              <option key={u.id} value={u.name}>{u.name}</option>
                            ))}
                          </select>
                        ) : (
                          deal.salesperson
                        )}
                      </td>
                      <td style={{ ...themeStyles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {deal.customerEmail && (
                          <button
                            onClick={() => onOpenComposeEmail(deal.customerEmail, deal.customerName, deal.id)}
                            style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}`, marginRight: '6px' }}
                          >
                            ✉️ Quote
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete deal "${deal.title}"?`)) onDeleteDeal(deal.id);
                          }}
                          style={themeStyles.btnDelete}
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
      )}

      {/* Create Deal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="💼 Create Deal / Opportunity"
        subtitle="Creating a deal triggers the automated commercial quotation workflow"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>DEAL TITLE *</label>
              <input
                style={themeStyles.fieldInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Apex 500-User Enterprise Rollout"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>DEAL AMOUNT (₹ INR) *</label>
              <input
                type="number"
                style={themeStyles.fieldInput}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500000"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>CUSTOMER NAME *</label>
              <input
                style={themeStyles.fieldInput}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>CUSTOMER EMAIL (FOR QUOTE)</label>
              <input
                type="email"
                style={themeStyles.fieldInput}
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="priya@apexlogistics.io"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>COMPANY / ORGANIZATION</label>
              <input
                style={themeStyles.fieldInput}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Apex Global Logistics"
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>INITIAL STAGE</label>
              <select
                style={themeStyles.fieldSelect}
                value={stage}
                onChange={(e) => {
                  const st = e.target.value as DealStage;
                  setStage(st);
                  const stObj = STAGES.find((s) => s.id === st);
                  if (stObj) setProbability(String(stObj.defaultProb));
                }}
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>EXPECTED CLOSE DATE</label>
              <input
                type="date"
                style={themeStyles.fieldInput}
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>ASSIGNED SALESPERSON</label>
              {isManager ? (
                <select
                  style={themeStyles.fieldSelect}
                  value={salesperson}
                  onChange={(e) => setSalesperson(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              ) : (
                <input
                  style={{ ...themeStyles.fieldInput, backgroundColor: '#F0F0F0' }}
                  value={currentUser?.name || salesperson}
                  disabled
                />
              )}
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>DEAL NOTES &amp; DELIVERABLES</label>
            <textarea
              style={themeStyles.fieldTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Scope details, discount agreements, executive stakeholders..."
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
              🚀 Save Deal &amp; Trigger Quotation Workflow
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
