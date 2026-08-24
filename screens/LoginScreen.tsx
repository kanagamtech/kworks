import { useEffect, useRef, useState } from 'react';
import {
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Text from '../components/AppText';
import * as FileSystem from 'expo-file-system/legacy';
import MorningBackground from '../components/MorningBackground';
import { useResponsive } from '../hooks/useResponsive';
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
};

type Props = {
  user: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  onBack: () => void;
  onLogout: () => void;
};

export default function LoginScreen({ user, onSave, onBack, onLogout }: Props) {
  const { kind, scale, width } = useResponsive();
  const isMobile = kind === 'mobile';
  const isDesktop = kind === 'desktop';
  const formMaxWidth = isDesktop ? 520 : kind === 'tablet' ? 480 : Math.min(480, width - 48);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState(user?.password ?? '');
  const [company, setCompany] = useState(user?.company ?? 'kanagamtech');
  const [companies, setCompanies] = useState<string[]>(['kanagamtech', 'amsems']);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photoUri ?? null);
  const [error, setError] = useState('');
  const fade = useRef(new Animated.Value(0)).current;

  const [markedTimestamp, setMarkedTimestamp] = useState<number | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isLogoutUnlocked, setIsLogoutUnlocked] = useState<boolean>(true);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver }).start();

    // Fetch companies from backend API (configured from web management portal)
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
  }, [fade, user]);

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
      const targetMs = 8 * 60 * 60 * 1000; // 8 hours
      
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
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
      // 1. Authenticate with backend REST API
      const authRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          company: company.trim(),
        }),
      });

      const authData = await authRes.json().catch(() => null);

      if (authData && authData.success && authData.user) {
        setIsSubmitting(false);
        onSave({
          name: authData.user.name || name.trim() || 'Employee',
          email: authData.user.email || email.trim(),
          password: password.trim(),
          company: authData.user.company || company.trim(),
          department: authData.user.department || 'General',
          destination: authData.user.destination || authData.user.role || 'Employee',
          photoUri: authData.user.photoUri || photoUri || null,
        });
        return;
      }

      // 2. Fallback check directly against /api/employees
      const empRes = await fetch(`${API_BASE}/api/employees`);
      const empData = await empRes.json().catch(() => null);

      if (empData && empData.success && Array.isArray(empData.data)) {
        const match = empData.data.find(
          (e: any) => e.email?.trim().toLowerCase() === email.trim().toLowerCase()
        );

        if (!match) {
          setIsSubmitting(false);
          setError(
            `❌ Account "${email.trim()}" not found in company database.\n\nOnly registered employees onboarded by management can access this app. Please contact your HR or Manager.`
          );
          return;
        }

        if (match.company && company.trim().toLowerCase() !== match.company.trim().toLowerCase()) {
          setIsSubmitting(false);
          setError(`❌ This account is registered under "${match.company}", not "${company.trim()}".`);
          return;
        }

        if (match.password && match.password.trim() !== password.trim()) {
          setIsSubmitting(false);
          setError('❌ Incorrect password. Please check your credentials and try again.');
          return;
        }

        setIsSubmitting(false);
        onSave({
          name: match.name || name.trim() || 'Employee',
          email: match.email || email.trim(),
          password: password.trim(),
          company: match.company || company.trim(),
          department: match.department || 'General',
          destination: match.destination || match.role || 'Employee',
          photoUri: match.photo || photoUri || null,
        });
        return;
      }

      // If backend responded with custom rejection message
      if (authData && !authData.success && authData.message) {
        setIsSubmitting(false);
        setError(`❌ ${authData.message}`);
        return;
      }

      // Cannot verify with database
      setIsSubmitting(false);
      setError('❌ Unable to verify account with database. Please ensure the server is online.');
    } catch {
      setIsSubmitting(false);
      setError('❌ Server connection failed. Please check your network connection.');
    }
  };

  const initials = name.trim() ? name.trim()[0].toUpperCase() : 'U';
  const canSave = !isSubmitting && !!company.trim() && !!password.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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
            {user ? 'Account Settings' : 'KwOrKs Login'}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.form, { maxWidth: formMaxWidth, transform: [{ translateY: isMobile ? -10 : 0 }] }]}>
            
            {!user && (
              <View style={styles.welcomeBanner}>
                <Text style={[styles.welcomeTitle, { fontSize: 17 * scale }]}>Welcome to KwOrKs</Text>
                <Text style={[styles.welcomeSub, { fontSize: 13 * scale }]}>
                  Please select your company and sign in with your account
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

            {/* Company Dropdown */}
            <Text style={[styles.label, { fontSize: 14 * scale }]}>Company Organization</Text>
            <Pressable
              style={[styles.companyDropdownBtn, { paddingVertical: 14 * scale }]}
              onPress={() => setShowCompanyModal(true)}
            >
              <View style={styles.companyLeft}>
                <Text style={{ fontSize: 16 }}>🏢</Text>
                <Text style={[styles.companySelectedText, { fontSize: 15 * scale }]}>
                  {company || 'Select Company'}
                </Text>
              </View>
              <Text style={[styles.dropdownArrow, { color: BRAND.primary }]}>▾</Text>
            </Pressable>

            {/* Your Name */}
            <Text style={[styles.label, { fontSize: 14 * scale }]}>Your Name</Text>
            <TextInput
              style={[styles.input, { fontSize: 15 * scale, paddingVertical: 14 * scale }]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              placeholder="e.g. Rahul Kumar"
              placeholderTextColor={BRAND.textDim}
              autoCapitalize="words"
            />

            {/* Email ID */}
            <Text style={[styles.label, { fontSize: 14 * scale }]}>Email ID</Text>
            <TextInput
              style={[styles.input, { fontSize: 15 * scale, paddingVertical: 14 * scale }]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              placeholder="e.g. rahul@kanagam.tech"
              placeholderTextColor={BRAND.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password */}
            <Text style={[styles.label, { fontSize: 14 * scale }]}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.passwordInput, { fontSize: 15 * scale, paddingVertical: 14 * scale }]}
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
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>

            {error ? <Text style={[styles.error, { fontSize: 13 * scale }]}>{error}</Text> : null}

            <Pressable
              style={[styles.saveBtn, { paddingVertical: 16 * scale }, (!canSave || isSubmitting) && styles.saveBtnDisabled]}
              disabled={!canSave || isSubmitting}
              onPress={handleSave}
            >
              <Text style={[styles.saveText, { fontSize: 16 * scale }]}>
                {isSubmitting ? '⏳ Verifying Account...' : user ? 'Save Changes' : 'Sign In to Workspace'}
              </Text>
            </Pressable>

            {user && (
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
          </View>
        </ScrollView>

        {/* Company Selection Modal */}
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
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  backBtn: {
    minWidth: 70,
  },
  backText: {
    color: BRAND.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    color: BRAND.primaryLight,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  form: {
    width: '100%',
    alignItems: 'stretch',
  },
  welcomeBanner: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(215,171,106,0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.25)',
  },
  welcomeTitle: {
    color: BRAND.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  welcomeSub: {
    color: BRAND.textDim,
    textAlign: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: 'rgba(26,9,22,0.55)',
    borderWidth: 3,
    borderColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: BRAND.primary,
  },
  avatarHint: {
    marginTop: 8,
    color: BRAND.textDim,
    fontSize: 12,
  },
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
  companyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  companySelectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dropdownArrow: {
    fontSize: 18,
    fontWeight: '800',
  },
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
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.inputBg,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    color: BRAND.text,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  error: {
    marginTop: 14,
    color: '#E05050',
    fontSize: 13,
    alignSelf: 'flex-start',
  },
  saveBtn: {
    alignSelf: 'stretch',
    marginTop: 24,
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#31122B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: BRAND.primary,
  },
  modalTitle: {
    color: BRAND.primary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: BRAND.textDim,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
  },
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
  companyOptionActive: {
    borderColor: BRAND.primary,
    backgroundColor: 'rgba(215,171,106,0.18)',
  },
  companyOptionText: {
    color: BRAND.text,
    fontSize: 15,
    fontWeight: '600',
  },
  companyOptionTextActive: {
    color: BRAND.primary,
    fontWeight: '800',
  },
  modalCloseBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: BRAND.textDim,
    fontWeight: '700',
    fontSize: 14,
  },
});