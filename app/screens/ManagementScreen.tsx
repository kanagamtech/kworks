import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Text from '../components/AppText';
import MorningBackground from '../components/MorningBackground';
import { useResponsive } from '../hooks/useResponsive';
import { todayKey } from '../utils/records';
import { API_BASE } from '../utils/config';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#F7EFE2',
  primaryDark: '#31122B',
  bgMain: '#31122B',
  cardBg: 'rgba(42,16,36,0.65)',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  inputBg: 'rgba(26,9,22,0.6)',
  border: '#4A2040',
  success: '#2E8B57',
  danger: '#E05050',
};

type Props = { onBack: () => void };

type Employee = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  department: string;
  photo?: string;
  joinDate?: string;
};

type Role = 'admin' | 'manager' | 'hr' | 'it' | 'finance';

const SITE_CREDS: Record<Role, { email: string; pass: string }> = {
  admin: { email: 'admin@kworks.com', pass: 'admin123' },
  manager: { email: 'manager@kworks.com', pass: 'manager123' },
  hr: { email: 'hr@kworks.com', pass: 'hr123' },
  it: { email: 'itsupport@kworks.com', pass: 'itsupport123' },
  finance: { email: 'accounts@kworks.com', pass: 'accounts123' },
};

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  hr: 'HR Executive',
  it: 'IT Support',
  finance: 'Accounts Manager',
};

