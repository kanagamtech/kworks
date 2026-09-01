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
  onApply: () => void;
  onDismiss: () => void;
}

export default function UpdateModal({
  visible,
  updateInfo,
  isDownloading,
  onApply,
  onDismiss,
}: Props) {
  if (!updateInfo) return null;

  const notesList = updateInfo.notes
    ? updateInfo.notes.split('\n').filter((n) => n.trim().length > 0)
    : ['General performance improvements and feature updates.'];

  const handleDownloadApk = () => {
    if (updateInfo.apkUrl) {
      Linking.openURL(updateInfo.apkUrl).catch(() => {});
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={updateInfo.mandatory ? undefined : onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon & Title */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 28 }}>🚀</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionBadgeText}>v{updateInfo.version}</Text>
                </View>
                {updateInfo.mandatory && (
                  <View style={styles.mandatoryBadge}>
                    <Text style={styles.mandatoryBadgeText}>MANDATORY</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title}>{updateInfo.title || 'New Update Released'}</Text>
            </View>
          </View>

          {/* Changelog Card */}
          <Text style={styles.sectionHeader}>WHAT'S NEW &amp; IMPROVEMENTS</Text>
          <ScrollView style={styles.notesContainer} showsVerticalScrollIndicator={false}>
            {notesList.map((note, idx) => (
              <View key={idx} style={styles.noteRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.noteText}>{note.replace(/^[•\-\*]\s*/, '')}</Text>
              </View>
            ))}
          </ScrollView>

          {updateInfo.mandatory && (
            <View style={styles.mandatoryNotice}>
              <Text style={{ fontSize: 13, color: '#FFB74D', fontWeight: '700' }}>
                ⚠️ Management has marked this update as required before proceeding with attendance.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.applyBtn, isDownloading && styles.applyBtnDisabled]}
              disabled={isDownloading}
              onPress={onApply}
            >
              {isDownloading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator color="#31122B" size="small" />
                  <Text style={styles.applyBtnText}>Applying Update...</Text>
                </View>
              ) : (
                <Text style={styles.applyBtnText}>⚡ Update &amp; Reload Now</Text>
              )}
            </Pressable>

            {updateInfo.apkUrl ? (
              <Pressable style={styles.apkBtn} onPress={handleDownloadApk}>
                <Text style={styles.apkBtnText}>📦 Download Direct APK File</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissBtnText}>✕ Dismiss &amp; Continue to App</Text>
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
    backgroundColor: 'rgba(15, 3, 14, 0.82)',
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
    maxHeight: 140,
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
  applyBtn: {
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
  applyBtnDisabled: {
    opacity: 0.6,
  },
  applyBtnText: {
    color: '#31122B',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  apkBtn: {
    backgroundColor: 'rgba(215,171,106,0.15)',
    borderWidth: 1,
    borderColor: BRAND.primary,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  apkBtnText: {
    color: BRAND.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  dismissBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: BRAND.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
});
