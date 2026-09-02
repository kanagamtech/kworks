import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  ImageSourcePropType,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  ToastAndroid,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MorningBackground from '../components/MorningBackground';
import Text from '../components/AppText';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { API_BASE } from '../utils/config';
import { EMPLOYEES, HR_NOTICES, MANAGEMENT_NOTICES } from '../utils/celebrations';
import type { UserProfile } from '../types';

const useNativeDriver = Platform.OS !== 'web';

const MGMT_KEY = 'kworks_management_notices';
const HR_KEY = 'kworks_hr_notices';
const BIRTHDAYS_KEY = 'kworks_birthdays';
const ANNIVERSARIES_KEY = 'kworks_anniversaries';
const POLLS_KEY = 'kworks_polls';
const DEVICE_KEY = 'kworks_device_id';
const READ_NOTIFS_KEY = 'kworks_read_notif_ids';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#E8C98F',
  primaryDark: '#31122B',
  bgCard: 'rgba(32, 12, 28, 0.88)',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  success: '#4EBA6F',
  danger: '#E05050',
  info: '#4EA8DE',
  goldGlow: 'rgba(215, 171, 106, 0.25)',
};

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

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: 'announcement' | 'attendance_check_in' | 'attendance_punch_out' | 'poll' | 'celebration' | 'general' | 'leave' | 'ticket' | 'chat';
  category?: string;
  team?: string;
  date: string;
  time?: string;
  employeeName?: string;
  read?: boolean;
};

const BALLOON_COLORS = ['#D7AB6A', '#E8C98F', '#CBAF8C', '#D7AB6A', '#31122B', '#E8C98F', '#D7AB6A'];

const SPARKLES = [
  { x: 8, y: 12, c: '#D7AB6A', d: 900 },
  { x: 18, y: 30, c: '#E8C98F', d: 1200 },
  { x: 30, y: 8, c: '#D7AB6A', d: 800 },
  { x: 42, y: 25, c: '#E8C98F', d: 1100 },
  { x: 55, y: 14, c: '#D7AB6A', d: 1000 },
  { x: 66, y: 34, c: '#E8C98F', d: 900 },
  { x: 78, y: 10, c: '#D7AB6A', d: 1300 },
  { x: 90, y: 22, c: '#E8C98F', d: 950 },
  { x: 13, y: 55, c: '#D7AB6A', d: 1150 },
  { x: 35, y: 48, c: '#E8C98F', d: 850 },
  { x: 60, y: 60, c: '#D7AB6A', d: 1050 },
  { x: 85, y: 52, c: '#E8C98F', d: 1250 },
  { x: 25, y: 72, c: '#D7AB6A', d: 1000 },
  { x: 72, y: 78, c: '#E8C98F', d: 900 },
];

type Props = {
  onBack: () => void;
  user?: UserProfile | null;
};

type TabKey = 'all' | 'announcements' | 'alerts' | 'polls' | 'celebrations';

