import { Platform } from 'react-native';

// On real mobile devices, localhost doesn't point to your computer.
// Use your machine's actual local IP so Expo Go can reach the backend.
const LAN_IP = '10.52.94.136';

export const API_BASE =
  Platform.OS === 'web'
    ? 'http://localhost:5000'
    : `http://${LAN_IP}:5000`;
