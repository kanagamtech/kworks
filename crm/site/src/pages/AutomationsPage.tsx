import React, { useState } from 'react';
import { AutomationRule, AutomationLog, EmailTemplate } from '../types/crm';
import { COLORS, themeStyles } from '../styles/theme';
import { Modal } from '../components/Modal';

interface AutomationsPageProps {
  rules: AutomationRule[];
  logs: AutomationLog[];
  templates: EmailTemplate[];
  onToggleRule: (id: string, isActive: boolean) => Promise<void>;
  onTriggerRule: (event: string, payload: any) => Promise<void>;
  onAddTemplate: (tpl: Partial<EmailTemplate>) => Promise<void>;
}

export const AutomationsPage: React.FC<AutomationsPageProps> = ({
  rules,
  logs,
  templates,
  onToggleRule,
  onTriggerRule,
  onAddTemplate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'workflows' | 'logs' | 'templates'>('workflows');
  const [selectedLog, setSelectedLog] = useState<AutomationLog | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Template Form
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState<EmailTemplate['category']>('General');
  const [tplSubject, setTplSubject] = useState('');
  const [tplBody, setTplBody] = useState('');

  const handleTestTrigger = async (rule: AutomationRule) => {
    let mockPayload = {};
    if (rule.triggerEvent === 'LEAD_CREATED' || rule.triggerEvent === 'WEBSITE_FORM_SUBMITTED' || rule.triggerEvent === 'NO_RESPONSE_3_DAYS') {
      mockPayload = {
        name: 'Karthik Subramanian',
        company: 'Zenith Tech Systems',
        email: 'karthik@zenithtech.in',
        assignedTo: 'Rajesh Raman',
        source: 'Website Form',
      };
    } else if (rule.triggerEvent === 'DEAL_CREATED' || rule.triggerEvent === 'DEAL_WON') {
      mockPayload = {
        title: 'Apex Fleet Attendance Rollout',
        customerName: 'Priya Sharma',
        customerEmail: 'priya.sharma@apexlogistics.io',
        company: 'Apex Global Logistics',
        amount: 28000,
        salesperson: 'Rajesh Raman',
      };
    } else if (rule.triggerEvent === 'TASK_DUE_TOMORROW') {
      mockPayload = {
        title: 'Send Revised Commercial Quotation',
        assignedTo: 'Ananya Iyer',
        assignedToEmail: 'ananya@kworks.com',
        dueDate: 'Tomorrow',
      };
    }

    await onTriggerRule(rule.triggerEvent, mockPayload);
  };

  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName || !tplSubject || !tplBody) return;

    await onAddTemplate({
      name: tplName,
      category: tplCategory,
      subject: tplSubject,
      body: tplBody,
      variables: ['name', 'company', 'deal_amount', 'salesperson'],
    });

    setTplName('');
    setTplSubject('');
    setTplBody('');
    setIsTemplateModalOpen(false);
  };

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>⚡</span> Automated Workflows &amp; Trigger Engine
          </h1>
          <div style={themeStyles.pageSubtitle}>
            Zero-touch automated email dispatches, lead ingestions, deal milestone alerts, and inactivity sequences
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveSubTab('workflows')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeSubTab === 'workflows' ? `2px solid ${COLORS.goldAccent}` : '1px solid #CCC',
              backgroundColor: activeSubTab === 'workflows' ? COLORS.goldAccent : 'transparent',
              color: activeSubTab === 'workflows' ? COLORS.textDark : '#FFF',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
            }}
          >
            ⚡ Active Workflows ({rules.length})
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeSubTab === 'logs' ? `2px solid ${COLORS.goldAccent}` : '1px solid #CCC',
              backgroundColor: activeSubTab === 'logs' ? COLORS.goldAccent : 'transparent',
              color: activeSubTab === 'logs' ? COLORS.textDark : '#FFF',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
            }}
          >
            📋 Execution Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('templates')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeSubTab === 'templates' ? `2px solid ${COLORS.goldAccent}` : '1px solid #CCC',
              backgroundColor: activeSubTab === 'templates' ? COLORS.goldAccent : 'transparent',
              color: activeSubTab === 'templates' ? COLORS.textDark : '#FFF',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
            }}
          >
            📄 Email Templates ({templates.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: WORKFLOWS */}
      {activeSubTab === 'workflows' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
          {rules.map((rule) => {
            const tpl = templates.find((t) => t.id === rule.templateId);

            return (
              <div
                key={rule.id}
                style={{
                  backgroundColor: rule.isActive ? '#FFFFFF' : '#F7F7F7',
                  border: rule.isActive ? `2px solid ${COLORS.goldAccent}` : '1px solid #DDD',
                  borderRadius: '14px',
                  padding: '18px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: rule.isActive ? 1 : 0.7,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, color: COLORS.goldDark, textTransform: 'uppercase' }}>
                        TRIGGER: {rule.triggerEvent}
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: COLORS.textDark, marginTop: '2px' }}>
                        {rule.name}
                      </h3>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={(e) => onToggleRule(rule.id, e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: rule.isActive ? '#2E8B57' : '#888' }}>
                        {rule.isActive ? 'ACTIVE' : 'OFF'}
                      </span>
                    </label>
                  </div>

                  <div style={{ backgroundColor: COLORS.cardChampagne, border: `1px solid ${COLORS.borderGold}`, borderRadius: '8px', padding: '10px 12px', margin: '10px 0', fontSize: '12px' }}>
                    <div><strong>Action:</strong> {rule.actionType}</div>
                    {tpl && <div><strong>Template:</strong> [{tpl.category}] {tpl.name}</div>}
                    <div style={{ marginTop: '4px', color: '#444', fontStyle: 'italic' }}>
                      "{rule.emailSubject || (tpl ? tpl.subject : 'Automatic notification')}"
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#777', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Executions: <strong>{rule.executionsCount} times</strong></span>
                    <span>Last run: {rule.lastExecutedAt ? new Date(rule.lastExecutedAt).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>

                <div style={{ marginTop: '16px', borderTop: `1px solid ${COLORS.borderGoldLight}`, paddingTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleTestTrigger(rule)}
                    style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}`, flex: 1 }}
                    title="Simulate event and execute this automation workflow"
                  >
                    ⚡ Test Trigger Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 2: LOGS */}
      {activeSubTab === 'logs' && (
        <div style={themeStyles.panel}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.goldDark, marginBottom: '14px', textTransform: 'uppercase' }}>
            AUTOMATION EXECUTION AUDIT TRAIL ({logs.length})
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={themeStyles.table}>
              <thead>
                <tr>
                  <th style={themeStyles.th}>Timestamp</th>
                  <th style={themeStyles.th}>Rule Name</th>
                  <th style={themeStyles.th}>Event Trigger</th>
                  <th style={themeStyles.th}>Target Entity / Email</th>
                  <th style={themeStyles.th}>Status</th>
                  <th style={themeStyles.th}>Result Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: COLORS.textMuted, fontStyle: 'italic' }}>
                      No automation logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={themeStyles.td}>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: COLORS.textDark }}>
                          {new Date(log.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div style={{ fontSize: '10.5px', color: COLORS.textMuted }}>
                          {new Date(log.executedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={themeStyles.td}>
                        <strong>{log.ruleName}</strong>
                      </td>
                      <td style={themeStyles.td}>
                        <span style={{ fontSize: '11px', backgroundColor: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {log.triggerEvent}
                        </span>
                      </td>
                      <td style={themeStyles.td}>
                        <div>{log.targetName}</div>
                        <div style={{ fontSize: '11px', color: COLORS.goldDark }}>{log.targetEmail || 'System'}</div>
                      </td>
                      <td style={themeStyles.td}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: log.status === 'Success' ? 'rgba(46, 139, 87, 0.15)' : 'rgba(224, 80, 80, 0.15)',
                            color: log.status === 'Success' ? '#2E8B57' : '#E05050',
                          }}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td style={{ ...themeStyles.td, fontSize: '12px', color: '#444' }}>
                        {log.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: TEMPLATES */}
      {activeSubTab === 'templates' && (
        <div style={themeStyles.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: COLORS.goldDark, textTransform: 'uppercase' }}>
              PRE-CONFIGURED SYSTEM TEMPLATES ({templates.length})
            </span>
            <button onClick={() => setIsTemplateModalOpen(true)} style={themeStyles.btnPrimary}>
              + Create Template
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  backgroundColor: COLORS.cardChampagne,
                  border: `1px solid ${COLORS.borderGold}`,
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '14px', color: COLORS.textDark }}>{tpl.name}</strong>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, backgroundColor: 'rgba(215, 171, 106, 0.25)', color: COLORS.goldDark, padding: '2px 6px', borderRadius: '4px' }}>
                    {tpl.category}
                  </span>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.textDark, marginBottom: '8px' }}>
                  Subject: {tpl.subject}
                </div>

                <div style={{ fontSize: '11.5px', color: '#555', backgroundColor: '#FFFFFF', border: `1px solid ${COLORS.borderGoldLight}`, borderRadius: '6px', padding: '8px', maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-line' }}>
                  {tpl.body}
                </div>

                <div style={{ fontSize: '10.5px', color: COLORS.goldDark, marginTop: '8px' }}>
                  Variables: {tpl.variables?.map((v) => `{{${v}}}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="📄 Create Email Template"
        subtitle="Create reusable templates with variable interpolation (e.g. {{name}}, {{company}}, {{deal_amount}})"
      >
        <form onSubmit={handleCreateTemplateSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>TEMPLATE NAME *</label>
              <input
                style={themeStyles.fieldInput}
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="e.g. Executive Follow-up"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>CATEGORY</label>
              <select
                style={themeStyles.fieldSelect}
                value={tplCategory}
                onChange={(e) => setTplCategory(e.target.value as any)}
              >
                <option value="Welcome">Welcome Email</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Quotation">Quotation</option>
                <option value="Payment Reminder">Payment Reminder</option>
                <option value="Thank You">Thank You</option>
                <option value="Meeting Confirmation">Meeting Confirmation</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>SUBJECT LINE *</label>
            <input
              style={themeStyles.fieldInput}
              value={tplSubject}
              onChange={(e) => setTplSubject(e.target.value)}
              placeholder="e.g. Quick check-in regarding {{company}}"
              required
            />
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>BODY TEXT (SUPPORTS VARIABLES) *</label>
            <textarea
              style={{ ...themeStyles.fieldTextarea, minHeight: '140px' }}
              value={tplBody}
              onChange={(e) => setTplBody(e.target.value)}
              placeholder="Hi {{name}},&#10;&#10;Thank you for reaching out..."
              required
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(false)}
              style={{ ...themeStyles.btnSecondary, color: COLORS.textDark, borderColor: COLORS.borderGold, flex: 1 }}
            >
              Cancel
            </button>
            <button type="submit" style={{ ...themeStyles.btnPrimary, flex: 2 }}>
              Save Email Template
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
