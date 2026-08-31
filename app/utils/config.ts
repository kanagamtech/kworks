import { Platform } from 'react-native';

// ─── Production backend URL ───────────────────────────────────────────────────
// Set this to your live backend URL when deployed.
// Leave empty ('') during LOCAL DEVELOPMENT so the LAN/localhost fallback is used.
const PRODUCTION_BACKEND_URL = 'https://backend.kanagamtech.in'; // Live Coolify backend

// ─── Local development fallback ───────────────────────────────────────────────
// Your machine's LAN IP — only used if PRODUCTION_BACKEND_URL is empty.
const LAN_IP = '192.168.0.14';

export const API_BASE = (
  PRODUCTION_BACKEND_URL ||
  (Platform.OS === 'web'
    ? 'http://localhost:5000'
    : `http://${LAN_IP}:5000`)
).replace(/\/+$/, '');
