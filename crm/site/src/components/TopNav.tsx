import React from 'react';
import { COLORS } from '../styles/theme';
import { UserAccount } from '../types/crm';

export type CRMTab = 
  | 'dashboard'
  | 'accounts'
  | 'leads'
  | 'quotes'
  | 'deals'
  | 'forecast'
  | 'tasks'
  | 'email'
  | 'reports'
  | 'team';

interface TopNavProps {
  activeTab: CRMTab;
  onTabChange: (tab: CRMTab) => void;
  onOpenPublicForm: () => void;
  users: UserAccount[];
  currentUser: UserAccount | null;
  onUserChange: (user: UserAccount) => void;
  unreadEmailCount?: number;
  pendingTasksCount?: number;
  quotesCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onOpenPublicForm,
  users,
  currentUser,
  onUserChange,
  unreadEmailCount = 0,
  pendingTasksCount = 0,
  quotesCount = 0,
}) => {
  const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Admin';

  const ALL_TABS: { id: CRMTab; label: string; icon: string; badge?: number; managerOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'accounts', label: 'Accounts & Contacts', icon: '🏢' },
    { id: 'leads', label: 'Leads', icon: '🎯' },
    { id: 'quotes', label: 'Quotations', icon: '📜', badge: quotesCount },
    { id: 'deals', label: 'Deals & Pipeline', icon: '💼' },
    { id: 'forecast', label: 'Forecast & Lifecycle', icon: '🔮' },
    { id: 'tasks', label: 'Tasks & Follow-ups', icon: '⏰', badge: pendingTasksCount },
    { id: 'email', label: 'Email Center', icon: '✉️', badge: unreadEmailCount },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'team', label: 'Team Members', icon: '👥', managerOnly: true }, // ONLY MANAGER/ADMIN SEES THIS
  ];

  // Filter tabs so Employees NEVER see Team tab
  const visibleTabs = ALL_TABS.filter((t) => !t.managerOnly || isManager);

  return (
    <header style={{ backgroundColor: 'rgba(26, 9, 22, 0.98)', borderBottom: `1px solid ${COLORS.borderWine}`, position: 'sticky', top: 0, zIndex: 900 }}>
      {/* Top Brand Bar */}
      <div style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(215, 171, 106, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: COLORS.goldAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: COLORS.textDark, boxShadow: '0 2px 8px rgba(215,171,106,0.3)' }}>
            K
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: COLORS.goldAccent, letterSpacing: '1px' }}>
                KwOrKs CRM
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 800, backgroundColor: isManager ? 'rgba(215,171,106,0.2)' : 'rgba(59,130,246,0.2)', color: isManager ? COLORS.goldAccent : '#60A5FA', border: `1px solid ${isManager ? COLORS.borderGold : '#3B82F6'}`, padding: '2px 8px', borderRadius: '6px' }}>
                {isManager ? '👑 MANAGER VIEW (FULL ACCESS & TEAM MANAGEMENT)' : `👤 EMPLOYEE VIEW (${currentUser?.name}'s DATA ONLY)`}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#E5D4B8' }}>
              Enterprise Workforce &amp; Sales Lifecycle Engine
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Public Web Form Simulator Trigger */}
          <button
            onClick={onOpenPublicForm}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: `1px solid ${COLORS.goldAccent}`,
              backgroundColor: 'rgba(215, 171, 106, 0.15)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Simulate a customer submitting a public contact form to trigger lead creation and automated welcome email"
          >
            <span>🌐</span> Test Web Lead Form
          </button>

          {/* Active Account Persona Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '5px 12px', borderRadius: '8px', border: `1px solid ${isManager ? COLORS.goldAccent : '#3B82F6'}` }}>
            <span style={{ fontSize: '14px' }}>{isManager ? '👑' : '👤'}</span>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: COLORS.goldAccent, textTransform: 'uppercase' }}>
                ACTIVE PERSONA:
              </div>
              <select
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const found = users.find((u) => u.id === e.target.value);
                  if (found) onUserChange(found);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} style={{ backgroundColor: '#250B20', color: '#FFF' }}>
                    {u.name} ({u.role === 'Manager' ? '👑 Manager' : u.role === 'Admin' ? '⚡ Admin' : '👤 Employee'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav style={{ padding: '4px 24px', display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto' }}>
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? `3px solid ${COLORS.goldAccent}` : '3px solid transparent',
                backgroundColor: isActive ? 'rgba(215, 171, 106, 0.12)' : 'transparent',
                color: isActive ? COLORS.goldAccent : '#E5D4B8',
                fontWeight: isActive ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 ? (
                <span
                  style={{
                    backgroundColor: isActive ? COLORS.goldAccent : '#E05050',
                    color: isActive ? COLORS.textDark : '#FFFFFF',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    lineHeight: 1,
                  }}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
