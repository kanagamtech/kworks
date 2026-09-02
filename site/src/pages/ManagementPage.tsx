import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

type Role = 'super_admin' | 'admin' | 'manager' | 'hr' | 'it' | 'finance';

const SITE_CREDS: Record<string, { email: string; pass: string }> = {
  super_admin: { email: 'superadmin@kworks.com', pass: 'SuperAdmin@2026!' },
  admin: { email: 'admin@kworks.com', pass: 'Admin@2026!' },
  manager: { email: 'manager@kworks.com', pass: 'Manager@2026!' },
  hr: { email: 'hr@kworks.com', pass: 'HR@2026!' },
  it: { email: 'itsupport@kworks.com', pass: 'ITSupport@2026!' },
  finance: { email: 'accounts@kworks.com', pass: 'Accounts@2026!' },
};

const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  hr: 'HR Executive',
  it: 'IT Support',
  finance: 'Accounts Manager',
};

const ROLE_COLORS: Record<Role, { bg: string; text: string; border: string }> = {
  super_admin: { bg: 'rgba(123, 31, 162, 0.12)', text: '#7B1FA2', border: '#7B1FA2' },
  admin: { bg: 'rgba(194, 24, 91, 0.12)', text: '#C2185B', border: '#C2185B' },
  manager: { bg: 'rgba(215, 171, 106, 0.22)', text: '#7A4F1D', border: '#D7AB6A' },
  hr: { bg: 'rgba(46, 125, 50, 0.12)', text: '#2E7D32', border: '#2E7D32' },
  it: { bg: 'rgba(2, 136, 209, 0.12)', text: '#0288D1', border: '#0288D1' },
  finance: { bg: 'rgba(230, 81, 0, 0.12)', text: '#E65100', border: '#E65100' },
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: 'Full unrestricted system access, database reset & all controls',
  admin: 'Full management: onboarding, attendance, food, leaves, notices, app updates & role management',
  manager: 'General management: employee onboarding, attendance, leaves, claims, notices & role assignment',
  hr: 'Human Resources: attendance logs & export, meal planning, leave approvals & notices',
  it: 'Technical support: IT helpdesk tickets, OTA updates broadcast & announcements',
  finance: 'Accounts approvals: reimbursement claims, cash advances & meal headcounts',
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  super_admin: ['users', 'onboarding', 'attendance', 'food', 'leaves', 'notices', 'polls', 'tickets', 'claims', 'updates'],
  admin: ['users', 'onboarding', 'attendance', 'food', 'leaves', 'notices', 'polls', 'tickets', 'claims', 'updates'],
  manager: ['users', 'onboarding', 'attendance', 'food', 'leaves', 'notices', 'polls', 'claims', 'updates'],
  hr: ['onboarding', 'attendance', 'food', 'leaves', 'notices', 'polls'],
  it: ['tickets', 'updates', 'notices'],
  finance: ['claims', 'food', 'notices'],
};

type TabId = 'users' | 'onboarding' | 'attendance' | 'food' | 'leaves' | 'notices' | 'polls' | 'tickets' | 'claims' | 'updates';

