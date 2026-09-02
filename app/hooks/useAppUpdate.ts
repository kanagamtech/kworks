import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

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

const CURRENT_APP_VERSION = '1.3.0';
// Key to remember which EAS bundle we last silently applied
const SILENT_APPLIED_KEY = 'kworks_eas_silent_applied';

/**
 * Completely silent OTA updater.
 *
 * - On first startup: uses Expo's native ON_LOAD mechanism (configured in app.json)
 *   to download and apply the bundle on the NEXT app open.
 * - On manual check: calls checkForUpdateAsync → fetchUpdateAsync → reloadAsync
 *   to apply an update immediately in the background, then reloads automatically.
 * - NEVER shows a popup modal to the user automatically.
 * - Only shows status messages when the user manually taps "Check for Updates".
 */
export function useAppUpdate() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // On mount: silently check and apply EAS OTA update in background (no popup)
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    const silentCheck = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          // Record we found an update so we don't re-check unnecessarily
          const updateId = (result as any).manifest?.id || 'unknown';
          const lastApplied = await AsyncStorage.getItem(SILENT_APPLIED_KEY).catch(() => null);
          if (lastApplied === updateId) return; // Already fetched this bundle

          await Updates.fetchUpdateAsync();
          await AsyncStorage.setItem(SILENT_APPLIED_KEY, updateId).catch(() => {});
          // Reload the app silently with the new bundle
          await Updates.reloadAsync();
        }
      } catch {
        // Silently ignore – user experience is not interrupted
      }
    };

    // Slight delay to not block the initial render
    const timer = setTimeout(silentCheck, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Manual check (triggered by user tapping "Check for Updates" in settings)
  const checkForUpdate = useCallback(async () => {
    setIsChecking(true);
    setStatusMessage('Checking for EAS updates...');

    try {
      if (!__DEV__ && Updates.isEnabled) {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          setStatusMessage('Downloading & applying v1.3.0 update...');
          setIsDownloading(true);
          await Updates.fetchUpdateAsync();
          setStatusMessage('Reloading with latest v1.3.0 bundle...');
          await Updates.reloadAsync();
          return;
        } else {
          setStatusMessage(`KwOrKs is up to date (v${CURRENT_APP_VERSION}) ✓`);
        }
      } else {
        setStatusMessage(`Dev / Web Mode · Latest code active (v${CURRENT_APP_VERSION})`);
      }
      setTimeout(() => setStatusMessage(''), 4500);
    } catch {
      setStatusMessage('Could not check for updates. Check your internet connection.');
      setTimeout(() => setStatusMessage(''), 5000);
    } finally {
      setIsChecking(false);
      setIsDownloading(false);
    }
  }, []);

  return {
    updateAvailable: false, // Never triggers a popup
    updateInfo: null,
    isChecking,
    isDownloading,
    statusMessage,
    checkForUpdate,
    applyUpdate: checkForUpdate,
    dismissUpdate: () => {},
    currentVersion: CURRENT_APP_VERSION,
  };
}
