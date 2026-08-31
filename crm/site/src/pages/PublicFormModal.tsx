import React, { useState } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { COLORS, themeStyles } from '../styles/theme';

interface PublicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCaptured: (lead: { id: string; name: string; company: string; email: string; assignedTo: string } | null) => void;
}

export const PublicFormModal: React.FC<PublicFormModalProps> = ({
  isOpen,
  onClose,
  onLeadCaptured,
}) => {
  const [name, setName] = useState('Sarah Jenkins');
  const [email, setEmail] = useState('sarah.jenkins@lumina-energy.com');
  const [company, setCompany] = useState('Lumina Renewable Energy');
  const [phone, setPhone] = useState('+1 (555) 432-8899');
  const [budget, setBudget] = useState('35000');
  const [message, setMessage] = useState('We are exploring a biometric attendance system for 180 field engineers and would like a quote and interactive demo.');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    const result = await api.submitPublicLeadForm({
      name,
      email,
      company,
      phone,
      message,
      estimatedBudget: Number(budget) || 15000,
    });
    setLoading(false);

    if (result) {
      setSuccessResult(result);
      onLeadCaptured(result.data?.lead ? {
        id: result.data.lead.id,
        name: result.data.lead.name,
        company: result.data.lead.company,
        email: result.data.lead.email,
        assignedTo: result.data.lead.assignedTo
      } : null);
    }
  };

  const handleReset = () => {
    setSuccessResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🌐 Public Website Lead Capture Simulator"
      subtitle="Demonstrates external website form submission triggering CRM ingestion & Instant Welcome Email Automation"
      maxWidth="680px"
    >
      {successResult ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: COLORS.textDark, marginBottom: '8px' }}>
            Lead Captured &amp; Automation Fired!
          </h3>
          <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '20px' }}>
            The Webhook successfully processed the lead payload:
          </p>

          <div style={{ backgroundColor: COLORS.cardChampagne, border: `1px solid ${COLORS.borderGold}`, borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <strong style={{ color: COLORS.goldDark }}>Lead ID:</strong> {successResult.data?.lead?.id}
              </div>
              <div>
                <strong style={{ color: COLORS.goldDark }}>Lead Name:</strong> {successResult.data?.lead?.name}
              </div>
              <div>
                <strong style={{ color: COLORS.goldDark }}>Company:</strong> {successResult.data?.lead?.company}
              </div>
              <div>
                <strong style={{ color: COLORS.goldDark }}>Assigned Rep:</strong> {successResult.data?.lead?.assignedTo}
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${COLORS.borderGoldLight}` }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#2E8B57', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✅</span> AUTOMATION EXECUTED: Welcome Email Dispatched to {successResult.data?.lead?.email}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <span>📋</span> TASK CREATED: "{successResult.data?.task?.title}"
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            style={{ ...themeStyles.btnPrimary, width: '100%' }}
          >
            Done &amp; View in CRM
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ backgroundColor: 'rgba(215, 171, 106, 0.1)', border: `1px dashed ${COLORS.borderGold}`, borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '12.5px', color: COLORS.textDark, lineHeight: 1.4 }}>
            💡 <strong>How it works:</strong> Submitting this form mimics a prospect filling out a "Contact Sales" form on your website. The backend endpoint <code>/webhook/lead</code> will ingest the prospect into <strong>Leads</strong>, create an urgent follow-up <strong>Task</strong>, and trigger the <strong>New Lead Welcome Email</strong> rule.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>PROSPECT FULL NAME *</label>
              <input
                style={themeStyles.fieldInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>WORK EMAIL *</label>
              <input
                type="email"
                style={themeStyles.fieldInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. sarah@company.com"
                required
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
                placeholder="e.g. Lumina Energy"
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>PHONE NUMBER</label>
              <input
                style={themeStyles.fieldInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0192"
              />
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>ESTIMATED ANNUAL BUDGET (₹ INR)</label>
            <input
              type="number"
              style={themeStyles.fieldInput}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="1500000"
            />
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>PROJECT REQUIREMENTS / MESSAGE</label>
            <textarea
              style={themeStyles.fieldTextarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your requirements..."
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ ...themeStyles.btnSecondary, color: COLORS.textDark, borderColor: COLORS.borderGold, flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ ...themeStyles.btnPrimary, flex: 2 }}
            >
              {loading ? 'Submitting & Ingesting...' : '🚀 Submit Web Lead Form & Trigger Automation'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
