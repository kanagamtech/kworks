const fs = require('fs');
const path = require('path');
const { connectMongoDB, getIsConnected, Models } = require('./mongo');

const DB_FILE = path.join(__dirname, 'kworks_db.json');

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
};

class Database {
  constructor() {
    this.data = this.load();
    this.initMongo();
  }

  async initMongo() {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL;

    if (mongoUri) {
      const connected = await connectMongoDB(mongoUri);
      if (connected) {
        // Sync existing in-memory/JSON data to MongoDB on initial startup
        await this.syncToMongo();
      }
    }
  }

  async syncToMongo() {
    if (!getIsConnected()) return;
    try {
      // Sync companies
      for (const c of this.getCompanies()) {
        await Models.Company.updateOne({ name: c }, { name: c }, { upsert: true }).catch(() => {});
      }
      // Sync employees
      for (const emp of this.data.employees || []) {
        await Models.Employee.updateOne({ id: emp.id }, emp, { upsert: true }).catch(() => {});
      }
      // Sync attendance
      for (const att of this.data.attendance || []) {
        await Models.Attendance.updateOne({ id: att.id }, att, { upsert: true }).catch(() => {});
      }
      // Sync notices
      for (const notice of this.data.notices || []) {
        await Models.Notice.updateOne({ id: notice.id }, notice, { upsert: true }).catch(() => {});
      }
      // Sync food counts
      for (const fc of this.data.food_counts || []) {
        await Models.FoodCount.updateOne({ id: fc.id }, fc, { upsert: true }).catch(() => {});
      }
      // Sync notifications
      for (const notif of this.data.notifications || []) {
        await Models.Notification.updateOne({ id: notif.id }, notif, { upsert: true }).catch(() => {});
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
      ...msg,
      timestamp: new Date().toISOString(),
    };
    if (!this.data.chat_messages) this.data.chat_messages = [];
    this.data.chat_messages.push(item);
    this.save();
    return item;
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
    return item;
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
}

const db = new Database();
module.exports = db;
