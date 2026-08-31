import { useEffect, useState, useCallback, useRef } from 'react';
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

const APPLIED_UPDATE_KEY = 'kworks_applied_update_version';
const DISMISSED_UPDATE_KEY = 'kworks_dismissed_update_version';
const CURRENT_APP_VERSION = '1.0.0';

function isVersionGreater(serverVer: string, currentVer: string): boolean {
  const sParts = (serverVer || '').split('.').map((p) => parseInt(p, 10) || 0);
  const cParts = (currentVer || '').split('.').map((p) => parseInt(p, 10) || 0);
  for (let i = 0; i < Math.max(sParts.length, cParts.length); i++) {
    const s = sParts[i] || 0;
    const c = cParts[i] || 0;
    if (s > c) return true;
    if (s < c) return false;
  }
  return false;
}

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const isCheckedRef = useRef(false);

  const checkForUpdate = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsChecking(true);
      setStatusMessage('Checking server for updates...');
    }

    try {
      // Check Backend Broadcast API
      const res = await fetch(`${API_BASE}/api/app-updates`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        if (json && json.success && json.data) {
          const serverUpdate: AppUpdateInfo = json.data;
          const dismissedVer = await AsyncStorage.getItem(DISMISSED_UPDATE_KEY).catch(() => null);

          // Only trigger if server version is strictly greater than current app
          const isNewer = isVersionGreater(serverUpdate.version, CURRENT_APP_VERSION);

          if (isNewer) {
            // If not mandatory and already dismissed on this device, skip modal unless manual check
            if (!serverUpdate.mandatory && dismissedVer === serverUpdate.version && !isManual) {
              return;
            }

            setUpdateInfo(serverUpdate);
            setUpdateAvailable(true);
            if (isManual) setStatusMessage(`New update v${serverUpdate.version} is available!`);
            return;
          }
        }
      }

      if (isManual) {
        setStatusMessage(`App is up to date (v${CURRENT_APP_VERSION})`);
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
      if (updateInfo?.version) {
        await AsyncStorage.setItem(APPLIED_UPDATE_KEY, updateInfo.version).catch(() => {});
      }

      // If standalone production app has expo-updates enabled and configured
      if (!__DEV__ && Updates.isEnabled) {
        try {
          const checkResult = await Updates.checkForUpdateAsync();
          if (checkResult.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
            return;
          }
        } catch {
          // Native OTA fetch not available on channel
        }
      }

      // Dismiss modal after applying
      setUpdateAvailable(false);
      setIsDownloading(false);
    } catch {
      setUpdateAvailable(false);
      setIsDownloading(false);
    }
  }, [updateInfo]);

  const dismissUpdate = useCallback(() => {
    if (!updateInfo?.mandatory) {
      if (updateInfo?.version) {
        AsyncStorage.setItem(DISMISSED_UPDATE_KEY, updateInfo.version).catch(() => {});
      }
      setUpdateAvailable(false);
    }
  }, [updateInfo]);

  useEffect(() => {
    // Only check once on initial mount
    if (!isCheckedRef.current) {
      isCheckedRef.current = true;
      checkForUpdate(false);
    }
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
