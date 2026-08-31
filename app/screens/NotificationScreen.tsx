import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MorningBackground from '../components/MorningBackground';
import Text from '../components/AppText';
import { API_BASE } from '../utils/config';
import { EMPLOYEES, HR_NOTICES, MANAGEMENT_NOTICES } from '../utils/celebrations';

const useNativeDriver = Platform.OS !== 'web';

const MGMT_KEY = 'kworks_management_notices';
const HR_KEY = 'kworks_hr_notices';
const BIRTHDAYS_KEY = 'kworks_birthdays';
const ANNIVERSARIES_KEY = 'kworks_anniversaries';
const POLLS_KEY = 'kworks_polls';
const DEVICE_KEY = 'kworks_device_id';

type UploadedBirthday = {
  id: string;
  name: string;
  month: string;
  day: string;
  photo: string | null;
  role?: string;
};

type UploadedAnniversary = {
  id: string;
  name: string;
  month: string;
  day: string;
  year: string;
};

type Poll = {
  id: string;
  title: string;
  options: string[];
  votes: Record<string, number>;
  createdAt: number;
};

type Celebrant = {
  id: string;
  name: string;
  role: string;
  photo: number | string;
  birthMonth?: number;
  birthDay?: number;
  joinMonth?: number;
  joinDay?: number;
  joinYear?: number;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#D7AB6A',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
};

const BALLOON_COLORS = ['#D7AB6A', '#D7AB6A', '#D7AB6A', '#D7AB6A', '#D7AB6A', '#31122B', '#D7AB6A'];

const SPARKLES = [
  { x: 8, y: 12, c: '#D7AB6A', d: 900 },
  { x: 18, y: 30, c: '#D7AB6A', d: 1200 },
  { x: 30, y: 8, c: '#D7AB6A', d: 800 },
  { x: 42, y: 25, c: '#D7AB6A', d: 1100 },
  { x: 55, y: 14, c: '#D7AB6A', d: 1000 },
  { x: 66, y: 34, c: '#D7AB6A', d: 900 },
  { x: 78, y: 10, c: '#D7AB6A', d: 1300 },
  { x: 90, y: 22, c: '#D7AB6A', d: 950 },
  { x: 13, y: 55, c: '#D7AB6A', d: 1150 },
  { x: 35, y: 48, c: '#D7AB6A', d: 850 },
  { x: 60, y: 60, c: '#D7AB6A', d: 1050 },
  { x: 85, y: 52, c: '#D7AB6A', d: 1250 },
  { x: 25, y: 72, c: '#D7AB6A', d: 1000 },
  { x: 72, y: 78, c: '#D7AB6A', d: 900 },
];

type Props = {
  onBack: () => void;
};

