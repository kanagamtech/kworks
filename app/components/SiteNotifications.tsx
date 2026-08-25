import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';

const useNativeDriver = Platform.OS !== 'web';

const MGMT_KEY = 'kworks_management_notices';
const HR_KEY = 'kworks_hr_notices';
const POLLS_KEY = 'kworks_polls';
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
    autoDismiss.current = setTimeout(hide, 5000);
  };

  const openPopup = () => {
    hide();
    onOpen();
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(window.localStorage.getItem(SEEN_KEY) || '[]');
    } catch {
      seen = [];
    }

    const read = (key: string): any[] => {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    };

    const collect = (): Popup[] => {
      const items: Popup[] = [];
      const teamOf = (n: any) => (n.team && n.team !== 'ALL' ? n.team : 'All');
      read(MGMT_KEY).forEach((n) =>
        items.push({ id: 'm' + n.id, kind: 'Announcement · ' + teamOf(n), title: n.title, body: n.body })
      );
      read(HR_KEY).forEach((n) =>
        items.push({ id: 'h' + n.id, kind: 'Announcement · ' + teamOf(n), title: n.title, body: n.body })
      );
      read(POLLS_KEY).forEach((p) =>
        items.push({
          id: 'p' + p.id,
          kind: 'New Poll',
          title: p.title,
          body: 'A new poll is waiting for your vote in Notifications.',
        })
      );
      return items;
    };

    const markSeen = (id: string) => {
      seen.push(id);
      try {
        window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-300)));
      } catch {}
    };

    collect().forEach((it) => markSeen(it.id));

    const scan = () => {
      collect().forEach((it) => {
        if (seen.includes(it.id)) return;
        markSeen(it.id);
        queue.current.push(it);
      });
      if (queue.current.length) showNext();
    };

    const iv = setInterval(scan, 5000);
    window.addEventListener('storage', scan);
    return () => {
      clearInterval(iv);
      window.removeEventListener('storage', scan);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    top: 54,
    left: 14,
    right: 14,
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.97)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
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