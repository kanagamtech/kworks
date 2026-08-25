# KwOrKs — Enterprise Employee Management & Biometric Attendance Platform

KwOrKs is a full-stack, enterprise workforce management suite featuring biometric face-recognition attendance with live GPS telemetry, daily food/meal planning, leave management, claims, and management dashboards.

---

## 🏗️ 3-Folder Architecture

```text
KwOrK/
├── app/                        # 📱 Mobile App (React Native / Expo)
│   ├── App.tsx                 # Mobile App root router & state
│   ├── screens/                # Mobile app screens (Attendance, Login, Profile, etc.)
│   ├── components/             # Reusable UI components
│   ├── utils/                  # Biometrics, Face Recognition, GPS Location
│   ├── assets/                 # App icons, splash screens, and logos
│   ├── app.json                # Expo configuration
│   ├── eas.json                # EAS Mobile build configuration
│   └── package.json            # App dependencies
│
├── backend/                    # ⚙️ REST API & MongoDB Database Server
│   ├── db/                     # Mongoose schemas & JSON fallback
│   ├── routes/                 # REST API route handlers
│   ├── server.js               # Node.js API server
│   ├── Dockerfile              # Dockerfile for Coolify VPS deployment
│   ├── .env.example            # Environment variables template
│   └── package.json            # Backend dependencies
│
└── site/                       # 🌐 Management Web Portal (React + Vite)
    ├── src/                    # Web Portal pages (Onboarding, Attendance, Leaves)
    ├── hr/                     # HR Portal static routes
    ├── management/             # Management Portal static routes
    ├── Dockerfile              # Production Dockerfile (Nginx)
    ├── nginx.conf              # SPA Nginx routing configuration
    ├── tsconfig.json           # Vite TypeScript configuration
    └── package.json            # Site dependencies
```

---

## 🌟 Key Features

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