export default function NotificationScreen({ onBack }: Props) {
  const screenH = Dimensions.get('window').height;
  const [mgmtNotices, setMgmtNotices] = useState(MANAGEMENT_NOTICES);
  const [hrNotices, setHrNotices] = useState(HR_NOTICES);
  const [uploadedBirthdays, setUploadedBirthdays] = useState<UploadedBirthday[]>([]);
  const [uploadedAnniversaries, setUploadedAnniversaries] = useState<UploadedAnniversary[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // 1. Load local cache for instant offline rendering
      try {
        const [mgmtRaw, hrRaw, bRaw, aRaw, pollsRaw, devRaw] = await Promise.all([
          AsyncStorage.getItem(MGMT_KEY),
          AsyncStorage.getItem(HR_KEY),
          AsyncStorage.getItem(BIRTHDAYS_KEY),
          AsyncStorage.getItem(ANNIVERSARIES_KEY),
          AsyncStorage.getItem(POLLS_KEY),
          AsyncStorage.getItem(DEVICE_KEY),
        ]);
        if (!mounted) return;
        if (mgmtRaw) setMgmtNotices(JSON.parse(mgmtRaw) as typeof MANAGEMENT_NOTICES);
        if (hrRaw) setHrNotices(JSON.parse(hrRaw) as typeof HR_NOTICES);
        if (bRaw) setUploadedBirthdays(JSON.parse(bRaw) as UploadedBirthday[]);
        if (aRaw) setUploadedAnniversaries(JSON.parse(aRaw) as UploadedAnniversary[]);
        if (pollsRaw) setPolls(JSON.parse(pollsRaw) as Poll[]);
        if (devRaw) {
          setDeviceId(devRaw);
        } else {
          const id = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
          setDeviceId(id);
          AsyncStorage.setItem(DEVICE_KEY, id).catch(() => {});
        }
      } catch {}

      // 2. Fetch live notices from backend
      try {
        const res = await fetch(`${API_BASE}/api/notices`);
        const data = await res.json();
        if (mounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          const allNotices = data.data;
          const mgmt = allNotices.filter((n: any) => n.category === 'management' || n.team === 'MANAGEMENT' || (!n.category && !n.team));
          const hr = allNotices.filter((n: any) => n.category === 'hr' || n.team === 'HR');
          if (mgmt.length > 0) {
            setMgmtNotices(mgmt);
            AsyncStorage.setItem(MGMT_KEY, JSON.stringify(mgmt)).catch(() => {});
          }
          if (hr.length > 0) {
            setHrNotices(hr);
            AsyncStorage.setItem(HR_KEY, JSON.stringify(hr)).catch(() => {});
          }
        }
      } catch {}

      // 3. Fetch live polls from backend
      try {
        const res = await fetch(`${API_BASE}/api/polls`);
        const data = await res.json();
        if (mounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setPolls(data.data);
          AsyncStorage.setItem(POLLS_KEY, JSON.stringify(data.data)).catch(() => {});
        }
      } catch {}
    };
    load();
    const onStorage = () => {
      AsyncStorage.getItem(POLLS_KEY)
        .then((raw) => {
          if (mounted && raw) setPolls(JSON.parse(raw) as Poll[]);
        })
        .catch(() => {});
    };
    if (Platform.OS === 'web') window.addEventListener('storage', onStorage);
    return () => {
      mounted = false;
      if (Platform.OS === 'web') window.removeEventListener('storage', onStorage);
    };
  }, []);

  const balloons = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      anim: new Animated.Value(0),
      left: 6 + i * 12.5,
      delay: 500 + i * 420,
      color: BALLOON_COLORS[i % BALLOON_COLORS.length],
      size: 20 + (i % 3) * 9,
    }))
  ).current;

  const sparkles = useRef(
    SPARKLES.map((s) => ({
      ...s,
      anim: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const loops = balloons.map((b) =>
      Animated.loop(
        Animated.timing(b.anim, {
          toValue: 1,
          duration: 6500 + b.delay,
          easing: Easing.linear,
          useNativeDriver,
        })
      )
    );
    loops.forEach((l) => l.start());
    const sparkLoops = sparkles.map((s) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(s.anim, {
            toValue: 1,
            duration: s.d * 0.4,
            easing: Easing.out(Easing.quad),
            useNativeDriver,
          }),
          Animated.timing(s.anim, {
            toValue: 0,
            duration: s.d * 0.6,
            easing: Easing.in(Easing.quad),
            useNativeDriver,
          }),
          Animated.delay(s.d * 0.5),
        ])
      )
    );
    sparkLoops.forEach((l) => l.start());
    return () => {
      loops.forEach((l) => l.stop());
      sparkLoops.forEach((l) => l.stop());
    };
  }, [balloons, sparkles]);

  useEffect(() => {
    let mounted = true;
    const fire = async () => {
      try {
        if (Platform.OS === 'web') return;
        const perms = await Notifications.getPermissionsAsync();
        if (perms.status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          if (req.status !== 'granted') return;
        }
        // Use live backend notice instead of hardcoded mock data
        const res = await fetch(`${API_BASE}/api/notices`);
        const data = await res.json();
        const notices = data.success && Array.isArray(data.data) ? data.data : [];
        const latest = notices[0];
        if (!latest) return;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'KwOrKs · ' + latest.title,
            body: latest.body,
            sound: 'default',
          },
          trigger: null,
        });
      } catch {}
    };
    if (mounted) fire();
    return () => {
      mounted = false;
    };
  }, []);

  const persistPolls = (next: Poll[]) => {
    setPolls(next);
    AsyncStorage.setItem(POLLS_KEY, JSON.stringify(next)).catch(() => {});
    fetch(`${API_BASE}/api/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => {});
  };

  const castVote = (pollId: string, optionIdx: number) => {
    if (!deviceId) return;
    const next = polls.map((p) => {
      if (p.id !== pollId) return p;
      const votes = { ...p.votes };
      if (votes[deviceId] === optionIdx) return p;
      votes[deviceId] = optionIdx;
      return { ...p, votes };
    });
    persistPolls(next);
  };

const now = new Date();
  const month = now.getMonth();
  const birthdays = EMPLOYEES.filter((e) => e.birthMonth === month);
  const annivs = EMPLOYEES.filter((e) => e.joinMonth === month && !birthdays.some((b) => b.id === e.id));
  const uploadedCelebrants = useMemo<Celebrant[]>(() => {
    const list: Celebrant[] = [];
    uploadedBirthdays.forEach((b) => {
      if (Number(b.month) - 1 === month) {
        list.push({
          id: b.id,
          name: b.name,
          role: b.role ?? 'Birthday',
          photo: b.photo ?? '',
          birthMonth: Number(b.month) - 1,
          birthDay: Number(b.day),
        });
      }
    });
    uploadedAnniversaries.forEach((a) => {
      if (Number(a.month) - 1 === month) {
        list.push({
          id: a.id,
          name: a.name,
          role: 'Work Anniversary',
          photo: '',
          joinMonth: Number(a.month) - 1,
          joinDay: Number(a.day),
          joinYear: Number(a.year),
        });
      }
    });
    return list;
  }, [uploadedBirthdays, uploadedAnniversaries, month]);

  const monthLabel = now.toLocaleDateString('en-US', { month: 'long' });

  const celebrationItems = useMemo(() => {
    const items: { id: string; type: 'birthday' | 'anniversary'; label: string; emp: Celebrant }[] = [];
    birthdays.forEach((e) =>
      items.push({
        id: `b${e.id}`,
        type: 'birthday',
        label: `Birthday · ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        emp: e,
      })
    );
    annivs.forEach((e) =>
      items.push({
        id: `a${e.id}`,
        type: 'anniversary',
        label: `Work Anniversary · Joined ${now.toLocaleDateString('en-US', { month: 'short' })} ${e.joinDay}, ${e.joinYear}`,
        emp: e,
      })
    );
    uploadedCelebrants.forEach((e) =>
      items.push({
        id: `u${e.id}`,
        type: e.birthMonth === month ? 'birthday' : 'anniversary',
        label:
          e.birthMonth === month
            ? `Birthday · ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : `Work Anniversary · Joined ${now.toLocaleDateString('en-US', { month: 'short' })} ${e.joinDay}, ${e.joinYear}`,
        emp: e,
      })
    );
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, birthdays.length, annivs.length, uploadedCelebrants]);

  const photoSource = (photo: number | string): ImageSourcePropType | undefined =>
    typeof photo === 'string' ? (photo ? { uri: photo } : undefined) : photo;

  const collage = celebrationItems.length > 1;
  const sectionHeight = Math.min(screenH * 0.5, 460);

  return (
    <View style={styles.root}>
      <MorningBackground />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'} Back</Text>
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.celebrateSection, { minHeight: sectionHeight }]}>
            {balloons.map((b, i) => (
              <Animated.View
                key={`b${i}`}
                pointerEvents="none"
                style={[
                  styles.balloonWrap,
                  {
                    left: `${b.left}%`,
                    width: b.size,
                    height: b.size * 1.4,
                    opacity: b.anim.interpolate({ inputRange: [0, 0.05, 0.95, 1], outputRange: [0, 1, 1, 0] }),
                    transform: [
                      {
                        translateY: b.anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [sectionHeight + 40, -60],
                        }),
                      },
                      {
                        translateX: b.anim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 12, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={[styles.balloon, { backgroundColor: b.color }]}>
                  <View style={styles.balloonShine} />
                </View>
                <View style={[styles.balloonString, { height: b.size * 1.1 }]} />
              </Animated.View>
            ))}
            {sparkles.map((s, i) => (
              <Animated.View
                key={`s${i}`}
                pointerEvents="none"
                style={[
                  styles.sparkle,
                  {
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    backgroundColor: s.c,
                    opacity: s.anim,
                    transform: [
                      {
                        scale: s.anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.5] }),
                      },
                    ],
                  },
                ]}
              />
            ))}

            <Text style={styles.celebrateTitle}>Celebrations · {monthLabel}</Text>

            {collage ? (
              <View style={styles.collage}>
                {celebrationItems.map((item) => (
                  <View key={item.id} style={styles.collageCard}>
                    <Image source={photoSource(item.emp.photo)} style={styles.collagePhoto} />
                    <Text style={styles.collageName} numberOfLines={1}>
                      {item.emp.name}
                    </Text>
                    <Text style={[styles.collageLabel, item.type === 'anniversary' && styles.collageLabelAnniv]} numberOfLines={2}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : celebrationItems.length === 1 ? (
              <View style={styles.singleCard}>
                <Image source={photoSource(celebrationItems[0].emp.photo)} style={styles.singlePhoto} />
                <Text style={styles.singleName}>{celebrationItems[0].emp.name}</Text>
                <Text style={styles.singleRole}>{celebrationItems[0].emp.role}</Text>
                <Text style={[styles.singleLabel, celebrationItems[0].type === 'anniversary' && styles.collageLabelAnniv]}>
                  {celebrationItems[0].label}
                </Text>
              </View>
            ) : (
              <Text style={styles.noCeleb}>No birthdays or work anniversaries this month.</Text>
            )}
          </View>

          {polls.map((p) => {
            const total = Object.keys(p.votes).length;
            return (
              <View key={p.id} style={styles.pollCard}>
                <View style={styles.pollHead}>
                  <Text style={styles.pollTitleText}>{p.title}</Text>
                </View>
                <Text style={styles.pollQuestion}>Tap an option to vote</Text>
                {p.options.map((opt, idx) => {
                  const count = Object.values(p.votes).filter((v) => v === idx).length;
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  const mine = deviceId ? p.votes[deviceId] === idx : false;
                  return (
                    <Pressable
                      key={`${p.id}-${idx}`}
                      onPress={() => castVote(p.id, idx)}
                      style={[styles.pollOption, mine && styles.pollOptionMine]}
                    >
                      <View style={[styles.pollRadio, mine && styles.pollRadioOn]}>
                        {mine ? <View style={styles.pollRadioDot} /> : null}
                      </View>
                      <Text style={styles.pollOptionText}>{opt}</Text>
                      <Text style={[styles.pollCount, mine && styles.pollCountMine]}>{mine ? `${count}  Your vote` : count}</Text>
                      <Text style={styles.pollPct}>{pct}%</Text>
                    </Pressable>
                  );
                })}
                <Text style={styles.pollMeta}>{total} vote{total === 1 ? '' : 's'} · You can change your vote anytime</Text>
              </View>
            );
          })}

          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Announcements</Text>
            {[...mgmtNotices, ...hrNotices].map((n) => (
              <View key={n.id} style={styles.noticeItem}>
                <Text style={styles.noticeItemTitle}>{n.title}</Text>
                <Text style={styles.noticeItemBody}>{n.body}</Text>
                <Text style={styles.noticeItemDate}>
                  {n.team && n.team !== 'ALL' ? `For: ${n.team} · ` : ''}
                  {n.date}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pollCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.55)',
    padding: 16,
    marginTop: 16,
  },
  pollHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pollTitleText: {
    flex: 1,
    color: BRAND.text,
    fontSize: 16,
    fontWeight: '800',
  },
  pollQuestion: {
    color: BRAND.textDim,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderWidth: 1,
    borderColor: '#D7AB6A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
  },
  pollOptionMine: {
    borderColor: BRAND.text,
    borderWidth: 1.5,
  },
  pollRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: BRAND.textDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pollRadioOn: {
    borderColor: '#D7AB6A',
  },
  pollRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D7AB6A',
  },
  pollOptionText: {
    flex: 1,
    color: BRAND.text,
    fontSize: 14,
    fontWeight: '600',
  },
  pollCount: {
    color: BRAND.textDim,
    fontSize: 12.5,
    fontWeight: '700',
    marginRight: 8,
  },
  pollCountMine: {
    color: '#D7AB6A',
  },
  pollPct: {
    color: '#D7AB6A',
    fontSize: 13,
    fontWeight: '800',
    minWidth: 42,
    textAlign: 'right',
  },
  pollMeta: {
    color: BRAND.textDim,
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
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
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  celebrateSection: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.55)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  balloonWrap: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  balloon: {
    width: '100%',
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
  },
  balloonShine: {
    width: '30%',
    height: '22%',
    borderRadius: 99,
    backgroundColor: 'rgba(42,16,36,0.5)',
    alignSelf: 'flex-start',
    marginLeft: '16%',
    marginTop: '12%',
  },
  balloonString: {
    width: 1.5,
    backgroundColor: 'rgba(42,16,36,0.5)',
  },
  sparkle: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  celebrateTitle: {
    color: BRAND.primaryLight,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 14,
  },
  collage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  collageCard: {
    width: 104,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.55)',
    alignItems: 'center',
    padding: 8,
  },
  collagePhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  collageName: {
    color: BRAND.text,
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 6,
  },
  collageLabel: {
    color: BRAND.primaryLight,
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 3,
  },
  collageLabelAnniv: {
    color: '#D7AB6A',
  },
  singleCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  singlePhoto: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  singleName: {
    color: BRAND.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },
  singleRole: {
    color: BRAND.textDim,
    fontSize: 12.5,
    marginTop: 2,
  },
  singleLabel: {
    color: BRAND.primaryLight,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  noCeleb: {
    color: BRAND.textDim,
    fontSize: 13,
    fontStyle: 'italic',
  },
  noticeCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  noticeTitle: {
    color: BRAND.primaryLight,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  noticeItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D7AB6A',
  },
  noticeItemTitle: {
    color: BRAND.text,
    fontSize: 14,
    fontWeight: '700',
  },
  noticeItemBody: {
    color: BRAND.textDim,
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 3,
  },
  noticeItemDate: {
    color: BRAND.primaryLight,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 4,
  },
});