export default function NotificationScreen({ onBack, user }: Props) {
  const screenH = Dimensions.get('window').height;

  // Active Tab Filter
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Data Stores
  const [mgmtNotices, setMgmtNotices] = useState(MANAGEMENT_NOTICES);
  const [hrNotices, setHrNotices] = useState(HR_NOTICES);
  const [systemNotifs, setSystemNotifs] = useState<NotificationItem[]>([]);
  const [uploadedBirthdays, setUploadedBirthdays] = useState<UploadedBirthday[]>([]);
  const [uploadedAnniversaries, setUploadedAnniversaries] = useState<UploadedAnniversary[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [readIds, setReadIds] = useState<string[]>([]);

  // Selected Notification Detail Modal
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  // Wishes Sent State
  const [wishedCelebrants, setWishedCelebrants] = useState<Record<string, boolean>>({});

  // ── Android Back Button & Modal Dismissal ─────────────────────────────────
  useEffect(() => {
    const onBackPress = () => {
      if (selectedNotif) {
        setSelectedNotif(null);
        return true;
      }
      onBack();
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [selectedNotif, onBack]);

  // ── Load Cached & Remote Data ─────────────────────────────────────────────
  const loadData = async () => {
    try {
      // 1. Local Cache
      const [mgmtRaw, hrRaw, bRaw, aRaw, pollsRaw, devRaw, readRaw] = await Promise.all([
        AsyncStorage.getItem(MGMT_KEY),
        AsyncStorage.getItem(HR_KEY),
        AsyncStorage.getItem(BIRTHDAYS_KEY),
        AsyncStorage.getItem(ANNIVERSARIES_KEY),
        AsyncStorage.getItem(POLLS_KEY),
        AsyncStorage.getItem(DEVICE_KEY),
        AsyncStorage.getItem(READ_NOTIFS_KEY),
      ]);

      if (mgmtRaw) setMgmtNotices(JSON.parse(mgmtRaw));
      if (hrRaw) setHrNotices(JSON.parse(hrRaw));
      if (bRaw) setUploadedBirthdays(JSON.parse(bRaw));
      if (aRaw) setUploadedAnniversaries(JSON.parse(aRaw));
      if (pollsRaw) setPolls(JSON.parse(pollsRaw));
      if (readRaw) setReadIds(JSON.parse(readRaw));

      if (devRaw) {
        setDeviceId(devRaw);
      } else {
        const id = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
        setDeviceId(id);
        AsyncStorage.setItem(DEVICE_KEY, id).catch(() => {});
      }
    } catch {}

    // 2. Fetch Live Notices
    try {
      const res = await fetch(`${API_BASE}/api/notices`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const allNotices = data.data;
        const mgmt = allNotices.filter(
          (n: any) => n.category === 'management' || n.team === 'MANAGEMENT' || (!n.category && !n.team)
        );
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

    // 3. Fetch Live System Notifications
    try {
      const res = await fetch(`${API_BASE}/api/notifications`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const formatted: NotificationItem[] = data.data.map((n: any) => ({
          id: n.id || `notif_${Math.random()}`,
          title: n.title || 'System Notification',
          body: n.body || '',
          type: n.type || 'general',
          category: n.category || n.department || 'Activity',
          team: n.company || n.department || 'KwOrKs',
          date: n.date || new Date().toISOString().split('T')[0],
          time: n.time || '',
          employeeName: n.employeeName,
        }));
        setSystemNotifs(formatted);
      }
    } catch {}

    // 4. Fetch Live Polls
    try {
      const res = await fetch(`${API_BASE}/api/polls`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setPolls(data.data);
        AsyncStorage.setItem(POLLS_KEY, JSON.stringify(data.data)).catch(() => {});
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Mark as Read ──────────────────────────────────────────────────────────
  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      AsyncStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(updated)).catch(() => {});
    }
  };

  const markAllAsRead = () => {
    const allIds = [
      ...mgmtNotices.map((n) => `mgmt_${n.id}`),
      ...hrNotices.map((n) => `hr_${n.id}`),
      ...systemNotifs.map((n) => n.id),
      ...polls.map((p) => `poll_${p.id}`),
    ];
    const unique = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(unique);
    AsyncStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(unique)).catch(() => {});
    if (Platform.OS === 'android') {
      ToastAndroid.show('All notifications marked as read', ToastAndroid.SHORT);
    }
  };

  // ── Send Wishes Reaction ──────────────────────────────────────────────────
  const handleSendWish = (celebrantId: string, name: string) => {
    setWishedCelebrants((prev) => ({ ...prev, [celebrantId]: true }));
    if (Platform.OS === 'android') {
      ToastAndroid.show(`🎉 Sent celebration wishes to ${name}!`, ToastAndroid.SHORT);
    } else {
      Share.share({
        message: `🎉 Happy Celebration to ${name} from KwOrKs! Wishing you immense success & joy! 🥳✨`,
      }).catch(() => {});
    }
  };

  // ── Balloon & Sparkle Animations ──────────────────────────────────────────
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

  // ── Polls Sync & Voting ───────────────────────────────────────────────────
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

  // ── Celebrations Data Calculation ─────────────────────────────────────────
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
        id: `b_${e.id}`,
        type: 'birthday',
        label: `Birthday · ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        emp: e,
      })
    );
    annivs.forEach((e) =>
      items.push({
        id: `a_${e.id}`,
        type: 'anniversary',
        label: `Work Anniversary · Joined ${now.toLocaleDateString('en-US', { month: 'short' })} ${e.joinDay}, ${e.joinYear}`,
        emp: e,
      })
    );
    uploadedCelebrants.forEach((e) =>
      items.push({
        id: `u_${e.id}`,
        type: e.birthMonth === month ? 'birthday' : 'anniversary',
        label:
          e.birthMonth === month
            ? `Birthday · ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : `Work Anniversary · Joined ${now.toLocaleDateString('en-US', { month: 'short' })} ${e.joinDay}, ${e.joinYear}`,
        emp: e,
      })
    );
    return items;
  }, [month, birthdays.length, annivs.length, uploadedCelebrants]);

  const photoSource = (photo: number | string): ImageSourcePropType | undefined =>
    typeof photo === 'string' ? (photo ? { uri: photo } : undefined) : photo;

  // ── Combined Notice Feed ──────────────────────────────────────────────────
  const combinedNotices: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Management Notices
    mgmtNotices.forEach((n) => {
      list.push({
        id: `mgmt_${n.id}`,
        title: n.title,
        body: n.body,
        type: 'announcement',
        category: 'MANAGEMENT',
        team: n.team || 'ALL',
        date: n.date,
        read: readIds.includes(`mgmt_${n.id}`),
      });
    });

    // 2. HR Notices
    hrNotices.forEach((n) => {
      list.push({
        id: `hr_${n.id}`,
        title: n.title,
        body: n.body,
        type: 'announcement',
        category: 'HR NOTICES',
        team: n.team || 'ALL',
        date: n.date,
        read: readIds.includes(`hr_${n.id}`),
      });
    });

    // 3. System Activity Notifications
    systemNotifs.forEach((s) => {
      list.push({
        ...s,
        read: readIds.includes(s.id),
      });
    });

    return list;
  }, [mgmtNotices, hrNotices, systemNotifs, readIds]);

  // Tab Item Counts
  const counts = {
    all: combinedNotices.length + polls.length + celebrationItems.length,
    announcements: combinedNotices.filter((n) => n.type === 'announcement').length,
    alerts: combinedNotices.filter((n) => n.type !== 'announcement').length,
    polls: polls.length,
    celebrations: celebrationItems.length,
  };

  const unreadCount = combinedNotices.filter((n) => !n.read).length;

  const sectionHeight = Math.min(screenH * 0.46, 420);

  return (
    <View style={styles.root}>
      <MorningBackground />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backText}>{'<'} Back</Text>
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Notification Center</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
              </View>
            )}
          </View>
          <Pressable onPress={markAllAsRead} style={styles.markReadBtn} hitSlop={10}>
            <Text style={styles.markReadText}>Read All</Text>
          </Pressable>
        </View>

        {/* Category Tabs */}
        <View style={styles.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {[
              { id: 'all' as TabKey, label: '🔔 All', count: counts.all },
              { id: 'announcements' as TabKey, label: '📢 Notices', count: counts.announcements },
              { id: 'alerts' as TabKey, label: '⚡ Alerts', count: counts.alerts },
              { id: 'polls' as TabKey, label: '📊 Polls', count: counts.polls },
              { id: 'celebrations' as TabKey, label: '🎂 Celebrations', count: counts.celebrations },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                    {tab.label}
                  </Text>
                  {tab.count > 0 && (
                    <View style={[styles.tabCountPill, active && styles.tabCountPillActive]}>
                      <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{tab.count}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Notification Content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BRAND.primary} />}
        >
          {/* ── TAB 1: CELEBRATIONS SECTION ── */}
          {(activeTab === 'all' || activeTab === 'celebrations') && celebrationItems.length > 0 && (
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
                            outputRange: [sectionHeight + 30, -50],
                          }),
                        },
                        {
                          translateX: b.anim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0, 10, 0],
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
                          scale: s.anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.4] }),
                        },
                      ],
                    },
                  ]}
                />
              ))}

              <View style={styles.celebrateHeadRow}>
                <Text style={styles.celebrateTitle}>🎉 Celebrations · {monthLabel}</Text>
                <View style={styles.celebrateBadge}>
                  <Text style={styles.celebrateBadgeText}>{celebrationItems.length} this month</Text>
                </View>
              </View>

              <View style={styles.collage}>
                {celebrationItems.map((item) => {
                  const wished = wishedCelebrants[item.id];
                  return (
                    <View key={item.id} style={styles.collageCard}>
                      <Image source={photoSource(item.emp.photo)} style={styles.collagePhoto} />
                      <Text style={styles.collageName} numberOfLines={1}>
                        {item.emp.name}
                      </Text>
                      <Text
                        style={[styles.collageLabel, item.type === 'anniversary' && styles.collageLabelAnniv]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                      <Pressable
                        style={[styles.wishBtn, wished && styles.wishBtnDone]}
                        onPress={() => handleSendWish(item.id, item.emp.name)}
                      >
                        <Text style={[styles.wishBtnText, wished && styles.wishBtnTextDone]}>
                          {wished ? '✓ Wishes Sent' : '✨ Send Wishes'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── TAB 2: LIVE POLLS ── */}
          {(activeTab === 'all' || activeTab === 'polls') && polls.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionTitle}>📊 Company Polls</Text>
                <Text style={styles.sectionSub}>{polls.length} Active</Text>
              </View>
              {polls.map((p) => {
                const total = Object.keys(p.votes).length;
                return (
                  <View key={p.id} style={styles.pollCard}>
                    <View style={styles.pollHead}>
                      <Text style={styles.pollTitleText}>{p.title}</Text>
                    </View>
                    <Text style={styles.pollQuestion}>Tap an option below to submit your vote:</Text>
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
                          <View style={[styles.pollProgressFill, { width: `${pct}%` }]} />
                          <View style={[styles.pollRadio, mine && styles.pollRadioOn]}>
                            {mine ? <View style={styles.pollRadioDot} /> : null}
                          </View>
                          <Text style={[styles.pollOptionText, mine && styles.pollOptionTextMine]}>{opt}</Text>
                          <Text style={[styles.pollCount, mine && styles.pollCountMine]}>
                            {mine ? `✓ ${count} (You)` : count}
                          </Text>
                          <Text style={styles.pollPct}>{pct}%</Text>
                        </Pressable>
                      );
                    })}
                    <View style={styles.pollMetaRow}>
                      <Text style={styles.pollMeta}>
                        👥 {total} vote{total === 1 ? '' : 's'} recorded
                      </Text>
                      <Text style={styles.pollMeta}>Live sync</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── TAB 3: ANNOUNCEMENTS & ACTIVITY NOTICES ── */}
          {(activeTab === 'all' || activeTab === 'announcements' || activeTab === 'alerts') && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionTitle}>
                  {activeTab === 'announcements'
                    ? '📢 Official Announcements'
                    : activeTab === 'alerts'
                    ? '⚡ Activity & System Alerts'
                    : '📋 Recent Notifications'}
                </Text>
                <Text style={styles.sectionSub}>
                  {
                    combinedNotices.filter((n) => {
                      if (activeTab === 'announcements') return n.type === 'announcement';
                      if (activeTab === 'alerts') return n.type !== 'announcement';
                      return true;
                    }).length
                  }{' '}
                  items
                </Text>
              </View>

              {combinedNotices
                .filter((n) => {
                  if (activeTab === 'announcements') return n.type === 'announcement';
                  if (activeTab === 'alerts') return n.type !== 'announcement';
                  return true;
                })
                .map((n) => {
                  const isRead = n.read;
                  const isCheckIn = n.type === 'attendance_check_in';
                  const isPunchOut = n.type === 'attendance_punch_out';
                  const isNotice = n.type === 'announcement';
                  const isChat = n.type === 'chat';

                  return (
                    <Pressable
                      key={n.id}
                      style={[styles.notifCard, !isRead && styles.notifCardUnread]}
                      onPress={() => {
                        markAsRead(n.id);
                        setSelectedNotif(n);
                      }}
                    >
                      <View style={styles.notifIconWrap}>
                        {isChat ? (
                          <Text style={styles.notifEmoji}>💬</Text>
                        ) : isCheckIn ? (
                          <Text style={styles.notifEmoji}>🟢</Text>
                        ) : isPunchOut ? (
                          <Text style={styles.notifEmoji}>🔴</Text>
                        ) : isNotice ? (
                          <Text style={styles.notifEmoji}>📢</Text>
                        ) : (
                          <Text style={styles.notifEmoji}>🔔</Text>
                        )}
                      </View>

                      <View style={styles.notifContent}>
                        <View style={styles.notifHeaderRow}>
                          <Text style={styles.notifCategory}>{n.category || 'NOTICE'}</Text>
                          <Text style={styles.notifDate}>
                            {n.date} {n.time ? `· ${n.time}` : ''}
                          </Text>
                        </View>

                        <Text style={[styles.notifTitle, !isRead && styles.notifTitleUnread]} numberOfLines={1}>
                          {n.title}
                        </Text>

                        <Text style={styles.notifBody} numberOfLines={2}>
                          {n.body}
                        </Text>

                        <View style={styles.notifFooterRow}>
                          {n.team && (
                            <View style={styles.teamTag}>
                              <Text style={styles.teamTagText}>🏷️ {n.team}</Text>
                            </View>
                          )}
                          <Text style={styles.viewMoreText}>View details {'>'}</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          )}

          {/* Empty State when no items exist in current filter */}
          {activeTab === 'celebrations' && celebrationItems.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🎂</Text>
              <Text style={styles.emptyTitle}>No Celebrations This Month</Text>
              <Text style={styles.emptySub}>Birthdays and work anniversaries will appear here automatically.</Text>
            </View>
          )}

          {activeTab === 'polls' && polls.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>📊</Text>
              <Text style={styles.emptyTitle}>No Active Polls</Text>
              <Text style={styles.emptySub}>Management will post interactive company polls when available.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── NOTIFICATION DETAIL MODAL ── */}
        <Modal
          visible={!!selectedNotif}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedNotif(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalCategoryBadge}>
                  <Text style={styles.modalCategoryText}>{selectedNotif?.category || 'NOTIFICATION'}</Text>
                </View>
                <Pressable onPress={() => setSelectedNotif(null)} hitSlop={8}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalTitle}>{selectedNotif?.title}</Text>

              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaText}>📅 Date: {selectedNotif?.date}</Text>
                {selectedNotif?.time ? <Text style={styles.modalMetaText}>⏰ {selectedNotif?.time}</Text> : null}
                {selectedNotif?.team ? <Text style={styles.modalMetaText}>🏢 Team: {selectedNotif?.team}</Text> : null}
              </View>

              <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalBodyText}>{selectedNotif?.body}</Text>
              </ScrollView>

              <View style={styles.modalActionsRow}>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    setSelectedNotif(null);
                  }}
                >
                  <Text style={styles.modalPrimaryBtnText}>Dismiss</Text>
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
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    minWidth: 60,
  },
  backText: {
    color: BRAND.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  unreadBadge: {
    backgroundColor: BRAND.danger,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  markReadBtn: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  markReadText: {
    color: BRAND.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  tabsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(215, 171, 106, 0.2)',
    paddingBottom: 8,
  },
  tabsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(32, 12, 28, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(215, 171, 106, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: BRAND.primary,
    borderColor: BRAND.primary,
  },
  tabBtnText: {
    color: BRAND.textDim,
    fontSize: 12.5,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#31122B',
    fontWeight: '800',
  },
  tabCountPill: {
    backgroundColor: 'rgba(215, 171, 106, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountPillActive: {
    backgroundColor: '#31122B',
  },
  tabCountText: {
    color: BRAND.primaryLight,
    fontSize: 10.5,
    fontWeight: '800',
  },
  tabCountTextActive: {
    color: BRAND.primary,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 30,
    gap: 16,
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sectionSub: {
    color: BRAND.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: BRAND.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(215, 171, 106, 0.25)',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  notifCardUnread: {
    borderColor: BRAND.primary,
    backgroundColor: 'rgba(46, 16, 40, 0.95)',
    borderLeftWidth: 4,
    borderLeftColor: BRAND.primary,
  },
  notifIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifEmoji: {
    fontSize: 18,
  },
  notifContent: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifCategory: {
    color: BRAND.primaryLight,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  notifDate: {
    color: BRAND.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  notifTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  notifTitleUnread: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notifBody: {
    color: BRAND.textDim,
    fontSize: 12.5,
    lineHeight: 17,
  },
  notifFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  teamTag: {
    backgroundColor: 'rgba(215, 171, 106, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  teamTagText: {
    color: BRAND.primaryLight,
    fontSize: 10.5,
    fontWeight: '700',
  },
  viewMoreText: {
    color: BRAND.primary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  celebrateSection: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    backgroundColor: 'rgba(32, 12, 28, 0.92)',
    padding: 16,
    overflow: 'hidden',
  },
  celebrateHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  celebrateTitle: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  celebrateBadge: {
    backgroundColor: BRAND.goldGlow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  celebrateBadgeText: {
    color: BRAND.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  collage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  collageCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(215, 171, 106, 0.3)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  collagePhoto: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: BRAND.primary,
    marginBottom: 8,
    backgroundColor: 'rgba(215, 171, 106, 0.2)',
  },
  collageName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  collageLabel: {
    color: BRAND.primaryLight,
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  collageLabelAnniv: {
    color: BRAND.success,
  },
  wishBtn: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  wishBtnDone: {
    backgroundColor: 'rgba(78, 186, 111, 0.2)',
    borderWidth: 1,
    borderColor: BRAND.success,
  },
  wishBtnText: {
    color: '#31122B',
    fontSize: 11,
    fontWeight: '800',
  },
  wishBtnTextDone: {
    color: BRAND.success,
  },
  balloonWrap: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  balloon: {
    width: '100%',
    height: '75%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  balloonShine: {
    position: 'absolute',
    top: 3,
    left: 4,
    width: 6,
    height: 8,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  balloonString: {
    width: 1,
    backgroundColor: 'rgba(215, 171, 106, 0.5)',
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 1,
  },
  pollCard: {
    backgroundColor: BRAND.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.primary,
    padding: 14,
  },
  pollHead: {
    marginBottom: 4,
  },
  pollTitleText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(215, 171, 106, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  pollOptionMine: {
    borderColor: BRAND.primary,
    borderWidth: 1.5,
  },
  pollProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(215, 171, 106, 0.18)',
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
    borderColor: BRAND.primary,
  },
  pollRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND.primary,
  },
  pollOptionText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  pollOptionTextMine: {
    fontWeight: '800',
  },
  pollCount: {
    color: BRAND.textDim,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },
  pollCountMine: {
    color: BRAND.primary,
    fontWeight: '800',
  },
  pollPct: {
    color: BRAND.primaryLight,
    fontSize: 13,
    fontWeight: '800',
  },
  pollMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  pollMeta: {
    color: BRAND.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: BRAND.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(215, 171, 106, 0.2)',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    color: BRAND.textDim,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#200C1C',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    padding: 18,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalCategoryBadge: {
    backgroundColor: BRAND.goldGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalCategoryText: {
    color: BRAND.primary,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalCloseIcon: {
    color: BRAND.textDim,
    fontSize: 18,
    fontWeight: '800',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 8,
  },
  modalMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(215, 171, 106, 0.2)',
  },
  modalMetaText: {
    color: BRAND.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  modalBodyScroll: {
    maxHeight: 220,
    marginBottom: 16,
  },
  modalBodyText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalPrimaryBtn: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalPrimaryBtnText: {
    color: '#31122B',
    fontSize: 14,
    fontWeight: '800',
  },
});