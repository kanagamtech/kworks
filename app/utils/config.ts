import { Platform } from 'react-native';

// Set your Coolify VPS backend domain here:
const PRODUCTION_BACKEND_URL = 'https://www.kworksb.kanagamtech.com';

const LAN_IP = '192.168.0.6';

export const API_BASE = (PRODUCTION_BACKEND_URL ||
  (Platform.OS === 'web'
    ? 'http://localhost:5000'
    : `http://${LAN_IP}:5000`)).replace(/\/+$/, '');
