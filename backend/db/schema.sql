-- KwOrKs Database Schema Definition

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  photo_uri TEXT,
  role TEXT DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT,
  photo_uri TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Food Counts Table
CREATE TABLE IF NOT EXISTS food_counts (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  date TEXT NOT NULL,
  breakfast BOOLEAN DEFAULT FALSE,
  morning_snacks BOOLEAN DEFAULT FALSE,
  lunch BOOLEAN DEFAULT FALSE,
  evening_snacks BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | approved | cancelled
  time TEXT,
  decided_by TEXT,
  decided_at TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  cc_email TEXT,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open | resolved
  created_at TEXT NOT NULL
);

-- Support Ticket Messages Table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  role TEXT NOT NULL, -- user | support | management
  body TEXT NOT NULL,
  time TEXT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Announcements & Notices Table
CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  date TEXT NOT NULL,
  team TEXT DEFAULT 'ALL',
  category TEXT DEFAULT 'management', -- management | hr
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Birthdays Table
CREATE TABLE IF NOT EXISTS birthdays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  photo TEXT,
  role TEXT DEFAULT 'Birthday',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anniversaries Table
CREATE TABLE IF NOT EXISTS anniversaries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Polls Table
CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  options_json TEXT NOT NULL,
  votes_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
