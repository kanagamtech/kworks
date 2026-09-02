import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Text from '../components/AppText';
import * as Location from 'expo-location';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import MorningBackground from '../components/MorningBackground';
import { useResponsive } from '../hooks/useResponsive';
import { getRealGPSLocation, type RealGPSData } from '../utils/locationName';
import { saveAttendanceRecord, saveFoodCount, todayKey, type MealKey } from '../utils/records';
import { API_BASE } from '../utils/config';
import { checkInternetConnection, isOnline, subscribeToNetworkChanges, type NetworkState } from '../utils/network';
import type { UserProfile } from '../types';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#E8C98F',
  primaryDark: '#31122B',
  bgCard: 'rgba(32, 12, 28, 0.88)',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  success: '#4EBA6F',
  successGlow: 'rgba(78, 186, 111, 0.25)',
  danger: '#E05050',
  dangerGlow: 'rgba(224, 80, 80, 0.25)',
  goldGlow: 'rgba(215, 171, 106, 0.25)',
  error: '#E05050',
};

type Props = {
  onDone: () => void;
  onFoodCount: () => void;
  user: UserProfile | null;
  onLogout: () => void;
};

export default function AttendanceScreen({ onDone, onFoodCount, user }: Props) {
  const { width } = useResponsive();

  // Scanning & Biometric State
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('Tap Mark Attendance to check in');

  // Shift & Attendance Lifecycle
  const [done, setDone] = useState(false);
  const [punchedOut, setPunchedOut] = useState(false);
  const [punchOutData, setPunchOutData] = useState<{ time: string; duration: string } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState('');
  const [markedTimestamp, setMarkedTimestamp] = useState<number | null>(null);
  const [shiftTimerStr, setShiftTimerStr] = useState<string>('00h 00m 00s');

  // Modals & UI Controls
  const [showFoodPopup, setShowFoodPopup] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [mismatchMsg, setMismatchMsg] = useState('');
  const [showPunchOutModal, setShowPunchOutModal] = useState(false);
  const [isPunchingOut, setIsPunchingOut] = useState(false);

  // Food Count & Meal Options State
  const [selectedMeals, setSelectedMeals] = useState<Record<MealKey, boolean>>({
    breakfast: false,
    morningSnacks: false,
    lunch: true,
    eveningSnacks: true,
  });
  const [foodSaving, setFoodSaving] = useState(false);
  const [foodSubmitted, setFoodSubmitted] = useState(false);

  const toggleMeal = (mealKey: MealKey) => {
    setSelectedMeals((prev) => ({
      ...prev,
      [mealKey]: !prev[mealKey],
    }));
  };

  const handleSaveMealSelection = async (skipAll: boolean = false) => {
    setFoodSaving(true);
    const mealsToSave = skipAll
      ? { breakfast: false, morningSnacks: false, lunch: false, eveningSnacks: false }
      : selectedMeals;

    const payload = {
      date: todayKey(),
      user: user?.email ?? 'guest@kworks.com',
      meals: mealsToSave,
    };

    try {
      await saveFoodCount(payload);
      fetch(`${API_BASE}/api/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
      setFoodSubmitted(true);
    } catch {
      // ignore
    } finally {
      setFoodSaving(false);
      setShowFoodPopup(false);
    }
  };

  // GPS & Location Telemetry
  const [gpsData, setGpsData] = useState<RealGPSData | null>(null);
  const [locName, setLocName] = useState<string | null>(null);
  const [locState, setLocState] = useState<'locating' | 'ready' | 'denied' | 'error'>('locating');
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

  // Database of Registered Employees
  const [registeredEmployees, setRegisteredEmployees] = useState<any[]>([]);

  // Network State
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: false,
    isInternetReachable: null,
    type: 'unknown',
    details: null,
  });
  const [isNetworkChecked, setIsNetworkChecked] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Viewport Geometry
  const size = Math.min(width * 0.76, 320);
  const stroke = Math.max(5, size * 0.022);
  const r = size / 2 - stroke / 2 - 4;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;

  // ── 1. Fetch Registered Employees Database ─────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/employees`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setRegisteredEmployees(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // ── 2. Check Existing Attendance for Today ──────────────────────────────────
  useEffect(() => {
    const checkExistingAttendance = async () => {
      const today = todayKey();
      const userKey = user?.email?.trim().toLowerCase() || 'guest';

      // Check punch-out record first
      try {
        const outRaw = await AsyncStorage.getItem(`kworks_punchout_${today}_${userKey}`);
        if (outRaw) {
          const outParsed = JSON.parse(outRaw);
          setPunchedOut(true);
          setPunchOutData(outParsed);
          setDone(true);
          return;
        }
      } catch {}

      // Initial local check for offline speed
      try {
        const raw = await AsyncStorage.getItem('kworks_attendance_records');
        if (raw) {
          const list = JSON.parse(raw);
          const todayRec = list.find((r: any) => r.date === today && r.user?.toLowerCase() === userKey);
          if (todayRec) {
            setPhotoUri(todayRec.photoUri);
            setCapturedAt(todayRec.time);
            setDone(true);
            setProgress(1);
            setStatus('Attendance verified & active!');
          }
        }
      } catch {}

      // Live backend database check
      try {
        const res = await fetch(`${API_BASE}/api/attendance`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const todayRec = data.data.find(
            (r: any) => r.date === today && r.user?.toLowerCase() === userKey
          );

          if (todayRec) {
            setPhotoUri(todayRec.photoUri);
            setCapturedAt(todayRec.time);
            setDone(true);
            setProgress(1);
            setStatus('Attendance verified & active!');

            // Sync with local store
            const raw = await AsyncStorage.getItem('kworks_attendance_records');
            const list = raw ? JSON.parse(raw) : [];
            const filtered = list.filter((r: any) => !(r.date === today && r.user?.toLowerCase() === userKey));
            filtered.push(todayRec);
            await AsyncStorage.setItem('kworks_attendance_records', JSON.stringify(filtered));
          }
        }
      } catch {}
    };

    if (user?.email) {
      checkExistingAttendance();
    }
  }, [user]);

  // ── Network Connectivity Check ───────────────────────────────────────────────
  useEffect(() => {
    const checkNetwork = async () => {
      const state = await checkInternetConnection();
      setNetworkState(state);
      setIsNetworkChecked(true);
      if (!isOnline(state)) {
        setNetworkError('🌐 No internet connection. Attendance requires online verification.');
      } else {
        setNetworkError(null);
      }
    };
    checkNetwork();

    const unsubscribe = subscribeToNetworkChanges((state) => {
      setNetworkState(state);
      if (isOnline(state)) {
        setNetworkError(null);
      } else {
        setNetworkError('🌐 Internet connection lost. Attendance requires online verification.');
      }
    });

    return () => unsubscribe();
  }, []);

  // ── 3. High-Precision Real GPS Location Fetcher ────────────────────────────
  const fetchLocation = async () => {
    try {
      setLocState('locating');
      setIsRefreshingGps(true);
      const locPerm = await Location.requestForegroundPermissionsAsync();
      if (!locPerm.granted) {
        setLocState('denied');
        setIsRefreshingGps(false);
        return;
      }
      const data = await getRealGPSLocation();
      if (data) {
        setGpsData(data);
        setLocName(data.address);
        setLocState('ready');
      } else {
        setLocState('error');
      }
    } catch {
      setLocState('error');
    } finally {
      setIsRefreshingGps(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  // ── 4. Live Shift Working Timer (Counts up from check-in timestamp) ─────────
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
  }, [done]);

  useEffect(() => {
    if (!markedTimestamp || punchedOut) return;

    const updateTimer = () => {
      const elapsedMs = Math.max(0, Date.now() - markedTimestamp);
      const totalSecs = Math.floor(elapsedMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      const hStr = String(hours).padStart(2, '0');
      const mStr = String(mins).padStart(2, '0');
      const sStr = String(secs).padStart(2, '0');

      setShiftTimerStr(`${hStr}h ${mStr}m ${sStr}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [markedTimestamp, punchedOut]);

  // ── 5. Direct Attendance Punch-In ───────────────────────────
  const handleMarkAttendance = async () => {
    if (done || scanning) return;

    setScanning(true);
    setProgress(0.5);
    setStatus('Recording attendance & GPS telemetry...');

    try {
      const capturedUri = user?.photoUri || '';
      
      // Artificial delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 800));

      setProgress(1.0);
      setStatus('Attendance marked successfully!');
      success(capturedUri);
    } catch {
      setProgress(1.0);
      success(user?.photoUri || '');
    } finally {
      setScanning(false);
    }
  };

  const resetProgress = () => {
    setProgress(0);
  };

  const success = (uri: string) => {
    const nowTime = new Date().toLocaleTimeString();
    const nowDate = todayKey();
    const nowTimestamp = Date.now();

    setPhotoUri(uri);
    setCapturedAt(new Date().toLocaleString());
    setDone(true);
    setScanning(false);
    setStatus('Attendance marked successfully!');
    setProgress(1);
    setShowFoodPopup(true);

    const rec = {
      date: nowDate,
      time: nowTime,
      user: user?.email ?? 'guest@kworks.com',
      name: user?.name ?? 'Guest',
      location: gpsData?.address || locName || 'Location recorded',
      latitude: gpsData?.latitude,
      longitude: gpsData?.longitude,
      accuracy: gpsData?.accuracy,
      altitude: gpsData?.altitude,
      gpsFormatted: gpsData?.gpsFormatted,
      mapsUrl: gpsData?.mapsUrl,
      photoUri: uri,
    };

    saveAttendanceRecord(rec);

    // Save to backend REST API DB
    fetch(`${API_BASE}/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rec),
    }).catch(() => {});

    // Notify Management View of Check-in
    fetch(`${API_BASE}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `🟢 Check-In: ${user?.name || 'Employee'}`,
        body: `${user?.name || 'Employee'} (${user?.email || ''}) logged in at ${nowTime}.\nLocation: ${rec.location}`,
        employeeName: user?.name || 'Employee',
        employeeEmail: user?.email || '',
        company: user?.company || 'kanagamtech',
        department: user?.department || 'General',
        type: 'attendance_check_in',
        date: nowDate,
        time: nowTime,
      }),
    }).catch(() => {});

    // Save check-in timestamp for shift timer
    setMarkedTimestamp(nowTimestamp);
    AsyncStorage.setItem('kworks_last_attendance_time', nowTimestamp.toString()).catch(() => {});
  };

  // ── 6. Punch Out & End Shift (Keeps user account logged in) ─────────────────
  const handleConfirmPunchOut = async () => {
    setIsPunchingOut(true);
    try {
      const nowTime = new Date().toLocaleTimeString();
      const nowDate = todayKey();
      const userKey = user?.email?.trim().toLowerCase() || 'guest';

      const notifPayload = {
        title: `Attendance Shift Ended: ${user?.name || 'Employee'}`,
        body: `${user?.name || 'Employee'} (${user?.email || ''}) punched out and completed their shift at ${nowTime}.\nTotal Active Shift Time: ${shiftTimerStr}.\nLocation: ${gpsData?.address || locName || 'Location recorded'}.`,
        employeeName: user?.name || 'Employee',
        employeeEmail: user?.email || '',
        company: user?.company || 'kanagamtech',
        department: user?.department || 'General',
        duration: shiftTimerStr,
        type: 'shift_punch_out',
        date: nowDate,
        time: nowTime,
      };

      // 1. Send alert to Manager Notifications
      await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifPayload),
      }).catch(() => {});

      // 2. Publish to Management Notices Feed
      await fetch(`${API_BASE}/api/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `punchout_${Date.now()}`,
          title: `Shift Completed — ${user?.name || 'Employee'}`,
          body: `${user?.name || 'Employee'} punched out at ${nowTime}. Total active shift time: ${shiftTimerStr}.`,
          date: nowDate,
          team: user?.department || 'ALL',
          category: 'management',
        }),
      }).catch(() => {});

      // 3. Save Punch Out Time to Attendance Record
      await fetch(`${API_BASE}/api/attendance/punchout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: nowDate,
          userEmail: userKey,
          punchOutTime: nowTime,
          duration: shiftTimerStr,
        }),
      }).catch(() => {});

      // Save punch out local state
      const punchOutObj = { time: nowTime, duration: shiftTimerStr };
      setPunchedOut(true);
      setPunchOutData(punchOutObj);
      await AsyncStorage.setItem(
        `kworks_punchout_${nowDate}_${userKey}`,
        JSON.stringify(punchOutObj)
      ).catch(() => {});
      await AsyncStorage.removeItem('kworks_last_attendance_time').catch(() => {});
    } catch {}

    setIsPunchingOut(false);
    setShowPunchOutModal(false);
  };

  // ── Android Back Button & Swipe Gesture Handler ───────────────────────────
  useEffect(() => {
    const onBackPress = () => {
      // 1. Close punch out modal
      if (showPunchOutModal) {
        setShowPunchOutModal(false);
        return true;
      }
      // 2. Close food popup modal
      if (showFoodPopup) {
        setShowFoodPopup(false);
        return true;
      }
      // 3. Close mismatch modal
      if (showMismatchModal) {
        setShowMismatchModal(false);
        return true;
      }
      // 4. Return to home dashboard
      onDone();
      return true;
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [showPunchOutModal, showFoodPopup, showMismatchModal, onDone]);

  const openGoogleMaps = () => {
    if (gpsData?.mapsUrl) {
      Linking.openURL(gpsData.mapsUrl).catch(() => {});
    } else if (gpsData?.latitude && gpsData?.longitude) {
      Linking.openURL(`https://www.google.com/maps?q=${gpsData.latitude},${gpsData.longitude}`).catch(() => {});
    }
  };

  // ── Circular Arc Calculations ──────────────────────────────────────────────
  const endAngle = progress * 360 - 90;
  const endRad = (endAngle * Math.PI) / 180;
  const endX = c + r * Math.cos(endRad);
  const endY = c + r * Math.sin(endRad);
  const dashOffset = circumference * (1 - progress);

  const sweepColor = (() => {
    if (progress >= 1) return BRAND.success;
    const RED = { r: 224, g: 80, b: 70 };
    const GOLD = { r: 215, g: 171, b: 106 };
    const t = progress;
    const redVal = Math.round(RED.r + (GOLD.r - RED.r) * t);
    const greenVal = Math.round(RED.g + (GOLD.g - RED.g) * t);
    const blueVal = Math.round(RED.b + (GOLD.b - RED.b) * t);
    return `rgb(${redVal},${greenVal},${blueVal})`;
  })();

  const locationLabel = (() => {
    if (locState === 'denied') return 'Location access denied by device';
    if (locState === 'error') return 'Location unavailable';
    if (locState === 'locating') return 'Locking GPS satellite signal...';
    return locName ?? 'Location detected';
  })();

  // ── Authentication Check ───────────────────────────────────────────────────
  const isGuest = !user || !user.email || user.email === 'guest@kworks.com';

  if (isGuest) {
    return (
      <View style={styles.root}>
        <MorningBackground />
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Pressable onPress={onDone} style={styles.backBtn}>
              <Text style={styles.backText}>{'<'} Back</Text>
            </Pressable>
            <Text style={styles.title}>Attendance Terminal</Text>
            <View style={styles.backBtn} />
          </View>
          <View style={styles.blockedCard}>
            <Text style={{ fontSize: 52, marginBottom: 16 }}>🔒</Text>
            <Text style={styles.blockedTitle}>Employee Login Required</Text>
            <Text style={styles.blockedSub}>
              You must be logged in with your employee account to mark attendance.\n\nPlease log in first.
            </Text>
            <Pressable style={styles.blockedBtn} onPress={onDone}>
              <Text style={styles.blockedBtnText}>Return to Home</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MorningBackground />
      <View style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <Pressable onPress={onDone} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'} Back</Text>
          </Pressable>
          <Text style={styles.title}>Biometric Terminal</Text>
          {done && !punchedOut ? (
            <Pressable style={styles.topPunchOutBtn} onPress={() => setShowPunchOutModal(true)}>
              <Text style={styles.topPunchOutText}>Punch Out</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Employee Header Greeting Badge */}
          <View style={styles.userHeaderCard}>
            <View style={styles.userHeaderLeft}>
              <Text style={styles.userGreeting}>Welcome, {user?.name || 'Employee'}</Text>
              <Text style={styles.userSub}>
                🏢 {user?.department || 'General'} &middot; {user?.company || 'kanagamtech'}
              </Text>
            </View>
            <View style={styles.liveDateBadge}>
              <Text style={styles.liveDateText}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* Profile Viewport / Punch Completed Card */}
          {punchedOut ? (
            <View style={styles.punchedOutCard}>
              <View style={styles.punchedOutIconWrap}>
                <Text style={{ fontSize: 32 }}>🏁</Text>
              </View>
              <Text style={styles.punchedOutHeading}>SHIFT COMPLETED TODAY</Text>
              <Text style={styles.punchedOutSub}>You have punched out for today's attendance.</Text>

              <View style={styles.punchedOutSummaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>🕒 Check-in Time:</Text>
                  <Text style={styles.summaryValue}>{capturedAt || 'Recorded'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>🚪 Punch-out Time:</Text>
                  <Text style={styles.summaryValue}>{punchOutData?.time || 'Recorded'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>⏱️ Total Working Hours:</Text>
                  <Text style={[styles.summaryValue, { color: BRAND.primary, fontWeight: '800' }]}>
                    {punchOutData?.duration || shiftTimerStr}
                  </Text>
                </View>
              </View>

              <Pressable style={styles.primaryActionBtn} onPress={onDone}>
                <Text style={styles.primaryActionBtnText}>Back to Dashboard</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.cameraWrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(32, 12, 28, 0.5)', justifyContent: 'center', alignItems: 'center' }]}>
              {user?.photoUri ? (
                <Image source={{ uri: user.photoUri }} style={{ width: size - stroke * 2, height: size - stroke * 2, borderRadius: (size - stroke * 2) / 2 }} />
              ) : (
                <View style={{ width: size - stroke * 2, height: size - stroke * 2, borderRadius: (size - stroke * 2) / 2, backgroundColor: '#D7AB6A', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, fontWeight: '800', color: '#31122B' }}>
                    {(user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              {/* HUD Target Overlay */}
              <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                <Svg width={size} height={size}>
                  <Circle cx={c} cy={c} r={r} stroke="rgba(215,171,106,0.3)" strokeWidth={stroke} fill="none" />
                  <Circle
                    cx={c}
                    cy={c}
                    r={r}
                    stroke={sweepColor}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${c} ${c})`}
                  />
                  <Circle cx={c} cy={c - r} r={stroke * 0.9} fill={sweepColor} />
                  <Circle cx={endX} cy={endY} r={stroke * 0.9} fill={sweepColor} />
                </Svg>
              </View>
            </View>
          )}

          {/* Dynamic Status & Action Section */}
          {done && !punchedOut ? (
            <View style={styles.successCard}>
              <View style={styles.successHeaderRow}>
                <View style={styles.successBadge}>
                  <Text style={styles.successBadgeText}>✓ VERIFIED</Text>
                </View>
                <Text style={styles.successTimeText}>Punched in at {capturedAt}</Text>
              </View>

              {photoUri && (
                <View style={styles.thumbWrap}>
                  <Image source={{ uri: photoUri }} style={styles.thumbImage} />
                  <View style={styles.thumbOnlineDot} />
                </View>
              )}

              {/* Real-time Shift Working Hours Timer */}
              <View style={styles.activeShiftWidget}>
                <View style={styles.shiftWidgetHeader}>
                  <View style={styles.pulseGreenDot} />
                  <Text style={styles.shiftWidgetLabel}>ACTIVE WORK SHIFT</Text>
                </View>
                <Text style={styles.shiftWidgetTimer}>{shiftTimerStr}</Text>
                <Text style={styles.shiftWidgetSub}>
                  Live working hours recorded on management server
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsCol}>
                <Pressable style={styles.primaryActionBtn} onPress={onDone}>
                  <Text style={styles.primaryActionBtnText}>Back to Dashboard</Text>
                </Pressable>

                <Pressable style={styles.punchOutBtn} onPress={() => setShowPunchOutModal(true)}>
                  <Text style={styles.punchOutBtnText}>🚪 Punch Out & End Shift</Text>
                </Pressable>
              </View>
            </View>
          ) : !punchedOut ? (
            <View style={styles.scanningControls}>
              <View style={styles.networkStatusBar}>
                <Text style={[
                  styles.networkStatusText,
                  { color: isOnline(networkState) ? BRAND.success : BRAND.error }
                ]}>
                  {isOnline(networkState) ? '● Online - Server Connected' : '● Offline - Internet Required'}
                </Text>
              </View>
              {networkError && <Text style={styles.networkErrorText}>{networkError}</Text>}
              <Text style={styles.statusMsg}>{status}</Text>
              {scanning && (
                <View style={styles.scanningProgressRow}>
                  <ActivityIndicator size="small" color={BRAND.primary} />
                  <Text style={styles.scanningPercentText}>{Math.round(progress * 100)}%</Text>
                </View>
              )}

              <Pressable
                style={[
                  styles.markAttendanceBtn,
                  scanning && styles.markAttendanceBtnScanning,
                  done && styles.markAttendanceBtnDisabled,
                ]}
                disabled={scanning || done}
                onPress={handleMarkAttendance}
              >
                <Text style={styles.markAttendanceBtnText}>
                  {scanning ? 'MARKING ATTENDANCE...' : 'MARK ATTENDANCE'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* High-Precision Real GPS Location Card */}
          <View style={styles.gpsTelemetryCard}>
            <View style={styles.gpsIconWrap}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path
                  d="M12 2 C7.6 2 4 5.6 4 10 C4 15.4 12 22 12 22 C12 22 20 15.4 20 10 C20 5.6 16.4 2 12 2 Z"
                  stroke="#D7AB6A"
                  strokeWidth={1.8}
                  fill="rgba(215,171,106,0.3)"
                  strokeLinejoin="round"
                />
                <Circle cx={12} cy={10} r={2.6} stroke="#D7AB6A" strokeWidth={1.6} fill="none" />
              </Svg>
            </View>

            <View style={styles.gpsInfoWrap}>
              <View style={styles.gpsBadgeRow}>
                <Text style={styles.gpsHeaderLabel}>LIVE GPS LOCATION</Text>
                {gpsData?.accuracy != null && (
                  <View style={styles.gpsAccuracyBadge}>
                    <Text style={styles.gpsAccuracyText}>±{Math.round(gpsData.accuracy)}m Lock</Text>
                  </View>
                )}
                <Pressable
                  onPress={fetchLocation}
                  disabled={isRefreshingGps}
                  style={styles.gpsRefreshBtn}
                  hitSlop={8}
                >
                  <Text style={{ fontSize: 12 }}>{isRefreshingGps ? '⏳' : '🔄'}</Text>
                </Pressable>
              </View>

              <Text style={[styles.gpsAddressText, locState !== 'ready' && styles.gpsAddressDim]} numberOfLines={2}>
                {locationLabel}
              </Text>

              {gpsData && (
                <View style={styles.gpsCoordsRow}>
                  <Text style={styles.gpsCoordsText}>🛰️ {gpsData.gpsFormatted}</Text>
                  <Pressable onPress={openGoogleMaps} hitSlop={6}>
                    <Text style={styles.gpsMapsLink}>🗺️ View Maps</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* Food Count Navigation Button (If attendance is marked) */}
          {done && (
            <Pressable style={styles.foodCountNavCard} onPress={() => setShowFoodPopup(true)}>
              <View style={styles.foodCountIconWrap}>
                <Svg width={22} height={22} viewBox="0 0 24 24">
                  <Rect x={4} y={2} width={16} height={20} rx={2.5} stroke="#D7AB6A" strokeWidth={1.8} fill="rgba(215,171,106,0.35)" />
                  <Path d="M4 8 h16" stroke="#D7AB6A" strokeWidth={1.8} />
                  <Circle cx={12} cy={14.5} r={1.8} fill="#D7AB6A" />
                </Svg>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.foodCountTitle}>MEAL COUNT</Text>
                <Text style={styles.foodCountSub}>
                  {foodSubmitted
                    ? `Lunch: ${selectedMeals.lunch ? 'YES' : 'NO'} · Snacks: ${selectedMeals.eveningSnacks ? 'YES' : 'NO'}`
                    : 'Tap to select or update today\'s meal options'}
                </Text>
              </View>
              <Text style={styles.foodCountArrow}>{'>'}</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* ── FOOD COUNT PROMPT & OPTIONS MODAL ── */}
        <Modal visible={showFoodPopup} transparent animationType="fade" onRequestClose={() => setShowFoodPopup(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 360 }]}>
              <View style={styles.modalIconWrap}>
                <Svg width={30} height={30} viewBox="0 0 24 24">
                  <Rect x={4} y={2} width={16} height={20} rx={2.5} stroke="#D7AB6A" strokeWidth={1.8} fill="rgba(215,171,106,0.35)" />
                  <Path d="M4 8 h16" stroke="#D7AB6A" strokeWidth={1.8} />
                  <Circle cx={12} cy={14.5} r={1.8} fill="#D7AB6A" />
                </Svg>
              </View>
              <Text style={styles.modalTag}>MEAL COUNT SELECTION</Text>
              <Text style={styles.modalTitle}>Today's Meal Requirements</Text>
              <Text style={styles.modalDesc}>
                Attendance verified! Select your meal options for today:
              </Text>

              {/* Meal Options Selection List */}
              <View style={styles.mealOptionsWrap}>
                {[
                  { key: 'lunch' as MealKey, label: '🍱 Lunch', desc: 'Afternoon meals' },
                  { key: 'eveningSnacks' as MealKey, label: '☕ Evening Snacks', desc: 'Tea & snacks' },
                  { key: 'breakfast' as MealKey, label: '🥐 Breakfast', desc: 'Morning breakfast' },
                  { key: 'morningSnacks' as MealKey, label: '🍪 Morning Snacks', desc: 'Morning refreshments' },
                ].map((item) => {
                  const isSelected = !!selectedMeals[item.key];
                  return (
                    <Pressable
                      key={item.key}
                      style={[styles.mealOptionCard, isSelected && styles.mealOptionCardActive]}
                      onPress={() => toggleMeal(item.key)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.mealOptionLabel, isSelected && styles.mealOptionLabelActive]}>
                          {item.label}
                        </Text>
                        <Text style={styles.mealOptionDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.mealCheckCircle, isSelected && styles.mealCheckCircleActive]}>
                        <Text style={styles.mealCheckText}>{isSelected ? '✓' : ''}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={styles.modalPrimaryBtn}
                onPress={() => handleSaveMealSelection(false)}
                disabled={foodSaving}
              >
                {foodSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalPrimaryBtnText}>Confirm Meal Count</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.modalGhostBtn}
                onPress={() => handleSaveMealSelection(true)}
                disabled={foodSaving}
              >
                <Text style={styles.modalGhostBtnText}>Not Having Food Today / Skip</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* ── FACE MISMATCH MODAL ── */}
        <Modal visible={showMismatchModal} transparent animationType="fade" onRequestClose={() => setShowMismatchModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={[styles.modalIconWrap, { backgroundColor: BRAND.dangerGlow }]}>
                <Text style={{ fontSize: 26 }}>❌</Text>
              </View>
              <Text style={[styles.modalTag, { color: BRAND.danger }]}>BIOMETRIC MISMATCH</Text>
              <Text style={styles.modalTitle}>Face Not Recognized</Text>
              <Text style={styles.modalDesc}>
                {mismatchMsg || 'Your face did not match the registered profile. Please look directly into the camera in good lighting and try again.'}
              </Text>
              <Pressable
                style={[styles.modalPrimaryBtn, { backgroundColor: BRAND.danger }]}
                onPress={() => {
                  setShowMismatchModal(false);
                  resetProgress();
                  setStatus('Position your face inside the circle');
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* ── SHIFT PUNCH OUT CONFIRMATION MODAL ── */}
        <Modal
          visible={showPunchOutModal}
          transparent
          animationType="fade"
          onRequestClose={() => !isPunchingOut && setShowPunchOutModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={[styles.modalIconWrap, { backgroundColor: BRAND.dangerGlow }]}>
                <Text style={{ fontSize: 28 }}>🚪</Text>
              </View>
              <Text style={[styles.modalTag, { color: BRAND.danger }]}>END SHIFT & PUNCH OUT</Text>
              <Text style={styles.modalTitle}>Confirm Attendance Punch Out</Text>
              <Text style={styles.modalDesc}>
                Are you sure you want to end your active attendance shift?{'\n'}(You will remain logged into your KwOrKs account).
              </Text>

              <View style={styles.modalDetailsTable}>
                <View style={styles.modalTableRow}>
                  <Text style={styles.modalTableKey}>👤 Employee:</Text>
                  <Text style={styles.modalTableVal} numberOfLines={1}>
                    {user?.name || 'Employee'}
                  </Text>
                </View>
                <View style={styles.modalTableRow}>
                  <Text style={styles.modalTableKey}>🏢 Department:</Text>
                  <Text style={styles.modalTableVal}>{user?.department || 'General'}</Text>
                </View>
                <View style={styles.modalTableRow}>
                  <Text style={styles.modalTableKey}>⏱️ Shift Duration:</Text>
                  <Text style={[styles.modalTableVal, { color: BRAND.primary, fontWeight: '800' }]}>
                    {shiftTimerStr}
                  </Text>
                </View>
                <View style={styles.modalTableRow}>
                  <Text style={styles.modalTableKey}>📍 Location:</Text>
                  <Text style={styles.modalTableVal} numberOfLines={1}>
                    {gpsData?.address || locName || 'Location recorded'}
                  </Text>
                </View>
                <View style={styles.modalTableRow}>
                  <Text style={styles.modalTableKey}>🕒 Punch Out Time:</Text>
                  <Text style={styles.modalTableVal}>{new Date().toLocaleTimeString()}</Text>
                </View>
              </View>

              <Text style={styles.modalDisclaimer}>
                📢 A notification will be dispatched instantly to the Management Dashboard with your punch-out timestamp and active hours.
              </Text>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={[styles.modalCancelBtn, isPunchingOut && { opacity: 0.5 }]}
                  disabled={isPunchingOut}
                  onPress={() => setShowPunchOutModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalConfirmPunchOutBtn, isPunchingOut && { opacity: 0.7 }]}
                  disabled={isPunchingOut}
                  onPress={handleConfirmPunchOut}
                >
                  <Text style={styles.modalConfirmPunchOutBtnText}>
                    {isPunchingOut ? 'Notifying Manager...' : 'Confirm Punch Out'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
    paddingTop: Platform.OS === 'ios' ? 52 : 46,
    paddingHorizontal: 16,
    paddingBottom: 8,
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
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  topPunchOutBtn: {
    backgroundColor: BRAND.dangerGlow,
    borderWidth: 1,
    borderColor: BRAND.danger,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  topPunchOutText: {
    color: '#FFA5A5',
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  userHeaderCard: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  userHeaderLeft: {
    flex: 1,
  },
  userGreeting: {
    color: BRAND.text,
    fontSize: 16,
    fontWeight: '800',
  },
  userSub: {
    color: BRAND.textDim,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  liveDateBadge: {
    backgroundColor: 'rgba(215,171,106,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDateText: {
    color: BRAND.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  cameraWrap: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: BRAND.primary,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  camFlipBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,7,17,0.85)',
    padding: 20,
  },
  permText: {
    color: BRAND.text,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  permBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  permBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scanningControls: {
    alignItems: 'center',
    marginTop: 18,
    width: '100%',
    maxWidth: 340,
  },
  statusMsg: {
    color: BRAND.text,
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  scanningProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  scanningPercentText: {
    color: BRAND.primaryLight,
    fontSize: 18,
    fontWeight: '800',
  },
  markAttendanceBtn: {
    marginTop: 18,
    width: 220,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  markAttendanceBtnScanning: {
    backgroundColor: '#C49855',
  },
  markAttendanceBtnDisabled: {
    opacity: 0.45,
  },
  markAttendanceBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  networkStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.3)',
    backgroundColor: 'rgba(215,171,106,0.1)',
    marginBottom: 12,
    width: '100%',
  },
  networkStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  networkErrorText: {
    color: BRAND.error,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    fontWeight: '600',
  },
  successCard: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
    maxWidth: 360,
  },
  successHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successBadge: {
    backgroundColor: BRAND.successGlow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BRAND.success,
  },
  successBadgeText: {
    color: BRAND.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  successTimeText: {
    color: BRAND.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
  thumbWrap: {
    position: 'relative',
    marginTop: 12,
  },
  thumbImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: BRAND.primary,
  },
  thumbOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: BRAND.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activeShiftWidget: {
    width: '100%',
    backgroundColor: 'rgba(215,171,106,0.12)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  shiftWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.success,
  },
  shiftWidgetLabel: {
    color: BRAND.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  shiftWidgetTimer: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginVertical: 4,
  },
  shiftWidgetSub: {
    color: BRAND.textDim,
    fontSize: 11,
    textAlign: 'center',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
  primaryActionBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  punchOutBtn: {
    backgroundColor: BRAND.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchOutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  punchedOutCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: BRAND.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.primary,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
  punchedOutIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  punchedOutHeading: {
    color: BRAND.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  punchedOutSub: {
    color: BRAND.textDim,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  punchedOutSummaryBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: BRAND.textDim,
    fontSize: 12.5,
    fontWeight: '600',
  },
  summaryValue: {
    color: BRAND.text,
    fontSize: 12.5,
    fontWeight: '700',
  },
  gpsTelemetryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.primary,
    backgroundColor: BRAND.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  gpsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsInfoWrap: {
    flex: 1,
    marginLeft: 12,
  },
  gpsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  gpsHeaderLabel: {
    color: BRAND.primaryLight,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  gpsAccuracyBadge: {
    backgroundColor: BRAND.goldGlow,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  gpsAccuracyText: {
    color: BRAND.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  gpsRefreshBtn: {
    padding: 2,
  },
  gpsAddressText: {
    color: BRAND.text,
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 18,
  },
  gpsAddressDim: {
    color: BRAND.textDim,
  },
  gpsCoordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gpsCoordsText: {
    color: BRAND.textDim,
    fontSize: 11,
    fontWeight: '700',
  },
  gpsMapsLink: {
    color: BRAND.primary,
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  foodCountNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.primary,
    backgroundColor: BRAND.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  foodCountIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodCountTitle: {
    color: BRAND.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  foodCountSub: {
    color: BRAND.textDim,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  foodCountArrow: {
    color: BRAND.primaryLight,
    fontSize: 20,
    fontWeight: '800',
  },
  blockedCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  blockedTitle: {
    color: BRAND.primary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  blockedSub: {
    color: BRAND.textDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  blockedBtn: {
    marginTop: 28,
    backgroundColor: BRAND.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  blockedBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,7,17,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.primary,
    backgroundColor: BRAND.bgCard,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTag: {
    color: BRAND.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  modalTitle: {
    color: BRAND.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },
  modalDesc: {
    color: BRAND.textDim,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  modalDetailsTable: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 14,
    gap: 8,
  },
  modalTableRow: {
    flexDirection: 'row',
    alignItems: 'center',    
    justifyContent: 'space-between',
  },
  modalTableKey: {
    color: BRAND.textDim,
    fontSize: 12.5,
    fontWeight: '600',
  },
  modalTableVal: { 
    color: BRAND.text,
    fontSize: 12.5,
    fontWeight: '700',
    maxWidth: 180,
    textAlign: 'right',
  }, 
  modalDisclaimer: {
    color: BRAND.textDim,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.3)',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: BRAND.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmPunchOutBtn: {
    flex: 1.4,
    backgroundColor: BRAND.danger,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalConfirmPunchOutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalPrimaryBtn: {
    marginTop: 20,
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 13,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalGhostBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  modalGhostBtnText: {
    color: BRAND.textDim,
    fontSize: 13.5,
    fontWeight: '700',
  },
  mealOptionsWrap: {
    width: '100%',
    marginVertical: 12,
    gap: 8,
  },
  mealOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(215, 171, 106, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mealOptionCardActive: {
    backgroundColor: 'rgba(215, 171, 106, 0.16)',
    borderColor: BRAND.primary,
  },
  mealOptionLabel: {
    color: BRAND.textDim,
    fontSize: 13.5,
    fontWeight: '700',
  },
  mealOptionLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  mealOptionDesc: {
    color: BRAND.textDim,
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },
  mealCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 171, 106, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  mealCheckCircleActive: {
    backgroundColor: BRAND.primary,
    borderColor: BRAND.primary,
  },
  mealCheckText: {
    color: '#31122B',
    fontSize: 13,
    fontWeight: '900',
  },
});