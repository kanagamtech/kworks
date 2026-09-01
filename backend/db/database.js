const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { connectMongoDB, getIsConnected, Models } = require('./mongo');

const DB_FILE = path.join(__dirname, 'kworks_db.json');

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

async function seedManagementUsers() {
  const users = [
    { id: 'mu_super', email: 'superadmin@kworks.com', password: 'SuperAdmin@2026!', role: 'super_admin', name: 'Super Administrator', department: 'IT', created_at: new Date().toISOString() },
    { id: 'mu_admin', email: 'admin@kworks.com', password: 'Admin@2026!', role: 'admin', name: 'System Admin', department: 'IT', created_at: new Date().toISOString() },
    { id: 'mu_manager', email: 'manager@kworks.com', password: 'Manager@2026!', role: 'manager', name: 'General Manager', department: 'Management', created_at: new Date().toISOString() },
    { id: 'mu_hr', email: 'hr@kworks.com', password: 'HR@2026!', role: 'hr', name: 'HR Executive', department: 'Human Resources', created_at: new Date().toISOString() },
    { id: 'mu_it', email: 'itsupport@kworks.com', password: 'ITSupport@2026!', role: 'it', name: 'IT Support Lead', department: 'Information Technology', created_at: new Date().toISOString() },
    { id: 'mu_finance', email: 'accounts@kworks.com', password: 'Accounts@2026!', role: 'finance', name: 'Accounts Manager', department: 'Accounts', created_at: new Date().toISOString() },
    { id: 'mu_finance_alias', email: 'finance@kworks.com', password: 'Finance@2026!', role: 'finance', name: 'Accounts Manager', department: 'Accounts', created_at: new Date().toISOString() },
  ];

  const hashedUsers = [];
  for (const u of users) {
    hashedUsers.push({
      ...u,
      passwordHash: await hashPassword(u.password),
    });
    delete u.password;
  }
  return hashedUsers;
}

const INITIAL_DATA = {
  users: [],
  employees: [],
  attendance: [],
  food_counts: [],
  leave_requests: {},
  tickets: [],
  notices: [
    {
      id: 'm1',
      title: 'Welcome to KwOrKs Portal',
      body: 'KwOrKs Enterprise portal is active. Please mark your biometric attendance and plan food counts.',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      team: 'ALL',
      category: 'management',
    },
  ],
  birthdays: [],
  anniversaries: [],
  polls: [],
  claims: [],
  chat_messages: [],
  chat_groups: [],
  companies: ['kanagamtech', 'amsems'],
  notifications: [],
  app_updates: {
    version: '1.0.0',
    buildNumber: 1,
    title: 'KwOrKs',
    notes: 'Initial release',
    mandatory: false,
    apkUrl: '',
    publishedAt: new Date().toISOString(),
    updateId: 'upd_v1_0_0_base',
  },
  management_users: [],
};

class Database {
  constructor() {
    this.data = this.load();
    this.seedManagementUsers();
    // Expose a promise that resolves when MongoDB data is fully loaded
    this.initReady = this.initMongo();
  }

  async seedManagementUsers() {
    if (!this.data.management_users || this.data.management_users.length === 0) {
      this.data.management_users = await seedManagementUsers();
      this.save();
    }
  }

  async initMongo() {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL;

    if (mongoUri) {
      console.log('[KwOrKs] Connecting to MongoDB...');
      const connected = await connectMongoDB(mongoUri);
      if (connected) {
        console.log('[KwOrKs] MongoDB connected. Loading all data from MongoDB...');
        await this.loadFromMongo();
        console.log('[KwOrKs] MongoDB data restored successfully.');
      } else {
        console.warn('[KwOrKs] MongoDB connection failed. Using local JSON file.');
      }
    } else {
      console.log('[KwOrKs] No MONGODB_URI set. Using local JSON file only.');
    }
  }

