import React, { useState } from 'react';
import {
  Lead,
  Deal,
  Quotation,
  LeadLifecycleStatus,
  DealForecastStage,
  OrderLifecycleStatus,
  PostSaleFeedbackStatus,
  ForecastStageConfig,
  LifecycleItem,
} from '../types/crm';
import { COLORS, themeStyles, formatINR } from '../styles/theme';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';

interface ForecastPageProps {
  leads: Lead[];
  deals: Deal[];
  quotes: Quotation[];
  onConvertLeadToDeal?: (leadId: string) => Promise<void>;
  onCreateQuote?: (quote: Partial<Quotation>) => Promise<void>;
}

// Stage Forecast Weight Matrix
const STAGE_CONFIGS: Record<DealForecastStage, ForecastStageConfig> = {
  DISCOVERY: {
    stage: 'DISCOVERY',
    label: 'Discovery',
    weight: 0.20,
    description: 'Initial meeting to understand technical or business needs.',
    triggerAction: 'Qualifies customer requirements.',
  },
  PROPOSAL: {
    stage: 'PROPOSAL',
    label: 'Proposal',
    weight: 0.50,
    description: 'Solution being designed. Triggers creation of Quotation.',
    triggerAction: '⚡ Auto-drafts Quotation in DRAFT_QUOTE status.',
  },
  NEGOTIATION: {
    stage: 'NEGOTIATION',
    label: 'Negotiation',
    weight: 0.80,
    description: 'Client reviewing price & terms. Commercial revisions happen here.',
    triggerAction: 'Locks terms and prepares final approval.',
  },
  CLOSED_WON: {
    stage: 'CLOSED_WON',
    label: 'Closed Won',
    weight: 1.00,
    description: 'Client agreed. Triggers PO / SO fulfillment phase.',
    triggerAction: '⚡ Auto-creates internal Sales Order (SO_GENERATED).',
  },
  CLOSED_LOST: {
    stage: 'CLOSED_LOST',
    label: 'Closed Lost',
    weight: 0.00,
    description: 'Client chose competitor or canceled project.',
    triggerAction: 'Logs loss reason and freezes deal.',
  },
};