export default function ManagementScreen({ onBack }: Props) {
  const { kind } = useResponsive();
  const isMobile = kind === 'mobile';

  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [loginRole, setLoginRole] = useState<Role>('manager');
  const [loginEmail, setLoginEmail] = useState(SITE_CREDS.manager.email);
  const [loginPass, setLoginPass] = useState(SITE_CREDS.manager.pass);
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'onboarding' | 'attendance' | 'food' | 'leaves' | 'notices' | 'polls' | 'tickets'>('onboarding');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [foodCounts, setFoodCounts] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<Record<string, any>>({});
  const [notices, setNotices] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPass, setEmpPass] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empPhoto, setEmpPhoto] = useState<string | null>(null);
  const [onboardStatus, setOnboardStatus] = useState('');
  const [createdEmpCreds, setCreatedEmpCreds] = useState<Employee | null>(null);

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeStatus, setNoticeStatus] = useState('');

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpts, setPollOpts] = useState<string[]>(['', '']);
  const [pollStatus, setPollStatus] = useState('');

  const refreshData = () => {
    fetch(`${API_BASE}/api/employees`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setEmployees(res.data || []); })
      .catch(() => {});
    fetch(`${API_BASE}/api/attendance`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setAttendance(res.data || []); })
      .catch(() => {});
    fetch(`${API_BASE}/api/food`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setFoodCounts(res.data || []); })
      .catch(() => {});
    fetch(`${API_BASE}/api/leaves`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setLeaves(res.data || {}); })
      .catch(() => {});
    fetch(`${API_BASE}/api/notices`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setNotices(res.data || []); })
      .catch(() => {});
    fetch(`${API_BASE}/api/polls`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setPolls(res.data || []); })
      .catch(() => {});
    fetch(`${API_BASE}/api/tickets`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setTickets(res.data || []); })
      .catch(() => {});
  };

  useEffect(() => { refreshData(); }, []);

  const handleLogin = () => {
    const cred = SITE_CREDS[loginRole];
    if (loginEmail.trim().toLowerCase() === cred.email && loginPass === cred.pass) {
      setActiveRole(loginRole);
      setLoginError('');
    } else {
      setLoginError('Invalid management credentials.');
    }
  };

  const pickEmpPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) setEmpPhoto(res.assets[0].uri);
  };

  const handleOnboard = () => {
    if (!empName.trim() || !empEmail.trim()) {
      setOnboardStatus('Please enter full name and email address.');
      return;
    }
    const finalPass = empPass.trim() || 'KwOrKs@2026';
    const newEmp: Employee = {
      id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: empName.trim(),
      email: empEmail.trim(),
      password: finalPass,
      role: empRole.trim() || 'Employee',
      department: empDept.trim() || 'General',
      photo: empPhoto || '',
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setEmployees([newEmp, ...employees]);
    setCreatedEmpCreds(newEmp);
    fetch(`${API_BASE}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmp),
    }).catch(() => {});
    setEmpName(''); setEmpEmail(''); setEmpPass(''); setEmpRole(''); setEmpDept(''); setEmpPhoto(null);
    setOnboardStatus('Employee onboarded & face registered successfully!');
  };

  const handleDeleteEmp = (id: string) => {
    setEmployees(employees.filter((e) => e.id !== id));
    fetch(`${API_BASE}/api/employees/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleCreateNotice = () => {
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      setNoticeStatus('Please enter a title and message body.');
      return;
    }
    const newNotice = {
      id: `n${Date.now()}`,
      title: noticeTitle.trim(),
      body: noticeBody.trim(),
      team: 'ALL',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    const updated = [newNotice, ...notices];
    setNotices(updated);
    fetch(`${API_BASE}/api/notices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});
    setNoticeTitle(''); setNoticeBody('');
    setNoticeStatus('Announcement published successfully!');
  };

  const handleCreatePoll = () => {
    const validOpts = pollOpts.map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validOpts.length < 2) {
      setPollStatus('Please enter a poll title and at least 2 options.');
      return;
    }
    const newPoll = {
      id: `p${Date.now()}`,
      title: pollQuestion.trim(),
      options: validOpts,
      votes: {},
      createdAt: Date.now(),
    };
    const updated = [newPoll, ...polls];
    setPolls(updated);
    fetch(`${API_BASE}/api/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});
    setPollQuestion(''); setPollOpts(['', '']);
    setPollStatus('Poll created successfully!');
  };

  const filteredEmployees = employees.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q) || e.id?.toLowerCase().includes(q);
  });

  // LOGIN SCREEN
  if (!activeRole) {
    return (
      <View style={styles.root}>
        <MorningBackground />
        <View style={styles.loginModalOverlay}>
          <View style={styles.loginCard}>
            <Text style={styles.loginCardTitle}>MANAGEMENT PORTAL</Text>
            <Text style={styles.loginCardSub}>Sign in with your executive credentials</Text>
            <Text style={styles.fieldLabel}>SELECT ROLE</Text>
            <View style={styles.roleRow}>
              {(['manager', 'hr', 'admin', 'it', 'finance'] as Role[]).map((r) => (
                <Pressable
                  key={r}
                  style={[styles.roleChip, loginRole === r && styles.roleChipActive]}
                  onPress={() => {
                    setLoginRole(r);
                    setLoginEmail(SITE_CREDS[r].email);
                    setLoginPass(SITE_CREDS[r].pass);
                  }}
                >
                  <Text style={[styles.roleChipText, loginRole === r && styles.roleChipTextActive]}>{r.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <TextInput style={styles.fieldInput} value={loginEmail} onChangeText={setLoginEmail} placeholderTextColor={BRAND.textDim} autoCapitalize="none" />
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <TextInput style={styles.fieldInput} value={loginPass} onChangeText={setLoginPass} placeholderTextColor={BRAND.textDim} secureTextEntry />
            {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
            <Pressable style={styles.primaryBtn} onPress={handleLogin}>
              <Text style={styles.primaryBtnText}>Login to Management Portal</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={onBack}>
              <Text style={styles.ghostBtnText}>← Back to Employee App</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MorningBackground />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>{'<'} Back</Text>
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>KwOrKs Management</Text>
              <Text style={styles.headerSub}>{ROLE_LABELS[activeRole]} · {loginEmail}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.actionBtn} onPress={refreshData}>
              <Text style={styles.actionBtnText}>↻ Refresh</Text>
            </Pressable>
            <Pressable style={styles.actionBtnDanger} onPress={() => setActiveRole(null)}>
              <Text style={styles.actionBtnText}>Logout</Text>
            </Pressable>
          </View>
        </View>

        {/* Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsBar} contentContainerStyle={styles.tabsContent}>
          {[
            { id: 'onboarding', label: '👤 ONBOARDING', count: `${employees.length}` },
            { id: 'attendance', label: '📋 ATTENDANCE', count: `${attendance.filter((r) => r.date === todayKey()).length} today` },
            { id: 'food', label: '🍱 FOOD COUNT', count: `${foodCounts.length}` },
            { id: 'leaves', label: '🗓 LEAVES', count: `${Object.keys(leaves).length}` },
            { id: 'notices', label: '📢 NOTICES', count: `${notices.length}` },
            { id: 'polls', label: '📊 POLLS', count: `${polls.length}` },
            { id: 'tickets', label: '🎫 IT SUPPORT', count: `${tickets.length}` },
          ].map((tab) => (
            <Pressable
              key={tab.id}
              style={[styles.tabCard, activeTab === tab.id && styles.tabCardActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
              <Text style={styles.tabCount}>{tab.count}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
          {/* TAB 1: ONBOARDING */}
          {activeTab === 'onboarding' && (
            <View style={[styles.gridTwoCol, isMobile && styles.gridOneCol]}>
              {/* Left: Form */}
              <View style={styles.colCard}>
                <Text style={styles.cardTitle}>ONBOARD NEW EMPLOYEE & REGISTER FACE</Text>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <TextInput style={styles.fieldInput} value={empName} onChangeText={setEmpName} placeholder="e.g. Suresh Kumar" placeholderTextColor={BRAND.textDim} />
                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <TextInput style={styles.fieldInput} value={empEmail} onChangeText={setEmpEmail} placeholder="e.g. suresh@kanagam.tech" placeholderTextColor={BRAND.textDim} keyboardType="email-address" autoCapitalize="none" />
                <Text style={styles.fieldLabel}>PASSWORD (FOR APP LOGIN)</Text>
                <TextInput style={styles.fieldInput} value={empPass} onChangeText={setEmpPass} placeholder="e.g. Pass@1234 (or blank = KwOrKs@2026)" placeholderTextColor={BRAND.textDim} autoCapitalize="none" />
                <View style={styles.rowInputs}>
                  <View style={styles.colInput}>
                    <Text style={styles.fieldLabel}>ROLE</Text>
                    <TextInput style={styles.fieldInput} value={empRole} onChangeText={setEmpRole} placeholder="e.g. Engineer" placeholderTextColor={BRAND.textDim} />
                  </View>
                  <View style={styles.colInput}>
                    <Text style={styles.fieldLabel}>DEPARTMENT</Text>
                    <TextInput style={styles.fieldInput} value={empDept} onChangeText={setEmpDept} placeholder="e.g. Engineering" placeholderTextColor={BRAND.textDim} />
                  </View>
                </View>
                <Text style={styles.fieldLabel}>FACE PHOTO FOR ATTENDANCE</Text>
                <Pressable style={styles.photoUploadBtn} onPress={pickEmpPhoto}>
                  <Text style={styles.photoUploadText}>{empPhoto ? '✓ Photo Selected (tap to change)' : '📷 Upload Face Photo'}</Text>
                </Pressable>
                {empPhoto && <Image source={{ uri: empPhoto }} style={styles.photoPreviewImg} />}
                {onboardStatus ? <Text style={styles.statusOkText}>{onboardStatus}</Text> : null}
                <Pressable style={styles.primaryBtn} onPress={handleOnboard}>
                  <Text style={styles.primaryBtnText}>Onboard Employee & Register Face</Text>
                </Pressable>
              </View>

              {/* Right: Employee List */}
              <View style={styles.colCard}>
                <Text style={styles.cardTitle}>ONBOARDED EMPLOYEES & REGISTERED FACES</Text>
                <Text style={styles.fieldLabel}>SEARCH</Text>
                <TextInput style={styles.fieldInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by name, email, role..." placeholderTextColor={BRAND.textDim} />
                <Text style={styles.countBadge}>Showing {filteredEmployees.length} of {employees.length} employee(s)</Text>
                {filteredEmployees.length === 0 ? (
                  <Text style={styles.emptyText}>{searchQuery ? 'No results found.' : 'No employees onboarded yet.'}</Text>
                ) : (
                  filteredEmployees.map((emp) => (
                    <View key={emp.id} style={styles.empCard}>
                      <View style={styles.empAvatar}>
                        {emp.photo ? <Image source={{ uri: emp.photo }} style={styles.empAvatarImg} /> : <Text style={styles.empAvatarText}>{(emp.name[0] || 'E').toUpperCase()}</Text>}
                      </View>
                      <View style={styles.empInfo}>
                        <Text style={styles.empName}>{emp.name} <Text style={styles.empId}>({emp.id})</Text></Text>
                        <Text style={styles.empMeta}>{emp.role} · {emp.department}</Text>
                        <Text style={styles.empMeta}>{emp.email}</Text>
                      </View>
                      <Pressable style={styles.delBtn} onPress={() => handleDeleteEmp(emp.id)}>
                        <Text style={styles.delBtnText}>✕</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <View style={styles.panelCard}>
              <Text style={styles.cardTitle}>ATTENDANCE RECORDS</Text>
              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{attendance.filter((r) => r.date === todayKey()).length}</Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{attendance.length}</Text>
                  <Text style={styles.statLabel}>Total Marks</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{employees.length}</Text>
                  <Text style={styles.statLabel}>Total Staff</Text>
                </View>
              </View>
              {attendance.length === 0 ? (
                <Text style={styles.emptyText}>No attendance records yet. Records will appear here once employees mark attendance via the mobile app.</Text>
              ) : (
                attendance.map((r, i) => (
                  <View key={i} style={styles.listItemRow}>
                    <View style={[styles.itemDot, r.date === todayKey() && { backgroundColor: BRAND.success }]} />
                    <View style={styles.itemContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={styles.itemTitle}>{r.name || r.user}</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: BRAND.success, backgroundColor: 'rgba(46,139,87,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            In: {r.time}
                          </Text>
                          {r.punchOutTime ? (
                            <Text style={{ fontSize: 11, fontWeight: '800', color: BRAND.primary, backgroundColor: 'rgba(215,171,106,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              Out: {r.punchOutTime}
                            </Text>
                          ) : null}
                          {r.duration ? (
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#E8C98F', backgroundColor: 'rgba(232,201,143,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              ⏱️ {r.duration}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <Text style={styles.itemMeta}>
                        📅 {r.date} · 📍 {r.location || 'Unknown location'}
                        {!r.punchOutTime && <Text style={{ color: BRAND.success, fontWeight: '700' }}> · ✓ Active Shift</Text>}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 3: FOOD COUNT */}
          {activeTab === 'food' && (
            <View style={styles.panelCard}>
              <Text style={styles.cardTitle}>FOOD COUNT ({foodCounts.length} entries)</Text>
              {foodCounts.length === 0 ? (
                <Text style={styles.emptyText}>No food count submissions yet.</Text>
              ) : (
                foodCounts.map((f, i) => (
                  <View key={i} style={styles.listItemRow}>
                    <View style={styles.itemDot} />
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{f.user}</Text>
                      <Text style={styles.itemMeta}>{f.date}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 4: LEAVES */}
          {activeTab === 'leaves' && (
            <View style={styles.panelCard}>
              <Text style={styles.cardTitle}>LEAVE REQUESTS ({Object.keys(leaves).length})</Text>
              {Object.keys(leaves).length === 0 ? (
                <Text style={styles.emptyText}>No leave requests submitted yet.</Text>
              ) : (
                Object.entries(leaves).map(([k, r]) => (
                  <View key={k} style={styles.listItemRow}>
                    <View style={styles.itemDot} />
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{r.user || 'Employee'} — {(r.status || 'PENDING').toUpperCase()}</Text>
                      <Text style={styles.itemMeta}>{k} · {r.reason || 'No reason provided'}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 5: NOTICES */}
          {activeTab === 'notices' && (
            <View style={styles.panelCard}>
              <Text style={styles.cardTitle}>CREATE ANNOUNCEMENT</Text>
              <Text style={styles.fieldLabel}>TITLE</Text>
              <TextInput style={styles.fieldInput} value={noticeTitle} onChangeText={setNoticeTitle} placeholder="Announcement title..." placeholderTextColor={BRAND.textDim} />
              <Text style={styles.fieldLabel}>MESSAGE</Text>
              <TextInput style={[styles.fieldInput, { height: 80 }]} multiline value={noticeBody} onChangeText={setNoticeBody} placeholder="Full message..." placeholderTextColor={BRAND.textDim} />
              {noticeStatus ? <Text style={styles.statusOkText}>{noticeStatus}</Text> : null}
              <Pressable style={styles.primaryBtn} onPress={handleCreateNotice}>
                <Text style={styles.primaryBtnText}>Publish Announcement</Text>
              </Pressable>
              <Text style={[styles.cardTitle, { marginTop: 20 }]}>PUBLISHED ({notices.length})</Text>
              {notices.map((n) => (
                <View key={n.id} style={styles.listItemRow}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{n.title}</Text>
                    <Text style={styles.itemMeta}>{n.body} · {n.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 6: POLLS */}
          {activeTab === 'polls' && (
            <View style={styles.panelCard}>
              <Text style={styles.cardTitle}>CREATE POLL</Text>
              <Text style={styles.fieldLabel}>POLL QUESTION</Text>
              <TextInput style={styles.fieldInput} value={pollQuestion} onChangeText={setPollQuestion} placeholder="e.g. Team outing date?" placeholderTextColor={BRAND.textDim} />
              {pollOpts.map((opt, idx) => (
                <View key={idx}>
                  <Text style={styles.fieldLabel}>OPTION {idx + 1}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={opt}
                    onChangeText={(val) => { const c = [...pollOpts]; c[idx] = val; setPollOpts(c); }}
                    placeholder={`Option ${idx + 1}`}
                    placeholderTextColor={BRAND.textDim}
                  />
                </View>
              ))}
              {pollStatus ? <Text style={styles.statusOkText}>{pollStatus}</Text> : null}
              <Pressable style={styles.primaryBtn} onPress={handleCreatePoll}>
                <Text style={styles.primaryBtnText}>Create Poll</Text>
              </Pressable>
            </View>
          )}

          {/* TAB 7: IT SUPPORT */}
          {activeTab === 'tickets' && (
            <View style={styles.panelCard}>
              <Text style={styles.cardTitle}>IT SUPPORT TICKETS ({tickets.length})</Text>
              {tickets.length === 0 ? (
                <Text style={styles.emptyText}>No IT support tickets yet.</Text>
              ) : (
                tickets.map((t) => (
                  <View key={t.id} style={styles.listItemRow}>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{t.subject} [{(t.status || 'OPEN').toUpperCase()}]</Text>
                      <Text style={styles.itemMeta}>From: {t.from}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* CREDENTIAL POPUP MODAL */}
        <Modal visible={!!createdEmpCreds} transparent animationType="fade" onRequestClose={() => setCreatedEmpCreds(null)}>
          <View style={styles.loginModalOverlay}>
            <View style={styles.loginCard}>
              <Text style={styles.loginCardTitle}>🎉 EMPLOYEE ACCOUNT CREATED!</Text>
              <Text style={styles.loginCardSub}>Share these login credentials with the employee</Text>
              {createdEmpCreds && (
                <View style={{ backgroundColor: 'rgba(26,9,22,0.6)', borderWidth: 1, borderColor: BRAND.primary, borderRadius: 12, padding: 16, marginVertical: 10 }}>
                  <Text style={styles.fieldLabel}>EMPLOYEE NAME</Text>
                  <Text style={{ color: BRAND.text, fontWeight: '800', fontSize: 14 }}>
                    {createdEmpCreds.name} <Text style={{ color: BRAND.primary }}>({createdEmpCreds.id})</Text>
                  </Text>
                  <Text style={styles.fieldLabel}>LOGIN EMAIL</Text>
                  <Text style={{ color: BRAND.text, fontWeight: '800', fontSize: 14 }}>{createdEmpCreds.email}</Text>
                  <Text style={styles.fieldLabel}>LOGIN PASSWORD</Text>
                  <View style={{ backgroundColor: BRAND.primaryDark, borderWidth: 1, borderColor: BRAND.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 }}>
                    <Text style={{ color: BRAND.primary, fontWeight: '800', fontSize: 15 }}>{createdEmpCreds.password}</Text>
                  </View>
                  <Text style={{ color: BRAND.textDim, fontSize: 11, marginTop: 10 }}>
                    Role: {createdEmpCreds.role} · Dept: {createdEmpCreds.department}
                  </Text>
                </View>
              )}
              <Pressable style={styles.primaryBtn} onPress={() => setCreatedEmpCreds(null)}>
                <Text style={styles.primaryBtnText}>Close & Continue</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  loginModalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  loginCard: { width: '100%', maxWidth: 440, backgroundColor: BRAND.cardBg, borderWidth: 1, borderColor: BRAND.border, borderRadius: 16, padding: 24 },
  loginCardTitle: { fontSize: 18, fontWeight: '800', color: BRAND.primary, letterSpacing: 1, textAlign: 'center' },
  loginCardSub: { fontSize: 12, color: BRAND.textDim, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(26,9,22,0.6)', borderWidth: 1, borderColor: BRAND.border },
  roleChipActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  roleChipText: { fontSize: 11, fontWeight: '700', color: BRAND.textDim },
  roleChipTextActive: { color: '#FFFFFF' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: BRAND.textDim, letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  fieldInput: { backgroundColor: BRAND.inputBg, borderWidth: 1, borderColor: BRAND.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: BRAND.text, fontSize: 14 },
  errorText: { color: BRAND.danger, fontSize: 12, marginTop: 10 },
  statusOkText: { color: BRAND.primary, fontSize: 13, fontWeight: '700', marginTop: 10 },
  primaryBtn: { backgroundColor: BRAND.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  ghostBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 10 },
  ghostBtnText: { color: BRAND.textDim, fontSize: 13, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 44, paddingHorizontal: 16, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  backBtn: { paddingRight: 8 },
  backText: { color: BRAND.primary, fontWeight: '700', fontSize: 15 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: BRAND.primary },
  headerSub: { fontSize: 11, color: BRAND.textDim },
  headerRight: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: 'rgba(215,171,106,0.2)', borderWidth: 1, borderColor: BRAND.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionBtnDanger: { backgroundColor: 'rgba(224,80,80,0.2)', borderWidth: 1, borderColor: BRAND.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { color: BRAND.text, fontWeight: '700', fontSize: 12 },
  tabsBar: { maxHeight: 70, paddingHorizontal: 16, marginBottom: 8 },
  tabsContent: { gap: 10, paddingRight: 32 },
  tabCard: { backgroundColor: BRAND.cardBg, borderWidth: 1, borderColor: BRAND.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, minWidth: 130 },
  tabCardActive: { borderColor: BRAND.primary, backgroundColor: 'rgba(215,171,106,0.2)' },
  tabLabel: { fontSize: 11, fontWeight: '800', color: BRAND.textDim },
  tabLabelActive: { color: BRAND.primary },
  tabCount: { fontSize: 11, color: BRAND.text, marginTop: 2 },
  mainContent: { padding: 16, paddingBottom: 60 },
  gridTwoCol: { flexDirection: 'row', gap: 16 },
  gridOneCol: { flexDirection: 'column' },
  colCard: { flex: 1, backgroundColor: BRAND.cardBg, borderWidth: 1, borderColor: BRAND.border, borderRadius: 16, padding: 16 },
  panelCard: { backgroundColor: BRAND.cardBg, borderWidth: 1, borderColor: BRAND.border, borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: BRAND.primary, letterSpacing: 0.5, marginBottom: 4 },
  countBadge: { fontSize: 12, color: BRAND.primary, fontWeight: '700', marginVertical: 8 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  statChip: { backgroundColor: 'rgba(26,9,22,0.5)', borderWidth: 1, borderColor: BRAND.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', minWidth: 80 },
  statValue: { fontSize: 22, fontWeight: '800', color: BRAND.primary },
  statLabel: { fontSize: 11, color: BRAND.textDim, marginTop: 2 },
  empCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,9,22,0.5)', borderWidth: 1, borderColor: BRAND.border, borderRadius: 12, padding: 10, marginTop: 8, gap: 10 },
  empAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: BRAND.primaryDark, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: BRAND.primary },
  empAvatarImg: { width: '100%', height: '100%' },
  empAvatarText: { color: BRAND.primary, fontWeight: '800' },
  empInfo: { flex: 1 },
  empName: { color: BRAND.text, fontWeight: '700', fontSize: 13 },
  empId: { color: BRAND.textDim, fontSize: 11 },
  empMeta: { color: BRAND.textDim, fontSize: 11, marginTop: 1 },
  delBtn: { padding: 6 },
  delBtnText: { color: BRAND.danger, fontSize: 16, fontWeight: '800' },
  rowInputs: { flexDirection: 'row', gap: 10 },
  colInput: { flex: 1 },
  photoUploadBtn: { backgroundColor: 'rgba(215,171,106,0.15)', borderWidth: 1, borderColor: BRAND.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  photoUploadText: { color: BRAND.primary, fontWeight: '700', fontSize: 13 },
  photoPreviewImg: { width: 70, height: 70, borderRadius: 35, marginTop: 10, alignSelf: 'center' },
  emptyText: { color: BRAND.textDim, fontSize: 13, fontStyle: 'italic', marginTop: 12 },
  listItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(74,32,64,0.4)', gap: 10 },
  itemDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.primary },
  itemContent: { flex: 1 },
  itemTitle: { color: BRAND.text, fontWeight: '700', fontSize: 13 },
  itemMeta: { color: BRAND.textDim, fontSize: 11, marginTop: 2 },
});