  async loadFromMongo() {
    if (!getIsConnected()) return;
    try {
      // Restore ALL data from MongoDB (primary source of truth after redeploy)
      const [mongoMsgs, mongoGroups, mongoNotifs, mongoEmployees, mongoAttendance, mongoNotices] = await Promise.all([
        Models.ChatMessage.find({}).sort({ timestamp: 1 }).lean().catch(() => []),
        Models.ChatGroup.find({}).lean().catch(() => []),
        Models.Notification.find({}).sort({ timestamp: -1 }).lean().catch(() => []),
        Models.Employee.find({}).lean().catch(() => []),
        Models.Attendance.find({}).lean().catch(() => []),
        Models.Notice.find({}).lean().catch(() => []),
      ]);

      if (mongoMsgs && mongoMsgs.length > 0) {
        this.data.chat_messages = mongoMsgs;
        console.log(`[KwOrKs] Restored ${mongoMsgs.length} chat messages from MongoDB`);
      }
      if (mongoGroups && mongoGroups.length > 0) {
        this.data.chat_groups = mongoGroups;
        console.log(`[KwOrKs] Restored ${mongoGroups.length} chat groups from MongoDB`);
      }
      if (mongoNotifs && mongoNotifs.length > 0) {
        this.data.notifications = mongoNotifs;
      }
      if (mongoEmployees && mongoEmployees.length > 0) {
        this.data.employees = mongoEmployees;
        console.log(`[KwOrKs] Restored ${mongoEmployees.length} employees from MongoDB`);
      }
      if (mongoAttendance && mongoAttendance.length > 0) {
        this.data.attendance = mongoAttendance;
      }
      if (mongoNotices && mongoNotices.length > 0) {
        this.data.notices = mongoNotices;
      }

      // Save the restored state to local JSON file as a backup cache
      this.save();
    } catch (e) {
      console.error('[KwOrKs MongoDB] Data restore error:', e.message);
    }
  }

  async syncToMongo() {
    if (!getIsConnected()) return;
    try {
      // Sync chat messages to MongoDB
      for (const msg of this.data.chat_messages || []) {
        await Models.ChatMessage.updateOne({ id: msg.id }, { $set: msg }, { upsert: true }).catch(() => {});
      }
      // Sync chat groups
      for (const grp of this.data.chat_groups || []) {
        await Models.ChatGroup.updateOne({ id: grp.id }, { $set: grp }, { upsert: true }).catch(() => {});
      }
      // Sync employees
      for (const emp of this.data.employees || []) {
        await Models.Employee.updateOne({ id: emp.id }, { $set: emp }, { upsert: true }).catch(() => {});
      }
      // Sync attendance
      for (const att of this.data.attendance || []) {
        await Models.Attendance.updateOne({ id: att.id }, { $set: att }, { upsert: true }).catch(() => {});
      }
      // Sync notices
      for (const notice of this.data.notices || []) {
        await Models.Notice.updateOne({ id: notice.id }, { $set: notice }, { upsert: true }).catch(() => {});
      }
      // Sync notifications
      for (const notif of this.data.notifications || []) {
        await Models.Notification.updateOne({ id: notif.id }, { $set: notif }, { upsert: true }).catch(() => {});
      }
    } catch (e) {
      console.error('[KwOrKs MongoDB] Sync error:', e.message);
    }
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return { ...INITIAL_DATA, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.error('Error loading database file:', e);
    }
    this.save(INITIAL_DATA);
    return INITIAL_DATA;
  }

  save(data = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving database file:', e);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save();
    if (getIsConnected()) {
      Promise.all([
        Models.Employee.deleteMany({}),
        Models.Attendance.deleteMany({}),
        Models.FoodCount.deleteMany({}),
        Models.LeaveRequest.deleteMany({}),
        Models.Notice.deleteMany({}),
        Models.Notification.deleteMany({}),
        Models.Claim.deleteMany({}),
      ]).catch(() => {});
    }
    return this.data;
  }

  getEmployees() {
    return this.data.employees || [];
  }

  addEmployee(emp) {
    const item = {
      id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      ...emp,
      created_at: new Date().toISOString(),
    };
    if (!this.data.employees) this.data.employees = [];
    this.data.employees.unshift(item);
    this.save();

    if (getIsConnected()) {
      Models.Employee.create(item).catch(() => {});
    }
    return item;
  }