export const ForecastPage: React.FC<ForecastPageProps> = ({
  leads,
  deals,
  quotes,
  onConvertLeadToDeal,
  onCreateQuote,
}) => {
  // Active subview: 'pipeline' | 'lifecycle' | 'matrix'
  const [activeView, setActiveView] = useState<'lifecycle' | 'pipeline' | 'matrix'>('lifecycle');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<LifecycleItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form State for creating a new Lifecycle prospect
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newVal, setNewVal] = useState(2500000);
  const [newAssigned, setNewAssigned] = useState('Rajesh Raman');

  // Unified State Machine Items (Synthesizing real CRM leads + deals + initial seed mock)
  const [lifecycleItems, setLifecycleItems] = useState<LifecycleItem[]>([
    {
      id: 'LC-101',
      customerName: 'Vikram Seth',
      company: 'Titan Manufacturing Corp',
      email: 'vikram.seth@titanmfg.in',
      phone: '+91 98401 23456',
      assignedTo: 'Rajesh Raman',
      estimatedValue: 3800000,
      leadStatus: 'QUALIFIED',
      dealStage: 'NEGOTIATION',
      dealAmount: 3800000,
      orderStatus: 'QUOTE_SENT',
      feedbackStatus: undefined,
      lastUpdated: new Date().toISOString(),
      createdAt: '2026-08-20T10:00:00Z',
      history: [
        { module: 'Lead', from: 'NEW', to: 'CONTACTED', timestamp: '2026-08-20 10:15', triggerNote: 'Introductory email sent by sales rep.' },
        { module: 'Lead', from: 'CONTACTED', to: 'QUALIFIED', timestamp: '2026-08-21 14:30', triggerNote: '⚡ Budget & authority confirmed. Auto-created Deal opportunity.' },
        { module: 'Deal', from: 'DISCOVERY', to: 'PROPOSAL', timestamp: '2026-08-23 09:00', triggerNote: '⚡ Auto-generated commercial Quotation QT-2026-001.' },
        { module: 'Deal', from: 'PROPOSAL', to: 'NEGOTIATION', timestamp: '2026-08-25 16:20', triggerNote: 'Client requested 5% volume rebate.' },
      ],
    },
    {
      id: 'LC-102',
      customerName: 'Ananya Deshmukh',
      company: 'OmniHealth Hospital Networks',
      email: 'ananya.d@omnihealth.org',
      phone: '+91 98200 88991',
      assignedTo: 'Sunita Rao',
      estimatedValue: 7500000,
      leadStatus: 'QUALIFIED',
      dealStage: 'CLOSED_WON',
      dealAmount: 7500000,
      orderStatus: 'FULFILLED',
      feedbackStatus: 'SATISFIED',
      satisfactionRating: 5,
      feedbackNotes: 'Exceeded deployment expectations across all 6 clinics.',
      lastUpdated: new Date().toISOString(),
      createdAt: '2026-08-10T11:00:00Z',
      history: [
        { module: 'Lead', from: 'NEW', to: 'QUALIFIED', timestamp: '2026-08-10 11:30', triggerNote: 'Enterprise inbound tender request.' },
        { module: 'Deal', from: 'DISCOVERY', to: 'CLOSED_WON', timestamp: '2026-08-18 17:00', triggerNote: '⚡ Contract signed. Auto-triggered PO & Sales Order SO-501.' },
        { module: 'Order', from: 'SO_GENERATED', to: 'FULFILLED', timestamp: '2026-08-24 12:00', triggerNote: '⚡ Hardware installed. Invoiced & automated 7-day survey scheduled.' },
        { module: 'Feedback', from: 'SURVEY_SENT', to: 'SATISFIED', timestamp: '2026-08-26 15:00', triggerNote: '⚡ 5-Star rating received. Automated referral request dispatched.' },
      ],
    },
    {
      id: 'LC-103',
      customerName: 'Phiroj Kalal',
      company: 'Greysim Learnings Foundation',
      email: 'phiroj.k@greysim.edu.in',
      phone: '+91 99448 88342',
      assignedTo: 'Rajesh Raman',
      estimatedValue: 95580,
      leadStatus: 'QUALIFIED',
      dealStage: 'PROPOSAL',
      dealAmount: 95580,
      orderStatus: 'QUOTE_SENT',
      feedbackStatus: undefined,
      lastUpdated: new Date().toISOString(),
      createdAt: '2026-08-25T08:00:00Z',
      history: [
        { module: 'Lead', from: 'NEW', to: 'QUALIFIED', timestamp: '2026-08-25 08:30', triggerNote: 'Lead qualified.' },
        { module: 'Deal', from: 'DISCOVERY', to: 'PROPOSAL', timestamp: '2026-08-25 09:15', triggerNote: '⚡ Proforma Invoice QM/26-27/024 generated and emailed.' },
      ],
    },
    {
      id: 'LC-104',
      customerName: 'Kavita Menon',
      company: 'BlueWave Coldchain Transport',
      email: 'kavita.m@bluewavelogistics.com',
      phone: '+91 94441 55667',
      assignedTo: 'Vikram Joshi',
      estimatedValue: 1800000,
      leadStatus: 'CONTACTED',
      dealStage: undefined,
      orderStatus: undefined,
      feedbackStatus: undefined,
      lastUpdated: new Date().toISOString(),
      createdAt: '2026-08-26T14:00:00Z',
      history: [
        { module: 'Lead', from: 'NEW', to: 'CONTACTED', timestamp: '2026-08-26 14:30', triggerNote: 'Cold outreach email sent. Awaiting response.' },
      ],
    },
    {
      id: 'LC-105',
      customerName: 'Rahul Singhania',
      company: 'Zenith Warehousing Hub',
      email: 'rahul.s@zenithwarehouses.in',
      phone: '+91 98330 11223',
      assignedTo: 'Rajesh Raman',
      estimatedValue: 4200000,
      leadStatus: 'QUALIFIED',
      dealStage: 'CLOSED_WON',
      dealAmount: 4200000,
      orderStatus: 'FULFILLED',
      feedbackStatus: 'ESCALATED',
      satisfactionRating: 2,
      feedbackNotes: 'Delay in terminal API sync with their ERP.',
      lastUpdated: new Date().toISOString(),
      createdAt: '2026-08-12T09:00:00Z',
      history: [
        { module: 'Order', from: 'SO_GENERATED', to: 'FULFILLED', timestamp: '2026-08-20 18:00', triggerNote: 'Shipped.' },
        { module: 'Feedback', from: 'SURVEY_SENT', to: 'ESCALATED', timestamp: '2026-08-27 09:00', triggerNote: '⚠️ 2-Star survey response. Account manager flagged for immediate SLA intervention!' },
      ],
    },
  ]);

  // --- REVENUE FORECASTING CALCULATIONS (Weighted Pipeline) ---
  const activeDealsWithStage = lifecycleItems.filter((it) => it.dealStage && it.dealStage !== 'CLOSED_LOST');
  const grossPipelineValue = activeDealsWithStage.reduce((sum, it) => sum + (it.dealAmount || it.estimatedValue || 0), 0);
  
  const weightedForecastRevenue = activeDealsWithStage.reduce((sum, it) => {
    const stage = it.dealStage || 'DISCOVERY';
    const weight = STAGE_CONFIGS[stage]?.weight || 0.20;
    return sum + (it.dealAmount || it.estimatedValue || 0) * weight;
  }, 0);

  const discoveryCount = lifecycleItems.filter((it) => it.dealStage === 'DISCOVERY').length;
  const proposalCount = lifecycleItems.filter((it) => it.dealStage === 'PROPOSAL').length;
  const negotiationCount = lifecycleItems.filter((it) => it.dealStage === 'NEGOTIATION').length;
  const closedWonCount = lifecycleItems.filter((it) => it.dealStage === 'CLOSED_WON').length;
  const closedLostCount = lifecycleItems.filter((it) => it.dealStage === 'CLOSED_LOST').length;

  // --- AUTOMATED STATE MACHINE TRANSITION HANDLER ⭐ ---
  const handleAdvanceState = (item: LifecycleItem, targetModule: 'Lead' | 'Deal' | 'Order' | 'Feedback', nextState: string) => {
    const updated = lifecycleItems.map((it) => {
      if (it.id !== item.id) return it;

      const historyEntry = {
        module: targetModule,
        from: (it as any)[targetModule === 'Lead' ? 'leadStatus' : targetModule === 'Deal' ? 'dealStage' : targetModule === 'Order' ? 'orderStatus' : 'feedbackStatus'] || 'None',
        to: nextState,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        triggerNote: '',
      };

      const newItem: LifecycleItem = { ...it, lastUpdated: new Date().toISOString() };

      if (targetModule === 'Lead') {
        newItem.leadStatus = nextState as LeadLifecycleStatus;
        if (nextState === 'QUALIFIED') {
          historyEntry.triggerNote = '⚡ Lead QUALIFIED! Automated state machine created new Deal in DISCOVERY.';
          newItem.dealStage = 'DISCOVERY';
          newItem.dealAmount = newItem.estimatedValue;
        } else if (nextState === 'UNQUALIFIED') {
          historyEntry.triggerNote = '🛑 Lead marked UNQUALIFIED. Sales flow discontinued.';
        } else {
          historyEntry.triggerNote = `Lead status updated to ${nextState}.`;
        }
      } else if (targetModule === 'Deal') {
        newItem.dealStage = nextState as DealForecastStage;
        if (nextState === 'PROPOSAL') {
          historyEntry.triggerNote = '⚡ Deal moved to PROPOSAL! Automated state machine created Quotation draft (DRAFT_QUOTE).';
          newItem.orderStatus = 'DRAFT_QUOTE';
        } else if (nextState === 'CLOSED_WON') {
          historyEntry.triggerNote = '🎉 Deal CLOSED WON (100% Weight)! Triggered internal Sales Order (SO_GENERATED).';
          newItem.orderStatus = 'SO_GENERATED';
        } else if (nextState === 'CLOSED_LOST') {
          historyEntry.triggerNote = '🛑 Deal CLOSED LOST (0% Weight). Pipeline value zeroed.';
        } else {
          historyEntry.triggerNote = `Deal advanced to ${nextState} (${(STAGE_CONFIGS[nextState as DealForecastStage]?.weight || 0) * 100}% forecast weight).`;
        }
      } else if (targetModule === 'Order') {
        newItem.orderStatus = nextState as OrderLifecycleStatus;
        if (nextState === 'QUOTE_SENT') {
          historyEntry.triggerNote = '✉️ Quotation dispatched to customer. Editing locked.';
        } else if (nextState === 'PO_RECEIVED') {
          historyEntry.triggerNote = '📄 Official Purchase Order verified from client.';
        } else if (nextState === 'FULFILLED') {
          historyEntry.triggerNote = '📦 Deliverables FULFILLED! Generated Invoice & scheduled 7-Day post-sale satisfaction survey.';
          newItem.feedbackStatus = 'SURVEY_SENT';
        } else {
          historyEntry.triggerNote = `Order status moved to ${nextState}.`;
        }
      } else if (targetModule === 'Feedback') {
        newItem.feedbackStatus = nextState as PostSaleFeedbackStatus;
        if (nextState === 'SATISFIED') {
          historyEntry.triggerNote = '⭐ Customer SATISFIED (5 Stars)! Auto-triggered referral reward sequence.';
          newItem.satisfactionRating = 5;
        } else if (nextState === 'ESCALATED') {
          historyEntry.triggerNote = '⚠️ Customer feedback ESCALATED! High-priority SLA task assigned to Account Manager.';
          newItem.satisfactionRating = 1;
        }
      }

      newItem.history = [historyEntry, ...newItem.history];
      return newItem;
    });

    setLifecycleItems(updated);
    if (selectedItem?.id === item.id) {
      setSelectedItem(updated.find((x) => x.id === item.id) || null);
    }
  };

  // Create new prospect
  const handleCreateNewProspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCompany) return;

    const newItem: LifecycleItem = {
      id: `LC-${Date.now().toString().slice(-4)}`,
      customerName: newName,
      company: newCompany,
      email: newEmail || 'lead@enterprise.in',
      phone: newPhone || '+91 98000 00000',
      assignedTo: newAssigned,
      estimatedValue: Number(newVal) || 2000000,
      leadStatus: 'NEW',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      history: [
        {
          module: 'Lead',
          from: 'None',
          to: 'NEW',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          triggerNote: 'Raw prospect entered into Sales Lifecycle Engine.',
        },
      ],
    };

    setLifecycleItems([newItem, ...lifecycleItems]);
    setIsNewModalOpen(false);
    setNewName('');
    setNewCompany('');
    setNewEmail('');
    setNewPhone('');
  };

  // Filtered items
  const filteredItems = lifecycleItems.filter((it) => {
    const term = search.toLowerCase();
    return (
      it.customerName.toLowerCase().includes(term) ||
      it.company.toLowerCase().includes(term) ||
      (it.dealStage && it.dealStage.toLowerCase().includes(term)) ||
      it.leadStatus.toLowerCase().includes(term) ||
      (it.orderStatus && it.orderStatus.toLowerCase().includes(term))
    );
  });

  return (
    <div style={themeStyles.pageContainer}>
      {/* Top Header Row */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>🔮</span> Sales Lifecycle &amp; Revenue Forecast Engine
          </h1>
          <div style={themeStyles.pageSubtitle}>
            End-to-end 4-Module State Machine: Lead Qualification ➔ Weighted Deal Pipeline ➔ Order Fulfillment ➔ Post-Sale Feedback
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '3px', border: `1px solid ${COLORS.borderGold}` }}>
            <button
              onClick={() => setActiveView('lifecycle')}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeView === 'lifecycle' ? COLORS.goldAccent : 'transparent',
                color: activeView === 'lifecycle' ? COLORS.textDark : '#FFFFFF',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🔄 End-to-End Lifecycle
            </button>
            <button
              onClick={() => setActiveView('pipeline')}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeView === 'pipeline' ? COLORS.goldAccent : 'transparent',
                color: activeView === 'pipeline' ? COLORS.textDark : '#FFFFFF',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              📊 Weighted Forecast Matrix
            </button>
          </div>

          <button onClick={() => setIsNewModalOpen(true)} style={themeStyles.btnPrimary}>
            + New Lifecycle Prospect
          </button>
        </div>
      </div>

      {/* 3D Gold Revenue Forecast KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          title="WEIGHTED FORECAST REVENUE"
          value={formatINR(weightedForecastRevenue)}
          subtext="Sum of (Deal Value × Stage Weight)"
          icon="🔮"
          trend="+28% QoQ"
        />
        <StatCard
          title="TOTAL PIPELINE VALUE"
          value={formatINR(grossPipelineValue)}
          subtext={`${activeDealsWithStage.length} Active Deals in Pipeline`}
          icon="💼"
        />
        <StatCard
          title="ACTIVE DISCOVERY & PROPOSALS"
          value={`${discoveryCount + proposalCount}`}
          subtext={`₹${formatINR(
            lifecycleItems
              .filter((x) => x.dealStage === 'DISCOVERY' || x.dealStage === 'PROPOSAL')
              .reduce((s, x) => s + (x.dealAmount || 0), 0)
          )} pipeline`}
          icon="📋"
        />
        <StatCard
          title="HIGH-CONVERSION NEGOTIATION"
          value={`${negotiationCount}`}
          subtext={`₹${formatINR(
            lifecycleItems
              .filter((x) => x.dealStage === 'NEGOTIATION')
              .reduce((s, x) => s + (x.dealAmount || 0), 0)
          )} at 80% Weight`}
          icon="🤝"
          trend="Near Close"
        />
      </div>

      {/* ARCHITECTURE FLOW: INTERACTIVE 4-STAGE PIPELINE MAP */}
      <div style={{ ...themeStyles.panel, padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🗺️</span> ARCHITECTURAL STATE MACHINE PIPELINE FLOW
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {/* Module 1: Lead Status */}
          <div style={{ backgroundColor: '#FAF6EF', border: `1.5px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: COLORS.goldDark, textTransform: 'uppercase' }}>
                1. LEAD STATUS (lead_status)
              </span>
              <span style={{ fontSize: '11px', backgroundColor: 'rgba(215, 171, 106, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                {lifecycleItems.filter((x) => x.leadStatus).length} Leads
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>
              Tracks raw human contact before qualification.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: '#FFF', borderRadius: '4px' }}>
                <strong>NEW</strong> <span>Raw submission</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: '#FFF', borderRadius: '4px' }}>
                <strong>CONTACTED</strong> <span>Outreach active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: 'rgba(46, 139, 87, 0.15)', color: '#2E8B57', borderRadius: '4px', fontWeight: 800 }}>
                <strong>QUALIFIED ⚡</strong> <span>Triggers Deal</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: 'rgba(224, 80, 80, 0.1)', color: '#E05050', borderRadius: '4px' }}>
                <strong>UNQUALIFIED</strong> <span>Flow stops</span>
              </div>
            </div>
          </div>

          {/* Module 2: Deal Stage */}
          <div style={{ backgroundColor: '#FAF6EF', border: `1.5px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: COLORS.goldDark, textTransform: 'uppercase' }}>
                2. DEAL STAGE (deal_stage)
              </span>
              <span style={{ fontSize: '11px', backgroundColor: 'rgba(215, 171, 106, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                {activeDealsWithStage.length} Deals
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>
              Core pipeline weighted revenue forecasting.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: '#FFF', borderRadius: '4px' }}>
                <strong>DISCOVERY</strong> <span style={{ color: COLORS.goldDark, fontWeight: 700 }}>20% Weight</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#2563EB', borderRadius: '4px', fontWeight: 700 }}>
                <strong>PROPOSAL ⚡</strong> <span>50% (Auto-Quote)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: 'rgba(215, 171, 106, 0.25)', borderRadius: '4px', fontWeight: 700 }}>
                <strong>NEGOTIATION</strong> <span style={{ color: COLORS.goldDark, fontWeight: 800 }}>80% Weight</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: 'rgba(46, 139, 87, 0.2)', color: '#2E8B57', borderRadius: '4px', fontWeight: 900 }}>
                <strong>CLOSED_WON ⚡</strong> <span>100% (Auto-Order)</span>
              </div>
            </div>
          </div>

          {/* Module 3: Quotation & Order */}
          <div style={{ backgroundColor: '#FAF6EF', border: `1.5px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: COLORS.goldDark, textTransform: 'uppercase' }}>
                3. ORDER &amp; FULFILLMENT (order_status)
              </span>
              <span style={{ fontSize: '11px', backgroundColor: 'rgba(215, 171, 106, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                {lifecycleItems.filter((x) => x.orderStatus).length} Orders
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>
              Paperwork, purchase order, and work execution.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: '#FFF', borderRadius: '4px' }}>
                <strong>DRAFT_QUOTE</strong> <span>Building items</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: '#FFF', borderRadius: '4px' }}>
                <strong>QUOTE_SENT</strong> <span>Locked &amp; sent</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: '#FFF', borderRadius: '4px' }}>
                <strong>PO_RECEIVED</strong> <span>Client PO in hand</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: 'rgba(46, 139, 87, 0.15)', color: '#2E8B57', borderRadius: '4px', fontWeight: 800 }}>
                <strong>FULFILLED ⚡</strong> <span>Invoiced &amp; Survey</span>
              </div>
            </div>
          </div>

          {/* Module 4: Post-Sale Feedback */}
          <div style={{ backgroundColor: '#FAF6EF', border: `1.5px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: COLORS.goldDark, textTransform: 'uppercase' }}>
                4. POST-SALE &amp; FEEDBACK (feedback_status)
              </span>
              <span style={{ fontSize: '11px', backgroundColor: 'rgba(215, 171, 106, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                Satisfaction
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>
              Measures customer delight &amp; prevents churn.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: '#FFF', borderRadius: '4px' }}>
                <strong>SURVEY_SENT</strong> <span>Auto 7-day trigger</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: 'rgba(46, 139, 87, 0.15)', color: '#2E8B57', borderRadius: '4px', fontWeight: 800 }}>
                <strong>SATISFIED ⭐</strong> <span>Referral engine</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: 'rgba(224, 80, 80, 0.15)', color: '#E05050', borderRadius: '4px', fontWeight: 800 }}>
                <strong>ESCALATED ⚠️</strong> <span>Account manager SLA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeView === 'lifecycle' ? (
        /* ================= END-TO-END LIFECYCLE DIRECTORY ================= */
        <div style={themeStyles.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <input
              style={{ ...themeStyles.fieldInput, maxWidth: '380px' }}
              placeholder="Search lifecycle items by customer, company, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={{ fontSize: '12px', color: COLORS.goldDark, fontWeight: 700 }}>
              Showing {filteredItems.length} active end-to-end customer lifecycles
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${COLORS.borderGoldLight}`, color: COLORS.goldDark, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <th style={{ padding: '12px 8px' }}>Customer &amp; Company</th>
                  <th style={{ padding: '12px 8px' }}>1. Lead Status</th>
                  <th style={{ padding: '12px 8px' }}>2. Deal Stage (Weight)</th>
                  <th style={{ padding: '12px 8px' }}>3. Order / Fulfillment</th>
                  <th style={{ padding: '12px 8px' }}>4. Post-Sale</th>
                  <th style={{ padding: '12px 8px' }}>Forecast Value (₹)</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Advance / Triggers</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const dealWeight = item.dealStage ? STAGE_CONFIGS[item.dealStage]?.weight || 0 : 0;
                  const weightedVal = (item.dealAmount || item.estimatedValue) * dealWeight;

                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: '1px solid #F0E6D8', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6EF')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Customer Info */}
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: 800, color: COLORS.textDark }}>{item.customerName}</div>
                        <div style={{ fontSize: '11px', color: COLORS.goldDark }}>🏢 {item.company}</div>
                        <div style={{ fontSize: '10.5px', color: '#666' }}>👤 Rep: {item.assignedTo}</div>
                      </td>

                      {/* 1. Lead Status */}
                      <td style={{ padding: '14px 8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor:
                              item.leadStatus === 'QUALIFIED'
                                ? 'rgba(46, 139, 87, 0.15)'
                                : item.leadStatus === 'UNQUALIFIED'
                                ? 'rgba(224, 80, 80, 0.15)'
                                : 'rgba(215, 171, 106, 0.2)',
                            color:
                              item.leadStatus === 'QUALIFIED'
                                ? '#2E8B57'
                                : item.leadStatus === 'UNQUALIFIED'
                                ? '#E05050'
                                : COLORS.textDark,
                          }}
                        >
                          {item.leadStatus}
                        </span>
                      </td>

                      {/* 2. Deal Stage */}
                      <td style={{ padding: '14px 8px' }}>
                        {item.dealStage ? (
                          <div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor:
                                  item.dealStage === 'CLOSED_WON'
                                    ? 'rgba(46, 139, 87, 0.2)'
                                    : item.dealStage === 'NEGOTIATION'
                                    ? 'rgba(215, 171, 106, 0.25)'
                                    : 'rgba(59, 130, 246, 0.15)',
                                color:
                                  item.dealStage === 'CLOSED_WON'
                                    ? '#2E8B57'
                                    : item.dealStage === 'NEGOTIATION'
                                    ? COLORS.textDark
                                    : '#2563EB',
                              }}
                            >
                              {item.dealStage} ({dealWeight * 100}%)
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>Pending Lead Qual</span>
                        )}
                      </td>

                      {/* 3. Order Status */}
                      <td style={{ padding: '14px 8px' }}>
                        {item.orderStatus ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor:
                                item.orderStatus === 'FULFILLED'
                                  ? 'rgba(46, 139, 87, 0.15)'
                                  : 'rgba(215, 171, 106, 0.18)',
                              color: item.orderStatus === 'FULFILLED' ? '#2E8B57' : COLORS.textDark,
                            }}
                          >
                            📦 {item.orderStatus}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>

                      {/* 4. Post-Sale Feedback */}
                      <td style={{ padding: '14px 8px' }}>
                        {item.feedbackStatus ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor:
                                item.feedbackStatus === 'SATISFIED'
                                  ? 'rgba(46, 139, 87, 0.15)'
                                  : 'rgba(224, 80, 80, 0.15)',
                              color: item.feedbackStatus === 'SATISFIED' ? '#2E8B57' : '#E05050',
                            }}
                          >
                            {item.feedbackStatus === 'SATISFIED' ? '⭐ SATISFIED (5★)' : '⚠️ ESCALATED (Urgent)'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>

                      {/* Forecast Value */}
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: COLORS.textDark }}>
                          {formatINR(weightedVal)}
                        </div>
                        <div style={{ fontSize: '10.5px', color: COLORS.textMuted }}>
                          Gross: {formatINR(item.dealAmount || item.estimatedValue)}
                        </div>
                      </td>

                      {/* Actions / State Machine Transition Button */}
                      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Automated Next Step Transition Helpers */}
                          {item.leadStatus === 'NEW' && (
                            <button
                              onClick={() => handleAdvanceState(item, 'Lead', 'CONTACTED')}
                              style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.goldAccent, color: COLORS.textDark }}
                            >
                              📞 Contact
                            </button>
                          )}

                          {item.leadStatus === 'CONTACTED' && (
                            <button
                              onClick={() => handleAdvanceState(item, 'Lead', 'QUALIFIED')}
                              style={{ ...themeStyles.btnSmall, backgroundColor: '#2E8B57', color: '#FFF', fontWeight: 800 }}
                              title="Confirm budget & authority: Auto-creates Deal in DISCOVERY"
                            >
                              ⚡ Qualify ➔ Deal
                            </button>
                          )}

                          {item.dealStage === 'DISCOVERY' && (
                            <button
                              onClick={() => handleAdvanceState(item, 'Deal', 'PROPOSAL')}
                              style={{ ...themeStyles.btnSmall, backgroundColor: '#2563EB', color: '#FFF', fontWeight: 800 }}
                              title="Move to 50% Proposal: Auto-creates Quotation draft"
                            >
                              ⚡ Design ➔ Proposal
                            </button>
                          )}

                          {item.dealStage === 'PROPOSAL' && (
                            <button
                              onClick={() => handleAdvanceState(item, 'Deal', 'NEGOTIATION')}
                              style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.goldAccent, color: COLORS.textDark, fontWeight: 800 }}
                            >
                              🤝 Negotiate (80%)
                            </button>
                          )}

                          {item.dealStage === 'NEGOTIATION' && (
                            <button
                              onClick={() => handleAdvanceState(item, 'Deal', 'CLOSED_WON')}
                              style={{ ...themeStyles.btnSmall, backgroundColor: '#2E8B57', color: '#FFF', fontWeight: 800 }}
                              title="Close Deal: Auto-triggers internal Sales Order (SO_GENERATED)"
                            >
                              🎉 Close Won (100%)
                            </button>
                          )}

                          {item.orderStatus === 'SO_GENERATED' && (
                            <button
                              onClick={() => handleAdvanceState(item, 'Order', 'FULFILLED')}
                              style={{ ...themeStyles.btnSmall, backgroundColor: '#2E8B57', color: '#FFF' }}
                              title="Mark fulfilled: Triggers Invoice & schedules 7-day feedback survey"
                            >
                              📦 Deliver &amp; Survey
                            </button>
                          )}

                          {item.orderStatus === 'FULFILLED' && !item.feedbackStatus && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => handleAdvanceState(item, 'Feedback', 'SATISFIED')}
                                style={{ ...themeStyles.btnSmall, backgroundColor: '#2E8B57', color: '#FFF' }}
                                title="Client gave 5-star rating: Trigger referral engine"
                              >
                                ⭐ 5★
                              </button>
                              <button
                                onClick={() => handleAdvanceState(item, 'Feedback', 'ESCALATED')}
                                style={{ ...themeStyles.btnSmall, backgroundColor: '#E05050', color: '#FFF' }}
                                title="Client reported issue: Escalate to manager"
                              >
                                ⚠️ 1★
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => setSelectedItem(item)}
                            style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}` }}
                          >
                            📜 History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= WEIGHTED REVENUE FORECASTING MATRIX ================= */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {(['DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'] as DealForecastStage[]).map((st) => {
            const config = STAGE_CONFIGS[st];
            const matching = lifecycleItems.filter((x) => x.dealStage === st);
            const gross = matching.reduce((sum, x) => sum + (x.dealAmount || x.estimatedValue || 0), 0);
            const weighted = gross * config.weight;

            return (
              <div key={st} style={{ ...themeStyles.panel, padding: '20px', borderLeft: `5px solid ${st === 'CLOSED_WON' ? '#2E8B57' : st === 'NEGOTIATION' ? COLORS.goldAccent : '#2563EB'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: COLORS.textDark, margin: 0 }}>
                    {config.label} Stage
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: COLORS.goldDark, backgroundColor: 'rgba(215, 171, 106, 0.25)', padding: '3px 8px', borderRadius: '6px' }}>
                    {config.weight * 100}% Weight
                  </span>
                </div>

                <p style={{ fontSize: '11.5px', color: '#555', margin: '0 0 14px 0', minHeight: '32px' }}>
                  {config.description}
                </p>

                <div style={{ backgroundColor: '#FAF6EF', borderRadius: '8px', padding: '12px', marginBottom: '14px', border: `1px solid ${COLORS.borderGoldLight}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                    <span>Active Opportunities:</span>
                    <strong>{matching.length} Deals</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                    <span>Gross Pipeline:</span>
                    <strong>{formatINR(gross)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 800, color: COLORS.textDark, borderTop: '1px solid #DDD', paddingTop: '6px', marginTop: '6px' }}>
                    <span>Forecasted Inflow:</span>
                    <span>{formatINR(weighted)}</span>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: COLORS.goldDark, fontWeight: 700, backgroundColor: 'rgba(215, 171, 106, 0.12)', padding: '6px 10px', borderRadius: '6px' }}>
                  {config.triggerAction}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL & AUDIT HISTORY MODAL */}
      {selectedItem && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          title={`End-to-End Lifecycle Audit: ${selectedItem.customerName} (${selectedItem.company})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#FAF6EF', padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.borderGoldLight}` }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#666' }}>CUSTOMER / ENTITY</div>
                <strong style={{ fontSize: '13px', color: COLORS.textDark }}>{selectedItem.customerName}</strong>
                <div style={{ fontSize: '11.5px', color: COLORS.goldDark }}>{selectedItem.company}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#666' }}>GROSS / WEIGHTED VALUE</div>
                <strong style={{ fontSize: '14px', color: COLORS.textDark }}>
                  {formatINR(selectedItem.dealAmount || selectedItem.estimatedValue)}
                </strong>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  Weight: {((STAGE_CONFIGS[selectedItem.dealStage || 'DISCOVERY']?.weight || 0) * 100)}%
                </div>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: COLORS.textDark, textTransform: 'uppercase', marginBottom: '10px' }}>
                📜 State Machine Audit Trail &amp; Trigger Log
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedItem.history.map((h, idx) => (
                  <div key={idx} style={{ borderLeft: `3px solid ${COLORS.goldAccent}`, paddingLeft: '12px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '2px' }}>
                      <span>🏷️ {h.module} Module: <strong>{h.from} ➔ {h.to}</strong></span>
                      <span>{h.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.textDark, fontWeight: 600 }}>
                      {h.triggerNote}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={() => setSelectedItem(null)} style={themeStyles.btnPrimary}>
                Close Audit
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE NEW LIFECYCLE PROSPECT MODAL */}
      {isNewModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewModalOpen(false)}
          title="Add Prospect into Sales Lifecycle Engine"
        >
          <form onSubmit={handleCreateNewProspect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={themeStyles.fieldLabel}>PROSPECT CONTACT NAME *</label>
                <input
                  style={themeStyles.fieldInput}
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                />
              </div>
              <div>
                <label style={themeStyles.fieldLabel}>ORGANIZATION / COMPANY *</label>
                <input
                  style={themeStyles.fieldInput}
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Delta Logistics Ltd"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={themeStyles.fieldLabel}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  style={themeStyles.fieldInput}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ramesh@deltalogistics.in"
                />
              </div>
              <div>
                <label style={themeStyles.fieldLabel}>PHONE NUMBER</label>
                <input
                  style={themeStyles.fieldInput}
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98000 12345"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={themeStyles.fieldLabel}>ESTIMATED DEAL VALUE (₹ INR)</label>
                <input
                  type="number"
                  style={themeStyles.fieldInput}
                  value={newVal}
                  onChange={(e) => setNewVal(Number(e.target.value))}
                />
              </div>
              <div>
                <label style={themeStyles.fieldLabel}>ASSIGNED SALES REP</label>
                <input
                  style={themeStyles.fieldInput}
                  value={newAssigned}
                  onChange={(e) => setNewAssigned(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                style={{ ...themeStyles.btnSecondary, color: COLORS.textDark }}
              >
                Cancel
              </button>
              <button type="submit" style={themeStyles.btnPrimary}>
                Initialize Prospect in NEW Stage
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
