import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { API_BASE } from '../utils/config';

export interface AppUpdateInfo {
  version: string;
  buildNumber: number;
  title: string;
  notes: string;
  mandatory: boolean;
  apkUrl?: string;
  publishedAt: string;
  updateId: string;
}

const APPLIED_UPDATE_KEY = 'kworks_applied_update_id';
const CURRENT_APP_VERSION = '1.0.0';

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const lastCheckTime = useRef(0);

  const checkForUpdate = useCallback(async (isManual = false) => {
    // Throttle checks to once every 10 seconds unless manual
    const now = Date.now();
    if (!isManual && now - lastCheckTime.current < 10000) return;
    lastCheckTime.current = now;

    if (isManual) setIsChecking(true);

    try {
      // 1. Check with Backend Management Broadcast API
      const res = await fetch(`${API_BASE}/api/app-updates`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        if (json && json.success && json.data) {
          const serverUpdate: AppUpdateInfo = json.data;
          const appliedId = await AsyncStorage.getItem(APPLIED_UPDATE_KEY);

          // Check if server version is newer than current or has new broadcast ID
          const isNewerVersion =
            serverUpdate.version !== CURRENT_APP_VERSION ||
            (serverUpdate.updateId && serverUpdate.updateId !== appliedId && serverUpdate.updateId !== 'upd_v1_0_0');

          if (isNewerVersion) {
            setUpdateInfo(serverUpdate);
            setUpdateAvailable(true);
            if (isManual) setStatusMessage(`New update v${serverUpdate.version} available!`);
            return;
          }
        }
      }

      // 2. Check native OTA via expo-updates if enabled in standalone build
      if (!__DEV__ && Updates.isEnabled) {
        try {
          const checkResult = await Updates.checkForUpdateAsync();
          if (checkResult.isAvailable) {
            setUpdateAvailable(true);
            setUpdateInfo({
              version: 'Latest OTA',
              buildNumber: 2,
              title: 'Over-The-Air Code Update',
              notes: 'Management pushed a new live code update. Tap below to reload instantly.',
              mandatory: false,
              publishedAt: new Date().toISOString(),
              updateId: checkResult.manifest?.id || `ota_${Date.now()}`,
            });
            if (isManual) setStatusMessage('New OTA update ready to download!');
            return;
          }
        } catch {
          // Native OTA check failed or running in Expo Go
        }
      }

      if (isManual) {
        setStatusMessage('Your app is up to date (v' + CURRENT_APP_VERSION + ')');
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch {
      if (isManual) {
        setStatusMessage('Could not reach update server.');
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } finally {
      if (isManual) setIsChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    setIsDownloading(true);
    try {
      if (updateInfo?.updateId) {
        await AsyncStorage.setItem(APPLIED_UPDATE_KEY, updateInfo.updateId);
      }

      // If standalone production app has expo-updates enabled
      if (!__DEV__ && Updates.isEnabled) {
        try {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
          return;
        } catch {
          // Fallback to reload
        }
      }

      // Soft reload & dismiss modal
      setUpdateAvailable(false);
      setIsDownloading(false);
    } catch {
      setIsDownloading(false);
    }
  }, [updateInfo]);

  const dismissUpdate = useCallback(() => {
    if (!updateInfo?.mandatory) {
      setUpdateAvailable(false);
    }
  }, [updateInfo]);

  useEffect(() => {
    // Initial check on mount
    checkForUpdate();

    // Re-check when app returns from background
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkForUpdate();
      }
    });

    // Periodic check every 30 seconds
    const interval = setInterval(() => checkForUpdate(), 30000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [checkForUpdate]);

  return {
    updateAvailable,
    updateInfo,
    isChecking,
    isDownloading,
    statusMessage,
    checkForUpdate: () => checkForUpdate(true),
    applyUpdate,
    dismissUpdate,
    currentVersion: CURRENT_APP_VERSION,
  };
}