  deleteEmployee(id) {
    if (!this.data.employees) return [];
    this.data.employees = this.data.employees.filter((e) => e.id !== id);
    this.save();

    if (getIsConnected()) {
      Models.Employee.deleteOne({ id }).catch(() => {});
    }
    return this.data.employees;
  }

  getAttendance() {
    return this.data.attendance || [];
  }

  addAttendance(record) {
    const item = {
      id: record.id || `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...record,
      created_at: new Date().toISOString(),
    };
    if (!this.data.attendance) this.data.attendance = [];
    this.data.attendance.unshift(item);
    this.save();

    if (getIsConnected()) {
      Models.Attendance.create(item).catch(() => {});
    }
    return item;
  }

  clearAttendance() {
    this.data.attendance = [];
    this.save();

    if (getIsConnected()) {
      Models.Attendance.deleteMany({}).catch(() => {});
    }
    return [];
  }

  deleteAttendance(id) {
    if (!this.data.attendance) return [];
    this.data.attendance = this.data.attendance.filter((r) => r.id !== id);
    this.save();

    if (getIsConnected()) {
      Models.Attendance.deleteOne({ id }).catch(() => {});
    }
    return this.data.attendance;
  }

  getFoodCounts() {
    return this.data.food_counts || [];
  }

  saveFoodCount(record) {
    if (!this.data.food_counts) this.data.food_counts = [];
    const existingIdx = this.data.food_counts.findIndex((f) => f.date === record.date && f.user === record.user);
    const item = { id: `fc_${Date.now()}`, ...record, updated_at: new Date().toISOString() };
    if (existingIdx >= 0) {
      this.data.food_counts[existingIdx] = item;
    } else {
      this.data.food_counts.unshift(item);
    }
    this.save();

    if (getIsConnected()) {
      Models.FoodCount.updateOne({ date: record.date, user: record.user }, item, { upsert: true }).catch(() => {});
    }
    return item;
  }

  getLeaves() {
    return this.data.leave_requests || {};
  }

  saveLeaves(leaveMap) {
    this.data.leave_requests = leaveMap;
    this.save();

    if (getIsConnected()) {
      Object.entries(leaveMap || {}).forEach(([key, val]) => {
        Models.LeaveRequest.updateOne({ key }, { key, ...val }, { upsert: true }).catch(() => {});
      });
    }
    return this.data.leave_requests;
  }

  getTickets() {
    return this.data.tickets || [];
  }

  saveTickets(tickets) {
    this.data.tickets = tickets;
    this.save();
    return this.data.tickets;
  }

  getNotices() {
    return this.data.notices || [];
  }

  saveNotices(notices) {
    this.data.notices = notices;
    this.save();

    if (getIsConnected()) {
      Models.Notice.deleteMany({})
        .then(() => Models.Notice.insertMany(notices))
        .catch(() => {});
    }
    return this.data.notices;
  }

  getPolls() {
    return this.data.polls || [];
  }

  savePolls(polls) {
    this.data.polls = polls;
    this.save();
    return this.data.polls;
  }

  getBirthdays() {
    return this.data.birthdays || [];
  }

  saveBirthdays(birthdays) {
    this.data.birthdays = birthdays;
    this.save();
    return this.data.birthdays;
  }

  getAnniversaries() {
    return this.data.anniversaries || [];
  }

  saveAnniversaries(anniversaries) {
    this.data.anniversaries = anniversaries;
    this.save();
    return this.data.anniversaries;
  }

  getClaims() {
    return this.data.claims || [];
  }

  saveClaims(claims) {
    this.data.claims = claims;
    this.save();
    return this.data.claims;
  }

  addClaim(claim) {
    const item = {
      id: `CLM-${Math.floor(100000 + Math.random() * 900000)}`,
      status: { manager: 'pending', finance: 'pending' },
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ...claim,
      created_at: new Date().toISOString(),
    };
    if (!this.data.claims) this.data.claims = [];
    this.data.claims.unshift(item);
    this.save();

    if (getIsConnected()) {
      Models.Claim.create(item).catch(() => {});
    }
    return item;
  }

  getChatMessages() {
    return this.data.chat_messages || [];
  }

  addChatMessage(msg) {
    const item = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      status: 'delivered',
      reactions: {},
      ...msg,
      timestamp: new Date().toISOString(),
    };
    if (!this.data.chat_messages) this.data.chat_messages = [];
    this.data.chat_messages.push(item);

    // Auto-generate notification for recipient or group members
    try {
      const sender = (this.data.employees || []).find(e => e.email?.toLowerCase() === msg.from?.toLowerCase());
      const senderName = sender ? sender.name : (msg.from ? msg.from.split('@')[0] : 'Someone');
      const previewText = msg.text || (msg.photo ? '📷 Photo' : (msg.document ? `📄 ${msg.document.name || 'Document'}` : 'New message'));

      // Check if target is a group
      const group = (this.data.chat_groups || []).find(g => g.id === msg.to);
      if (group && Array.isArray(group.members)) {
        group.members.forEach(memberEmail => {
          if (memberEmail && memberEmail.toLowerCase() !== msg.from?.toLowerCase()) {
            this.addNotification({
              title: `💬 ${group.name} (${senderName})`,
              message: previewText,
              target: memberEmail,
              type: 'chat',
              groupId: group.id,
              from: msg.from,
            });
          }
        });
      } else if (msg.to) {
        // Direct 1-on-1 message
        this.addNotification({
          title: `💬 ${senderName}`,
          message: previewText,
          target: msg.to,
          type: 'chat',
          from: msg.from,
        });
      }
    } catch (e) {
      console.error('Error dispatching chat notification:', e);
    }

    this.save();
    if (getIsConnected()) {
      Models.ChatMessage.create(item).catch(() => {});
    }
    return item;
  }

  reactToChatMessage(msgId, userEmail, reaction) {
    if (!this.data.chat_messages) return null;
    const msg = this.data.chat_messages.find(m => m.id === msgId);
    if (!msg) return null;
    if (!msg.reactions) msg.reactions = {};
    if (msg.reactions[userEmail] === reaction) {
      delete msg.reactions[userEmail]; // toggle off
    } else {
      msg.reactions[userEmail] = reaction;
    }
    this.save();
    if (getIsConnected()) {
      Models.ChatMessage.updateOne({ id: msgId }, { reactions: msg.reactions }).catch(() => {});
    }
    return msg;
  }

  deleteChatMessage(msgId, userEmail, userName) {
    if (!this.data.chat_messages) return { success: false, message: 'No messages found.' };
    const msg = this.data.chat_messages.find(m => m.id === msgId);
    if (!msg) return { success: false, message: 'Message not found.' };

    // 1 hour and 10 minutes limit = 70 minutes
    const TIME_LIMIT_MS = 70 * 60 * 1000;
    const msgAge = Date.now() - new Date(msg.timestamp).getTime();
    if (msgAge > TIME_LIMIT_MS) {
      return {
        success: false,
        message: 'Time limit expired. Messages can only be deleted within 1 hour and 10 minutes.',
      };
    }

    // Mark as deleted for everyone (WhatsApp style)
    msg.isDeleted = true;
    msg.deletedBy = userName || (userEmail ? userEmail.split('@')[0] : 'Someone');
    msg.originalText = msg.text;
    msg.text = 'This message was deleted';
    delete msg.photo;
    delete msg.document;
    msg.deletedAt = new Date().toISOString();

    this.save();
    if (getIsConnected()) {
      Models.ChatMessage.updateOne({ id: msgId }, msg).catch(() => {});
    }
    return { success: true, data: msg };
  }

  editChatMessage(msgId, newText, userEmail) {
    if (!this.data.chat_messages) return { success: false, message: 'No messages found.' };
    const msg = this.data.chat_messages.find(m => m.id === msgId);
    if (!msg) return { success: false, message: 'Message not found.' };

    // 1 hour and 10 minutes limit = 70 minutes
    const TIME_LIMIT_MS = 70 * 60 * 1000;
    const msgAge = Date.now() - new Date(msg.timestamp).getTime();
    if (msgAge > TIME_LIMIT_MS) {
      return {
        success: false,
        message: 'Time limit expired. Messages can only be edited within 1 hour and 10 minutes.',
      };
    }

    msg.text = newText ? newText.trim() : '';
    msg.isEdited = true;
    msg.editedAt = new Date().toISOString();

    this.save();
    if (getIsConnected()) {
      Models.ChatMessage.updateOne({ id: msgId }, msg).catch(() => {});
    }
    return { success: true, data: msg };
  }

  markChatAsRead(readerEmail, conversationPartnerOrGroupId) {
    if (!this.data.chat_messages) return false;
    let changed = false;
    this.data.chat_messages.forEach(m => {
      if (m.to?.toLowerCase() === readerEmail?.toLowerCase() &&
          m.from?.toLowerCase() === conversationPartnerOrGroupId?.toLowerCase() &&
          m.status !== 'read') {
        m.status = 'read';
        changed = true;
      } else if (m.to === conversationPartnerOrGroupId && m.status !== 'read') {
        // For groups
        m.status = 'read';
        changed = true;
      }
    });
    if (changed) this.save();
    return true;
  }

  getChatGroups() {
    return this.data.chat_groups || [];
  }

  addChatGroup(group) {
    const item = {
      id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      members: [],
      ...group,
      created_at: new Date().toISOString(),
    };
    if (!this.data.chat_groups) this.data.chat_groups = [];
    this.data.chat_groups.push(item);
    this.save();
    if (getIsConnected()) {
      Models.ChatGroup.create(item).catch(() => {});
    }
    return item;
  }

  addMemberToGroup(groupId, memberEmail) {
    if (!this.data.chat_groups) return null;
    const grp = this.data.chat_groups.find(g => g.id === groupId);
    if (!grp) return null;
    if (!Array.isArray(grp.members)) grp.members = [];
    const normalized = memberEmail.trim().toLowerCase();
    if (!grp.members.some(m => m.toLowerCase() === normalized)) {
      grp.members.push(normalized);
      this.save();
      if (getIsConnected()) {
        Models.ChatGroup.updateOne({ id: groupId }, { members: grp.members }).catch(() => {});
      }
    }
    return grp;
  }

  removeMemberFromGroup(groupId, memberEmail) {
    if (!this.data.chat_groups) return null;
    const grp = this.data.chat_groups.find(g => g.id === groupId);
    if (!grp) return null;
    if (!Array.isArray(grp.members)) return grp;
    const normalized = memberEmail.trim().toLowerCase();
    grp.members = grp.members.filter(m => m.toLowerCase() !== normalized);
    this.save();
    if (getIsConnected()) {
      Models.ChatGroup.updateOne({ id: groupId }, { members: grp.members }).catch(() => {});
    }
    return grp;
  }

  getNotifications() {
    return this.data.notifications || [];
  }

  addNotification(notif) {
    const item = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString(),
      ...notif,
    };
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift(item);
    this.save();

    if (getIsConnected()) {
      Models.Notification.create(item).catch(() => {});
    }
    return item;
  }

  getCompanies() {
    if (!this.data.companies || !Array.isArray(this.data.companies)) {
      this.data.companies = ['kanagamtech', 'amsems'];
      this.save();
    }
    if (!this.data.companies.includes('kanagamtech')) this.data.companies.unshift('kanagamtech');
    if (!this.data.companies.includes('amsems')) this.data.companies.push('amsems');
    return this.data.companies;
  }

  addCompany(companyName) {
    if (!this.data.companies || !Array.isArray(this.data.companies)) {
      this.data.companies = ['kanagamtech', 'amsems'];
    }
    const name = (companyName || '').trim();
    if (name && !this.data.companies.includes(name)) {
      this.data.companies.push(name);
      this.save();

      if (getIsConnected()) {
        Models.Company.updateOne({ name }, { name }, { upsert: true }).catch(() => {});
      }
    }
    return this.getCompanies();
  }

  deleteCompany(companyName) {
    if (!this.data.companies || !Array.isArray(this.data.companies)) {
      this.data.companies = ['kanagamtech', 'amsems'];
    }
    const name = (companyName || '').trim();
    if (name) {
      this.data.companies = this.data.companies.filter((c) => c.toLowerCase() !== name.toLowerCase());
      this.save();

      if (getIsConnected()) {
        Models.Company.deleteOne({ name }).catch(() => {});
      }
    }
    return this.getCompanies();
  }

  getAppUpdate() {
    if (!this.data.app_updates) {
      this.data.app_updates = {
        version: '1.0.0',
        buildNumber: 1,
        title: 'KwOrKs',
        notes: 'Initial release',
        mandatory: false,
        apkUrl: '',
        publishedAt: new Date().toISOString(),
        updateId: 'upd_v1_0_0_base',
      };
      this.save();
    }
    return this.data.app_updates;
  }

  publishAppUpdate(updateData) {
    const item = {
      version: updateData.version || '1.0.1',
      buildNumber: Number(updateData.buildNumber) || (this.data.app_updates?.buildNumber || 1) + 1,
      title: updateData.title || 'App Update Available',
      notes: updateData.notes || 'Performance improvements & feature updates.',
      mandatory: Boolean(updateData.mandatory),
      apkUrl: updateData.apkUrl || '',
      publishedAt: new Date().toISOString(),
      updateId: `upd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    this.data.app_updates = item;
    this.save();

    // Broadcast a high-priority system notice & notification to all employee devices
    this.addNotification({
      title: `🚀 App Update Released: ${item.version}`,
      body: `${item.title} - ${item.notes.replace(/\\n/g, ' ')}`,
      type: 'app_update',
      version: item.version,
    });

    if (getIsConnected()) {
      Models.AppUpdate.updateOne({}, item, { upsert: true }).catch(() => {});
    }

    return item;
  }

  getManagementUsers() {
    return (this.data.management_users || []).map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
      department: u.department,
      created_at: u.created_at,
    }));
  }

  async addManagementUser(userData) {
    const existing = this.data.management_users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      throw new Error('Email already exists');
    }
    const passwordHash = await hashPassword(userData.password);
    const newUser = {
      id: `mu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      email: userData.email.toLowerCase(),
      passwordHash,
      role: userData.role,
      name: userData.name,
      department: userData.department || 'General',
      created_at: new Date().toISOString(),
    };
    this.data.management_users.push(newUser);
    this.save();
    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      department: newUser.department,
      created_at: newUser.created_at,
    };
  }

  async updateManagementUser(id, updates) {
    const idx = this.data.management_users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    
    const cleanUpdates = { ...updates };
    delete cleanUpdates.id;

    if (cleanUpdates.email) {
      cleanUpdates.email = cleanUpdates.email.trim().toLowerCase();
    }

    if (cleanUpdates.password && typeof cleanUpdates.password === 'string' && cleanUpdates.password.trim()) {
      cleanUpdates.passwordHash = await hashPassword(cleanUpdates.password.trim());
    }
    delete cleanUpdates.password;
    
    this.data.management_users[idx] = { ...this.data.management_users[idx], ...cleanUpdates };
    this.save();
    const u = this.data.management_users[idx];
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
      department: u.department,
      created_at: u.created_at,
    };
  }

  deleteManagementUser(id) {
    const target = this.data.management_users.find(u => u.id === id);
    if (!target) return this.getManagementUsers();

    // Prevent deleting the last remaining admin or super_admin
    const adminCount = this.data.management_users.filter(u => u.role === 'super_admin' || u.role === 'admin').length;
    if ((target.role === 'super_admin' || target.role === 'admin') && adminCount <= 1) {
      throw new Error('Cannot delete the last remaining administrator account.');
    }

    this.data.management_users = this.data.management_users.filter(u => u.id !== id);
    this.save();
    return this.getManagementUsers();
  }

  async verifyManagementUser(email, password) {
    const user = this.data.management_users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    };
  }

  isConnectedToMongo() {
    return typeof getIsConnected === 'function' ? getIsConnected() : false;
  }
}

const db = new Database();
module.exports = db;
module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;
