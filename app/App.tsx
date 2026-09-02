import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, BackHandler, Easing, Image, Platform, StyleSheet, ToastAndroid, View } from 'react-native';
import Text from './components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, OpenSans_400Regular, OpenSans_600SemiBold, OpenSans_700Bold, OpenSans_800ExtraBold } from '@expo-google-fonts/open-sans';
import MorningBackground from './components/MorningBackground';
import SiteNotifications from './components/SiteNotifications';
import { ThemeProvider } from './theme';
import { useResponsive } from './hooks/useResponsive';
import AttendanceScreen from './screens/AttendanceScreen';
import FoodCountScreen from './screens/FoodCountScreen';
import HomeScreen from './screens/HomeScreen';
import SupportScreen from './screens/SupportScreen';
import LeaveScreen from './screens/LeaveScreen';
import LoginScreen from './screens/LoginScreen';
import NotificationScreen from './screens/NotificationScreen';
import ClaimsScreen from './screens/ClaimsScreen';
import ChatScreen from './screens/ChatScreen';
import * as Notifications from 'expo-notifications';
import { API_BASE } from './utils/config';
import { useAppUpdate } from './hooks/useAppUpdate';
// UpdateModal removed — updates are fully silent via EAS OTA background bundle
import type { UserProfile } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Cannot record touch end without a touch start')) {
      return;
    }
    originalWarn(...args);
  };
}

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    const { protocol, hostname, host, pathname, search } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (protocol === 'http:' && !isLocal) {
      window.location.replace(`https://${host}${pathname}${search}`);
    }
  } catch {}
}

SplashScreen.preventAutoHideAsync().catch(() => {});

const useNativeDriver = Platform.OS !== 'web';
const USER_STORAGE_KEY = 'kworks_user_profile';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#D7AB6A',
  primaryDark: '#31122B',
  bgTop: '#31122B',
  bgMain: '#31122B',
  bgDeep: 'rgba(20,7,17,0.62)',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
};

const LOGO_DELAY_MS = 1200;
const LOGO_FADE_MS = 800;
const LOGO_HOLD_MS = 500;
const SPLASH_FADE_MS = 500;

