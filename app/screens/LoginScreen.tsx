import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Text from '../components/AppText';
import * as FileSystem from 'expo-file-system/legacy';
import MorningBackground from '../components/MorningBackground';
import { useResponsive } from '../hooks/useResponsive';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { API_BASE } from '../utils/config';
import type { UserProfile } from '../types';

const useNativeDriver = Platform.OS !== 'web';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#D7AB6A',
  primaryDark: '#31122B',
  bgMain: '#31122B',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  inputBg: 'rgba(42,16,36,0.5)',
  border: '#31122B',
  error: '#E05050',
  success: '#4EBA6F',
};

type Props = {
  user: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  onBack: () => void;
  onLogout: () => void;
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000;
const LOGIN_ATTEMPTS_KEY = 'kworks_login_attempts';
const LOCKOUT_UNTIL_KEY = 'kworks_lockout_until';

export default function LoginScreen({ user, onSave, onBack, onLogout }: Props) {
  const { kind, scale, width } = useResponsive();
  const isMobile = kind === 'mobile';
  const isDesktop = kind === 'desktop';
  const formMaxWidth = isDesktop ? 520 : kind === 'tablet' ? 480 : Math.min(480, width - 48);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState(user?.company ?? 'kanagamtech');
  const [companies, setCompanies] = useState<string[]>(['kanagamtech', 'amsems']);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photoUri ?? null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const [markedTimestamp, setMarkedTimestamp] = useState<number | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isLogoutUnlocked, setIsLogoutUnlocked] = useState<boolean>(true);
  const { checkForUpdate, isChecking: isCheckingUpdate, statusMessage: updateStatusMsg } = useAppUpdate();

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver }).start();

    fetch(`${API_BASE}/api/companies`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCompanies(res.data);
          if (!user?.company) {
            setCompany(res.data[0]);
          }
        }
      })
      .catch(() => {});

    const loadLockout = async () => {
      try {
        const [attemptsRaw, lockoutRaw] = await Promise.all([
          AsyncStorage.getItem(LOGIN_ATTEMPTS_KEY),
          AsyncStorage.getItem(LOCKOUT_UNTIL_KEY),
        ]);
        const attempts = attemptsRaw ? parseInt(attemptsRaw, 10) : 0;
        const lockout = lockoutRaw ? parseInt(lockoutRaw, 10) : null;
        setLoginAttempts(attempts);
        if (lockout && lockout > Date.now()) {
          setLockoutUntil(lockout);
        } else if (lockout) {
          await AsyncStorage.multiRemove([LOGIN_ATTEMPTS_KEY, LOCKOUT_UNTIL_KEY]);
          setLoginAttempts(0);
          setLockoutUntil(null);
        }
      } catch {}
    };
    loadLockout();
  }, []);

  useEffect(() => {
    const loadLastAttendanceTime = async () => {
      try {
        const val = await AsyncStorage.getItem('kworks_last_attendance_time');
        if (val) {
          setMarkedTimestamp(parseInt(val, 10));
        }
      } catch {}
    };
    loadLastAttendanceTime();
  }, []);

  useEffect(() => {
    if (!markedTimestamp) {
      setIsLogoutUnlocked(true);
      return;
    }

    const checkTime = () => {
      const elapsedMs = Date.now() - markedTimestamp;
      const targetMs = 8 * 60 * 60 * 1000;

      if (elapsedMs >= targetMs) {
        setIsLogoutUnlocked(true);
        setTimeLeftStr('');
      } else {
        setIsLogoutUnlocked(false);
        const remainingMs = targetMs - elapsedMs;
        const totalSecs = Math.floor(remainingMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        const hStr = String(hours).padStart(2, '0');
        const mStr = String(mins).padStart(2, '0');
        const sStr = String(secs).padStart(2, '0');

        setTimeLeftStr(`${hStr}h ${mStr}m ${sStr}s`);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [markedTimestamp]);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo library permission is needed to pick a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const picked = result.assets[0].uri;
    try {
      const ext = picked.split('.').pop()?.split('?')[0] || 'jpg';
      const dest = FileSystem.documentDirectory + `profile_${Date.now()}.${ext}`;
      await FileSystem.copyAsync({ from: picked, to: dest });
      setPhotoUri(dest);
    } catch {
      setPhotoUri(picked);
    }
    setError('');
  };

  const handleFailedAttempt = useCallback(async () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    await AsyncStorage.setItem(LOGIN_ATTEMPTS_KEY, newAttempts.toString());

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutUntil(until);
      await AsyncStorage.setItem(LOCKOUT_UNTIL_KEY, until.toString());
      setError(`Too many failed attempts. Account locked for 15 minutes.`);
    }
  }, [loginAttempts]);

  const clearLoginAttempts = useCallback(async () => {
    setLoginAttempts(0);
    setLockoutUntil(null);
    await AsyncStorage.multiRemove([LOGIN_ATTEMPTS_KEY, LOCKOUT_UNTIL_KEY]);
  }, []);

  const getLockoutTimeRemaining = (): string => {
    if (!lockoutUntil) return '';
    const remaining = lockoutUntil - Date.now();
    if (remaining <= 0) return '';
    const secs = Math.ceil(remaining / 1000);
    return `${secs} second${secs !== 1 ? 's' : ''}`;
  };

  const isLockedOut = lockoutUntil !== null && lockoutUntil > Date.now();
  const lockoutTimeRemaining = getLockoutTimeRemaining();

  const handleSave = async () => {
    if (isLockedOut) {
      setError(`Account temporarily locked. Try again in ${lockoutTimeRemaining}.`);
      return;
    }

    if (!company.trim()) {
      setError('Please select your company.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const authRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          company: company.trim(),
        }),
      });

      const authData = await authRes.json().catch(() => null);

      if (!authRes.ok || !authData?.success || !authData?.user) {
        await handleFailedAttempt();

        if (authData?.message) {
          setError(`❌ ${authData.message}`);
        } else if (authRes.status === 401) {
          setError('❌ Invalid credentials. Please check your email and password.');
        } else if (authRes.status === 404) {
          setError(
            `❌ Account "${email.trim()}" not found in company database.\n\n` +
            `Only registered employees onboarded by management can access this app.\n\n` +
            `Please contact your HR or Manager to create your account.`
          );
        } else {
          setError('❌ Authentication failed. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      await clearLoginAttempts();

      const userProfile: UserProfile = {
        name: authData.user.name || name.trim() || 'Employee',
        email: authData.user.email || email.trim().toLowerCase(),
        company: authData.user.company || company.trim(),
        department: authData.user.department || 'General',
        destination: authData.user.destination || authData.user.role || 'Employee',
        photoUri: authData.user.photoUri || photoUri || null,
      };

      await AsyncStorage.setItem('kworks_user_profile', JSON.stringify(userProfile));
      setIsSubmitting(false);
      onSave(userProfile);
    } catch (err) {
      await handleFailedAttempt();
      setIsSubmitting(false);

      if (err instanceof TypeError && err.message.includes('Network')) {
        setError('🌐 Network error. Cannot reach server. Please check your internet connection.');
      } else {
        setError('❌ Server connection failed. Please ensure the server is online and try again.');
      }
    }
  };

  const initials = name.trim() ? name.trim()[0].toUpperCase() : 'U';
  const canSave = !isSubmitting && !isLockedOut && !!company.trim() && !!password.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <View style={styles.root}>
      <MorningBackground />
      <Animated.View style={[styles.container, { opacity: fade }]}>
        <View style={[styles.topBar, { paddingTop: 50 * scale }]}>
          {user ? (
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={[styles.backText, { fontSize: 16 * scale }]}>{'<'} Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          <Text style={[styles.title, { fontSize: 20 * scale }]}>
            {user ? 'Account Settings' : 'KwOrKs Secure Login'}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.form, { maxWidth: formMaxWidth, transform: [{ translateY: isMobile ? -10 : 0 }] }]}>
            
            {!user && (
              <View style={styles.welcomeBanner}>
                <Text style={[styles.welcomeTitle, { fontSize: 17 * scale }]}>Welcome to KwOrKs</Text>
                <Text style={[styles.welcomeSub, { fontSize: 13 * scale }]}>
                  Sign in with your company-registered account
                </Text>
              </View>
            )}

            <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
              <View style={[styles.avatar, { width: 100 * scale, height: 100 * scale, borderRadius: 50 * scale }]}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.avatarText, { fontSize: 38 * scale }]}>{initials}</Text>
                )}
              </View>
              <Text style={[styles.avatarHint, { fontSize: 12 * scale }]}>Tap to change photo</Text>
            </Pressable>

            <Text style={[styles.label, { fontSize: 14 * scale }]}>Company Organization</Text>
            <Pressable
              style={[styles.companyDropdownBtn, { paddingVertical: 14 * scale }, isLockedOut ? styles.inputDisabled : null]}
              onPress={() => !isLockedOut && setShowCompanyModal(true)}
              disabled={isLockedOut}
            >
              <View style={styles.companyLeft}>
                <Text style={{ fontSize: 16 }}>🏢</Text>
                <Text style={[styles.companySelectedText, { fontSize: 15 * scale }]}>
                  {company || 'Select Company'}
                </Text>
              </View>
              <Text style={[styles.dropdownArrow, { color: BRAND.primary }]}>▾</Text>
            </Pressable>

            <Text style={[styles.label, { fontSize: 14 * scale }]}>Your Name</Text>
            <TextInput
              style={[styles.input, { fontSize: 15 * scale, paddingVertical: 14 * scale }, isLockedOut ? styles.inputDisabled : null]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              placeholder="e.g. Rahul Kumar"
              placeholderTextColor={BRAND.textDim}
              autoCapitalize="words"
              editable={!isLockedOut}
            />

            <Text style={[styles.label, { fontSize: 14 * scale }]}>Email ID</Text>
            <TextInput
              style={[styles.input, { fontSize: 15 * scale, paddingVertical: 14 * scale }, isLockedOut ? styles.inputDisabled : null]}
              value={email}
              onChangeText={(text) => {
                setEmail(text.toLowerCase());
                setError('');
              }}
              placeholder="e.g. rahul@kanagam.tech"
              placeholderTextColor={BRAND.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLockedOut}
            />

            <Text style={[styles.label, { fontSize: 14 * scale }]}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.passwordInput, { fontSize: 15 * scale, paddingVertical: 14 * scale }, isLockedOut ? styles.inputDisabled : null]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                placeholder="Enter your password"
                placeholderTextColor={BRAND.textDim}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLockedOut}
                textContentType={user ? 'password' : 'oneTimeCode'}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)} disabled={isLockedOut}>
                <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>

            {isLockedOut && (
              <View style={styles.lockoutBanner}>
                <Text style={styles.lockoutIcon}>🔒</Text>
                <Text style={styles.lockoutText}>
                  Account temporarily locked due to multiple failed attempts.
                </Text>
                <Text style={styles.lockoutTimer}>Try again in {lockoutTimeRemaining}</Text>
                <Text style={styles.lockoutNote}>
                  If you forgot your credentials, contact your HR/Admin for account recovery.
                </Text>
              </View>
            )}

            {error ? <Text style={[styles.error, { fontSize: 13 * scale }]}>{error}</Text> : null}

            <Pressable
              style={[
                styles.saveBtn,
                { paddingVertical: 16 * scale },
                (!canSave || isSubmitting) ? styles.saveBtnDisabled : null,
                isLockedOut ? styles.saveBtnDisabled : null,
              ]}
              disabled={!canSave || isSubmitting || isLockedOut}
              onPress={handleSave}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.saveText, { fontSize: 16 * scale }]}>Verifying Account...</Text>
                </>
              ) : (
                <Text style={[styles.saveText, { fontSize: 16 * scale }]}>
                  {user ? 'Save Changes' : 'Sign In to Workspace'}
                </Text>
              )}
            </Pressable>

            {user && !isLockedOut && (
              <View style={{ marginTop: 24, borderTopWidth: 1.5, borderTopColor: 'rgba(215,171,106,0.2)', paddingTop: 20 }}>
                {isLogoutUnlocked ? (
                  <Pressable
                    style={[styles.saveBtn, { backgroundColor: '#E05050', paddingVertical: 16 * scale }]}
                    onPress={onLogout}
                  >
                    <Text style={[styles.saveText, { fontSize: 16 * scale }]}>Log Out of Account</Text>
                  </Pressable>
                ) : (
                  <View
                    style={[
                      styles.saveBtn,
                      {
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderColor: 'rgba(215,171,106,0.3)',
                        borderWidth: 1.5,
                        opacity: 0.6,
                        paddingVertical: 16 * scale,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Text style={[styles.saveText, { color: '#CBAF8C', fontSize: 15 * scale }]}>
                      Logout Locked ({timeLeftStr || '08h 00m 00s'})
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!user && !isLockedOut && (
              <View style={styles.adminNote}>
                <Text style={styles.adminNoteTitle}>🔐 Account Access</Text>
                <Text style={styles.adminNoteText}>
                  Don't have an account? Contact your <Text style={styles.adminHighlight}>HR or Manager</Text> to register your account in the management portal.
                </Text>
                <Text style={styles.adminNoteText}>
                  Only pre-registered employees can access KwOrKs. Self-registration is not allowed.
                </Text>
              </View>
            )}

            <Pressable
              style={[
                styles.saveBtn,
                {
                  backgroundColor: 'rgba(215,171,106,0.12)',
                  borderColor: BRAND.primary,
                  borderWidth: 1.2,
                  marginTop: 12,
                  paddingVertical: 13 * scale,
                },
              ]}
              disabled={isCheckingUpdate || isLockedOut}
              onPress={checkForUpdate}
            >
              <Text style={[styles.saveText, { color: BRAND.primary, fontSize: 14 * scale }]}>
                {isCheckingUpdate ? '⏳ Checking Server...' : '🔄 Check for App Code Updates'}
              </Text>
            </Pressable>
            {updateStatusMsg ? (
              <Text style={{ textAlign: 'center', color: BRAND.primaryLight, fontSize: 12 * scale, marginTop: 6 }}>
                {updateStatusMsg}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        <Modal visible={showCompanyModal} transparent animationType="fade" onRequestClose={() => setShowCompanyModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Company</Text>
              <Text style={styles.modalSubtitle}>Choose your organization configured by management</Text>

              <ScrollView style={{ maxHeight: 280, marginVertical: 14 }}>
                {companies.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.companyOption, company.toLowerCase() === c.toLowerCase() && styles.companyOptionActive]}
                    onPress={() => {
                      setCompany(c);
                      setShowCompanyModal(false);
                      setError('');
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 18 }}>🏢</Text>
                      <Text style={[styles.companyOptionText, company.toLowerCase() === c.toLowerCase() && styles.companyOptionTextActive]}>
                        {c}
                      </Text>
                    </View>
                    {company.toLowerCase() === c.toLowerCase() && (
                      <Text style={{ color: BRAND.primary, fontWeight: '800', fontSize: 16 }}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable style={styles.modalCloseBtn} onPress={() => setShowCompanyModal(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  backBtn: { minWidth: 70 },
  backText: { color: BRAND.primary, fontSize: 16, fontWeight: '700' },
  title: { color: BRAND.primaryLight, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 40 },
  form: { width: '100%', alignItems: 'stretch' },
  welcomeBanner: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(215,171,106,0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.25)',
  },
  welcomeTitle: { color: BRAND.primary, fontWeight: '800', marginBottom: 4 },
  welcomeSub: { color: BRAND.textDim, textAlign: 'center' },
  avatarWrap: { alignItems: 'center', marginBottom: 16 },
  avatar: {
    backgroundColor: 'rgba(26,9,22,0.55)',
    borderWidth: 3,
    borderColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 40, fontWeight: '800', color: BRAND.primary },
  avatarHint: { marginTop: 8, color: BRAND.textDim, fontSize: 12 },
  label: {
    alignSelf: 'flex-start',
    color: BRAND.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  companyDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.inputBg,
    borderWidth: 1.5,
    borderColor: 'rgba(215,171,106,0.5)',
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  companyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  companySelectedText: { color: '#FFFFFF', fontWeight: '700' },
  dropdownArrow: { fontSize: 18, fontWeight: '800' },
  input: {
    alignSelf: 'stretch',
    backgroundColor: BRAND.inputBg,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: BRAND.text,
    fontSize: 15,
  },
  inputDisabled: { opacity: 0.5, backgroundColor: 'rgba(255,255,255,0.05)' },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.inputBg,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, color: BRAND.text, fontSize: 15 },
  eyeBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  error: { marginTop: 14, color: BRAND.error, fontSize: 13, alignSelf: 'flex-start' },
  saveBtn: {
    alignSelf: 'stretch',
    marginTop: 24,
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  lockoutBanner: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(224,80,80,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.error,
    alignItems: 'center',
  },
  lockoutIcon: { fontSize: 28, marginBottom: 8 },
  lockoutText: { color: BRAND.error, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  lockoutTimer: { color: BRAND.primary, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  lockoutNote: { color: BRAND.textDim, fontSize: 12, textAlign: 'center' },
  adminNote: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(215,171,106,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.3)',
  },
  adminNoteTitle: { color: BRAND.primary, fontSize: 14, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  adminNoteText: { color: BRAND.textDim, fontSize: 12.5, textAlign: 'center', lineHeight: 18, marginBottom: 6 },
  adminHighlight: { color: BRAND.primary, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#31122B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: BRAND.primary,
  },
  modalTitle: { color: BRAND.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  modalSubtitle: { color: BRAND.textDim, fontSize: 12.5, textAlign: 'center', marginTop: 4 },
  companyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  companyOptionActive: { borderColor: BRAND.primary, backgroundColor: 'rgba(215,171,106,0.18)' },
  companyOptionText: { color: BRAND.text, fontSize: 15, fontWeight: '600' },
  companyOptionTextActive: { color: BRAND.primary, fontWeight: '800' },
  modalCloseBtn: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalCloseText: { color: BRAND.textDim, fontWeight: '700', fontSize: 14 },
});