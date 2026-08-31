import React from 'react';
import { StatCard } from '../components/StatCard';
import { COLORS, themeStyles, formatINR } from '../styles/theme';
import { DashboardMetrics, Deal, Lead, Task, Email } from '../types/crm';
import { CRMTab } from '../components/TopNav';

interface DashboardPageProps {
  metrics: DashboardMetrics | null;
  todayTasks: Task[];
  recentLeads: Lead[];
  recentDeals: Deal[];
  recentEmails: Email[];
  onNavigateTab: (tab: CRMTab) => void;
  onOpenNewLead: () => void;
  onOpenNewDeal: () => void;
  onOpenNewTask: () => void;
  onOpenComposeEmail: () => void;
  onCompleteTask: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  todayTasks,
  recentLeads,
  recentDeals,
  recentEmails,
  onNavigateTab,
  onOpenNewLead,
  onOpenNewDeal,
  onOpenNewTask,
  onOpenComposeEmail,
  onCompleteTask,
}) => {
  const formatCurrency = (val?: number) => {
    return formatINR(val);
  };

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header with Quick Actions */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>📊</span> Executive CRM Dashboard
          </h1>
          <div style={themeStyles.pageSubtitle}>
            Live sales pipeline summary, urgent follow-ups, lead velocity &amp; deal forecasts
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={onOpenNewLead} style={themeStyles.btnPrimary}>
            <span>+</span> New Lead
          </button>
          <button onClick={onOpenNewDeal} style={{ ...themeStyles.btnPrimary, backgroundColor: '#FFFFFF', color: COLORS.textDark }}>
            <span>💼</span> New Deal
          </button>
          <button onClick={onOpenComposeEmail} style={{ ...themeStyles.btnSecondary, backgroundColor: 'rgba(215,171,106,0.15)' }}>
            <span>✉️</span> Compose Email
          </button>
          <button onClick={onOpenNewTask} style={themeStyles.btnSecondary}>
            <span>⏰</span> Add Task
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={themeStyles.statsGrid}>
        <StatCard
          title="Revenue Generated"
          value={formatCurrency(metrics?.totalRevenue)}
          subtext="Closed Won deals"
          icon="💰"
          trend="+28% MoM"
          trendPositive={true}
          highlight={true}
          onClick={() => onNavigateTab('deals')}
        />
        <StatCard
          title="Active Pipeline Value"
          value={formatCurrency(metrics?.pipelineValue)}
          subtext={`${metrics?.openDealsCount || 0} open deals in flight`}
          icon="📈"
          trend="82% health"
          trendPositive={true}
          onClick={() => onNavigateTab('deals')}
        />
        <StatCard
          title="New Inbound Leads"
          value={metrics?.newLeadsCount || 0}
          subtext={`Out of ${metrics?.totalLeads || 0} total leads`}
          icon="🎯"
          trend="Ready to qualify"
          trendPositive={true}
          onClick={() => onNavigateTab('leads')}
        />
        <StatCard
          title="Today's Tasks & Follow-ups"
          value={todayTasks.length}
          subtext={`${metrics?.pendingFollowupsCount || 0} pending follow-ups`}
          icon="⏰"
          trend={todayTasks.length > 0 ? 'Urgent' : 'All clear'}
          trendPositive={todayTasks.length === 0}
          onClick={() => onNavigateTab('tasks')}
        />
        <StatCard
          title="Sales Win Rate"
          value={`${metrics?.winRate || 75}%`}
          subtext="Closed deals conversion"
          icon="🏆"
          trend="High efficiency"
          trendPositive={true}
          onClick={() => onNavigateTab('reports')}
        />
      </div>

      {/* Two Column Layout: Today's Tasks vs Recent Deals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Today's Tasks & Follow-ups */}
        <div style={themeStyles.panel}>
          <div style={themeStyles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>⏰</span>
              <span style={themeStyles.panelTitle}>Today's Tasks &amp; Scheduled Follow-ups</span>
            </div>
            <button
              onClick={() => onNavigateTab('tasks')}
              style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}` }}
            >
              View All ({metrics?.todayTasksCount || 0})
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: COLORS.textMuted, fontStyle: 'italic' }}>
              🎉 All clear! No pending tasks due today.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: COLORS.cardChampagne,
                    border: `1px solid ${COLORS.borderGold}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          backgroundColor: t.priority === 'High' ? '#E05050' : COLORS.goldAccent,
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {t.priority}
                      </span>
                      <strong style={{ fontSize: '13.5px', color: COLORS.textDark }}>{t.title}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                      Due {t.dueTime} &middot; Assigned to <strong>{t.assignedTo}</strong>
                      {t.relatedToName && ` · Related to ${t.relatedToType}: ${t.relatedToName}`}
                    </div>
                  </div>

                  <button
                    onClick={() => onCompleteTask(t.id)}
                    style={{
                      ...themeStyles.btnSmall,
                      backgroundColor: '#2E8B57',
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Mark as Completed"
                  >
                    ✓ Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Deals Pipeline Snapshot */}
        <div style={themeStyles.panel}>
          <div style={themeStyles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💼</span>
              <span style={themeStyles.panelTitle}>Open Deals Pipeline</span>
            </div>
            <button
              onClick={() => onNavigateTab('deals')}
              style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}` }}
            >
              Open Pipeline Board &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentDeals.slice(0, 4).map((d) => {
              const stageColors: Record<string, string> = {
                'Discovery': '#3B82F6',
                'Proposal': '#D7AB6A',
                'Negotiation': '#9333EA',
                'Closed Won': '#2E8B57',
                'Closed Lost': '#E05050',
              };
              const color = stageColors[d.stage] || COLORS.goldAccent;

              return (
                <div
                  key={d.id}
                  style={{
                    backgroundColor: COLORS.cardChampagne,
                    border: `1px solid ${COLORS.borderGold}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: COLORS.textDark }}>
                      {d.title}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '2px' }}>
                      {d.company || d.customerName} &middot; Close: {d.expectedCloseDate} &middot; Rep: {d.salesperson}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: COLORS.textDark }}>
                      {formatCurrency(d.amount)}
                    </div>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        backgroundColor: `${color}20`,
                        color: color,
                        border: `1px solid ${color}`,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'inline-block',
                        marginTop: '3px',
                      }}
                    >
                      {d.stage} ({d.probability}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Leads vs Recent Emails */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        {/* Fresh Inbound Leads */}
        <div style={themeStyles.panel}>
          <div style={themeStyles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🎯</span>
              <span style={themeStyles.panelTitle}>Fresh Inbound Leads</span>
            </div>
            <button
              onClick={() => onNavigateTab('leads')}
              style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}` }}
            >
              Manage Leads &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentLeads.slice(0, 4).map((l) => (
              <div
                key={l.id}
                style={{
                  backgroundColor: COLORS.cardChampagne,
                  border: `1px solid ${COLORS.borderGold}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: COLORS.textDark }}>
                    {l.name} <span style={{ color: COLORS.goldDark, fontSize: '12px' }}>({l.company})</span>
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '2px' }}>
                    {l.email} &middot; Source: <strong>{l.source}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: l.status === 'New' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(215, 171, 106, 0.2)',
                      color: l.status === 'New' ? '#2563EB' : COLORS.textDark,
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {l.status}
                  </span>
                  <div style={{ fontSize: '11.5px', color: COLORS.goldDark, fontWeight: 700, marginTop: '3px' }}>
                    Est: {formatCurrency(l.estimatedValue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Email Communications Stream */}
        <div style={themeStyles.panel}>
          <div style={themeStyles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>✉️</span>
              <span style={themeStyles.panelTitle}>Live Email Communications</span>
            </div>
            <button
              onClick={() => onNavigateTab('email')}
              style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}` }}
            >
              Open Email Inbox &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentEmails.slice(0, 4).map((e) => (
              <div
                key={e.id}
                style={{
                  backgroundColor: COLORS.cardChampagne,
                  border: `1px solid ${COLORS.borderGold}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px' }}>{e.direction === 'inbound' ? '📥' : '📤'}</span>
                    <strong style={{ fontSize: '13px', color: COLORS.textDark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.subject}
                    </strong>
                    {e.isAutomated && (
                      <span style={{ fontSize: '9.5px', fontWeight: 800, backgroundColor: 'rgba(215, 171, 106, 0.25)', color: COLORS.goldDark, padding: '1px 5px', borderRadius: '4px' }}>
                        AUTO
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11.5px', color: COLORS.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.direction === 'inbound' ? `From: ${e.fromName || e.from}` : `To: ${e.toName || e.to}`} &middot; {e.snippet}
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: COLORS.goldDark, whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {e.sentAt ? new Date(e.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
