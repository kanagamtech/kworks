  import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
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

const CURRENT_APP_VERSION = '1.4.0-beta';
const DEFAULT_APK_FALLBACK_URL = 'https://expo.dev/artifacts/eas/umETEjrlthy-f8KLf3xD4XNQ2LY-eI05DtwBpBcnd3U.apk';
const APPLIED_UPDATE_KEY = 'kworks_applied_update_version';
const DISMISSED_UPDATE_KEY = 'kworks_dismissed_update_version';
const SILENT_APPLIED_KEY = 'kworks_eas_silent_applied';

function parseVersionNumbers(ver: string): number[] {
  if (!ver) return [0];
  const cleaned = ver.replace(/[^0-9.]/g, '');
  return cleaned.split('.').map((n) => parseInt(n, 10) || 0);
}

function isVersionGreater(serverVer: string, currentVer: string): boolean {
  const sParts = parseVersionNumbers(serverVer);
  const cParts = parseVersionNumbers(currentVer);
  const len = Math.max(sParts.length, cParts.length);
  for (let i = 0; i < len; i++) {
    const s = sParts[i] || 0;
    const c = cParts[i] || 0;
    if (s > c) return true;
    if (s < c) return false;
  }
  return false;
}

/**
 * Enhanced Major APK Auto-Downloader & OTA Update Engine
 *
 * 1. For Major Updates: Downloads full APK file in-app with a live progress bar,
 *    and launches Android Package Installer via ContentUri to reinstall the full app cleanly.
 * 2. For Silent Patches: Fetches native EAS updates automatically in the background.
 * 3. Supports manual "Check for Updates" button on Login and Settings.
 */
