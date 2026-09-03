import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import Text from './AppText';
import type { AppUpdateInfo } from '../hooks/useAppUpdate';

const BRAND = {
  primary: '#D7AB6A',
  primaryDark: '#31122B',
  bgCard: '#1E0B1A',
  bgCardLight: 'rgba(215,171,106,0.1)',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  border: '#D7AB6A',
  accent: '#2E8B57',
};

interface Props {
  visible: boolean;
  updateInfo: AppUpdateInfo | null;
  isDownloading: boolean;
  isDownloadingApk?: boolean;
  downloadProgress?: number;
  onDownloadApk?: () => void;
  onApply: () => void;
  onDismiss: () => void;
}

export default function UpdateModal({
  visible,
  updateInfo,
  isDownloading,
  isDownloadingApk = false,
  downloadProgress = 0,
  onDownloadApk,
  onApply,
  onDismiss,
}: Props) {
  if (!updateInfo) return null;

  const notesList = updateInfo.notes
    ? updateInfo.notes.split('\n').filter((n) => n.trim().length > 0)
    : ['General performance improvements, feature enhancements, and bug fixes.'];

  const pct = Math.round(downloadProgress * 100);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon & Title */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 28 }}>📦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionBadgeText}>v{updateInfo.version}</Text>
                </View>
                {updateInfo.mandatory && (
                  <View style={styles.mandatoryBadge}>
                    <Text style={styles.mandatoryBadgeText}>REQUIRED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title}>{updateInfo.title || 'Major App Update Ready'}</Text>
            </View>
          </View>

          {/* Changelog Card */}
          <Text style={styles.sectionHeader}>WHAT'S INCLUDED IN THIS RELEASE</Text>
          <ScrollView style={styles.notesContainer} showsVerticalScrollIndicator={false}>
            {notesList.map((note, idx) => (
              <View key={idx} style={styles.noteRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.noteText}>{note.replace(/^[•\-\*]\s*/, '')}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Download Progress Bar */}
          {isDownloadingApk && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>📥 Downloading Full APK Installer...</Text>
                <Text style={styles.progressPct}>{pct}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressSub}>
                Package installer will launch automatically once download completes.
              </Text>
            </View>
          )}

          {updateInfo.mandatory && (
            <View style={styles.mandatoryNotice}>
              <Text style={{ fontSize: 12.5, color: '#FFB74D', fontWeight: '700' }}>
                ⚠️ Management has marked this update as required to ensure full synchronization.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Primary Action: Download & Install Full App APK */}
            <Pressable
              style={[
                styles.apkBtnPrimary,
                (isDownloadingApk || isDownloading) && styles.btnDisabled,
              ]}
              disabled={isDownloadingApk || isDownloading}
              onPress={onDownloadApk || onApply}
            >
              {isDownloadingApk ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator color="#31122B" size="small" />
                  <Text style={styles.apkBtnPrimaryText}>Downloading ({pct}%)...</Text>
                </View>
              ) : (
                <Text style={styles.apkBtnPrimaryText}>📦 Download &amp; Reinstall Full App</Text>
              )}
            </Pressable>

            {/* Secondary Action: Instant OTA JS Reload */}
            <Pressable
              style={[styles.otaBtn, (isDownloading || isDownloadingApk) && styles.btnDisabled]}
              disabled={isDownloading || isDownloadingApk}
              onPress={onApply}
            >
              {isDownloading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color={BRAND.primary} size="small" />
                  <Text style={styles.otaBtnText}>Applying Instant Patch...</Text>
                </View>
              ) : (
                <Text style={styles.otaBtnText}>⚡ Apply Instant OTA Patch &amp; Restart</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 3, 14, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: BRAND.bgCard,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: BRAND.primary,
    padding: 22,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(215,171,106,0.18)',
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  versionBadge: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  versionBadgeText: {
    color: '#31122B',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  mandatoryBadge: {
    backgroundColor: '#E05050',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mandatoryBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  title: {
    color: BRAND.text,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  sectionHeader: {
    color: BRAND.textDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  notesContainer: {
    maxHeight: 130,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.2)',
    padding: 12,
    marginBottom: 14,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  bullet: {
    color: BRAND.primary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  noteText: {
    flex: 1,
    color: '#F0E6D8',
    fontSize: 13,
    lineHeight: 18,
  },
  progressSection: {
    backgroundColor: 'rgba(215,171,106,0.1)',
    borderWidth: 1,
    borderColor: BRAND.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  progressPct: {
    color: BRAND.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BRAND.primary,
    borderRadius: 4,
  },
  progressSub: {
    color: BRAND.textDim,
    fontSize: 11,
    fontStyle: 'italic',
  },
  mandatoryNotice: {
    backgroundColor: 'rgba(255,183,77,0.12)',
    borderWidth: 1,
    borderColor: '#FFB74D',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  apkBtnPrimary: {
    backgroundColor: BRAND.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  apkBtnPrimaryText: {
    color: '#31122B',
    fontWeight: '900',
    fontSize: 14.5,
    letterSpacing: 0.5,
  },
  otaBtn: {
    backgroundColor: 'rgba(215,171,106,0.12)',
    borderWidth: 1.2,
    borderColor: BRAND.primary,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  otaBtnText: {
    color: BRAND.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  dismissBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: BRAND.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
});
