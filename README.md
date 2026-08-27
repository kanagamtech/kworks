# KwOrKs — Enterprise Employee Management & Biometric Attendance Platform

KwOrKs is a full-stack, enterprise workforce management suite featuring biometric face-recognition attendance with live GPS telemetry, daily food/meal planning, leave management, claims, and management dashboards.

---

## 🏗️ 4-Folder Architecture

```text
KwOrK/
├── app/                        # 📱 Mobile App (React Native / Expo)
│   ├── App.tsx                 # Mobile App root router & state
│   ├── screens/                # Mobile app screens (Attendance, Login, Profile, etc.)
│   ├── components/             # Reusable UI components
│   ├── utils/                  # Biometrics, Face Recognition, GPS Location
│   └── package.json            # App dependencies
│
├── backend/                    # ⚙️ REST API & MongoDB Database Server (Port 5000)
│   ├── db/                     # Mongoose schemas & JSON fallback
│   ├── routes/                 # REST API route handlers
│   ├── server.js               # Node.js API server
│   └── package.json            # Backend dependencies
│
├── site/                       # 🌐 Management & HR Web Portal (Port 3000)
│   ├── src/                    # Web Portal pages (Onboarding, Attendance, Leaves)
│   └── package.json            # Site dependencies
│
└── crm/                        # 💼 Enterprise CRM, Email Engine & Automations (Port 3001 & 5001)
    ├── backend/                # Mongoose CRM schemas, Email engine & Workflow triggers
    ├── site/                   # React CRM Portal (Deals, Leads, Contacts, Inbox, Reports)
    └── README.md               # CRM specific architecture & documentation
```

---

## 🌟 Key Features

- **💼 CRM & Automation Suite (`/crm`)**:
  - Full-stack MERN CRM with KwOrKs luxury wine/gold enterprise UI/UX.
  - Complete email send & receive client with customer auto-identification, threading, and attachments.
  - Automated workflow triggers (Welcome emails on new lead, quote dispatch on deal creation, onboarding on deal won, 3-day inactivity follow-ups, and public webhook form ingestion).
  - Visual Kanban Pipeline board, 360° customer communication histories, and analytics dashboards.
- **📱 Mobile App (`/app`)**:
  - High-precision facial recognition with anti-spoofing and spectacles-invariance.
  - Real-time GPS location lock with satellite accuracy metering.
  - Active work shift timer with live elapsed duration.
  - Meal & food count selection (Breakfast, Snacks, Lunch, Dinner).
  - Attendance shift punch-out with automated manager notifications.
  - Strict database account verification for login and session persistence.
- **🌐 Management Web Portal (`/site`)**:
  - Employee face registration & onboarding with camera photo capture.
  - Multi-company management (`kanagamtech`, `amsems`, etc.).
  - Daily attendance logs with timestamp, photo thumbnails, and GPS map coordinates.
  - Food count summary reports for cafeteria planning.
  - Leave management approval workflow.
- **⚙️ Backend REST API (`/backend`)**:
  - Mongoose-powered collections for Employees, Attendance, Food Counts, Leaves, Notices, and Notifications.
  - Multi-tenant architecture for multiple corporate divisions.
  - Dockerized and ready for 1-click deployment on Coolify VPS.

---

## 🚀 Local Development

### 1. Run Backend Server
```bash
cd backend
node server.js
```

### 2. Run Management Web Portal
```bash
cd site
npm run dev
```

### 3. Run Mobile App (Expo Go)
```bash
cd app
npx expo start --go
```

---

## ☁️ Deployment on Coolify VPS

### 1. Backend API Service
- **Base Directory**: `/backend`
- **Build Pack**: `Dockerfile`
- **Port**: `5000`
- **Environment Variables**:
  ```env
  PORT=5000
  NODE_ENV=production
  MONGODB_URI=mongodb://root:<PASSWORD>@<CONTAINER_ID>:27017/default?authSource=admin&directConnection=true
  ```

### 2. Management Web Portal
- **Base Directory**: `/site`
- **Build Pack**: `Dockerfile`
- **Port**: `80`
- **Environment Variables**:
  ```env
  VITE_API_URL=https://api.yourdomain.com
  ```

---

## 📱 Mobile App Build (Standalone Android APK)

```bash
cd app
npx eas-cli build -p android --profile preview
```