export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const isCheckedRef = useRef(false);

  // Background silent OTA check on mount
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    const silentCheck = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          const updateId = (result as any).manifest?.id || 'unknown';
          const lastApplied = await AsyncStorage.getItem(SILENT_APPLIED_KEY).catch(() => null);
          if (lastApplied === updateId) return;

          await Updates.fetchUpdateAsync();
          await AsyncStorage.setItem(SILENT_APPLIED_KEY, updateId).catch(() => {});
          await Updates.reloadAsync();
        }
      } catch {
        // Silently continue
      }
    };

    const timer = setTimeout(silentCheck, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Check server for updates (manual or automatic)
  const checkForUpdate = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsChecking(true);
      setStatusMessage('Checking server for updates...');
    }

    try {
      // 1. Check Backend Broadcast API
      const res = await fetch(`${API_BASE}/api/app-updates`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        if (json && json.success && json.data) {
          const serverUpdate: AppUpdateInfo = {
            ...json.data,
            apkUrl: json.data.apkUrl || DEFAULT_APK_FALLBACK_URL,
          };
          const dismissedVer = await AsyncStorage.getItem(DISMISSED_UPDATE_KEY).catch(() => null);
          const appliedVer = await AsyncStorage.getItem(APPLIED_UPDATE_KEY).catch(() => null);

          // If this version was already applied on this device, skip automatic popup
          if (appliedVer === serverUpdate.version && !isManual) {
            return;
          }

          // If dismissed and not mandatory, skip automatic popup
          if (!serverUpdate.mandatory && dismissedVer === serverUpdate.version && !isManual) {
            return;
          }

          const isNewer = isVersionGreater(serverUpdate.version, CURRENT_APP_VERSION);

          if (isNewer || isManual) {
            setUpdateInfo(serverUpdate);
            setUpdateAvailable(true);
            if (isManual) {
              setStatusMessage(`Update v${serverUpdate.version} ready to install!`);
            }
            return;
          }
        }
      }

      // 2. Fallback: check Expo EAS update channel
      if (!__DEV__ && Updates.isEnabled) {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          setStatusMessage('Downloading EAS update patch...');
          setIsDownloading(true);
          await Updates.fetchUpdateAsync();
          setStatusMessage('Reloading with latest bundle...');
          await Updates.reloadAsync();
          return;
        }
      }

      if (isManual) {
        setStatusMessage(`KwOrKs is up to date (v${CURRENT_APP_VERSION}) ✓`);
        setTimeout(() => setStatusMessage(''), 4500);
      }
    } catch {
      if (isManual) {
        setStatusMessage('Could not connect to update server. Check your internet.');
        setTimeout(() => setStatusMessage(''), 5000);
      }
    } finally {
      if (isManual) setIsChecking(false);
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    if (!isCheckedRef.current) {
      isCheckedRef.current = true;
      checkForUpdate(false);
    }
  }, [checkForUpdate]);

  // 1. Download & Install Full APK in-app
  const downloadAndInstallApk = useCallback(async (customUrl?: string) => {
    const targetUrl = customUrl || updateInfo?.apkUrl || DEFAULT_APK_FALLBACK_URL;
    if (!targetUrl) {
      Alert.alert('Download Error', 'No APK download URL available for this update.');
      return;
    }

    if (Platform.OS === 'web') {
      window.open(targetUrl, '_blank');
      return;
    }

    try {
      setIsDownloadingApk(true);
      setDownloadProgress(0);
      setStatusMessage('Preparing APK download...');

      const filename = `KwOrKs_v${updateInfo?.version || 'latest'}_${Date.now()}.apk`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        targetUrl,
        fileUri,
        {},
        (downloadProgressEvent) => {
          const totalExpected = downloadProgressEvent.totalBytesExpectedToWrite;
          const written = downloadProgressEvent.totalBytesWritten;
          if (totalExpected > 0) {
            const pct = Math.min(Math.max(written / totalExpected, 0), 1);
            setDownloadProgress(pct);
            setStatusMessage(`Downloading APK: ${Math.round(pct * 100)}%`);
          }
        }
      );

      const downloadResult = await downloadResumable.downloadAsync();
      setIsDownloadingApk(false);

      if (!downloadResult || !downloadResult.uri) {
        throw new Error('Download did not complete.');
      }

      setStatusMessage('Download complete! Opening installer...');

      // Launch Android Package Installer
      if (Platform.OS === 'android') {
        try {
          const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
          await Linking.openURL(contentUri);
        } catch {
          // Fallback to direct APK URL in browser
          await Linking.openURL(targetUrl);
        }
      } else {
        await Linking.openURL(targetUrl);
      }

      if (updateInfo?.version) {
        await AsyncStorage.setItem(APPLIED_UPDATE_KEY, updateInfo.version).catch(() => {});
      }
      setUpdateAvailable(false);
    } catch (err: any) {
      setIsDownloadingApk(false);
      setStatusMessage('Direct download failed. Opening browser...');
      try {
        await Linking.openURL(targetUrl);
      } catch {}
    }
  }, [updateInfo]);

  // 2. Apply JS/EAS OTA Patch
  const applyUpdate = useCallback(async () => {
    setIsDownloading(true);
    setStatusMessage('Applying update patch...');

    try {
      if (updateInfo?.version) {
        await AsyncStorage.setItem(APPLIED_UPDATE_KEY, updateInfo.version).catch(() => {});
      }

      if (!__DEV__ && Updates.isEnabled) {
        try {
          const checkResult = await Updates.checkForUpdateAsync();
          if (checkResult.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
            return;
          }
        } catch {
          // Fall back to APK installer
        }
      }

      // If EAS is not available or if APK URL is present, trigger APK download
      if (updateInfo?.apkUrl) {
        await downloadAndInstallApk();
      } else {
        setUpdateAvailable(false);
      }
    } catch {
      setUpdateAvailable(false);
    } finally {
      setIsDownloading(false);
    }
  }, [updateInfo, downloadAndInstallApk]);

  // 3. Dismiss Update Modal
  const dismissUpdate = useCallback(async () => {
    if (updateInfo?.version) {
      await AsyncStorage.setItem(DISMISSED_UPDATE_KEY, updateInfo.version).catch(() => {});
    }
    setUpdateAvailable(false);
  }, [updateInfo]);

  return {
    updateAvailable,
    updateInfo,
    isChecking,
    isDownloading,
    isDownloadingApk,
    downloadProgress,
    statusMessage,
    checkForUpdate: () => checkForUpdate(true),
    downloadAndInstallApk,
    applyUpdate,
    dismissUpdate,
    currentVersion: CURRENT_APP_VERSION,
  };
}
