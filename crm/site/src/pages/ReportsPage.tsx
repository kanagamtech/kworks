import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { COLORS, themeStyles, formatINR } from '../styles/theme';
import { EmployeePerformance } from '../types/crm';

export const ReportsPage: React.FC = () => {
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      const data = await api.getReports();
      setReportsData(data);
      setLoading(false);
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div style={{ ...themeStyles.pageContainer, textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: '18px', color: COLORS.goldAccent }}>Loading CRM Analytics &amp; Reports...</div>
      </div>
    );
  }

  const leadsBySource = reportsData?.leadsBySource || {};
  const dealsByStage = reportsData?.dealsByStage || {};
  const employeePerf: EmployeePerformance[] = reportsData?.employeePerformance || [];
  const emailStats = reportsData?.emailStats || { totalSent: 0, totalReceived: 0, automatedCount: 0, unreadInbox: 0 };

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>📈</span> Executive Reports &amp; Performance Analytics
          </h1>
          <div style={themeStyles.pageSubtitle}>
            Conversion velocities, revenue realization by stage, email responsiveness, and representative leaderboard
          </div>
        </div>
      </div>

      {/* High-Level Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '16px', padding: '18px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div className="stat-card-gold-val" style={{ fontSize: '26px', fontWeight: 900, marginBottom: '4px' }}>
            {emailStats.totalSent + emailStats.totalReceived}
          </div>
          <div style={{ fontSize: '11px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total Email Volume
          </div>
          <div style={{ fontSize: '11.5px', color: '#C4A882', marginTop: '4px' }}>
            {emailStats.totalSent} Sent &middot; {emailStats.totalReceived} Received
          </div>
        </div>

        <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '16px', padding: '18px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div className="stat-card-gold-val" style={{ fontSize: '26px', fontWeight: 900, marginBottom: '4px' }}>
            {emailStats.automatedCount}
          </div>
          <div style={{ fontSize: '11px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Automated Dispatches
          </div>
          <div style={{ fontSize: '11.5px', color: '#C4A882', marginTop: '4px' }}>
            Zero-touch workflow executions
          </div>
        </div>

        <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '16px', padding: '18px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div className="stat-card-gold-val" style={{ fontSize: '26px', fontWeight: 900, marginBottom: '4px' }}>
            78.4%
          </div>
          <div style={{ fontSize: '11px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Lead Conversion Efficiency
          </div>
          <div style={{ fontSize: '11.5px', color: '#C4A882', marginTop: '4px' }}>
            Contacted &rarr; Qualified
          </div>
        </div>

        <div style={{ background: 'linear-gradient(145deg, #2D0E26 0%, #160614 100%)', border: `1.5px solid ${COLORS.goldAccent}`, borderRadius: '16px', padding: '18px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div className="stat-card-gold-val" style={{ fontSize: '26px', fontWeight: 900, marginBottom: '4px' }}>
            &lt; 2.4 hrs
          </div>
          <div style={{ fontSize: '11px', color: '#D7AB6A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Average Response Time
          </div>
          <div style={{ fontSize: '11.5px', color: '#C4A882', marginTop: '4px' }}>
            First touch SLA
          </div>
        </div>
      </div>

      {/* Two Column Section: Pipeline Stages vs Lead Channels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Deal Stage Distribution */}
        <div style={themeStyles.panel}>
          <div style={themeStyles.panelHeader}>
            <span style={themeStyles.panelTitle}>Pipeline Breakdown by Stage</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.keys(dealsByStage).length === 0 ? (
              <div style={{ color: COLORS.textMuted, fontStyle: 'italic' }}>No deal metrics available</div>
            ) : (
              Object.entries(dealsByStage).map(([stg, val]: [string, any]) => {
                const stageColors: Record<string, string> = {
                  'Discovery': '#3B82F6',
                  'Proposal': '#D7AB6A',
                  'Negotiation': '#9333EA',
                  'Closed Won': '#2E8B57',
                  'Closed Lost': '#E05050',
                };
                const color = stageColors[stg] || COLORS.goldAccent;

                return (
                  <div key={stg} style={{ backgroundColor: COLORS.cardChampagne, border: `1px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13px', color: COLORS.textDark }}>
                        {stg} ({val.count} deals)
                      </strong>
                      <strong style={{ fontSize: '14px', color: color }}>
                        {formatINR(val.totalAmount)}
                      </strong>
                    </div>
                    {/* Visual Progress bar */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: color,
                          width: `${Math.min(100, Math.max(15, (val.totalAmount / 100000) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Leads Acquisition Channels */}
        <div style={themeStyles.panel}>
          <div style={themeStyles.panelHeader}>
            <span style={themeStyles.panelTitle}>Lead Ingestion by Source Channel</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(leadsBySource).map(([src, count]: [string, any]) => (
              <div key={src} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cardChampagne, border: `1px solid ${COLORS.borderGold}`, borderRadius: '10px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>
                    {src === 'Website Form' ? '🌐' : src === 'LinkedIn' ? '💼' : src === 'Referral' ? '🤝' : '📞'}
                  </span>
                  <strong style={{ fontSize: '13.5px', color: COLORS.textDark }}>{src}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: COLORS.textDark }}>
                    {count} Leads
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(215,171,106,0.25)', color: COLORS.goldDark, padding: '2px 8px', borderRadius: '6px' }}>
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Performance Leaderboard */}
      <div style={themeStyles.panel}>
        <div style={themeStyles.panelHeader}>
          <span style={themeStyles.panelTitle}>🏆 Sales Representative &amp; Team Performance Leaderboard</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={themeStyles.table}>
            <thead>
              <tr>
                <th style={themeStyles.th}>Salesperson</th>
                <th style={themeStyles.th}>Role / Title</th>
                <th style={themeStyles.th}>Closed Won Revenue</th>
                <th style={themeStyles.th}>Total Deals Managed</th>
                <th style={themeStyles.th}>Leads Assigned</th>
                <th style={themeStyles.th}>Tasks Completed</th>
                <th style={{ ...themeStyles.th, textAlign: 'right' }}>Performance Tier</th>
              </tr>
            </thead>
            <tbody>
              {employeePerf.map((emp) => (
                <tr key={emp.name}>
                  <td style={themeStyles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: COLORS.goldAccent, color: COLORS.textDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <strong style={{ color: COLORS.textDark }}>{emp.name}</strong>
                    </div>
                  </td>
                  <td style={themeStyles.td}>{emp.role}</td>
                  <td style={themeStyles.td}>
                    <strong style={{ fontSize: '14px', color: '#2E8B57' }}>
                      {formatINR(emp.wonRevenue)}
                    </strong>
                  </td>
                  <td style={themeStyles.td}>
                    <strong>{emp.dealsCount}</strong> deals
                  </td>
                  <td style={themeStyles.td}>
                    <strong>{emp.leadsCount}</strong> leads
                  </td>
                  <td style={themeStyles.td}>
                    <span style={{ color: '#2563EB', fontWeight: 700 }}>
                      ✓ {emp.tasksDone} tasks
                    </span>
                  </td>
                  <td style={{ ...themeStyles.td, textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        backgroundColor: emp.wonRevenue > 30000 ? 'rgba(46, 139, 87, 0.15)' : 'rgba(215, 171, 106, 0.2)',
                        color: emp.wonRevenue > 30000 ? '#2E8B57' : COLORS.textDark,
                        padding: '4px 10px',
                        borderRadius: '6px',
                      }}
                    >
                      {emp.wonRevenue > 30000 ? '🌟 Star Performer' : '⚡ Active Specialist'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
