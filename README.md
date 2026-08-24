# KwOrKs — Enterprise Employee Management & Biometric Attendance Platform

KwOrKs is a full-stack, enterprise workforce management suite featuring biometric face-recognition attendance with live GPS telemetry, daily food/meal planning, leave management, claims, and management dashboards.

---

## 🌟 Key Features

- **📱 Mobile App (React Native / Expo)**:
  - High-precision facial recognition with anti-spoofing and spectacles-invariance.
  - Real-time GPS location lock with satellite accuracy metering.
  - Active work shift timer with live elapsed duration.
  - Meal & food count selection (Breakfast, Snacks, Lunch, Dinner).
  - Attendance shift punch-out with automated manager notifications.
- **🌐 Management Web Portal (React / Vite)**:
  - Employee face registration & onboarding with camera photo capture.
  - Multi-company management (`kanagamtech`, `amsems`, etc.).
  - Daily attendance logs with timestamp, photo thumbnails, and GPS map coordinates.
  - Food count summary reports for cafeteria planning.
  - Leave management approval workflow.
- **⚙️ Backend REST API (Node.js & MongoDB)**:
  - Mongoose-powered collections for Employees, Attendance, Food Counts, Leaves, Notices, and Notifications.
  - Multi-tenant architecture for multiple corporate divisions.
  - Dockerized and ready for 1-click deployment on Coolify VPS.

---

## 🏗️ Project Architecture

```text
KwOrK/
├── App.tsx                     # Mobile App root router & state
├── screens/                    # Mobile app screens (Attendance, Login, Profile, etc.)
├── components/                 # Reusable UI components
├── utils/                      # Biometrics, Face Recognition, GPS Location
├── backend/                    # Node.js REST API server & MongoDB Models
│   ├── db/                     # Mongoose schemas & local JSON fallback
│   ├── server.js               # REST API endpoints
│   ├── Dockerfile              # Dockerfile for Backend deployment
│   └── package.json
├── site/                       # Management Web Portal (Vite + React)
│   ├── src/                    # Web Portal pages (Onboarding, Attendance, Leaves)
│   ├── Dockerfile              # Production Dockerfile (Nginx)
│   └── nginx.conf              # SPA Nginx configuration
├── app.json                    # Expo configuration
├── eas.json                    # EAS Mobile build configuration
└── package.json
```

---

## 🚀 Deployment on Coolify VPS

### 1. Provision MongoDB
In Coolify, create a new **MongoDB** database resource. Note the internal connection URL:
```text
mongodb://root:<PASSWORD>@<CONTAINER_ID>:27017/default?authSource=admin&directConnection=true
```

### 2. Deploy Backend API
- **Source**: GitHub Repository (`/backend` directory).
- **Build Pack**: `Dockerfile`.
- **Port**: `5000`.
- **Environment Variables**:
  ```env
  PORT=5000
  MONGODB_URI=mongodb://root:<PASSWORD>@<CONTAINER_ID>:27017/default?authSource=admin&directConnection=true
  ```

### 3. Deploy Management Web Portal
- **Source**: GitHub Repository (`/site` directory).
- **Build Pack**: `Dockerfile`.
- **Port**: `80`.
- **Environment Variables**:
  ```env
  VITE_API_URL=https://api.yourdomain.com
  ```

---

## 📱 Mobile App Build (EAS)

To build the standalone installable Android APK:
```bash
npx eas-cli build -p android --profile preview
```

---

## 💻 Local Development

### 1. Run Backend Server
```bash
node backend/server.js
```

### 2. Run Management Web Portal
```bash
cd site
npm run dev
```

### 3. Run Mobile App
```bash
npx expo start --go
```