function Screen({
  children,
  onOpenNotifications,
}: {
  children: ReactNode;
  onOpenNotifications?: () => void;
}) {
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <MorningBackground />
      {children}
      {onOpenNotifications ? <SiteNotifications onOpen={onOpenNotifications} /> : null}
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  const { scale, width } = useResponsive();
  const [fontsLoaded, fontError] = useFonts({ OpenSans_400Regular, OpenSans_600SemiBold, OpenSans_700Bold, OpenSans_800ExtraBold });
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const [showHome, setShowHome] = useState(false);
  const [screen, setScreen] = useState<'home' | 'login' | 'attendance' | 'foodcount' | 'leave' | 'notifications' | 'support' | 'claims' | 'chat'>('home');
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(USER_STORAGE_KEY)
      .then(async (raw) => {
        if (raw) {
          try {
            const parsed: UserProfile = JSON.parse(raw);
            if (!parsed || !parsed.email) {
              setUser(null);
              setScreen('login');
              return;
            }

            // Verify with backend database if account still exists
            try {
              const res = await fetch(`${API_BASE}/api/employees`).then((r) => r.json());
              if (res && res.success && Array.isArray(res.data)) {
                const match = res.data.find(
                  (e: any) => e.email?.trim().toLowerCase() === parsed.email?.trim().toLowerCase()
                );
                if (match) {
                  const updated: UserProfile = {
                    ...parsed,
                    name: match.name || parsed.name,
                    company: match.company || parsed.company,
                    department: match.department || parsed.department,
                    destination: match.destination || match.role || parsed.destination,
                    photoUri: match.photo || parsed.photoUri,
                  };
                  setUser(updated);
                  AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
                  setScreen('home');
                  return;
                } else {
                  // Account not in database -> Reject & redirect to login
                  setUser(null);
                  AsyncStorage.removeItem(USER_STORAGE_KEY).catch(() => {});
                  setScreen('login');
                  return;
                }
              }
            } catch {
              // Network offline / fallback
            }

            setUser(parsed);
            setScreen('home');
          } catch {
            setUser(null);
            setScreen('login');
          }
        } else {
          setUser(null);
          setScreen('login');
        }
      })
      .catch(() => {
        setUser(null);
        setScreen('login');
      });
  }, []);

  const handleSaveUser = (profile: UserProfile) => {
    setUser(profile);
    AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile)).catch(() => {});
    setScreen('home');
  };

  // ── 20-Second Cloud Keep-Alive Heartbeat ────────────────────────────────────
  useEffect(() => {
    const pulse = () => {
      fetch(`${API_BASE}/api/health`).catch(() => {});
    };
    pulse();
    const interval = setInterval(pulse, 20000);
    return () => clearInterval(interval);
  }, []);

  // ── Global Chat Notification Poller ──────────────────────────────────────────
  const lastKnownChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    if (Platform.OS !== 'web') {
      Notifications.getPermissionsAsync().then((perms) => {
        if (perms.status !== 'granted') {
          Notifications.requestPermissionsAsync();
        }
      });
    }

    const checkGlobalChat = () => {
      fetch(`${API_BASE}/api/chat`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const latest = res.data[res.data.length - 1];
            if (!latest || latest.isDeleted) return;

            if (lastKnownChatIdRef.current && lastKnownChatIdRef.current !== latest.id) {
              const myEmail = user.email.toLowerCase();
              const isFromOther = latest.from?.toLowerCase() !== myEmail;
              const isDirectToMe = latest.to?.toLowerCase() === myEmail;
              const isGroupMsg = latest.to?.startsWith('grp_');

              if (isFromOther && (isDirectToMe || isGroupMsg)) {
                if (screen !== 'chat') {
                  const senderName = latest.from?.split('@')[0] || 'Someone';
                  const title = isGroupMsg ? '💬 KwOrKs Group' : `💬 ${senderName}`;
                  const body = latest.text || (latest.photo ? '📷 Sent a photo' : '📄 Sent a document');

                  if (Platform.OS !== 'web') {
                    Notifications.scheduleNotificationAsync({
                      content: {
                        title,
                        body,
                        sound: 'default',
                      },
                      trigger: null,
                    }).catch(() => {});
                  }
                }
              }
            }
            lastKnownChatIdRef.current = latest.id;
          }
        })
        .catch(() => {});
    };

    checkGlobalChat();
    const interval = setInterval(checkGlobalChat, 3500);
    return () => clearInterval(interval);
  }, [user, screen]);

  // ── Global Android Back Button & Swipe Gesture Handler ────────────────────
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    const onBackPress = () => {
      // If currently on any sub-screen, go back to home screen (or previous screen)
      if (screen === 'foodcount') {
        setScreen('attendance');
        return true; // Prevent default app exit
      }

      if (screen !== 'home') {
        if (screen === 'login' && !user) {
          // On login screen with no user, allow normal back/exit
          return false;
        }
        setScreen('home');
        return true; // Handled back navigation internally
      }

      // If already on the home screen, require double tap within 2 seconds to exit
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        return false; // Exit app on second tap
      }

      lastBackPressRef.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit KwOrKs', ToastAndroid.SHORT);
      }
      return true; // Intercept first back press
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [screen, user]);

  const handleLogout = () => {
    setUser(null);
    AsyncStorage.removeItem(USER_STORAGE_KEY).catch(() => {});
    AsyncStorage.removeItem('kworks_last_attendance_time').catch(() => {});
    setScreen('login');
  };

  // useAppUpdate handles silent background EAS OTA — no popup, no modal
  useAppUpdate();

  const wrapScreen = (content: ReactNode) => (
    <Screen onOpenNotifications={() => setScreen('notifications')}>
      {content}
    </Screen>
  );

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: LOGO_FADE_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: LOGO_FADE_MS,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver,
          }),
        ]).start();
        Animated.timing(contentOpacity, {
            toValue: 1,
            duration: LOGO_FADE_MS,
            delay: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver,
          }).start();
        SplashScreen.hideAsync().catch(() => {});
      }, LOGO_DELAY_MS)
    );
    timers.push(
      setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: SPLASH_FADE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }).start(() => setShowHome(true));
      }, LOGO_DELAY_MS + LOGO_FADE_MS + LOGO_HOLD_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [logoOpacity, logoScale, contentOpacity, splashOpacity]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <MorningBackground />
        <Image source={require('./assets/images/logo-kanagam.png')} style={{ width: Math.min(300, width * 0.7) * scale, height: Math.min(300, width * 0.7) * scale }} resizeMode="contain" />
      </View>
    );
  }

  if (screen === 'attendance') {
    return wrapScreen(
      <AttendanceScreen
        onDone={() => setScreen('home')}
        onFoodCount={() => setScreen('foodcount')}
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === 'foodcount') {
    return wrapScreen(
      <FoodCountScreen onBack={() => setScreen('attendance')} onSubmit={() => setScreen('home')} user={user} />
    );
  }

  if (screen === 'leave') {
    return wrapScreen(
      <LeaveScreen onBack={() => setScreen('home')} user={user} />
    );
  }

  if (screen === 'notifications') {
    return wrapScreen(
      <NotificationScreen onBack={() => setScreen('home')} user={user} />
    );
  }

  if (screen === 'support') {
    return wrapScreen(
      <SupportScreen onBack={() => setScreen('home')} user={user} />
    );
  }

  if (screen === 'login') {
    return wrapScreen(
      <LoginScreen
        user={user}
        onSave={handleSaveUser}
        onBack={() => {
          if (user) {
            setScreen('home');
          }
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === 'claims') {
    return wrapScreen(
      <ClaimsScreen onBack={() => setScreen('home')} user={user} />
    );
  }

  if (screen === 'chat') {
    return wrapScreen(
      <ChatScreen onBack={() => setScreen('home')} user={user} />
    );
  }

  if (showHome) {
    if (!user) {
      return wrapScreen(
        <LoginScreen user={user} onSave={handleSaveUser} onBack={() => {}} onLogout={handleLogout} />
      );
    }
    return wrapScreen(
      <HomeScreen
        user={user}
        onLoginPress={() => setScreen('login')}
        onOpenAttendance={() => setScreen('attendance')}
        onOpenFoodCount={() => setScreen('foodcount')}
        onOpenLeave={() => setScreen('leave')}
        onOpenNotifications={() => setScreen('notifications')}
        onOpenSupport={() => setScreen('support')}
        onOpenClaims={() => setScreen('claims')}
        onOpenChat={() => setScreen('chat')}
      />
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: splashOpacity }]}>
      <StatusBar style="light" />
      <MorningBackground />
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image source={require('./assets/images/logo-kanagam.png')} style={{ width: Math.min(300, width * 0.7) * scale, height: Math.min(300, width * 0.7) * scale }} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[styles.textBlock, { opacity: contentOpacity }]}>
        <Text style={styles.tagline}>Work that moves forward</Text>
        <View style={styles.dotRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 300,
    height: 300,
  },
  textBlock: {
    alignItems: 'center',
  },
  tagline: {
    marginTop: 16,
    fontSize: 18,
    letterSpacing: 1.2,
    color: BRAND.textDim,
    fontWeight: '600',
  },
  dotRow: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.primaryDark,
  },
  dotActive: {
    backgroundColor: BRAND.primary,
  },
});