import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types/crm';
import { COLORS, themeStyles, formatINR } from '../styles/theme';
import { Modal } from '../components/Modal';

interface AccountManagementPageProps {
  users: UserAccount[];
  currentUser: UserAccount | null;
  onAddUser: (user: Partial<UserAccount>) => Promise<void>;
  onUpdateUser: (id: string, updates: Partial<UserAccount>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const AccountManagementPage: React.FC<AccountManagementPageProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [title, setTitle] = useState('Sales Representative');
  const [department, setDepartment] = useState('Sales & Business Development');
  const [phone, setPhone] = useState('');
  const [monthlyQuota, setMonthlyQuota] = useState('500000');

  const isManagerOrAdmin = currentUser?.role === 'Manager' || currentUser?.role === 'Admin';

  if (!isManagerOrAdmin) {
    return (
      <div style={themeStyles.pageContainer}>
        <div style={{ ...themeStyles.panel, textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '40px auto' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: COLORS.textDark, marginBottom: '8px' }}>
            Manager Permission Required
          </h2>
          <p style={{ fontSize: '13.5px', color: COLORS.textMuted, lineHeight: '1.6' }}>
            Team Management and member account creation is restricted to <strong>Managers &amp; Administrators</strong>.
            As an Employee ({currentUser?.name}), your view is focused strictly on your assigned leads, deals, tasks, and communications.
          </p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.title.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    await onAddUser({
      name,
      email,
      role,
      title,
      department,
      phone,
      monthlyQuota: Number(monthlyQuota) || 500000,
      status: 'Active',
    });

    setName('');
    setEmail('');
    setPhone('');
    setIsModalOpen(false);
  };

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>👥</span> Team Members &amp; Role Management (Manager Only)
          </h1>
          <div style={themeStyles.pageSubtitle}>
            Configure role-based access control (Manager vs. Employee), monthly sales quotas in ₹ INR, and team assignments
          </div>
        </div>

        <button onClick={() => setIsModalOpen(true)} style={themeStyles.btnPrimary}>
          <span>+</span> Add Team Member
        </button>
      </div>

      {/* Role Explanation Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', border: `2px solid ${COLORS.goldAccent}`, borderRadius: '14px', padding: '16px', color: COLORS.textDark }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>👑</span>
            <strong style={{ fontSize: '14px', color: COLORS.goldDark, textTransform: 'uppercase' }}>
              Manager Account Capabilities
            </strong>
          </div>
          <p style={{ fontSize: '12.5px', color: '#444', lineHeight: '1.5' }}>
            • Global visibility across <strong>ALL accounts, leads, deals, tasks, and communications</strong>.<br />
            • Ability to reassign any lead or deal to any salesperson.<br />
            • Only Managers can add new team members and adjust monthly targets.
          </p>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${COLORS.borderGold}`, borderRadius: '14px', padding: '16px', color: COLORS.textDark }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>👤</span>
            <strong style={{ fontSize: '14px', color: '#2563EB', textTransform: 'uppercase' }}>
              Employee Account Sandbox
            </strong>
          </div>
          <p style={{ fontSize: '12.5px', color: '#444', lineHeight: '1.5' }}>
            • <strong>Scoped Privacy:</strong> Employees see ONLY the leads, contacts, deals, tasks, and emails that they have entered or are assigned to.<br />
            • The Team Management tab is completely hidden from Employee accounts.
          </p>
        </div>
      </div>

      {/* Search & Team Directory */}
      <div style={themeStyles.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ width: '320px' }}>
            <input
              style={{ ...themeStyles.fieldInput, padding: '8px 12px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members by name, role, email..."
            />
          </div>

          <span style={{ fontSize: '12.5px', fontWeight: 800, color: COLORS.goldDark }}>
            TOTAL REGISTERED ACCOUNTS: {filteredUsers.length}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={themeStyles.table}>
            <thead>
              <tr>
                <th style={themeStyles.th}>Team Member</th>
                <th style={themeStyles.th}>Role / Permission Level</th>
                <th style={themeStyles.th}>Job Title &amp; Department</th>
                <th style={themeStyles.th}>Contact Info</th>
                <th style={themeStyles.th}>Monthly Quota Target (₹)</th>
                <th style={themeStyles.th}>Status</th>
                <th style={{ ...themeStyles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                const isManager = u.role === 'Manager' || u.role === 'Admin';

                return (
                  <tr
                    key={u.id}
                    style={{
                      backgroundColor: isCurrent ? 'rgba(215, 171, 106, 0.1)' : 'transparent',
                      borderBottom: '1px solid #F0E6D8',
                    }}
                  >
                    <td style={themeStyles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '18px',
                            backgroundColor: isManager ? COLORS.goldAccent : '#3B82F6',
                            color: isManager ? COLORS.textDark : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '13px',
                          }}
                        >
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: COLORS.textDark, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {u.name}
                            {isCurrent && (
                              <span style={{ fontSize: '10px', backgroundColor: COLORS.goldAccent, color: COLORS.textDark, padding: '1px 6px', borderRadius: '4px' }}>
                                YOU
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td style={themeStyles.td}>
                      <select
                        value={u.role}
                        onChange={(e) => onUpdateUser(u.id, { role: e.target.value as UserRole })}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: isManager ? `1.5px solid ${COLORS.goldAccent}` : '1.5px solid #3B82F6',
                          backgroundColor: isManager ? 'rgba(215, 171, 106, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: isManager ? COLORS.textDark : '#1D4ED8',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Manager">👑 Manager (Full Global)</option>
                        <option value="Employee">👤 Employee (Own Data)</option>
                        <option value="Admin">⚡ Admin (Full System)</option>
                      </select>
                    </td>

                    <td style={themeStyles.td}>
                      <div style={{ fontWeight: 600, color: COLORS.textDark }}>{u.title}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{u.department}</div>
                    </td>

                    <td style={themeStyles.td}>
                      <div style={{ fontSize: '12px', color: '#444' }}>{u.phone || 'No phone'}</div>
                    </td>

                    <td style={themeStyles.td}>
                      <strong style={{ color: COLORS.textDark }}>
                        {u.monthlyQuota ? `${formatINR(u.monthlyQuota)} / mo` : '₹0'}
                      </strong>
                    </td>

                    <td style={themeStyles.td}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: u.status === 'Active' ? 'rgba(46, 139, 87, 0.15)' : 'rgba(224, 80, 80, 0.15)',
                          color: u.status === 'Active' ? '#2E8B57' : '#E05050',
                        }}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td style={{ ...themeStyles.td, textAlign: 'right' }}>
                      {users.length > 1 && !isCurrent && (
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          style={{
                            ...themeStyles.btnSmall,
                            backgroundColor: 'transparent',
                            color: '#E05050',
                            border: '1px solid #E05050',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Team Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="👥 Add New Team Member"
        subtitle="Create an employee profile and configure their access permissions"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>FULL NAME *</label>
              <input
                style={themeStyles.fieldInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>EMAIL ADDRESS (LOGIN) *</label>
              <input
                type="email"
                style={themeStyles.fieldInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@kworks.com"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>ROLE &amp; PERMISSIONS *</label>
              <select
                style={themeStyles.fieldSelect}
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="Employee">👤 Employee (Views Own Data Only)</option>
                <option value="Manager">👑 Manager (Full Global Visibility &amp; Assignment)</option>
                <option value="Admin">⚡ Admin (Full CRM Administrator)</option>
              </select>
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>PHONE NUMBER</label>
              <input
                style={themeStyles.fieldInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98400 99881"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>JOB TITLE</label>
              <input
                style={themeStyles.fieldInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enterprise Account Executive"
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>DEPARTMENT</label>
              <input
                style={themeStyles.fieldInput}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Enterprise Sales"
              />
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>MONTHLY SALES QUOTA TARGET (₹ INR)</label>
            <input
              type="number"
              style={themeStyles.fieldInput}
              value={monthlyQuota}
              onChange={(e) => setMonthlyQuota(e.target.value)}
              placeholder="500000"
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
              Add Team Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
