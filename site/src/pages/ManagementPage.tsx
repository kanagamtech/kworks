import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

type Role = 'admin' | 'manager' | 'hr' | 'it' | 'finance';

const SITE_CREDS: Record<Role, { email: string; pass: string }> = {
  admin: { email: 'admin@kworks.com', pass: 'admin123' },
  manager: { email: 'manager@kworks.com', pass: 'manager123' },
  hr: { email: 'hr@kworks.com', pass: 'hr123' },
  it: { email: 'itsupport@kworks.com', pass: 'itsupport123' },
  finance: { email: 'finance@kworks.com', pass: 'finance123' },
};

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  hr: 'HR Executive',
  it: 'IT Support',
  finance: 'Finance Manager',
};

export const ManagementPage: React.FC = () => {
  // Auth State
  const [role, setRole] = useState<Role | null>('manager');
  const [loginRole, setLoginRole] = useState<Role>('manager');
  const [loginEmail, setLoginEmail] = useState(SITE_CREDS.manager.email);
  const [loginPass, setLoginPass] = useState(SITE_CREDS.manager.pass);
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'onboarding' | 'attendance' | 'food' | 'leaves' | 'notices' | 'polls' | 'tickets' | 'claims'>('onboarding');

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

  const loadAllData = async () => {
    const [emps, atts, foods, lvs, nots, pls, tks, clms, cmps] = await Promise.all([
      api.getEmployees(),
      api.getAttendance(),
      api.getFoodCounts(),
      api.getLeaves(),
      api.getNotices(),
      api.getPolls(),
      api.getTickets(),
      api.getClaims(),
      api.getCompanies(),
    ]);
    setEmployees(emps);
    setAttendance(atts);
    setFoodCounts(foods);
    setLeaves(lvs);
    setNotices(nots);
    setPolls(pls);
    setTickets(tks);
    setClaims(clms);
    if (Array.isArray(cmps) && cmps.length > 0) {
      setCompanies(cmps);
      if (!cmps.includes(empCompany)) {
        setEmpCompany(cmps[0]);
      }
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cred = SITE_CREDS[loginRole];
    if (loginEmail.trim().toLowerCase() === cred.email && loginPass === cred.pass) {
      setRole(loginRole);
      setLoginError('');
    } else {
      setLoginError('Invalid management email or password.');
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
              {(['manager', 'hr', 'admin', 'it', 'finance'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  style={{ ...styles.roleChip, ...(loginRole === r ? styles.roleChipActive : {}) }}
                  onClick={() => {
                    setLoginRole(r);
                    setLoginEmail(SITE_CREDS[r].email);
                    setLoginPass(SITE_CREDS[r].pass);
                  }}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            <label style={styles.fieldLabel}>EMAIL ADDRESS</label>
            <input
              style={styles.fieldInput}
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="e.g. manager@kworks.com"
            />

            <label style={styles.fieldLabel}>PASSWORD</label>
            <input
              type="password"
              style={styles.fieldInput}
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="Enter password"
            />

            {loginError && <p style={styles.errorText}>{loginError}</p>}

            <button type="submit" style={styles.btnPrimary}>Login to Management Portal</button>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.roleBadge}>{ROLE_LABELS[role]} &middot; {loginEmail}</div>
          <button style={styles.btnGhost} onClick={loadAllData}>Refresh</button>
          <button style={styles.btnGhost} onClick={() => setRole(null)}>Logout</button>
        </div>
      </header>

      {/* Top Dashboard Navigation Keys Bar (Classic Cards) */}
      <div style={styles.keysBar}>
        {[
          { id: 'onboarding', label: 'EMPLOYEE ONBOARDING', stat: `${employees.length} onboarded` },
          { id: 'attendance', label: 'ATTENDANCE', stat: `${attendance.length} logged` },
          { id: 'food', label: 'FOOD COUNT', stat: `${foodCounts.length} days` },
          { id: 'leaves', label: 'LEAVE APPROVAL', stat: `${Object.keys(leaves).length} requests` },
          { id: 'notices', label: 'ANNOUNCEMENTS', stat: `${notices.length} published` },
          { id: 'polls', label: 'POLLS', stat: `${polls.length} active` },
          { id: 'tickets', label: 'IT SUPPORT', stat: `${tickets.length} tickets` },
          { id: 'claims', label: 'CLAIMS & ADVANCES', stat: `${claims.filter((c) => c.status.manager === 'pending' || (c.status.manager === 'approved' && c.status.finance === 'pending')).length} pending` },
        ].map((key) => (
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
          // Calculate Common Stats
          // Group by Date for daily check-ins chart
          const dailyMap: Record<string, number> = {};
          attendance.forEach((r) => {
            const dateStr = r.date || 'Unknown';
            dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
          });
          const last5Days = Object.keys(dailyMap)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            .slice(-5);
          const maxDailyCount = Math.max(...Object.values(dailyMap), 1);

          // Group by Location for location breakdown chart
          const locMap: Record<string, number> = {};
          attendance.forEach((r) => {
            const locStr = r.location || 'Location unknown';
            locMap[locStr] = (locMap[locStr] || 0) + 1;
          });

          // Individual stats calculation
          const employeeRecs = selectedEmpEmail
            ? attendance.filter((r) => r.user?.toLowerCase() === selectedEmpEmail.toLowerCase())
            : [];

          return (
            <div>
              <h2 style={styles.panelTitle}>Attendance — Common &amp; Individual Analytics</h2>

              {/* Analytics Header Chips */}
              <div style={styles.chipsRow}>
                <div style={styles.chip}>
                  <div style={styles.chipValue}>{attendance.length}</div>
                  <div style={styles.chipLabel}>Total Marks</div>
                </div>
                <div style={styles.chip}>
                  <div style={styles.chipValue}>{employees.length}</div>
                  <div style={styles.chipLabel}>Employees Onboarded</div>
                </div>
                <div style={styles.chip}>
                  <div style={styles.chipValue}>{Object.keys(dailyMap).length}</div>
                  <div style={styles.chipLabel}>Active Days</div>
                </div>
              </div>

              {/* Two Column Layout: Visual Charts vs Individual Tracker */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
                
                {/* COLUMN 1: COMMON ANALYTICS (VISUAL CHARTS) */}
                <div style={{ ...styles.colCard, flex: '1 1 500px' }}>
                  <h3 style={styles.cardTitle}>📊 COMPANY-WIDE ATTENDANCE CHARTS</h3>
                  
                  {/* Daily Trend Chart (CSS Bar Chart) */}
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

                  {/* Location Analysis Progress Bars */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#9C7B4E', marginBottom: '10px' }}>LOCATION REPRESENTATION</div>
                    {Object.keys(locMap).length === 0 ? (
                      <p style={{ ...styles.emptyText, fontSize: '11px' }}>No location data logged yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.keys(locMap).map((loc) => {
                          const count = locMap[loc];
                          const pct = (count / attendance.length) * 100;
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

                {/* COLUMN 2: INDIVIDUAL SEARCH & TRACKER */}
                <div style={{ ...styles.colCard, flex: '1 1 450px' }}>
                  <h3 style={styles.cardTitle}>👤 INDIVIDUAL EMPLOYEE ATTENDANCE CARD</h3>
                  
                  <label style={styles.fieldLabel}>SELECT EMPLOYEE</label>
                  <select
                    style={{ ...styles.fieldInput, cursor: 'pointer' }}
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
                    return (
                      <div style={{ marginTop: '20px', border: '1px solid #D7AB6A', borderRadius: '12px', padding: '16px', backgroundColor: '#FFFFFF' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                          <div style={{ ...styles.thumbWrap, width: '48px', height: '48px', borderRadius: '24px' }}>
                            {emp?.photo ? (
                              <img src={emp.photo} alt="" style={styles.thumbImg} />
                            ) : (
                              <div style={{ ...styles.dot, width: '14px', height: '14px', borderRadius: '7px' }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#2B1022' }}>{emp?.name || 'Unknown Employee'}</div>
                            <div style={{ fontSize: '12px', color: '#9C7B4E' }}>{emp?.role} &middot; {emp?.department}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                          <div style={{ flex: 1, backgroundColor: '#F7EFE2', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#2B1022' }}>{employeeRecs.length}</div>
                            <div style={{ fontSize: '10px', color: '#9C7B4E', marginTop: '2px' }}>Total Logs</div>
                          </div>
                          <div style={{ flex: 1, backgroundColor: '#F7EFE2', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#2E8B57' }}>
                              {employeeRecs.length > 0 ? 'Active' : 'No Logs'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#9C7B4E', marginTop: '2px' }}>Status</div>
                          </div>
                        </div>

                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#9C7B4E', marginBottom: '6px' }}>INDIVIDUAL LOGS</div>
                        {employeeRecs.length === 0 ? (
                          <p style={{ color: '#9C7B4E', fontSize: '12px', fontStyle: 'italic' }}>No check-in logs registered for this employee yet.</p>
                        ) : (
                          <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {employeeRecs.map((rec, idx) => (
                              <div key={idx} style={{ backgroundColor: 'rgba(75,29,63,0.03)', padding: '8px 10px', borderRadius: '6px', fontSize: '11.5px', border: '1px solid rgba(215,171,106,0.2)' }}>
                                <strong>{rec.date}</strong> &middot; {rec.time} <br />
                                <span style={{ color: '#9C7B4E' }}>📍 {rec.location || 'Location unknown'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <p style={{ ...styles.emptyText, textAlign: 'center', marginTop: '24px' }}>Select an employee from the dropdown list to see their detailed attendance history and card profile.</p>
                  )}
                </div>

              </div>

              {/* LATEST RECORD LOGS SECTION */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '28px 0 12px 0' }}>
                <div style={styles.listTitle}>LATEST ATTENDANCE LOGS</div>
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
                          <div style={styles.empName}>{r.name || r.user} &middot; {r.time}</div>
                          <div style={styles.empSub}>
                            📍 {r.location || 'Location unknown'} &middot; {r.date}
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
          );
        })()}

        {/* TAB 3: FOOD COUNT */}
        {activeTab === 'food' && (
          <div>
            <h2 style={styles.panelTitle}>Food Count — meal distribution</h2>
            <div style={styles.listTitle}>SUBMITTED MEAL ENTRIES</div>
            {foodCounts.length === 0 ? (
              <p style={styles.emptyText}>No food counts submitted yet.</p>
            ) : (
              foodCounts.map((f, i) => (
                <div key={i} style={styles.listRow}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.empName}>{f.user}</div>
                    <div style={styles.empSub}>
                      Date: {f.date} &nbsp;&middot;&nbsp; 
                      Breakfast: {f.meals?.breakfast ? '✅' : '❌'} &nbsp;&middot;&nbsp; 
                      Morning Snacks: {f.meals?.morningSnacks ? '✅' : '❌'} &nbsp;&middot;&nbsp; 
                      Lunch: {f.meals?.lunch ? '✅' : '❌'} &nbsp;&middot;&nbsp; 
                      Evening Snacks: {f.meals?.eveningSnacks ? '✅' : '❌'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

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
                💡 You are logged in as <strong>Executive Manager</strong>. You have authority to Approve/Reject Stage 1 claims. Approved claims automatically route to the Finance Team.
              </div>
            )}
            
            {role === 'finance' && (
              <div style={{ backgroundColor: 'rgba(215,171,106,0.1)', border: '1px solid #D7AB6A', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#9C7B4E' }}>
                💡 You are logged in as <strong>Finance Manager</strong>. You have authority to disburse funds for Stage 2 claims that have been pre-approved by Managers.
              </div>
            )}

            {role !== 'manager' && role !== 'finance' && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(215,171,106,0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#9C7B4E' }}>
                🔒 Read-Only Mode. Only Managers and Finance Team can approve or reject financial requests.
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
                            Finance: {c.status.finance.toUpperCase()}
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
                            Approve (Send to Finance)
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