export const ManagementPage: React.FC = () => {
  // Auth State - Always starts as null so user must explicitly sign in
  const [role, setRole] = useState<Role | null>(null);
  const [loginRole, setLoginRole] = useState<Role>('manager');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabId>('onboarding');

  // Data States
  const [employees, setEmployees] = useState<any[]>([]);
  const [companies, setCompanies] = useState<string[]>(['kanagamtech', 'amsems']);
  const [empCompany, setEmpCompany] = useState('kanagamtech');
  const [newCompanyInput, setNewCompanyInput] = useState('');
  const [companyStatusMsg, setCompanyStatusMsg] = useState('');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [foodCounts, setFoodCounts] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<Record<string, any>>({});
  const [notices, setNotices] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [liveToast, setLiveToast] = useState<{ title: string; body: string; time: string; type?: string } | null>(null);
  const [appUpdate, setAppUpdate] = useState<any>(null);

  // App Update Broadcast Form State
  const [updateVersion, setUpdateVersion] = useState('1.0.1');
  const [updateTitle, setUpdateTitle] = useState('⚡ Biometric Scan & Shift Sync Upgrade');
  const [updateNotes, setUpdateNotes] = useState('• Faster face recognition & spectacles invariance\n• High-precision GPS drift reduction\n• Real-time shift duration notification');
  const [updateMandatory, setUpdateMandatory] = useState(false);
  const [updateApkUrl, setUpdateApkUrl] = useState('');
  const [updateStatusMsg, setUpdateStatusMsg] = useState('');
  const [isPublishingUpdate, setIsPublishingUpdate] = useState(false);

  // Onboarding Form & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPass, setEmpPass] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empPhoto, setEmpPhoto] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [createdEmpCreds, setCreatedEmpCreds] = useState<any | null>(null);

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeTeam, setNoticeTeam] = useState('ALL');

  // Poll Form State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpts, setPollOpts] = useState<string[]>(['', '']);
  const [selectedEmpEmail, setSelectedEmpEmail] = useState('');

  // Attendance Date and View Filter States (Not Absent / Present tracking)
  const [attendanceDate, setAttendanceDate] = useState<string>('');
  const [attendanceViewMode, setAttendanceViewMode] = useState<'present' | 'absent' | 'analytics' | 'logs'>('present');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceCompanyFilter, setAttendanceCompanyFilter] = useState('ALL');

  // Food Count Filter & Action States
  const [foodDate, setFoodDate] = useState<string>('');
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCompanyFilter, setFoodCompanyFilter] = useState('ALL');
  const [isUpdatingFood, setIsUpdatingFood] = useState(false);
  const [foodStatusMsg, setFoodStatusMsg] = useState('');

  // Management Users & Roles State
  const [mgmtUsers, setMgmtUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Role>('manager');
  const [editDept, setEditDept] = useState('');
  const [editPass, setEditPass] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userStatusMsg, setUserStatusMsg] = useState('');

  // Add New Management User State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('manager');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  const loadAllData = async () => {
    const [emps, atts, foods, lvs, nots, pls, tks, clms, cmps, upd, mUsers, notifs] = await Promise.all([
      api.getEmployees(),
      api.getAttendance(),
      api.getFoodCounts(),
      api.getLeaves(),
      api.getNotices(),
      api.getPolls(),
      api.getTickets(),
      api.getClaims(),
      api.getCompanies(),
      api.getAppUpdate(),
      api.getManagementUsers(),
      api.getNotifications(),
    ]);
    setEmployees(emps);
    setAttendance(atts);
    setFoodCounts(foods);
    setLeaves(lvs);
    setNotices(nots);
    setPolls(pls);
    setTickets(tks);
    setClaims(clms);
    if (Array.isArray(notifs)) {
      setNotifications((prev) => {
        if (prev.length > 0 && notifs.length > prev.length) {
          const newest = notifs[0];
          if (newest && (newest.type === 'shift_punch_out' || newest.type === 'attendance_check_in')) {
            setLiveToast({
              title: newest.title || 'Shift Update',
              body: newest.body || '',
              time: newest.time || new Date().toLocaleTimeString(),
              type: newest.type,
            });
            setTimeout(() => setLiveToast(null), 8000);
          }
        }
        return notifs;
      });
    }
    if (upd) setAppUpdate(upd);
    if (Array.isArray(mUsers)) setMgmtUsers(mUsers);
    if (Array.isArray(cmps) && cmps.length > 0) {
      setCompanies(cmps);
      if (!cmps.includes(empCompany)) {
        setEmpCompany(cmps[0]);
      }
    }
  };

  const handlePublishAppUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateVersion.trim()) {
      setUpdateStatusMsg('Please enter a version string (e.g. 1.0.1)');
      return;
    }
    setIsPublishingUpdate(true);
    setUpdateStatusMsg('');
    try {
      const res = await api.publishAppUpdate({
        version: updateVersion.trim(),
        title: updateTitle.trim(),
        notes: updateNotes.trim(),
        mandatory: updateMandatory,
        apkUrl: updateApkUrl.trim(),
      });
      if (res) {
        setAppUpdate(res);
        setUpdateStatusMsg(`✅ Success! Version ${res.version} broadcasted to all connected user devices.`);
        setTimeout(() => setUpdateStatusMsg(''), 6000);
      }
    } catch {
      setUpdateStatusMsg('❌ Failed to broadcast update.');
    } finally {
      setIsPublishingUpdate(false);
    }
  };

  const handleResetAppUpdate = async () => {
    setIsPublishingUpdate(true);
    setUpdateStatusMsg('⏳ Resetting update broadcast to baseline v1.0.0...');
    try {
      const res = await api.publishAppUpdate({
        version: '1.0.0',
        title: 'KwOrKs Production Baseline',
        notes: 'Production baseline - all devices unlocked',
        mandatory: false,
        apkUrl: '',
      });
      if (res) {
        setAppUpdate(res);
        setUpdateStatusMsg('✅ Broadcast reset to baseline v1.0.0! All popup loops stopped on user devices.');
        setTimeout(() => setUpdateStatusMsg(''), 6000);
      }
    } catch {
      setUpdateStatusMsg('❌ Failed to reset broadcast.');
    } finally {
      setIsPublishingUpdate(false);
    }
  };

  useEffect(() => {
    if (!role) return;
    loadAllData();
    const interval = setInterval(loadAllData, 5000);
    return () => clearInterval(interval);
  }, [role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPass.trim()) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await api.managementLogin({
        role: loginRole,
        email: loginEmail.trim().toLowerCase(),
        password: loginPass.trim(),
      });

      if (res && res.success) {
        const activeRole = (res.role || res.user?.role || loginRole) as Role;
        setRole(activeRole);
        sessionStorage.setItem('kworks_mgmt_role', activeRole);
        if (res.accessToken) {
          localStorage.setItem('kworks_access_token', res.accessToken);
        }
        if (res.refreshToken) {
          localStorage.setItem('kworks_refresh_token', res.refreshToken);
        }
        const allowed = ROLE_PERMISSIONS[activeRole] || ['onboarding'];
        setActiveTab(allowed[0] as any);
        setIsLoggingIn(false);
        return;
      }

      setLoginError(res?.message || `Invalid credentials for ${ROLE_LABELS[loginRole]}. Please check your email and password.`);
    } catch {
      setLoginError('Authentication service unreachable. Please check your network connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setRole(null);
    sessionStorage.removeItem('kworks_mgmt_role');
    localStorage.removeItem('kworks_access_token');
    localStorage.removeItem('kworks_refresh_token');
  };

  const handleOpenEditUser = (u: any) => {
    setEditingUser(u);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditRole((u.role as Role) || 'manager');
    setEditDept(u.department || '');
    setEditPass('');
    setUserStatusMsg('');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim() || !editEmail.trim()) {
      setUserStatusMsg('❌ Name and Email are required.');
      return;
    }
    setIsSavingUser(true);
    setUserStatusMsg('');

    const payload: any = {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      department: editDept.trim() || 'Management',
    };
    if (editPass.trim()) {
      payload.password = editPass.trim();
    }

    const res = await api.updateManagementUser(editingUser.id, payload);
    setIsSavingUser(false);
    if (res && res.success) {
      setUserStatusMsg(`✅ Account "${payload.name}" updated! Role set to ${ROLE_LABELS[editRole]}.`);
      setEditingUser(null);
      const updatedList = await api.getManagementUsers();
      if (Array.isArray(updatedList)) setMgmtUsers(updatedList);
      setTimeout(() => setUserStatusMsg(''), 6000);
    } else {
      setUserStatusMsg(`❌ Failed to update: ${res?.message || 'Unknown error'}`);
    }
  };

  const handleCreateManagementUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPass.trim()) {
      setUserStatusMsg('❌ Name, email, and initial password are required.');
      return;
    }
    setIsAddingUser(true);
    setUserStatusMsg('');

    const payload = {
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      password: newUserPass.trim(),
      role: newUserRole,
      department: newUserDept.trim() || 'Management',
    };

    const res = await api.addManagementUser(payload);
    setIsAddingUser(false);
    if (res && res.success) {
      setUserStatusMsg(`✅ Account created for "${payload.name}" as ${ROLE_LABELS[newUserRole]}!`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPass('');
      setNewUserDept('');
      setShowAddUser(false);
      const updatedList = await api.getManagementUsers();
      if (Array.isArray(updatedList)) setMgmtUsers(updatedList);
      setTimeout(() => setUserStatusMsg(''), 6000);
    } else {
      setUserStatusMsg(`❌ ${res?.message || 'Failed to create user'}`);
    }
  };

  const handleDeleteManagementUser = async (userToDelete: any) => {
    if (!window.confirm(`Are you sure you want to delete ${userToDelete.name} (${userToDelete.email})?`)) {
      return;
    }
    const res = await api.deleteManagementUser(userToDelete.id);
    if (res && res.success) {
      setUserStatusMsg(`User "${userToDelete.name}" deleted.`);
      const updatedList = await api.getManagementUsers();
      if (Array.isArray(updatedList)) setMgmtUsers(updatedList);
      setTimeout(() => setUserStatusMsg(''), 5000);
    } else {
      setUserStatusMsg(`❌ ${res?.message || 'Failed to delete user'}`);
      setTimeout(() => setUserStatusMsg(''), 6000);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCompanyInput.trim().toLowerCase();
    if (!trimmed) {
      setCompanyStatusMsg('Please enter a company organization name.');
      return;
    }
    const updated = await api.addCompany(trimmed);
    if (Array.isArray(updated)) {
      setCompanies(updated);
      setEmpCompany(trimmed);
    }
    setNewCompanyInput('');
    setCompanyStatusMsg(`Company "${trimmed}" registered! Mobile app users can now log in under this company.`);
    setTimeout(() => setCompanyStatusMsg(''), 5000);
  };

  const handleDeleteCompany = async (companyName: string) => {
    const updated = await api.deleteCompany(companyName);
    if (Array.isArray(updated)) {
      setCompanies(updated);
      if (empCompany.toLowerCase() === companyName.toLowerCase()) {
        setEmpCompany(updated[0] || 'kanagamtech');
      }
    }
    setCompanyStatusMsg(`Company "${companyName}" removed.`);
    setTimeout(() => setCompanyStatusMsg(''), 4000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEmpPhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim()) {
      setStatusMsg('Please enter full name and email address.');
      return;
    }
    const finalPass = empPass.trim() || 'KwOrKs@2026';
    const newEmp = {
      id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: empName.trim(),
      email: empEmail.trim(),
      password: finalPass,
      company: empCompany.trim() || 'kanagamtech',
      role: empRole.trim() || 'Employee',
      department: empDept.trim() || 'General',
      photo: empPhoto || '',
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    const res = await api.addEmployee(newEmp);
    if (res) {
      setEmployees([newEmp, ...employees]);
      setCreatedEmpCreds(newEmp);
      setEmpName('');
      setEmpEmail('');
      setEmpPass('');
      setEmpRole('');
      setEmpDept('');
      setEmpPhoto(null);
      setStatusMsg('Employee onboarded & face registered successfully!');
    }
  };

  const handleDeleteEmp = async (id: string) => {
    const res = await api.deleteEmployee(id);
    setEmployees(res);
  };

  const handleDeleteAttendance = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      const res = await api.deleteAttendance(id);
      setAttendance(res);
    }
  };

  const handleClearAllAttendance = async () => {
    if (window.confirm('WARNING: Are you sure you want to delete ALL attendance records? This cannot be undone.')) {
      const res = await api.clearAttendance();
      setAttendance(res);
    }
  };

  const handleUpdateClaim = async (id: string, stage: 'manager' | 'finance', outcome: 'approved' | 'rejected') => {
    const claim = claims.find((c) => c.id === id);
    if (!claim) return;
    const updatedStatus = { ...claim.status, [stage]: outcome };
    const res = await api.updateClaimStatus(id, { status: updatedStatus });
    if (res) {
      setClaims(claims.map((c) => (c.id === id ? { ...c, status: updatedStatus } : c)));
    }
  };

  const handleUpdateLeave = async (key: string, outcome: 'approved' | 'rejected') => {
    const updatedLeaves = { ...leaves };
    if (!updatedLeaves[key]) return;
    
    updatedLeaves[key] = {
      ...updatedLeaves[key],
      approved: outcome === 'approved',
      status: outcome === 'approved' ? 'approved' : 'cancelled',
      decidedBy: role,
      decidedAt: new Date().toISOString(),
    };

    const res = await api.saveLeaves(updatedLeaves);
    if (res) {
      setLeaves(updatedLeaves);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) return;
    const newNotice = {
      id: `n${Date.now()}`,
      title: noticeTitle.trim(),
      body: noticeBody.trim(),
      team: noticeTeam,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    const updated = [newNotice, ...notices];
    await api.saveNotices(updated);
    setNotices(updated);
    setNoticeTitle('');
    setNoticeBody('');
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOpts = pollOpts.map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validOpts.length < 2) return;
    const newPoll = {
      id: `p${Date.now()}`,
      title: pollQuestion.trim(),
      options: validOpts,
      votes: {},
      createdAt: Date.now(),
    };
    const updated = [newPoll, ...polls];
    await api.savePolls(updated);
    setPolls(updated);
    setPollQuestion('');
    setPollOpts(['', '']);
  };

  const filteredEmployees = employees.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      e.name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q) ||
      e.id?.toLowerCase().includes(q)
    );
  });

  // Login Screen with Classic Styling
  if (!role) {
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.loginCard}>
          <h2 style={styles.loginTitle}>KwOrKs Management Login</h2>
          <p style={styles.loginSub}>Select role and enter management credentials</p>

          <form onSubmit={handleLogin}>
            <label style={styles.fieldLabel}>SELECT ROLE</label>
            <div style={styles.roleChips}>
              {(['super_admin', 'admin', 'manager', 'hr', 'it', 'finance'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  style={{ ...styles.roleChip, ...(loginRole === r ? styles.roleChipActive : {}) }}
                  onClick={() => {
                    setLoginRole(r);
                    setLoginError('');
                  }}
                >
                  {r.toUpperCase().replace('_', ' ')}
                </button>
              ))}
            </div>

            <label style={styles.fieldLabel}>EMAIL ADDRESS</label>
            <input
              style={styles.fieldInput}
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder={`Enter ${ROLE_LABELS[loginRole]} email...`}
              autoComplete="email"
              required
            />

            <label style={styles.fieldLabel}>PASSWORD</label>
            <input
              type="password"
              style={styles.fieldInput}
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="Enter password..."
              autoComplete="current-password"
              required
            />

            {loginError && <p style={styles.errorText}>{loginError}</p>}

            <button type="submit" disabled={isLoggingIn} style={styles.btnPrimary}>
              {isLoggingIn ? '⏳ Verifying Credentials...' : `Login as ${ROLE_LABELS[loginRole]}`}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* Executive Classic Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/management/logo.png" alt="Kanagam Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'contain' }} />
          <div>
            <h1 style={styles.siteTitle}>KwOrKs Management Dashboard</h1>
            <p style={styles.siteSub}>Live monitoring of attendance, food count, leaves, announcements, and employee onboarding</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          {/* Notification Bell Dropdown */}
          <button
            style={{
              ...styles.btnGhost,
              backgroundColor: showNotifDropdown ? '#D7AB6A' : 'rgba(215,171,106,0.15)',
              color: showNotifDropdown ? '#FFFFFF' : '#2B1022',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800,
            }}
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
          >
            <span>🔔</span>
            <span>Alerts ({notifications.length})</span>
          </button>

          {showNotifDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                right: '180px',
                width: '360px',
                maxHeight: '420px',
                overflowY: 'auto',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                border: '1.5px solid #D7AB6A',
                zIndex: 9999,
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #E5D4B8', paddingBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#2B1022' }}>🔔 LIVE SHIFT & ATTENDANCE ALERTS</span>
                <span style={{ fontSize: '11px', color: '#9C7B4E', fontWeight: 700 }}>{notifications.length} recent</span>
              </div>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '16px 0' }}>No notifications received yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.slice(0, 15).map((n, i) => (
                    <div
                      key={n.id || i}
                      style={{
                        backgroundColor: n.type === 'shift_punch_out' ? 'rgba(215,171,106,0.12)' : 'rgba(46,139,87,0.08)',
                        borderLeft: `4px solid ${n.type === 'shift_punch_out' ? '#D7AB6A' : '#2E8B57'}`,
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#2B1022', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{n.title}</span>
                        <span style={{ fontSize: '10px', color: '#9C7B4E' }}>{n.time || ''}</span>
                      </div>
                      <div style={{ color: '#444', marginTop: '3px', whiteSpace: 'pre-line', fontSize: '11px' }}>
                        {n.body}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={styles.roleBadge}>{ROLE_LABELS[role]} &middot; {SITE_CREDS[role]?.email || ''}</div>
          <button style={styles.btnGhost} onClick={loadAllData}>Refresh</button>
          <button style={styles.btnGhost} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Floating Live Punch-Out & Check-In Notification Toast */}
      {liveToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#2B1022',
            color: '#FFFFFF',
            border: '2px solid #D7AB6A',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            zIndex: 99999,
            maxWidth: '380px',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#D7AB6A' }}>{liveToast.title}</span>
            <button
              onClick={() => setLiveToast(null)}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '14px', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#E8C98F', whiteSpace: 'pre-line' }}>{liveToast.body}</div>
          <div style={{ fontSize: '10px', color: '#9C7B4E', marginTop: '6px', textAlign: 'right' }}>⏰ {liveToast.time}</div>
        </div>
      )}

      {/* Top Dashboard Navigation Keys Bar (Role-Filtered) */}
      <div style={styles.keysBar}>
        {[
          { id: 'users', label: 'ROLES & ACCESS', stat: `${mgmtUsers.length} active` },
          { id: 'onboarding', label: 'EMPLOYEE ONBOARDING', stat: `${employees.length} onboarded` },
          { id: 'attendance', label: 'ATTENDANCE', stat: `${attendance.length} logged` },
          { id: 'food', label: 'FOOD COUNT', stat: `${foodCounts.length}` },
          { id: 'leaves', label: 'LEAVE APPROVAL', stat: `${Object.keys(leaves).length} requests` },
          { id: 'notices', label: 'ANNOUNCEMENTS', stat: `${notices.length} published` },
          { id: 'polls', label: 'POLLS', stat: `${polls.length} active` },
          { id: 'tickets', label: 'IT SUPPORT', stat: `${tickets.length} tickets` },
          { id: 'claims', label: 'CLAIMS & ADVANCES', stat: `${claims.filter((c) => c.status.manager === 'pending' || (c.status.manager === 'approved' && c.status.finance === 'pending')).length} pending` },
          { id: 'updates', label: 'APP UPDATES (OTA)', stat: appUpdate ? `v${appUpdate.version} live` : 'v1.0.0 live' },
        ]
          .filter((key) => role && (ROLE_PERMISSIONS[role] || []).includes(key.id))
          .map((key) => (
            <div
              key={key.id}
              style={{ ...styles.keyCard, ...(activeTab === key.id ? styles.keyCardActive : {}) }}
              onClick={() => setActiveTab(key.id as any)}
            >
              <div style={{ ...styles.keyLabel, ...(activeTab === key.id ? styles.keyLabelActive : {}) }}>{key.label}</div>
              <div style={{ ...styles.keyStat, ...(activeTab === key.id ? styles.keyStatActive : {}) }}>{key.stat}</div>
            </div>
          ))}
      </div>

      {/* Main Panel Content Container (Classic White Card) */}
      <div style={styles.panelContainer}>
        {/* TAB 0: MANAGEMENT ROLES & ACCESS CONTROL */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ ...styles.panelTitle, textAlign: 'left', marginBottom: '4px' }}>
                  Management Roles &amp; Access Control
                </h2>
                <p style={{ color: '#666', fontSize: '13px' }}>
                  Assign role types, modify credentials, and control access permissions. Database credentials strictly supersede default passwords.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddUser(!showAddUser);
                  setUserStatusMsg('');
                }}
                style={{
                  backgroundColor: '#D7AB6A',
                  color: '#2B1022',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(215,171,106,0.3)',
                }}
              >
                {showAddUser ? '✕ Close Form' : '+ Add New Management User'}
              </button>
            </div>

            {/* Status Alert Banner */}
            {userStatusMsg && (
              <div
                style={{
                  backgroundColor: userStatusMsg.startsWith('❌') ? 'rgba(224,80,80,0.1)' : 'rgba(78,186,111,0.12)',
                  border: `1.5px solid ${userStatusMsg.startsWith('❌') ? '#E05050' : '#4EBA6F'}`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: userStatusMsg.startsWith('❌') ? '#C0392B' : '#27AE60',
                }}
              >
                {userStatusMsg}
              </div>
            )}

            {/* Collapsible Add Management User Form */}
            {showAddUser && (
              <div style={{ ...styles.colCard, marginBottom: '24px', backgroundColor: '#FFFDF9', border: '2px solid #D7AB6A' }}>
                <h3 style={{ ...styles.cardTitle, color: '#D7AB6A' }}>CREATE NEW MANAGEMENT ACCOUNT</h3>
                <p style={{ color: '#777', fontSize: '12.5px', marginBottom: '14px' }}>
                  Configure role type and initial credentials for a new management team member.
                </p>

                <form onSubmit={handleCreateManagementUser}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={styles.fieldLabel}>FULL NAME *</label>
                      <input
                        style={styles.fieldInput}
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="e.g. Rachel Green"
                        required
                      />
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>LOGIN EMAIL *</label>
                      <input
                        type="email"
                        style={styles.fieldInput}
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="e.g. rachel@kworks.com"
                        required
                      />
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>ASSIGN ROLE TYPE *</label>
                      <select
                        style={{ ...styles.fieldInput, height: '42px', cursor: 'pointer' }}
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as Role)}
                      >
                        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]} — ({ROLE_DESCRIPTIONS[r]})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>DEPARTMENT</label>
                      <input
                        style={styles.fieldInput}
                        value={newUserDept}
                        onChange={(e) => setNewUserDept(e.target.value)}
                        placeholder="e.g. Human Resources, Operations"
                      />
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>INITIAL PASSWORD *</label>
                      <input
                        type="password"
                        style={styles.fieldInput}
                        value={newUserPass}
                        onChange={(e) => setNewUserPass(e.target.value)}
                        placeholder="Set strong initial password..."
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                    <button
                      type="submit"
                      disabled={isAddingUser}
                      style={{ ...styles.btnPrimary, width: 'auto', padding: '10px 24px', marginTop: 0 }}
                    >
                      {isAddingUser ? '⏳ Creating Account...' : 'Create Account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      style={{ ...styles.btnGhost, color: '#666', borderColor: '#ccc', padding: '10px 18px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Management Users Directory Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #E5D4B8', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F7EFE2', borderBottom: '2px solid #D7AB6A', color: '#2B1022' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>USER</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>EMAIL</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>ROLE TYPE</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>DEPARTMENT</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>PERMISSIONS SUMMARY</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {mgmtUsers.map((u) => {
                    const userRole = (u.role as Role) || 'manager';
                    const roleColor = ROLE_COLORS[userRole] || { bg: '#F7EFE2', text: '#2B1022', border: '#D7AB6A' };
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #F0E6D8' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#2B1022' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: roleColor.bg,
                                color: roleColor.text,
                                border: `1.5px solid ${roleColor.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '12px',
                              }}
                            >
                              {(u.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#555' }}>{u.email}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: roleColor.bg,
                              color: roleColor.text,
                              border: `1px solid ${roleColor.border}`,
                              fontWeight: 800,
                              fontSize: '11.5px',
                              letterSpacing: '0.4px',
                            }}
                          >
                            {ROLE_LABELS[userRole] || userRole.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#666' }}>{u.department || 'General'}</td>
                        <td style={{ padding: '14px 16px', color: '#777', fontSize: '12px', maxWidth: '280px' }}>
                          {ROLE_DESCRIPTIONS[userRole] || 'Standard management access'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            style={{
                              backgroundColor: 'rgba(215,171,106,0.15)',
                              color: '#7A4F1D',
                              border: '1px solid #D7AB6A',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginRight: '8px',
                            }}
                          >
                            ✏️ Edit Role / Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteManagementUser(u)}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#E05050',
                              border: '1px solid #E05050',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                            title="Delete User"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {mgmtUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9C7B4E' }}>
                        No management users found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Role Capabilities Reference Guide */}
            <div style={{ marginTop: '28px', backgroundColor: '#FDFBF7', border: '1px solid #E5D4B8', borderRadius: '12px', padding: '16px 20px' }}>
              <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: '#2B1022', marginBottom: '10px', letterSpacing: '0.6px' }}>
                ROLE TYPE CAPABILITIES &amp; ACCESS MATRIX
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <div key={r} style={{ borderLeft: `3px solid ${ROLE_COLORS[r].border}`, paddingLeft: '10px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: ROLE_COLORS[r].text }}>{ROLE_LABELS[r]}</div>
                    <div style={{ fontSize: '11.5px', color: '#666', marginTop: '2px' }}>{ROLE_DESCRIPTIONS[r]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: EMPLOYEE ONBOARDING & FACE REGISTRATION (2-COLUMN LAYOUT) */}
        {activeTab === 'onboarding' && (
          <div>
            <h2 style={styles.panelTitle}>Employee Management &amp; Face Registration</h2>

            {/* Companies Management Card */}
            <div style={{ ...styles.colCard, marginBottom: '24px' }}>
              <h3 style={styles.cardTitle}>REGISTERED COMPANY ORGANIZATIONS</h3>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
                Companies managed here will be available in the mobile app login dropdown.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                {companies.map((c) => (
                  <div key={c} style={{ backgroundColor: 'rgba(215,171,106,0.15)', border: '1px solid #D7AB6A', padding: '6px 14px', borderRadius: '8px', color: '#31122B', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🏢</span> {c}
                    {c !== 'kanagamtech' && c !== 'amsems' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCompany(c)}
                        style={{ background: 'none', border: 'none', color: '#E05050', fontWeight: 800, cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}
                        title={`Remove ${c}`}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddCompany} style={{ display: 'flex', gap: '10px', maxWidth: '540px' }}>
                <input
                  style={{ ...styles.fieldInput, flex: 1, marginBottom: 0 }}
                  value={newCompanyInput}
                  onChange={(e) => setNewCompanyInput(e.target.value)}
                  placeholder="Enter new company name (e.g. Acme Corp)..."
                />
                <button type="submit" style={{ ...styles.btnPrimary, width: 'auto', padding: '0 20px', whiteSpace: 'nowrap' }}>
                  + Add Company
                </button>
              </form>
              {companyStatusMsg && <p style={{ ...styles.statusOkText, marginTop: '8px' }}>{companyStatusMsg}</p>}
            </div>

            <div style={styles.colsTwo}>
              {/* Left Side: Onboard New Employee & Register Face Form */}
              <div style={styles.colCard}>
                <h3 style={styles.cardTitle}>ONBOARD NEW EMPLOYEE &amp; REGISTER FACE</h3>
                <form onSubmit={handleOnboard}>
                  <label style={styles.fieldLabel}>COMPANY ORGANIZATION</label>
                  <select
                    style={{ ...styles.fieldInput, backgroundColor: '#FFFFFF', color: '#31122B', fontWeight: 600 }}
                    value={empCompany}
                    onChange={(e) => setEmpCompany(e.target.value)}
                  >
                    {companies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <label style={styles.fieldLabel}>FULL NAME</label>
                  <input style={styles.fieldInput} value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="e.g. Suresh Kumar" />

                  <label style={styles.fieldLabel}>EMAIL ADDRESS</label>
                  <input style={styles.fieldInput} value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} placeholder="e.g. suresh@kanagam.tech" />

                  <label style={styles.fieldLabel}>PASSWORD (FOR APP LOGIN)</label>
                  <input
                    type="text"
                    style={styles.fieldInput}
                    value={empPass}
                    onChange={(e) => setEmpPass(e.target.value)}
                    placeholder="e.g. Pass@1234 (or leave blank for KwOrKs@2026)"
                  />

                  <label style={styles.fieldLabel}>DEPARTMENT</label>
                  <input style={styles.fieldInput} value={empDept} onChange={(e) => setEmpDept(e.target.value)} placeholder="e.g. Engineering / HR / Accounts" />

                  <label style={styles.fieldLabel}>DESTINATION / DESIGNATION</label>
                  <input style={styles.fieldInput} value={empRole} onChange={(e) => setEmpRole(e.target.value)} placeholder="e.g. Software Engineer / Team Lead" />

                  <label style={styles.fieldLabel}>FACE PHOTO FOR ATTENDANCE MATCHING</label>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={styles.fileBtn} />
                  {empPhoto && <img src={empPhoto} alt="Preview" style={styles.photoPreview} />}

                  {statusMsg && <p style={styles.statusOkText}>{statusMsg}</p>}

                  <button type="submit" style={styles.btnPrimary}>Onboard Employee &amp; Register Face</button>
                </form>
              </div>

              {/* Right Side: Onboarded Employees List + Live Search */}
              <div style={styles.colCard}>
                <h3 style={styles.cardTitle}>ONBOARDED EMPLOYEES &amp; REGISTERED FACES</h3>
                <label style={styles.fieldLabel}>SEARCH EMPLOYEE</label>
                <input
                  style={styles.fieldInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, role, department..."
                />
                <div style={styles.countBadge}>
                  Showing {filteredEmployees.length} of {employees.length} onboarded employee(s)
                </div>

                <div style={{ marginTop: '12px' }}>
                  {filteredEmployees.length === 0 ? (
                    <p style={styles.emptyText}>{searchQuery ? 'No matching employees found.' : 'No employees onboarded yet.'}</p>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <div key={emp.id} style={styles.listRow}>
                        <div style={styles.thumbWrap}>
                          {emp.photo ? (
                            <img src={emp.photo} alt="" style={styles.thumbImg} />
                          ) : (
                            <div style={styles.dot} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={styles.empName}>{emp.name} <span style={{ color: '#9C7B4E', fontWeight: 600 }}>({emp.id})</span></div>
                          <div style={styles.empSub}>{emp.role} · {emp.department} · {emp.email}</div>
                        </div>
                        <button style={styles.delBtn} onClick={() => handleDeleteEmp(emp.id)} title="Delete">&times;</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE TRACKING */}
        {activeTab === 'attendance' && (() => {
          const getLocalToday = () => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          };

          // All distinct dates in attendance records (most recent first)
          const allDates = Array.from(new Set(attendance.map((r) => r.date).filter(Boolean)))
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          const todayStr = getLocalToday();
          const activeDateWithData = allDates.includes(todayStr) ? todayStr : (allDates[0] || todayStr);
          const selectedDate = attendanceDate || activeDateWithData;

          // Records matching selectedDate
          const dateRecords = attendance.filter((r) => r.date === selectedDate);

          // Map of checkins by email (lowercased)
          const checkInMap = new Map<string, any>();
          dateRecords.forEach((r) => {
            const emailKey = (r.user || '').trim().toLowerCase();
            if (emailKey && !checkInMap.has(emailKey)) {
              checkInMap.set(emailKey, r);
            }
          });

          // Present employees ("Not Absent" list)
          const presentEmployees: any[] = [];
          employees.forEach((emp) => {
            const emailKey = (emp.email || '').trim().toLowerCase();
            if (checkInMap.has(emailKey)) {
              presentEmployees.push({
                ...emp,
                checkIn: checkInMap.get(emailKey),
                isPresent: true,
              });
            }
          });

          // Also include any attendance record whose user email might not be in employees list
          dateRecords.forEach((rec) => {
            const recEmail = (rec.user || '').trim().toLowerCase();
            if (recEmail && !presentEmployees.some((e) => (e.email || '').trim().toLowerCase() === recEmail)) {
              presentEmployees.push({
                id: rec.id || `ext_${recEmail}`,
                name: rec.name || rec.user,
                email: rec.user,
                company: 'kanagamtech',
                role: 'Employee',
                department: 'General',
                checkIn: rec,
                isPresent: true,
              });
            }
          });

          // Absent employees (onboarded employees who have NOT checked in on selectedDate)
          const absentEmployees: any[] = employees
            .filter((emp) => !checkInMap.has((emp.email || '').trim().toLowerCase()))
            .map((emp) => ({
              ...emp,
              isPresent: false,
            }));

          // Filter by search and company
          const filterFn = (item: any) => {
            if (attendanceCompanyFilter !== 'ALL') {
              if ((item.company || '').toLowerCase() !== attendanceCompanyFilter.toLowerCase()) {
                return false;
              }
            }
            const q = attendanceSearch.trim().toLowerCase();
            if (!q) return true;
            return (
              (item.name || '').toLowerCase().includes(q) ||
              (item.email || '').toLowerCase().includes(q) ||
              (item.department || '').toLowerCase().includes(q) ||
              (item.role || '').toLowerCase().includes(q) ||
              (item.company || '').toLowerCase().includes(q) ||
              (item.checkIn?.location || '').toLowerCase().includes(q)
            );
          };

          const filteredPresent = presentEmployees.filter(filterFn);
          const filteredAbsent = absentEmployees.filter(filterFn);

          // Calculate Common Stats for charts
          const dailyMap: Record<string, number> = {};
          attendance.forEach((r) => {
            const dateStr = r.date || 'Unknown';
            dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
          });
          const last5Days = Object.keys(dailyMap)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            .slice(-5);
          const maxDailyCount = Math.max(...Object.values(dailyMap), 1);

          const locMap: Record<string, number> = {};
          attendance.forEach((r) => {
            const locStr = r.location || 'Location unknown';
            locMap[locStr] = (locMap[locStr] || 0) + 1;
          });

          const employeeRecs = selectedEmpEmail
            ? attendance.filter((r) => r.user?.toLowerCase() === selectedEmpEmail.toLowerCase())
            : [];

          // CSV Export for Present Employees
          const handleExportPresent = () => {
            const headers = ['EMP ID', 'Name', 'Email', 'Company', 'Department', 'Role', 'Date', 'Check-In Time', 'Punch-Out Time', 'Duration', 'Location', 'GPS'];
            const rows = filteredPresent.map((p) => [
              p.id || '',
              `"${(p.name || '').replace(/"/g, '""')}"`,
              p.email || '',
              p.company || '',
              p.department || '',
              p.role || '',
              p.checkIn?.date || selectedDate,
              p.checkIn?.time || '',
              p.checkIn?.punchOutTime || '',
              p.checkIn?.duration || '',
              `"${(p.checkIn?.location || '').replace(/"/g, '""')}"`,
              p.checkIn?.gpsFormatted || '',
            ]);
            const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kworks_present_${selectedDate}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          };

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                <h2 style={styles.panelTitle}>Attendance — Common &amp; Individual Analytics</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={handleExportPresent}
                    style={{
                      backgroundColor: '#2E8B57',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    📥 Export Present List (CSV)
                  </button>
                </div>
              </div>

              {/* Analytics Header Chips */}
              <div style={styles.chipsRow}>
                <div style={styles.chip}>
                  <div style={{ ...styles.chipValue, color: '#2E8B57' }}>{presentEmployees.length}</div>
                  <div style={styles.chipLabel}>🟢 Present ({selectedDate})</div>
                </div>
                <div style={styles.chip}>
                  <div style={{ ...styles.chipValue, color: '#E05050' }}>{absentEmployees.length}</div>
                  <div style={styles.chipLabel}>🔴 Not Checked In</div>
                </div>
                <div style={styles.chip}>
                  <div style={styles.chipValue}>{employees.length}</div>
                  <div style={styles.chipLabel}>Total Onboarded</div>
                </div>
                <div style={styles.chip}>
                  <div style={styles.chipValue}>{attendance.length}</div>
                  <div style={styles.chipLabel}>Total Logs</div>
                </div>
                <div style={styles.chip}>
                  <div style={styles.chipValue}>{Object.keys(dailyMap).length}</div>
                  <div style={styles.chipLabel}>Active Days</div>
                </div>
              </div>

              {/* CONTROLS BAR: Date Selector, Company Filter, Search */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #D7AB6A',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginTop: '18px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '14px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Date Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#2B1022' }}>📅 DATE:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    style={{
                      ...styles.fieldInput,
                      width: 'auto',
                      padding: '6px 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setAttendanceDate(todayStr)}
                    style={{
                      backgroundColor: selectedDate === todayStr ? '#D7AB6A' : 'rgba(215,171,106,0.2)',
                      color: selectedDate === todayStr ? '#FFFFFF' : '#2B1022',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Today ({todayStr})
                  </button>
                  {allDates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAttendanceDate(d)}
                      style={{
                        backgroundColor: selectedDate === d ? '#2E8B57' : 'rgba(46,139,87,0.12)',
                        color: selectedDate === d ? '#FFFFFF' : '#2E8B57',
                        border: '1px solid #2E8B57',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {d} ({attendance.filter((r) => r.date === d).length})
                    </button>
                  ))}
                </div>

                {/* Company Filter & Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    value={attendanceCompanyFilter}
                    onChange={(e) => setAttendanceCompanyFilter(e.target.value)}
                    style={{
                      ...styles.fieldInput,
                      width: 'auto',
                      padding: '6px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">🏢 All Companies</option>
                    {companies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="🔍 Search name, email, dept, location..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    style={{
                      ...styles.fieldInput,
                      width: '240px',
                      padding: '6px 12px',
                      fontSize: '12px',
                    }}
                  />
                </div>
              </div>

              {/* NAVIGATION TABS: Present (Not Absent) vs Absent vs Charts vs All Logs */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setAttendanceViewMode('present')}
                  style={{
                    backgroundColor: attendanceViewMode === 'present' ? '#2E8B57' : 'rgba(46,139,87,0.1)',
                    color: attendanceViewMode === 'present' ? '#FFFFFF' : '#2E8B57',
                    border: '1.5px solid #2E8B57',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: attendanceViewMode === 'present' ? '0 2px 8px rgba(46,139,87,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>🟢</span>
                  <span>PRESENT ({filteredPresent.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceViewMode('absent')}
                  style={{
                    backgroundColor: attendanceViewMode === 'absent' ? '#E05050' : 'rgba(224,80,80,0.1)',
                    color: attendanceViewMode === 'absent' ? '#FFFFFF' : '#E05050',
                    border: '1.5px solid #E05050',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: attendanceViewMode === 'absent' ? '0 2px 8px rgba(224,80,80,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>🔴</span>
                  <span>ABSENT ({filteredAbsent.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceViewMode('analytics')}
                  style={{
                    backgroundColor: attendanceViewMode === 'analytics' ? '#4B1D3F' : 'rgba(75,29,63,0.08)',
                    color: attendanceViewMode === 'analytics' ? '#FFFFFF' : '#4B1D3F',
                    border: '1.5px solid #4B1D3F',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>📊</span>
                  <span>CHARTS &amp; INDIVIDUAL CARD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceViewMode('logs')}
                  style={{
                    backgroundColor: attendanceViewMode === 'logs' ? '#D7AB6A' : 'rgba(215,171,106,0.15)',
                    color: attendanceViewMode === 'logs' ? '#2B1022' : '#9C7B4E',
                    border: '1.5px solid #D7AB6A',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>📋</span>
                  <span>ALL CHECK-IN LOGS ({attendance.length})</span>
                </button>
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* VIEW 1: PRESENT LIST (DEFAULT)                             */}
              {/* ────────────────────────────────────────────────────────── */}
              {attendanceViewMode === 'present' && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#2E8B57' }}>
                      ✅ PRESENT EMPLOYEES — {filteredPresent.length} PRESENT ON {selectedDate}
                    </div>
                    <span style={{ fontSize: '12px', color: '#9C7B4E', fontWeight: 600 }}>
                      Attendance Rate: {employees.length > 0 ? Math.round((presentEmployees.length / employees.length) * 100) : 0}%
                    </span>
                  </div>

                  {filteredPresent.length === 0 ? (
                    <div style={{ ...styles.colCard, textAlign: 'center', padding: '36px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#9C7B4E', margin: 0 }}>
                        No employees marked attendance for {selectedDate}.
                      </p>
                      {allDates.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 800, color: '#2B1022', marginBottom: '8px' }}>
                            Check-in records found on other dates:
                          </p>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {allDates.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setAttendanceDate(d)}
                                style={{
                                  backgroundColor: '#D7AB6A',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 14px',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                📅 View {d} ({attendance.filter((r) => r.date === d).length} check-ins)
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop: '16px' }}>
                        <button
                          type="button"
                          onClick={() => setAttendanceViewMode('logs')}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1.5px solid #D7AB6A',
                            color: '#2B1022',
                            borderRadius: '8px',
                            padding: '8px 18px',
                            fontSize: '12.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          📋 View All Check-In Logs ({attendance.length} Total Logs)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filteredPresent.map((emp, idx) => {
                        const rec = emp.checkIn || {};
                        const mapsUrl = rec.mapsUrl || (rec.latitude && rec.longitude ? `https://www.google.com/maps?q=${rec.latitude},${rec.longitude}` : null);
                        const initials = (emp.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                        return (
                          <div
                            key={emp.id || idx}
                            style={{
                              ...styles.listRow,
                              borderLeft: '5px solid #2E8B57',
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px',
                            }}
                          >
                            {/* Employee Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                              <div
                                style={{
                                  ...styles.thumbWrap,
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '21px',
                                  border: '2px solid #2E8B57',
                                }}
                              >
                                {emp.photo ? (
                                  <img src={emp.photo} alt="" style={styles.thumbImg} />
                                ) : (
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#D7AB6A' }}>{initials}</div>
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#2B1022' }}>
                                  {emp.name}
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#9C7B4E' }}>
                                  {emp.email} {emp.id ? `• ${emp.id}` : ''}
                                </div>
                              </div>
                            </div>

                            {/* Organization Badges */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  backgroundColor: 'rgba(75,29,63,0.08)',
                                  color: '#4B1D3F',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                🏢 {emp.company || 'kanagamtech'}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: '#F7EFE2',
                                  color: '#9C7B4E',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                {emp.department || 'General'}
                              </span>
                            </div>

                            {/* Check-In Details */}
                            <div style={{ minWidth: '200px', flex: '1 1 200px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    backgroundColor: 'rgba(46,139,87,0.15)',
                                    color: '#2E8B57',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  In: {rec.time || 'Checked In'}
                                </span>
                                {rec.punchOutTime && (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 800,
                                      backgroundColor: 'rgba(215,171,106,0.15)',
                                      color: '#9C7B4E',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    Out: {rec.punchOutTime}
                                  </span>
                                )}
                                {rec.duration && (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 800,
                                      backgroundColor: 'rgba(75,29,63,0.1)',
                                      color: '#4B1D3F',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    ⏱️ {rec.duration}
                                  </span>
                                )}
                                {!rec.punchOutTime && (
                                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#2E8B57' }}>
                                    ✓ ACTIVE SHIFT
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                📍 {rec.location || 'Location verified'}
                                {rec.gpsFormatted && <span style={{ color: '#9C7B4E', marginLeft: '4px' }}>({rec.gpsFormatted})</span>}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {/* View Shift Details Action */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEmpEmail(emp.email);
                                  setAttendanceViewMode('analytics');
                                }}
                                style={{
                                  backgroundColor: '#4B1D3F',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                👤 Shift Card
                              </button>

                              {/* Map Action Button */}
                              {mapsUrl && (
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    backgroundColor: '#F7EFE2',
                                    color: '#2B1022',
                                    border: '1px solid #D7AB6A',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  🗺️ View GPS
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* VIEW 2: ABSENT LIST                                       */}
              {/* ────────────────────────────────────────────────────────── */}
              {attendanceViewMode === 'absent' && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#E05050' }}>
                      ❌ ABSENT EMPLOYEES — {filteredAbsent.length} NOT MARKED ON {selectedDate}
                    </div>
                  </div>

                  {filteredAbsent.length === 0 ? (
                    <div style={{ ...styles.colCard, textAlign: 'center', padding: '36px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#2E8B57', margin: 0 }}>
                        🎉 Perfect Attendance! Zero absent employees on {selectedDate}.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredAbsent.map((emp, idx) => {
                        const initials = (emp.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                        return (
                          <div
                            key={emp.id || idx}
                            style={{
                              ...styles.listRow,
                              borderLeft: '5px solid #E05050',
                              padding: '10px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  ...styles.thumbWrap,
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '19px',
                                  border: '1.5px solid #E05050',
                                }}
                              >
                                {emp.photo ? (
                                  <img src={emp.photo} alt="" style={styles.thumbImg} />
                                ) : (
                                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#E05050' }}>{initials}</div>
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2B1022' }}>{emp.name}</div>
                                <div style={{ fontSize: '11px', color: '#9C7B4E' }}>{emp.email} &middot; {emp.id}</div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(75,29,63,0.06)', padding: '3px 8px', borderRadius: '4px' }}>
                                🏢 {emp.company || 'kanagamtech'}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#F7EFE2', padding: '3px 8px', borderRadius: '4px' }}>
                                {emp.department || 'General'}
                              </span>
                            </div>

                            <div>
                              <span
                                style={{
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  backgroundColor: 'rgba(224,80,80,0.15)',
                                  color: '#E05050',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                }}
                              >
                                ❌ ABSENT (NOT MARKED)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* VIEW 3: VISUAL CHARTS & INDIVIDUAL ANALYTICS               */}
              {/* ────────────────────────────────────────────────────────── */}
              {attendanceViewMode === 'analytics' && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
                  {/* Daily Trend & Location Breakdown */}
                  <div style={{ ...styles.colCard, flex: '1 1 500px' }}>
                    <h3 style={styles.cardTitle}>📊 COMPANY-WIDE ATTENDANCE CHARTS</h3>
                    
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#9C7B4E', marginBottom: '12px' }}>DAILY CHECK-INS (TREND)</div>
                      {last5Days.length === 0 ? (
                        <p style={{ ...styles.emptyText, fontSize: '11px' }}>No records to graph yet.</p>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '140px', backgroundColor: 'rgba(75,29,63,0.03)', border: '1px solid #E5D4B8', borderRadius: '10px', padding: '16px 8px 10px 8px' }}>
                          {last5Days.map((day) => {
                            const count = dailyMap[day];
                            const pct = (count / maxDailyCount) * 100;
                            return (
                              <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2B1022', marginBottom: '4px' }}>{count}</span>
                                <div style={{ width: '28px', height: `${Math.max(pct, 8)}%`, backgroundColor: '#D7AB6A', borderRadius: '4px 4px 0 0', minHeight: '8px', transition: 'height 0.3s' }} />
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#9C7B4E', marginTop: '8px', textAlign: 'center', width: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{day}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#9C7B4E', marginBottom: '10px' }}>LOCATION REPRESENTATION</div>
                      {Object.keys(locMap).length === 0 ? (
                        <p style={{ ...styles.emptyText, fontSize: '11px' }}>No location data logged yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {Object.keys(locMap).map((loc) => {
                            const count = locMap[loc];
                            const pct = (count / (attendance.length || 1)) * 100;
                            return (
                              <div key={loc} style={{ fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2B1022', fontWeight: 700, marginBottom: '2px' }}>
                                  <span style={{ fontSize: '11.5px' }}>📍 {loc}</span>
                                  <span>{count} ({Math.round(pct)}%)</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(75,29,63,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#4B1D3F', borderRadius: '4px' }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Individual Tracker */}
                  <div style={{ ...styles.colCard, flex: '1 1 500px' }}>
                    <h3 style={styles.cardTitle}>👤 INDIVIDUAL EMPLOYEE ATTENDANCE &amp; SHIFT CARD</h3>
                    
                    <label style={styles.fieldLabel}>CHOOSE EMPLOYEE TO VIEW LOGIN &amp; LOGOUT TIMES</label>
                    <select
                      style={{ ...styles.fieldInput, cursor: 'pointer', marginBottom: '12px' }}
                      value={selectedEmpEmail}
                      onChange={(e) => setSelectedEmpEmail(e.target.value)}
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.email}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </select>

                    {selectedEmpEmail ? (() => {
                      const emp = employees.find((e) => e.email?.toLowerCase() === selectedEmpEmail.toLowerCase());
                      const empTodayRec = attendance.find(
                        (r) => r.user?.toLowerCase() === selectedEmpEmail.toLowerCase() && r.date === selectedDate
                      );
                      const latestRec = employeeRecs[0];

                      return (
                        <div style={{ marginTop: '10px', border: '1.5px solid #D7AB6A', borderRadius: '12px', padding: '18px', backgroundColor: '#FFFFFF' }}>
                          {/* Profile Header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                            <div style={{ ...styles.thumbWrap, width: '52px', height: '52px', borderRadius: '26px', border: '2px solid #D7AB6A' }}>
                              {emp?.photo ? (
                                <img src={emp.photo} alt="" style={styles.thumbImg} />
                              ) : (
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#D7AB6A' }}>
                                  {(emp?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#2B1022' }}>{emp?.name || 'Employee Profile'}</div>
                              <div style={{ fontSize: '12px', color: '#9C7B4E' }}>{emp?.email} &middot; {emp?.id}</div>
                              <div style={{ fontSize: '11.5px', color: '#666', marginTop: '2px' }}>
                                🏢 {emp?.company || 'kanagamtech'} &middot; {emp?.department || 'General'} &middot; {emp?.role || 'Staff'}
                              </div>
                            </div>
                          </div>

                          {/* Login & Logout Today Banner */}
                          <div style={{ backgroundColor: 'rgba(75,29,63,0.04)', border: '1px solid #E5D4B8', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#4B1D3F', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>📅 DATE: {selectedDate}</span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  backgroundColor: empTodayRec ? (empTodayRec.punchOutTime ? 'rgba(215,171,106,0.2)' : 'rgba(46,139,87,0.2)') : 'rgba(224,80,80,0.15)',
                                  color: empTodayRec ? (empTodayRec.punchOutTime ? '#9C7B4E' : '#2E8B57') : '#E05050',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                {empTodayRec ? (empTodayRec.punchOutTime ? '🏁 SHIFT COMPLETED' : '🟢 ACTIVE SHIFT') : '❌ ABSENT ON THIS DATE'}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                              {/* Login Time */}
                              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '10px', border: '1px solid rgba(46,139,87,0.3)' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: '#2E8B57' }}>🟢 LOGIN (CHECK-IN)</div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2B1022', marginTop: '4px' }}>
                                  {empTodayRec?.time || '—'}
                                </div>
                              </div>

                              {/* Logout Time */}
                              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '10px', border: '1px solid rgba(215,171,106,0.4)' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: '#9C7B4E' }}>🚪 LOGOUT (PUNCH-OUT)</div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2B1022', marginTop: '4px' }}>
                                  {empTodayRec?.punchOutTime || (empTodayRec ? 'In Progress' : '—')}
                                </div>
                              </div>

                              {/* Total Working Time */}
                              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '10px', border: '1px solid rgba(75,29,63,0.2)' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: '#4B1D3F' }}>⏱️ TOTAL WORKING TIME</div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#4B1D3F', marginTop: '4px' }}>
                                  {empTodayRec?.duration || (empTodayRec ? (empTodayRec.punchOutTime ? 'Finished' : 'Active Counter') : '00h 00m')}
                                </div>
                              </div>
                            </div>

                            {empTodayRec?.location && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>
                                📍 Location: {empTodayRec.location}
                                {empTodayRec.gpsFormatted && <span style={{ color: '#9C7B4E', marginLeft: '6px' }}>({empTodayRec.gpsFormatted})</span>}
                              </div>
                            )}
                          </div>

                          {/* Historical Shift Log Table */}
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#9C7B4E', marginBottom: '8px' }}>
                            📋 ALL RECORDED SHIFTS &amp; ATTENDANCE HISTORY ({employeeRecs.length} total)
                          </div>
                          {employeeRecs.length === 0 ? (
                            <p style={{ color: '#9C7B4E', fontSize: '12px', fontStyle: 'italic', margin: '8px 0' }}>No check-in logs registered for this employee yet.</p>
                          ) : (
                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {employeeRecs.map((rec, idx) => (
                                <div
                                  key={rec.id || idx}
                                  style={{
                                    backgroundColor: 'rgba(75,29,63,0.03)',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    fontSize: '11.5px',
                                    border: '1px solid rgba(215,171,106,0.3)',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                                    <strong>📅 {rec.date}</strong>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <span style={{ backgroundColor: 'rgba(46,139,87,0.15)', color: '#2E8B57', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                        In: {rec.time}
                                      </span>
                                      {rec.punchOutTime && (
                                        <span style={{ backgroundColor: 'rgba(215,171,106,0.2)', color: '#9C7B4E', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                          Out: {rec.punchOutTime}
                                        </span>
                                      )}
                                      {rec.duration && (
                                        <span style={{ backgroundColor: 'rgba(75,29,63,0.1)', color: '#4B1D3F', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                          ⏱️ {rec.duration}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ color: '#666', fontSize: '11px' }}>
                                    📍 {rec.location || 'Location unknown'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <p style={{ ...styles.emptyText, textAlign: 'center', marginTop: '24px' }}>
                        Select an employee from the dropdown list above to view their exact Login (Check-in), Logout (Punch-out), and total shift working duration.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* VIEW 4: RAW CHECK-IN LOGS                                 */}
              {/* ────────────────────────────────────────────────────────── */}
              {attendanceViewMode === 'logs' && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 12px 0' }}>
                    <div style={styles.listTitle}>RAW CHECK-IN ATTENDANCE RECORDS</div>
                    {attendance.length > 0 && (
                      <button
                        style={{
                          backgroundColor: 'rgba(224, 80, 80, 0.15)',
                          color: '#E05050',
                          border: '1.5px solid #E05050',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          letterSpacing: '0.5px',
                          transition: 'all 0.2s',
                        }}
                        onClick={handleClearAllAttendance}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#E05050';
                          e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(224, 80, 80, 0.15)';
                          e.currentTarget.style.color = '#E05050';
                        }}
                      >
                        CLEAR ALL RECORDS
                      </button>
                    )}
                  </div>

                  {attendance.length === 0 ? (
                    <p style={styles.emptyText}>No attendance marked yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {attendance.map((r, i) => {
                        const mapsUrl = r.mapsUrl || (r.latitude && r.longitude ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}` : null);
                        return (
                          <div key={r.id || i} style={styles.listRow}>
                            <div style={styles.dot} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={styles.empName}>{r.name || r.user}</span>
                                <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(46,139,87,0.15)', color: '#2E8B57', padding: '2px 6px', borderRadius: '4px' }}>
                                  In: {r.time}
                                </span>
                                {r.punchOutTime && (
                                  <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(215,171,106,0.2)', color: '#9C7B4E', padding: '2px 6px', borderRadius: '4px' }}>
                                    Out: {r.punchOutTime}
                                  </span>
                                )}
                                {r.duration && (
                                  <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(75,29,63,0.1)', color: '#4B1D3F', padding: '2px 6px', borderRadius: '4px' }}>
                                    ⏱️ {r.duration}
                                  </span>
                                )}
                                {!r.punchOutTime && (
                                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#2E8B57' }}>
                                    ✓ ACTIVE SHIFT
                                  </span>
                                )}
                              </div>
                              <div style={styles.empSub}>
                                📍 {r.location || 'Location unknown'} &middot; 📅 {r.date}
                                {r.gpsFormatted && <span style={{ color: '#9C7B4E', marginLeft: '6px', fontWeight: 700 }}>({r.gpsFormatted})</span>}
                                {mapsUrl && (
                                  <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ marginLeft: '8px', color: '#D7AB6A', fontWeight: 800, textDecoration: 'underline', fontSize: '11.5px' }}
                                  >
                                    🗺️ View GPS on Map
                                  </a>
                                )}
                              </div>
                            </div>
                            <button
                              style={styles.delBtn}
                              onClick={() => handleDeleteAttendance(r.id || `att_${i}`)}
                              title="Delete Record"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: FOOD COUNT — MEAL DISTRIBUTION */}
        {activeTab === 'food' && (() => {
          const allFoodDates = Array.from(
            new Set([
              ...foodCounts.map((f) => f.date).filter(Boolean),
              ...attendance.map((a) => a.date).filter(Boolean),
            ])
          ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

          const todayStr = new Date().toISOString().split('T')[0];
          const selectedDate = foodDate || (allFoodDates[0] || todayStr);

          // Food count records matching selectedDate
          const dateFoodRecords = foodCounts.filter((f) => f.date === selectedDate);
          const dateAttRecords = attendance.filter((a) => a.date === selectedDate);

          const foodMap = new Map<string, any>();
          dateFoodRecords.forEach((f) => {
            const key = (f.user || '').trim().toLowerCase();
            if (key) foodMap.set(key, f);
          });

          const attMap = new Map<string, any>();
          dateAttRecords.forEach((a) => {
            const key = (a.user || '').trim().toLowerCase();
            if (key && !attMap.has(key)) attMap.set(key, a);
          });

          // Headcount metrics
          let breakfastTotal = 0;
          let morningSnacksTotal = 0;
          let lunchTotal = 0;
          let eveningSnacksTotal = 0;

          dateFoodRecords.forEach((f) => {
            if (f.meals?.breakfast) breakfastTotal++;
            if (f.meals?.morningSnacks) morningSnacksTotal++;
            if (f.meals?.lunch) lunchTotal++;
            if (f.meals?.eveningSnacks) eveningSnacksTotal++;
          });

          // Build roster combining onboarded employees + present employees + submitted meals
          const rosterMap = new Map<string, any>();

          employees.forEach((emp) => {
            const key = (emp.email || '').trim().toLowerCase();
            if (key) {
              const fRecord = foodMap.get(key);
              const aRecord = attMap.get(key);
              rosterMap.set(key, {
                email: emp.email,
                name: emp.name,
                id: emp.id,
                company: emp.company || 'kanagamtech',
                department: emp.department || 'General',
                photo: emp.photo,
                meals: fRecord?.meals || { breakfast: false, morningSnacks: false, lunch: false, eveningSnacks: false },
                hasSubmitted: !!fRecord,
                isPresent: !!aRecord,
                checkInTime: aRecord?.time,
              });
            }
          });

          // Add any food entry whose email isn't in employees
          dateFoodRecords.forEach((f) => {
            const key = (f.user || '').trim().toLowerCase();
            if (key && !rosterMap.has(key)) {
              const aRecord = attMap.get(key);
              rosterMap.set(key, {
                email: f.user,
                name: f.name || f.user.split('@')[0],
                id: 'EXT',
                company: 'kanagamtech',
                department: 'External / Contractor',
                meals: f.meals || { breakfast: false, morningSnacks: false, lunch: false, eveningSnacks: false },
                hasSubmitted: true,
                isPresent: !!aRecord,
                checkInTime: aRecord?.time,
              });
            }
          });

          const fullRoster = Array.from(rosterMap.values());

          // Filter by Company and Search
          const filteredRoster = fullRoster.filter((item) => {
            if (foodCompanyFilter !== 'ALL' && item.company?.toLowerCase() !== foodCompanyFilter.toLowerCase()) {
              return false;
            }
            if (foodSearch.trim()) {
              const q = foodSearch.toLowerCase();
              const mName = (item.name || '').toLowerCase().includes(q);
              const mEmail = (item.email || '').toLowerCase().includes(q);
              const mDept = (item.department || '').toLowerCase().includes(q);
              const mId = (item.id || '').toLowerCase().includes(q);
              if (!mName && !mEmail && !mDept && !mId) return false;
            }
            return true;
          });

          // Handler: Toggle single meal for employee
          const handleToggleMeal = async (userEmail: string, mealKey: 'breakfast' | 'morningSnacks' | 'lunch' | 'eveningSnacks', currentVal: boolean) => {
            const existing = foodMap.get(userEmail.toLowerCase());
            const currentMeals = existing?.meals || { breakfast: false, morningSnacks: false, lunch: false, eveningSnacks: false };
            const updatedMeals = { ...currentMeals, [mealKey]: !currentVal };

            const payload = {
              date: selectedDate,
              user: userEmail,
              meals: updatedMeals,
            };

            try {
              await api.saveFoodCount(payload);
              setFoodCounts((prev) => {
                const idx = prev.findIndex((f) => f.date === selectedDate && (f.user || '').toLowerCase() === userEmail.toLowerCase());
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = { ...copy[idx], meals: updatedMeals };
                  return copy;
                }
                return [{ id: `fc_${Date.now()}`, ...payload }, ...prev];
              });
              setFoodStatusMsg(`✅ Updated ${mealKey} for ${userEmail}`);
              setTimeout(() => setFoodStatusMsg(''), 2500);
            } catch (e: any) {
              setFoodStatusMsg(`❌ Failed to update meal: ${e.message}`);
            }
          };

          // Handler: Mark all present employees for lunch
          const handleMarkPresentLunch = async () => {
            setIsUpdatingFood(true);
            setFoodStatusMsg('⏳ Pre-filling Lunch for all present employees...');
            try {
              const presentItems = fullRoster.filter((r) => r.isPresent);
              for (const item of presentItems) {
                const updatedMeals = { ...(item.meals || {}), lunch: true };
                await api.saveFoodCount({ date: selectedDate, user: item.email, meals: updatedMeals });
              }
              const refreshed = await api.getFoodCounts();
              if (Array.isArray(refreshed)) {
                setFoodCounts(refreshed);
              }
              setFoodStatusMsg(`✅ Successfully marked Lunch for all ${presentItems.length} present employees!`);
              setTimeout(() => setFoodStatusMsg(''), 3500);
            } catch (e: any) {
              setFoodStatusMsg(`❌ Error: ${e.message}`);
            } finally {
              setIsUpdatingFood(false);
            }
          };

          // Handler: Export CSV
          const handleExportCSV = () => {
            const headers = ['Employee Name', 'EMP ID', 'Email', 'Company', 'Department', 'Date', 'Present', 'Lunch', 'Evening Snacks'];
            const rows = [headers.join(',')];
            filteredRoster.forEach((r) => {
              rows.push([
                `"${r.name || ''}"`,
                `"${r.id || ''}"`,
                `"${r.email || ''}"`,
                `"${r.company || ''}"`,
                `"${r.department || ''}"`,
                `"${selectedDate}"`,
                r.isPresent ? 'YES' : 'NO',
                r.meals?.lunch ? 'YES' : 'NO',
                r.meals?.eveningSnacks ? 'YES' : 'NO',
              ].join(','));
            });
            const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `kworks_food_count_${selectedDate}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          };

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <h2 style={{ ...styles.panelTitle, margin: 0, textAlign: 'left' }}>
                  🍱 Food Count — Meal Distribution &amp; Catering Orders
                </h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleMarkPresentLunch}
                    disabled={isUpdatingFood}
                    style={{
                      ...styles.btnPrimary,
                      backgroundColor: '#2E8B57',
                      color: '#FFFFFF',
                      width: 'auto',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 800,
                      marginTop: 0,
                      cursor: isUpdatingFood ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isUpdatingFood ? '⏳ Marking...' : '⚡ Mark All Present for Lunch'}
                  </button>
                  <button
                    onClick={handleExportCSV}
                    style={{
                      ...styles.btnPrimary,
                      backgroundColor: '#D7AB6A',
                      color: '#2B1022',
                      width: 'auto',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 800,
                      marginTop: 0,
                    }}
                  >
                    📥 Export Catering Sheet (CSV)
                  </button>
                </div>
              </div>

              {foodStatusMsg && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: foodStatusMsg.startsWith('✅') ? 'rgba(46,139,87,0.12)' : 'rgba(224,80,80,0.12)', color: foodStatusMsg.startsWith('✅') ? '#2E8B57' : '#E05050', fontWeight: 700, fontSize: '13px', marginBottom: '14px' }}>
                  {foodStatusMsg}
                </div>
              )}

              {/* KPI HEADCOUNT SUMMARY CARDS */}
              <div style={styles.chipsRow}>
                <div style={{ ...styles.chip, backgroundColor: 'rgba(46,139,87,0.15)', borderColor: '#2E8B57', minWidth: '130px' }}>
                  <div style={{ ...styles.chipValue, color: '#2E8B57' }}>🍱 {lunchTotal}</div>
                  <div style={styles.chipLabel}>Lunch Orders</div>
                </div>
                <div style={{ ...styles.chip, backgroundColor: 'rgba(230,81,0,0.12)', borderColor: '#E65100', minWidth: '130px' }}>
                  <div style={{ ...styles.chipValue, color: '#E65100' }}>🧃 {eveningSnacksTotal}</div>
                  <div style={styles.chipLabel}>Evening Snacks</div>
                </div>
                <div style={{ ...styles.chip, backgroundColor: '#F7EFE2', minWidth: '150px' }}>
                  <div style={{ ...styles.chipValue, color: '#2B1022' }}>👥 {dateFoodRecords.length} / {employees.length}</div>
                  <div style={styles.chipLabel}>Participating Employees</div>
                </div>
                <div style={{ ...styles.chip, backgroundColor: 'rgba(215,171,106,0.18)', borderColor: '#D7AB6A', minWidth: '150px' }}>
                  <div style={{ ...styles.chipValue, color: '#7A4F1D' }}>🍽️ {lunchTotal + eveningSnacksTotal}</div>
                  <div style={styles.chipLabel}>Total Meals Distributed</div>
                </div>
              </div>

              {/* DATE, COMPANY & SEARCH FILTER BAR */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', margin: '14px 0 20px', padding: '12px 16px', backgroundColor: '#F7EFE2', borderRadius: '12px', border: '1px solid #D7AB6A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#2B1022' }}>📅 DATE:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setFoodDate(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #D7AB6A', fontSize: '13px', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#2B1022' }}
                  />
                  <button
                    onClick={() => setFoodDate(todayStr)}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D7AB6A', backgroundColor: selectedDate === todayStr ? '#D7AB6A' : '#FFFFFF', color: selectedDate === todayStr ? '#2B1022' : '#7A4F1D', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Today
                  </button>
                </div>

                {allFoodDates.length > 0 && (
                  <select
                    value={selectedDate}
                    onChange={(e) => setFoodDate(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #D7AB6A', fontSize: '12px', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#2B1022' }}
                  >
                    {allFoodDates.map((d) => (
                      <option key={d} value={d}>
                        {d} ({foodCounts.filter((f) => f.date === d).length} meal records)
                      </option>
                    ))}
                  </select>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={foodCompanyFilter}
                    onChange={(e) => setFoodCompanyFilter(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D7AB6A', fontSize: '12px', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#2B1022' }}
                  >
                    <option value="ALL">🏢 All Companies</option>
                    {companies.map((c) => (
                      <option key={c} value={c}>🏢 {c}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    placeholder="🔍 Search employee name, email..."
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #D7AB6A', fontSize: '12px', width: '220px', backgroundColor: '#FFFFFF', color: '#2B1022' }}
                  />
                </div>
              </div>

              {/* EMPLOYEE MEAL ROSTER TABLE */}
              <div style={styles.listTitle}>
                EMPLOYEE MEAL DISTRIBUTION ROSTER ({filteredRoster.length} EMPLOYEES)
              </div>

              {filteredRoster.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#9C7B4E' }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
                    No employee records match the selected filters.
                  </p>
                  <p style={{ fontSize: '12px' }}>Try selecting a different date or clearing the search filter.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredRoster.map((emp, i) => {
                    const meals = emp.meals || {};
                    return (
                      <div
                        key={emp.email || i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: emp.hasSubmitted ? '1.5px solid #D7AB6A' : '1px solid #E5D4B8',
                          backgroundColor: emp.hasSubmitted ? '#FFFFFF' : 'rgba(247,239,226,0.4)',
                        }}
                      >
                        {/* Employee Identity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px' }}>
                          <div style={{ ...styles.thumbWrap, width: '42px', height: '42px', borderRadius: '21px', backgroundColor: '#F7EFE2', fontWeight: 800, fontSize: '15px', color: '#2B1022' }}>
                            {emp.photo ? (
                              <img src={emp.photo} alt={emp.name} style={styles.thumbImg} />
                            ) : (
                              (emp.name || emp.email || 'E').substring(0, 1).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={styles.empName}>{emp.name || emp.email}</span>
                              <span style={{ fontSize: '11px', color: '#9C7B4E', fontWeight: 700 }}>
                                ({emp.id || 'EMP'})
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(215,171,106,0.18)',
                                  color: '#7A4F1D',
                                  border: '1px solid #D7AB6A',
                                }}
                              >
                                🏢 {emp.company}
                              </span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#666', marginTop: '2px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <span>{emp.department} &middot; {emp.email}</span>
                              {emp.isPresent ? (
                                <span style={{ color: '#2E8B57', fontWeight: 800, fontSize: '11px' }}>
                                  ✓ Present ({emp.checkInTime || 'Checked in'})
                                </span>
                              ) : (
                                <span style={{ color: '#9C7B4E', fontSize: '11px' }}>
                                  Not Checked In
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Meal Toggles */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* Lunch */}
                          <button
                            onClick={() => handleToggleMeal(emp.email, 'lunch', !!meals.lunch)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: meals.lunch ? '1.5px solid #2E8B57' : '1px dashed #ccc',
                              backgroundColor: meals.lunch ? 'rgba(46,139,87,0.18)' : 'transparent',
                              color: meals.lunch ? '#2E8B57' : '#888',
                              fontWeight: meals.lunch ? 800 : 500,
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>🍱 Lunch</span>
                            <span>{meals.lunch ? '✅' : '⚪'}</span>
                          </button>

                          {/* Evening Snacks */}
                          <button
                            onClick={() => handleToggleMeal(emp.email, 'eveningSnacks', !!meals.eveningSnacks)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: meals.eveningSnacks ? '1.5px solid #E65100' : '1px dashed #ccc',
                              backgroundColor: meals.eveningSnacks ? 'rgba(230,81,0,0.15)' : 'transparent',
                              color: meals.eveningSnacks ? '#E65100' : '#888',
                              fontWeight: meals.eveningSnacks ? 800 : 500,
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>🧃 Evening</span>
                            <span>{meals.eveningSnacks ? '✅' : '⚪'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 4: LEAVE APPROVAL */}
        {activeTab === 'leaves' && (
          <div>
            <h2 style={styles.panelTitle}>Leave Requests &amp; Approvals</h2>
            
            {role !== 'manager' && role !== 'hr' && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(215,171,106,0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#9C7B4E' }}>
                🔒 Read-Only Mode. Only Managers and HR can approve or reject employee leave requests.
              </div>
            )}

            <div style={styles.listTitle}>LEAVE REQUESTS</div>
            {Object.keys(leaves).length === 0 ? (
              <p style={styles.emptyText}>No leave requests submitted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(leaves).map(([k, r]: [string, any]) => {
                  const parts = k.split('_');
                  const dateStr = parts[0];
                  const emailStr = parts[1] || r.email || 'unknown';
                  const isPending = (r.status || 'pending') === 'pending';
                  const statusText = (r.status || 'pending').toUpperCase();

                  const statusBg =
                    r.status === 'approved'
                      ? 'rgba(46,139,87,0.1)'
                      : r.status === 'cancelled' || r.status === 'rejected'
                      ? 'rgba(224,80,80,0.1)'
                      : 'rgba(215,171,106,0.1)';
                  const statusColor =
                    r.status === 'approved'
                      ? '#2E8B57'
                      : r.status === 'cancelled' || r.status === 'rejected'
                      ? '#E05050'
                      : '#9C7B4E';

                  return (
                    <div key={k} style={{ ...styles.listRow, flexDirection: 'column', alignItems: 'stretch', padding: '14px 16px', borderRadius: '12px', border: '1px solid #D7AB6A', backgroundColor: '#FFFFFF', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#D7AB6A', letterSpacing: '0.5px' }}>
                          📅 {dateStr}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', backgroundColor: statusBg, color: statusColor }}>
                          {statusText}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '13px', color: '#2B1022', lineHeight: '1.5' }}>
                        <strong>Employee:</strong> {r.user} ({emailStr}) <br />
                        <strong>Type:</strong> {r.type || 'General Leave'} <br />
                        <strong>Reason:</strong> {r.reason || 'None stated'}
                      </div>

                      {isPending && (role === 'manager' || role === 'hr') && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <button
                            onClick={() => handleUpdateLeave(k, 'approved')}
                            style={{ flex: 1, backgroundColor: '#2E8B57', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}
                          >
                            Approve Leave
                          </button>
                          <button
                            onClick={() => handleUpdateLeave(k, 'rejected')}
                            style={{ flex: 1, backgroundColor: '#E05050', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}
                          >
                            Reject Leave
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ANNOUNCEMENTS */}
        {activeTab === 'notices' && (
          <div>
            <h2 style={styles.panelTitle}>Announcements &amp; Management Notices</h2>
            <div style={styles.colCard}>
              <h3 style={styles.cardTitle}>CREATE ANNOUNCEMENT</h3>
              <form onSubmit={handleCreateNotice}>
                <label style={styles.fieldLabel}>TITLE</label>
                <input style={styles.fieldInput} value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="Title..." />

                <label style={styles.fieldLabel}>MESSAGE</label>
                <textarea style={{ ...styles.fieldInput, height: '80px' }} value={noticeBody} onChange={(e) => setNoticeBody(e.target.value)} placeholder="Message..." />

                <button type="submit" style={styles.btnPrimary}>Publish Announcement</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: POLLS */}
        {activeTab === 'polls' && (
          <div>
            <h2 style={styles.panelTitle}>Polls — created by HR &amp; Management</h2>
            <div style={styles.colCard}>
              <h3 style={styles.cardTitle}>CREATE POLL</h3>
              <form onSubmit={handleCreatePoll}>
                <label style={styles.fieldLabel}>POLL QUESTION</label>
                <input style={styles.fieldInput} value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Question..." />
                <button type="submit" style={styles.btnPrimary}>Create Poll</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: IT SUPPORT */}
        {activeTab === 'tickets' && (
          <div>
            <h2 style={styles.panelTitle}>IT Support Mail &amp; Tickets</h2>
            {tickets.length === 0 ? (
              <p style={styles.emptyText}>No IT support mails delivered yet.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} style={styles.listRow}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.empName}>{t.subject}</div>
                    <div style={styles.empSub}>From: {t.from}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 8: CLAIMS & ADVANCES */}
        {activeTab === 'claims' && (
          <div>
            <h2 style={styles.panelTitle}>Claims &amp; Advances Approval Panel</h2>
            
            {role === 'manager' && (
              <div style={{ backgroundColor: 'rgba(215,171,106,0.1)', border: '1px solid #D7AB6A', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#9C7B4E' }}>
                💡 You are logged in as <strong>Executive Manager</strong>. You have authority to Approve/Reject Stage 1 claims. Approved claims automatically route to the Accounts Team.
              </div>
            )}
            
            {role === 'finance' && (
              <div style={{ backgroundColor: 'rgba(215,171,106,0.1)', border: '1px solid #D7AB6A', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#9C7B4E' }}>
                💡 You are logged in as <strong>Accounts Manager</strong>. You have authority to disburse funds for Stage 2 claims that have been pre-approved by Managers.
              </div>
            )}

            {role !== 'manager' && role !== 'finance' && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(215,171,106,0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#9C7B4E' }}>
                🔒 Read-Only Mode. Only Managers and Accounts Team can approve or reject financial requests.
              </div>
            )}

            {claims.length === 0 ? (
              <p style={styles.emptyText}>No claims or advance requests submitted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {claims.map((c) => {
                  const isManagerPending = c.status.manager === 'pending';
                  const isFinancePending = c.status.manager === 'approved' && c.status.finance === 'pending';

                  return (
                    <div key={c.id} style={{ ...styles.listRow, flexDirection: 'column', alignItems: 'stretch', padding: '16px', gap: '12px', border: '1px solid #D7AB6A', borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#9C7B4E', letterSpacing: '0.5px' }}>
                            {c.type.toUpperCase()} REQUEST &middot; {c.id}
                          </span>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#2B1022', marginTop: '2px' }}>
                            ₹{c.amount}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', backgroundColor: c.status.manager === 'approved' ? 'rgba(46,139,87,0.1)' : c.status.manager === 'rejected' ? 'rgba(224,80,80,0.1)' : 'rgba(0,0,0,0.05)', color: c.status.manager === 'approved' ? '#2E8B57' : c.status.manager === 'rejected' ? '#E05050' : '#9C7B4E' }}>
                            Manager: {c.status.manager.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', backgroundColor: c.status.finance === 'approved' ? 'rgba(46,139,87,0.1)' : c.status.finance === 'rejected' ? 'rgba(224,80,80,0.1)' : 'rgba(0,0,0,0.05)', color: c.status.finance === 'approved' ? '#2E8B57' : c.status.finance === 'rejected' ? '#E05050' : '#9C7B4E' }}>
                            Accounts: {c.status.finance.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: '#2B1022', lineHeight: '1.5' }}>
                        <strong>Employee:</strong> {c.user} &middot; <strong>Date:</strong> {c.date} <br />
                        <strong>Purpose:</strong> {c.purpose || 'No purpose listed'}
                      </div>

                      {c.photo && (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9C7B4E', marginBottom: '4px' }}>RECEIPT / BILL ATTACHMENT</div>
                          <img src={c.photo} alt="Receipt attachment" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', border: '1px dashed #D7AB6A' }} />
                        </div>
                      )}

                      {/* Action buttons */}
                      {isManagerPending && role === 'manager' && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                          <button
                            onClick={() => handleUpdateClaim(c.id, 'manager', 'approved')}
                            style={{ flex: 1, backgroundColor: '#2E8B57', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}
                          >
                            Approve (Send to Accounts)
                          </button>
                          <button
                            onClick={() => handleUpdateClaim(c.id, 'manager', 'rejected')}
                            style={{ flex: 1, backgroundColor: '#E05050', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}
                          >
                            Reject Claim
                          </button>
                        </div>
                      )}

                      {isFinancePending && role === 'finance' && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                          <button
                            onClick={() => handleUpdateClaim(c.id, 'finance', 'approved')}
                            style={{ flex: 1, backgroundColor: '#2E8B57', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}
                          >
                            Approve &amp; Release Funds
                          </button>
                          <button
                            onClick={() => handleUpdateClaim(c.id, 'finance', 'rejected')}
                            style={{ flex: 1, backgroundColor: '#E05050', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}
                          >
                            Reject Claim
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 9: APP UPDATES & OVER-THE-AIR (OTA) MANAGER */}
        {activeTab === 'updates' && (
          <div>
            <h2 style={styles.panelTitle}>🚀 Mobile App Update &amp; Remote Deployment Center</h2>

            <div style={{ backgroundColor: 'rgba(215,171,106,0.12)', border: '1px solid #D7AB6A', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#31122B', marginBottom: '6px' }}>
                CURRENT LIVE APP VERSION ON USER PHONES
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ backgroundColor: '#31122B', color: '#D7AB6A', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '18px', letterSpacing: '1px' }}>
                  v{appUpdate?.version || '1.0.0'}
                </div>
                <div style={{ fontSize: '13px', color: '#31122B' }}>
                  <strong>Title:</strong> {appUpdate?.title || 'Production Initial'} &middot;{' '}
                  <strong>Published:</strong> {appUpdate?.publishedAt ? new Date(appUpdate.publishedAt).toLocaleString() : 'Active'} &middot;{' '}
                  <strong>Mandatory Lock:</strong> {appUpdate?.mandatory ? 'YES (Forced Update)' : 'NO (Flexible)'}
                </div>
              </div>
            </div>

            <div style={styles.colsTwo}>
              {/* Broadcast New Update Form */}
              <div style={styles.colCard}>
                <h3 style={styles.cardTitle}>BROADCAST NEW CODE UPDATE TO ALL USER PHONES</h3>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
                  When you broadcast an update, all connected mobile devices running the KwOrKs app will receive an instant update prompt with your changelog and automatically reload the new code.
                </p>

                <form onSubmit={handlePublishAppUpdate}>
                  <label style={styles.fieldLabel}>NEW VERSION TAG *</label>
                  <input
                    style={styles.fieldInput}
                    value={updateVersion}
                    onChange={(e) => setUpdateVersion(e.target.value)}
                    placeholder="e.g. 1.0.1 or 1.1.0"
                    required
                  />

                  <label style={styles.fieldLabel}>UPDATE HEADLINE / TITLE *</label>
                  <input
                    style={styles.fieldInput}
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                    placeholder="e.g. ⚡ Biometric Scan & Shift Sync Upgrade"
                    required
                  />

                  <label style={styles.fieldLabel}>RELEASE NOTES / CHANGELOG</label>
                  <textarea
                    style={{ ...styles.fieldInput, minHeight: '90px', fontFamily: 'inherit', resize: 'vertical' }}
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="• Bullet points of new features and bug fixes..."
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
                    <input
                      type="checkbox"
                      id="mandatoryCheck"
                      checked={updateMandatory}
                      onChange={(e) => setUpdateMandatory(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="mandatoryCheck" style={{ fontSize: '13px', fontWeight: 700, color: '#31122B', cursor: 'pointer' }}>
                      Force Mandatory Update (Users must apply update before accessing workspace)
                    </label>
                  </div>

                  <label style={styles.fieldLabel}>DIRECT APK DOWNLOAD URL (OPTIONAL FOR MAJOR NATIVE BUILDS)</label>
                  <input
                    style={styles.fieldInput}
                    value={updateApkUrl}
                    onChange={(e) => setUpdateApkUrl(e.target.value)}
                    placeholder="https://.../kworks-v1.0.1.apk"
                  />

                  <button
                    type="submit"
                    disabled={isPublishingUpdate}
                    style={{
                      ...styles.btnPrimary,
                      backgroundColor: '#31122B',
                      color: '#D7AB6A',
                      border: '1.5px solid #D7AB6A',
                      padding: '14px',
                      fontSize: '15px',
                      fontWeight: 800,
                      marginTop: '10px',
                    }}
                  >
                    {isPublishingUpdate ? '⏳ Broadcasting to User Phones...' : '🚀 Broadcast Code Update to All User Phones'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAppUpdate}
                    disabled={isPublishingUpdate}
                    style={{
                      ...styles.btnPrimary,
                      backgroundColor: '#8B0000',
                      color: '#FFFFFF',
                      border: '1.5px solid #FF6B6B',
                      padding: '12px',
                      fontSize: '13px',
                      fontWeight: 800,
                      marginTop: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    🛑 Stop Broadcast &amp; Reset to v1.0.0 (Stop All Popup Loops)
                  </button>

                  {updateStatusMsg && (
                    <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 700, color: updateStatusMsg.startsWith('✅') ? '#2E8B57' : '#E05050' }}>
                      {updateStatusMsg}
                    </p>
                  )}
                </form>
              </div>

              {/* Live Info & OTA Guide Card */}
              <div style={styles.colCard}>
                <h3 style={styles.cardTitle}>HOW SELF-UPDATE WORKS IN KWORKS</h3>
                <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px' }}>📲</span>
                    <div>
                      <strong>1. Real-Time Update Detection:</strong>
                      <p style={{ margin: '2px 0 0', color: '#666' }}>The KwOrKs mobile app continuously monitors the backend for new releases broadcasted from this dashboard.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px' }}>⚡</span>
                    <div>
                      <strong>2. Automatic In-App Reload:</strong>
                      <p style={{ margin: '2px 0 0', color: '#666' }}>Users receive an interactive update prompt showing your changelog. Tapping update instantly refreshes the runtime bundle.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px' }}>🔒</span>
                    <div>
                      <strong>3. Mandatory Version Locks:</strong>
                      <p style={{ margin: '2px 0 0', color: '#666' }}>If a critical fix or attendance policy changes, checking "Mandatory Update" prevents shift check-in until updated.</p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(46,139,87,0.08)', border: '1px solid rgba(46,139,87,0.3)', borderRadius: '8px', padding: '12px', marginTop: '6px' }}>
                    <span style={{ color: '#2E8B57', fontWeight: 800 }}>✔ Ready for Production Deployment</span>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#2E8B57' }}>
                      Broadcast signals are dispatched instantly over your Coolify VPS API to all Android and iOS user devices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUCCESS CREATED EMPLOYEE CREDENTIAL POPUP MODAL */}
      {createdEmpCreds && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.loginCard, maxWidth: '460px', textAlign: 'center', border: '2px solid #D7AB6A' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#2B1022', marginBottom: '4px' }}>
              🎉 EMPLOYEE ACCOUNT CREATED!
            </h2>
            <p style={{ fontSize: '12px', color: '#9C7B4E', marginBottom: '16px' }}>
              Share these login credentials with the employee to sign in on the mobile app
            </p>

            <div style={{ backgroundColor: '#F7EFE2', border: '1px solid #D7AB6A', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#9C7B4E', marginBottom: '4px' }}>EMPLOYEE NAME</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#2B1022', marginBottom: '10px' }}>
                {createdEmpCreds.name} <span style={{ fontSize: '12px', color: '#9C7B4E' }}>({createdEmpCreds.id})</span>
              </div>

              <div style={{ fontSize: '12px', color: '#9C7B4E', marginBottom: '4px' }}>LOGIN EMAIL</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#2B1022', marginBottom: '10px' }}>
                {createdEmpCreds.email}
              </div>

              <div style={{ fontSize: '12px', color: '#9C7B4E', marginBottom: '4px' }}>LOGIN PASSWORD</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#4B1D3F', backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D7AB6A', display: 'inline-block' }}>
                {createdEmpCreds.password}
              </div>

              <div style={{ fontSize: '11.5px', color: '#9C7B4E', marginTop: '10px' }}>
                Role: {createdEmpCreds.role} &middot; Department: {createdEmpCreds.department}
              </div>
            </div>

            <button
              style={styles.btnPrimary}
              onClick={() => {
                navigator.clipboard?.writeText?.(
                  `KwOrKs Employee Login:\nEmail: ${createdEmpCreds.email}\nPassword: ${createdEmpCreds.password}`
                );
                setCreatedEmpCreds(null);
              }}
            >
              Copy Credentials &amp; Close
            </button>
          </div>
        </div>
      )}

      {/* EDIT ROLE & CREDENTIALS MODAL */}
      {editingUser && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.loginCard, maxWidth: '520px', border: '2px solid #D7AB6A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#2B1022' }}>
                ✏️ EDIT ROLE &amp; CREDENTIALS
              </h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#999', cursor: 'pointer', fontWeight: 800, padding: '0 4px' }}
              >
                &times;
              </button>
            </div>
            <p style={{ fontSize: '12.5px', color: '#9C7B4E', marginBottom: '16px' }}>
              Change role type or set a custom password to permanently replace the default login credential for <strong>{editingUser.name}</strong>.
            </p>

            <form onSubmit={handleSaveEditUser}>
              <label style={styles.fieldLabel}>FULL NAME *</label>
              <input
                style={styles.fieldInput}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <label style={styles.fieldLabel}>EMAIL ADDRESS *</label>
              <input
                type="email"
                style={styles.fieldInput}
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />

              <label style={styles.fieldLabel}>CHANGE ROLE TYPE *</label>
              <select
                style={{ ...styles.fieldInput, height: '42px', cursor: 'pointer', fontWeight: 700 }}
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as Role)}
              >
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]} — ({ROLE_DESCRIPTIONS[r]})
                  </option>
                ))}
              </select>

              <label style={styles.fieldLabel}>DEPARTMENT</label>
              <input
                style={styles.fieldInput}
                value={editDept}
                onChange={(e) => setEditDept(e.target.value)}
                placeholder="e.g. IT, Management, Human Resources"
              />

              <label style={styles.fieldLabel}>NEW PASSWORD (OPTIONAL)</label>
              <input
                type="password"
                style={styles.fieldInput}
                value={editPass}
                onChange={(e) => setEditPass(e.target.value)}
                placeholder="Leave blank to keep existing password"
                autoComplete="new-password"
              />
              <p style={{ fontSize: '11px', color: '#9C7B4E', marginTop: '4px' }}>
                💡 Entering a new password here will permanently replace the default credential for this account.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  style={{ ...styles.btnPrimary, marginTop: 0 }}
                >
                  {isSavingUser ? '⏳ Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{ ...styles.btnGhost, color: '#666', borderColor: '#ccc', width: 'auto', padding: '10px 18px', marginTop: 0 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: { padding: '18px', maxWidth: '1240px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' },
  siteTitle: { fontSize: '22px', fontWeight: 800, letterSpacing: '1.5px', color: '#FFFFFF' },
  siteSub: { color: '#E5D4B8', fontSize: '12px', marginTop: '3px' },
  roleBadge: { backgroundColor: '#F7EFE2', border: '1px solid #D7AB6A', color: '#2B1022', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 },
  btnGhost: { backgroundColor: 'transparent', border: '1px solid #FFFFFF', borderRadius: '10px', color: '#FFFFFF', fontSize: '13px', fontWeight: 800, padding: '9px 16px', cursor: 'pointer' },
  keysBar: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', width: '100%' },
  keyCard: { flex: '1 1 0', minWidth: '120px', backgroundColor: '#FFFFFF', border: '2px solid #D7AB6A', borderRadius: '14px', padding: '12px 8px', cursor: 'pointer', textAlign: 'center', transition: 'background 0.15s' },
  keyCardActive: { borderColor: '#FFFFFF', backgroundColor: '#D7AB6A' },
  keyLabel: { fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', color: '#2B1022' },
  keyLabelActive: { color: '#FFFFFF' },
  keyStat: { color: '#9C7B4E', fontSize: '11.5px', marginTop: '5px' },
  keyStatActive: { color: '#E5D4B8' },
  panelContainer: { backgroundColor: '#FFFFFF', border: '2px solid #D7AB6A', borderRadius: '18px', padding: '22px', width: '100%', color: '#2B1022' },
  panelTitle: { fontSize: '16px', fontWeight: 800, marginBottom: '16px', textAlign: 'center', color: '#2B1022' },
  colsTwo: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  colCard: { flex: 1, minWidth: '320px', backgroundColor: '#F7EFE2', border: '1px solid #D7AB6A', padding: '18px', borderRadius: '14px' },
  cardTitle: { fontSize: '13px', fontWeight: 800, color: '#2B1022', marginBottom: '12px', letterSpacing: '0.8px' },
  fieldLabel: { display: 'block', fontSize: '11px', fontWeight: 800, color: '#9C7B4E', marginTop: '10px', marginBottom: '4px', letterSpacing: '0.5px' },
  fieldInput: { width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #D7AB6A', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#2B1022' },
  fileBtn: { width: '100%', marginTop: '6px', color: '#2B1022' },
  photoPreview: { width: '64px', height: '64px', borderRadius: '32px', marginTop: '10px', display: 'block' },
  btnPrimary: { width: '100%', backgroundColor: '#D7AB6A', border: 'none', borderRadius: '10px', color: '#2B1022', fontSize: '13px', fontWeight: 800, padding: '12px', cursor: 'pointer', marginTop: '16px' },
  statusOkText: { color: '#2B1022', fontSize: '12.5px', fontWeight: 800, marginTop: '8px' },
  countBadge: { fontSize: '12px', color: '#9C7B4E', fontWeight: 800, margin: '10px 0' },
  listRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #E5D4B8', fontSize: '13px' },
  thumbWrap: { width: '36px', height: '36px', borderRadius: '18px', backgroundColor: '#FFFFFF', border: '1px solid #D7AB6A', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  dot: { width: '10px', height: '10px', borderRadius: '5px', backgroundColor: '#D7AB6A' },
  empName: { fontWeight: 800, color: '#2B1022', fontSize: '13px' },
  empSub: { color: '#9C7B4E', fontSize: '11.5px', marginTop: '2px' },
  delBtn: { backgroundColor: 'transparent', border: 'none', color: '#E08A8A', fontSize: '18px', cursor: 'pointer', fontWeight: 800, padding: '0 6px' },
  emptyText: { color: '#9C7B4E', fontSize: '12.5px', fontStyle: 'italic', margin: '10px 0' },
  chipsRow: { display: 'flex', justifyContent: 'center', gap: '10px', margin: '16px 0', flexWrap: 'wrap' },
  chip: { backgroundColor: '#F7EFE2', border: '1px solid #D7AB6A', borderRadius: '12px', padding: '9px 15px', textAlign: 'center', minWidth: '92px' },
  chipValue: { fontSize: '18px', fontWeight: 800, color: '#2B1022' },
  chipLabel: { fontSize: '10.5px', color: '#9C7B4E', marginTop: '2px' },
  listTitle: { fontSize: '12px', fontWeight: 800, letterSpacing: '1.2px', color: '#D7AB6A', margin: '18px 0 8px' },
  statusChip: { display: 'inline-block', borderRadius: '6px', padding: '2px 8px', backgroundColor: '#D7AB6A', color: '#FFFFFF', fontSize: '9.5px', fontWeight: 800 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(75,29,63,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  loginCard: { backgroundColor: '#FFFFFF', border: '2px solid #D7AB6A', borderRadius: '18px', padding: '28px', maxWidth: '420px', width: '100%', color: '#2B1022' },
  loginTitle: { fontSize: '18px', fontWeight: 800, color: '#2B1022', textAlign: 'center' },
  loginSub: { fontSize: '12px', color: '#9C7B4E', textAlign: 'center', marginTop: '4px', marginBottom: '16px' },
  roleChips: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' },
  roleChip: { padding: '6px 12px', borderRadius: '8px', backgroundColor: '#F7EFE2', border: '1px solid #D7AB6A', color: '#9C7B4E', cursor: 'pointer', fontSize: '11px', fontWeight: 800 },
  roleChipActive: { backgroundColor: '#D7AB6A', color: '#FFFFFF' },
  errorText: { color: '#E08A8A', fontSize: '12px', marginTop: '10px' },
};
