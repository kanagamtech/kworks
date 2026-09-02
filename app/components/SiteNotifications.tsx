import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Text from './AppText';
import { API_BASE } from '../utils/config';

const useNativeDriver = Platform.OS !== 'web';

const SEEN_KEY = 'kworks_notif_seen';

type Popup = {
  id: string;
  kind: string;
  title: string;
  body: string;
};

type Props = {
  onOpen: () => void;
};

export default function SiteNotifications({ onOpen }: Props) {
  const [popup, setPopup] = useState<Popup | null>(null);
  const translateY = useRef(new Animated.Value(-160)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const queue = useRef<Popup[]>([]);
  const showing = useRef(false);
  const mounted = useRef(true);
  const autoDismiss = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenIdsRef = useRef<string[]>([]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (autoDismiss.current) clearTimeout(autoDismiss.current);
    };
  }, []);

  const hide = () => {
    if (autoDismiss.current) clearTimeout(autoDismiss.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -160,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver }),
    ]).start(() => {
      showing.current = false;
      if (!mounted.current) return;
      setPopup(null);
      showNext();
    });
  };

  const showNext = () => {
    if (showing.current || queue.current.length === 0) return;
    const p = queue.current.shift();
    if (!p) return;
    showing.current = true;
    setPopup(p);
    translateY.setValue(-160);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver }),
    ]).start();
    autoDismiss.current = setTimeout(hide, 5500);
  };

  const openPopup = () => {
    hide();
    onOpen();
  };

  useEffect(() => {
    let intervalId: any;

    const init = async () => {
      // 1. Load seen IDs from AsyncStorage
      try {
        const rawSeen = await AsyncStorage.getItem(SEEN_KEY);
        if (rawSeen) {
          seenIdsRef.current = JSON.parse(rawSeen);
        }
      } catch {}

      // 2. Scan for new notices/polls from backend
      const scan = async () => {
        if (!mounted.current) return;
        try {
          const res = await fetch(`${API_BASE}/api/notices`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const newNotices: Popup[] = [];
            data.data.forEach((n: any) => {
              const id = `notice_${n.id}`;
              if (!seenIdsRef.current.includes(id)) {
                newNotices.push({
                  id,
                  kind: n.team && n.team !== 'ALL' ? `Announcement · ${n.team}` : 'Company Notice',
                  title: n.title || 'New Announcement',
                  body: n.body || '',
                });
                seenIdsRef.current.push(id);
              }
            });

            if (newNotices.length > 0) {
              AsyncStorage.setItem(SEEN_KEY, JSON.stringify(seenIdsRef.current.slice(-300))).catch(() => {});
              newNotices.forEach((it) => queue.current.push(it));
              if (!showing.current) {
                showNext();
              }
            }
          }
        } catch {}
      };

      // Run initial check after 2 seconds, then periodically
      setTimeout(scan, 2000);
      intervalId = setInterval(scan, 12000);
    };

    init();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (!popup) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
        <Pressable style={styles.toastPress} onPress={openPopup}>
          <View style={styles.toastDot} />
          <View style={styles.toastBody}>
            <Text style={styles.toastKind}>{popup.kind}</Text>
            <Text style={styles.toastTitle} numberOfLines={1}>
              {popup.title}
            </Text>
            <Text style={styles.toastText} numberOfLines={2}>
              {popup.body}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 44,
    left: 14,
    right: 14,
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(32, 12, 28, 0.98)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    zIndex: 9999,
  },
  toastPress: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  toastDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D7AB6A',
    marginRight: 12,
  },
  toastBody: {
    flex: 1,
  },
  toastKind: {
    color: '#D7AB6A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    marginTop: 2,
  },
  toastText: {
    color: '#CBAF8C',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
});