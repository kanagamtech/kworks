const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  company: { type: String, default: 'kanagamtech', index: true },
  department: { type: String, default: 'General' },
  destination: { type: String, default: 'Employee' },
  photo: { type: String, default: '' },
  pushToken: { type: String, default: '' },
  faceData: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const AttendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  date: { type: String, required: true, index: true },
  time: { type: String, required: true },
  user: { type: String, required: true, index: true },
  name: { type: String },
  location: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  accuracy: { type: Number },
  altitude: { type: Number },
  gpsFormatted: { type: String },
  mapsUrl: { type: String },
  photoUri: { type: String },
  punchOutTime: { type: String },
  duration: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const FoodCountSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true, index: true },
  user: { type: String, required: true, index: true },
  meals: {
    breakfast: { type: Boolean, default: false },
    morningSnacks: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    eveningSnacks: { type: Boolean, default: false },
  },
  updated_at: { type: String, default: () => new Date().toISOString() },
});

const LeaveRequestSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  reason: { type: String },
  type: { type: String },
  approved: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  user: { type: String },
  email: { type: String, index: true },
  time: { type: String },
  decidedBy: { type: String },
  decidedAt: { type: String },
});

const NoticeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  date: { type: String },
  team: { type: String, default: 'ALL' },
  category: { type: String, default: 'management' },
});

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  employeeName: { type: String },
  employeeEmail: { type: String },
  company: { type: String },
  department: { type: String },
  duration: { type: String },
  type: { type: String, default: 'general' },
  date: { type: String },
  time: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const ClaimSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  status: {
    manager: { type: String, default: 'pending' },
    finance: { type: String, default: 'pending' },
  },
  date: { type: String },
  type: { type: String },
  amount: { type: String },
  purpose: { type: String },
  photo: { type: String },
});

const TicketSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String },
  status: { type: String, default: 'open' },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const AppUpdateSchema = new mongoose.Schema({
  version: { type: String, required: true },
  buildNumber: { type: Number, default: 1 },
  title: { type: String },
  notes: { type: String },
  mandatory: { type: Boolean, default: false },
  apkUrl: { type: String, default: '' },
  publishedAt: { type: String, default: () => new Date().toISOString() },
  updateId: { type: String, default: 'upd_v1_0_0' },
});

const ChatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  text: { type: String },
  photo: { type: String },
  document: {
    name: String,
    size: String,
    type: String,
    dataUri: String,
  },
  status: { type: String, default: 'delivered' },
  reactions: { type: Object, default: {} },
  replyTo: { type: Object },
  isSecret: { type: Boolean, default: false },
  expiresAt: { type: Number },
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: String },
  deletedAt: { type: String },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: String },
  timestamp: { type: String, default: () => new Date().toISOString() },
});

const ChatGroupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  members: [{ type: String }],
  created_at: { type: String, default: () => new Date().toISOString() },
  creator: { type: String },
});

const PushTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  pushToken: { type: String, required: true },
  platform: { type: String, default: 'android' },
  updated_at: { type: String, default: () => new Date().toISOString() },
});

const Models = {
  Employee: mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema),
  Attendance: mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema),
  FoodCount: mongoose.models.FoodCount || mongoose.model('FoodCount', FoodCountSchema),
  LeaveRequest: mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', LeaveRequestSchema),
  Notice: mongoose.models.Notice || mongoose.model('Notice', NoticeSchema),
  Notification: mongoose.models.Notification || mongoose.model('Notification', NotificationSchema),
  Company: mongoose.models.Company || mongoose.model('Company', CompanySchema),
  Claim: mongoose.models.Claim || mongoose.model('Claim', ClaimSchema),
  Ticket: mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema),
  AppUpdate: mongoose.models.AppUpdate || mongoose.model('AppUpdate', AppUpdateSchema),
  ChatMessage: mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema),
  ChatGroup: mongoose.models.ChatGroup || mongoose.model('ChatGroup', ChatGroupSchema),
  PushToken: mongoose.models.PushToken || mongoose.model('PushToken', PushTokenSchema),
};

let isConnected = false;

async function connectMongoDB(uri) {
  if (!uri) return false;
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[KwOrKs MongoDB] Connected successfully to Coolify MongoDB!');

    // Initialize default companies if empty
    const count = await Models.Company.countDocuments();
    if (count === 0) {
      await Models.Company.create([{ name: 'kanagamtech' }, { name: 'amsems' }]);
    }
    return true;
  } catch (err) {
    isConnected = false;
    console.warn('[KwOrKs MongoDB] Could not connect to MongoDB, using local fallback DB:', err.message);
    return false;
  }
}

module.exports = {
  connectMongoDB,
  getIsConnected: () => isConnected,
  Models,
};
