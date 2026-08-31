# KwOrKs CRM — Enterprise MERN Customer Relationship & Sales Automation Suite

KwOrKs CRM is a modern, full-stack **MERN (MongoDB, Express, React, Node.js)** platform built with the signature **KwOrKs** enterprise UI/UX aesthetic (deep wine `#31122B` theme, luxury champagne gold `#D7AB6A` accents, glassmorphic cards, bold typography, and interactive status workflows).

---

## 🏗️ Architecture & Modules

```text
crm/
├── backend/                      # ⚙️ REST API & Automation Server (Port 5001)
│   ├── db/                       # MongoDB connection + JSON fallback persistence
│   ├── models/                   # Mongoose schemas (Lead, Contact, Company, Deal, Task, Email, Template, Automation)
│   ├── routes/                   # REST API routes & Webhook endpoints
│   ├── services/                 # Email Service & Automated Workflow Trigger Engine
│   ├── server.js                 # Express server entry point
│   └── package.json              # Backend dependencies
│
├── site/                         # 🌐 React + Vite + TypeScript Web Portal (Port 3001)
│   ├── src/
│   │   ├── components/           # TopNav, StatCard, Modal, ToastContainer
│   │   ├── pages/                # Dashboard, Leads, Contacts, Companies, Deals, Tasks, Email, Automations, Reports
│   │   ├── services/             # Typed API client
│   │   ├── styles/               # KwOrKs theme tokens and styles
│   │   ├── types/                # CRM TypeScript interfaces
│   │   └── App.tsx               # Root application router & state sync
│   ├── vite.config.ts            # Vite configuration
│   └── package.json              # Frontend dependencies
│
└── README.md                     # Documentation
```

---

## 🌟 Key CRM Capabilities

### 1. 📊 Executive Dashboard
- **Sales Summary**: Won revenue, weighted pipeline, win rate %, open deals count.
- **Today's Tasks & Follow-ups**: Real-time urgent task tracker with one-click completion.
- **New Leads & Open Deals**: Live feed of incoming opportunities.
- **Quick Action Bar**: Instantly compose email, add lead, create deal, or add task.

### 2. 🎯 Leads Management
- Captures: Name, Company, Email, Phone, Source, Status, Assigned Rep, Estimated Value, Notes, and Auto Follow-up toggle.
- **1-Click Conversion**: Converts Lead to verified Contact and active Deal opportunity.
- **Quick Email**: Launches pre-addressed email composer directly from lead table.

### 3. 👥 Contacts (360° Customer Records)
- Profile details, account ownership, company affiliation.
- **Previous Communications Timeline**: Displays all historical inbound & outbound emails.
- **Linked Deals & Tasks**: Rolled-up view of active pipeline value and upcoming meetings.

### 4. 🏢 Companies & Accounts
- Enterprise account management, domain matching, industry, tier (Enterprise/SMB), and annual revenue.
- Multi-contact aggregation and organizational pipeline totals.

### 5. 💼 Deals & Sales Pipeline
- **Dual Views**: Interactive **Kanban Pipeline Board** and structured **Table View**.
- Stages: *Discovery / Qualification (20%)*, *Proposal Sent (50%)*, *Negotiation (80%)*, *Closed Won (100%)*, *Closed Lost (0%)*.
- Stage Progression: Automatically updates probabilities and triggers automated **Quotation** and **Deal Won Onboarding** emails.

### 6. ⏰ Tasks & Follow-ups
- Due date, time, 24-hour reminder alerts, assignee, priority (High/Medium/Low), and completion status.
- Highlights overdue tasks and items due today.

### 7. ✉️ Email Center (Send & Receive) ⭐
- **Send Outbound Email**: Rich composer with `To`, `CC`, `BCC`, file attachments, and template interpolation.
- **Auto Customer Identification**: Automatically matches recipient or sender emails against Contacts, Leads, and Deals, linking messages into their timeline.
- **Receive Inbound Emails**: Includes an interactive **"Simulate Customer Inbound Email"** modal to demonstrate real-time inbox ingestion and auto-association.
- **Reply & Forward**: Preserves thread quotes, subjects, and attachments.
- **Pre-built Templates**:
  - *Welcome & Introduction*
  - *Follow-up on Proposal*
  - *Quotation & Pricing Breakdown*
  - *Payment & Invoice Reminder*
  - *Deal Won & Thank You*
  - *Meeting Confirmation*

### 8. ⚡ Automatic Workflow Automations ⭐
Pre-configured, zero-touch automated triggers:
1. **New Lead Created** ➔ Automatically dispatches *Welcome Email* to prospect.
2. **Deal Created** ➔ Automatically dispatches *Commercial Quotation*.
3. **Deal Won** ➔ Automatically dispatches *Customer Confirmation & Onboarding Email*.
4. **No Response for 3 Days** ➔ Automatically triggers *Follow-up Email* sequence.
5. **Task Due Tomorrow** ➔ Dispatches automated employee reminder alert.
6. **Public Website Form Submission** ➔ Webhook (`/webhook/lead`) ingests lead, creates an urgent follow-up task, and fires a personalized welcome email.

### 9. 📈 Reports & Analytics
- Lead acquisition source channels breakdown.
- Pipeline stage distribution and revenue realization.
- Email volumes (sent, received, automated, response SLA).
- Employee performance leaderboard (won revenue, tasks completed, deals closed).

---

## 🚀 Running KwOrKs CRM Locally

### 1. Run CRM Backend Server (Port 5001)
```bash
cd crm/backend
npm install
node server.js
```

### 2. Run CRM Web Portal (Port 3001)
```bash
cd crm/site
npm install
npm run dev
```

Open your browser at **`http://localhost:3001`** to access KwOrKs CRM.
