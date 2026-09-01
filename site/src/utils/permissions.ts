import type { UserRole } from '../context/AuthContext';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  manager: 'Manager',
  hr: 'HR Executive',
  it: 'IT Support',
  finance: 'Accounts Manager',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: 'Full system access including user management',
  admin: 'Full access to all management features',
  manager: 'Employee, attendance, leave, claims, and team management',
  hr: 'Attendance tracking, food count, leave approval',
  it: 'IT support tickets, app updates',
  finance: 'Accounts & claims approval, announcements, polls',
};

export const ALL_TABS = [
  { id: 'onboarding', label: 'EMPLOYEE ONBOARDING', icon: '👥' },
  { id: 'attendance', label: 'ATTENDANCE', icon: '📊' },
  { id: 'food', label: 'FOOD COUNT', icon: '🍽️' },
  { id: 'leaves', label: 'LEAVE APPROVAL', icon: '📝' },
  { id: 'notices', label: 'ANNOUNCEMENTS', icon: '📢' },
  { id: 'polls', label: 'POLLS', icon: '📋' },
  { id: 'tickets', label: 'IT SUPPORT', icon: '🎫' },
  { id: 'claims', label: 'CLAIMS & ADVANCES', icon: '💰' },
  { id: 'updates', label: 'APP UPDATES (OTA)', icon: '🚀' },
  { id: 'management_users', label: 'USER MANAGEMENT', icon: '👤' },
] as const;

export type TabId = typeof ALL_TABS[number]['id'];

export const TAB_PERMISSIONS: Record<TabId, string[]> = {
  onboarding: ['employees:create', 'employees:read', 'companies:read'],
  attendance: ['attendance:read'],
  food: ['food:read'],
  leaves: ['leaves:read'],
  notices: ['notices:read'],
  polls: ['polls:read'],
  tickets: ['tickets:read'],
  claims: ['claims:read'],
  updates: ['updates:read'],
  management_users: ['management_users:read'],
};

export const ROLE_TABS: Record<UserRole, TabId[]> = {
  super_admin: ALL_TABS.map(t => t.id),
  admin: ALL_TABS.map(t => t.id),
  manager: ['onboarding', 'attendance', 'food', 'leaves', 'notices', 'polls', 'tickets', 'claims', 'updates'],
  hr: ['attendance', 'food', 'leaves'],
  it: ['tickets', 'updates'],
  finance: ['claims', 'notices', 'polls'],
};

export function getTabsForRole(role: UserRole): TabId[] {
  return ROLE_TABS[role] || [];
}

export function getAllowedTabs(userRole: UserRole, hasPermission: (perm: string) => boolean): TabId[] {
  return ALL_TABS
    .filter(tab => {
      const perms = TAB_PERMISSIONS[tab.id];
      return perms.some(p => hasPermission(p));
    })
    .map(tab => tab.id);
}

export function getTabConfig(tabId: TabId) {
  return ALL_TABS.find(t => t.id === tabId);
}

export const DEFAULT_TABS: Record<UserRole, TabId> = {
  super_admin: 'onboarding',
  admin: 'onboarding',
  manager: 'onboarding',
  hr: 'attendance',
  it: 'tickets',
  finance: 'claims',
};