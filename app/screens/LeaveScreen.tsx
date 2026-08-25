import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Text from '../components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MorningBackground from '../components/MorningBackground';
import { useResponsive } from '../hooks/useResponsive';
import { useHolidays } from '../hooks/useHolidays';
import { API_BASE } from '../utils/config';
import type { UserProfile } from '../types';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#D7AB6A',
  primaryDark: '#31122B',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  success: '#D7AB6A',
  red: '#E05050',
  redSoft: '#E07A70',
};

const LEAVE_KEY = 'kworks_leave_dates';
const MAX_FWD_MONTHS = 12;
const useNativeDriver = Platform.OS !== 'web';

type LeaveStatus = 'pending' | 'approved' | 'cancelled';

type LeaveRec = {
  reason: string;
  approved: boolean;
  status?: LeaveStatus;
  user?: string;
  time?: string;
  decidedBy?: string;
  decidedAt?: string;
  type?: string;
};

type LeaveMap = Record<string, LeaveRec>;

const LEAVE_TYPES = [
  'Casual Leave (CL)',
  'Sick Leave (SL)',
  'Maternity Leave',
  'Paternity Leave',
  'Adoption Leave',
  'Bereavement Leave',
  'Compensatory Off (Comp-Off)',
  'Loss of Pay (LOP) / Leave Without Pay (LWP)',
  'Sabbatical Leave',
  'Marriage Leave',
  'Public / Festival Holidays',
];

const statusOf = (rec?: LeaveRec): LeaveStatus => {
  if (!rec) return 'pending';
  if (rec.status === 'approved' || rec.status === 'cancelled') return rec.status;
  return rec.approved ? 'approved' : 'pending';
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const FESTIVALS: Record<string, { name: string; emoji: string }> = {
  '2026-01-01': { name: "New Year", emoji: '🎉' },
  '2026-01-14': { name: 'Pongal', emoji: '🪔' },
  '2026-01-15': { name: 'Mattu Pongal', emoji: '🐄' },
  '2026-01-17': { name: 'Kaanum Pongal', emoji: '🪁' },
  '2026-01-26': { name: 'Republic Day', emoji: '🇮🇳' },
  '2026-02-14': { name: "Valentine's Day", emoji: '💝' },
  '2026-02-15': { name: 'Maha Shivaratri', emoji: '🔱' },
  '2026-03-04': { name: 'Holi', emoji: '🎨' },
  '2026-03-08': { name: "Women's Day", emoji: '🌷' },
  '2026-03-20': { name: 'Eid al-Fitr', emoji: '🌙' },
  '2026-04-01': { name: "April Fools' Day", emoji: '😜' },
  '2026-04-03': { name: 'Good Friday', emoji: '✝️' },
  '2026-04-05': { name: 'Easter', emoji: '🐣' },
  '2026-04-14': { name: 'Tamil New Year', emoji: '🎊' },
  '2026-05-01': { name: 'May Day', emoji: '🛠️' },
  '2026-05-10': { name: "Mother's Day", emoji: '👩' },
  '2026-05-27': { name: 'Eid al-Adha', emoji: '🐑' },
  '2026-06-21': { name: "Father's Day", emoji: '👨' },
  '2026-08-02': { name: 'Friendship Day', emoji: '🤝' },
  '2026-08-15': { name: 'Independence Day', emoji: '🇮🇳' },
  '2026-08-25': { name: 'Onam', emoji: '🎋' },
  '2026-08-28': { name: 'Raksha Bandhan', emoji: '🪢' },
  '2026-09-04': { name: 'Janmashtami', emoji: '🦚' },
  '2026-09-05': { name: "Teachers' Day", emoji: '📚' },
  '2026-09-11': { name: 'Ganesh Chaturthi', emoji: '🐘' },
  '2026-10-02': { name: 'Gandhi Jayanti', emoji: '🕊️' },
  '2026-10-11': { name: 'Navaratri', emoji: '🎭' },
  '2026-10-20': { name: 'Dussehra', emoji: '🏹' },
  '2026-10-31': { name: 'Halloween', emoji: '🎃' },
  '2026-11-08': { name: 'Diwali', emoji: '🪔' },
  '2026-11-14': { name: "Children's Day", emoji: '🧒' },
  '2026-12-04': { name: 'Karthigai Deepam', emoji: '🏮' },
  '2026-12-25': { name: 'Christmas', emoji: '🎄' },
  '2026-12-31': { name: "New Year's Eve", emoji: '🎆' },
  '2027-01-01': { name: "New Year", emoji: '🎉' },
  '2027-01-14': { name: 'Pongal', emoji: '🪔' },
  '2027-01-15': { name: 'Mattu Pongal', emoji: '🐄' },
  '2027-01-26': { name: 'Republic Day', emoji: '🇮🇳' },
  '2027-02-14': { name: "Valentine's Day", emoji: '💝' },
  '2027-03-06': { name: 'Maha Shivaratri', emoji: '🔱' },
  '2027-03-08': { name: "Women's Day", emoji: '🌷' },
  '2027-03-11': { name: 'Eid al-Fitr', emoji: '🌙' },
  '2027-03-22': { name: 'Holi', emoji: '🎨' },
  '2027-04-01': { name: "April Fools' Day", emoji: '😜' },
  '2027-04-14': { name: 'Tamil New Year', emoji: '🎊' },
  '2027-05-01': { name: 'May Day', emoji: '🛠️' },
  '2027-05-09': { name: "Mother's Day", emoji: '👩' },
  '2027-05-17': { name: 'Eid al-Adha', emoji: '🐑' },
  '2027-06-20': { name: "Father's Day", emoji: '👨' },
  '2027-08-01': { name: 'Friendship Day', emoji: '🤝' },
  '2027-08-15': { name: 'Independence Day', emoji: '🇮🇳' },
  '2027-08-17': { name: 'Raksha Bandhan', emoji: '🪢' },
  '2027-08-26': { name: 'Janmashtami', emoji: '🦚' },
  '2027-09-05': { name: "Teachers' Day", emoji: '📚' },
  '2027-09-13': { name: 'Onam', emoji: '🎋' },
  '2027-10-02': { name: 'Gandhi Jayanti', emoji: '🕊️' },
  '2027-10-09': { name: 'Dussehra', emoji: '🏹' },
  '2027-10-29': { name: 'Diwali', emoji: '🪔' },
  '2027-10-31': { name: 'Halloween', emoji: '🎃' },
  '2027-11-14': { name: "Children's Day", emoji: '🧒' },
  '2027-11-24': { name: 'Karthigai Deepam', emoji: '🏮' },
  '2027-12-25': { name: 'Christmas', emoji: '🎄' },
  '2027-12-31': { name: "New Year's Eve", emoji: '🎆' },
};

const keyOf = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const MOTIVATIONS: string[][] = [
  [
    'Every morning brings a new chance to improve yourself.',
    'Small steps taken daily create big results over time.',
    'Trust the process even when progress feels slow.',
    'Your focus today builds your future tomorrow.',
    'Stay consistent and the effort will speak for itself.',
    'Believe in yourself — you are stronger than any challenge.',
  ],
  [
    'Success is not an accident; it is built with daily discipline.',
    'Show up even when you do not feel motivated.',
    'Hard work today becomes the foundation of tomorrow.',
    'Keep learning and never stop growing.',
    'Every expert was once a beginner who refused to quit.',
    'Your journey matters more than the destination.',
  ],
  [
    'Difficult roads often lead to beautiful destinations.',
    'Every obstacle is a lesson in disguise.',
    'Face challenges with courage and a calm mind.',
    'What you do today shapes who you become.',
    'Give your best effort and leave the rest to time.',
    'Great things are built one day at a time.',
  ],
  [
    'You are capable of far more than you imagine.',
    'Doubt is just a signal to prepare more.',
    'Take one step forward, no matter how small.',
    'Progress is better than perfection every single day.',
    'Surround yourself with people who lift you higher.',
    'Keep moving — momentum always beats motivation.',
  ],
  [
    'A winner is simply a loser who never gave up.',
    'Failures are stepping stones, not stop signs.',
    'Learn from every setback and rise again stronger.',
    'Your attitude determines how far you will go.',
    'Focus on what you can control and let go of the rest.',
    'Today is the perfect day to begin again.',
  ],
  [
    'Discipline is choosing what you want most over what you want now.',
    'Wake up with purpose and end the day with gratitude.',
    'Consistency turns ordinary effort into extraordinary results.',
    'Protect your focus like your most valuable asset.',
    'Great work comes from small, repeated actions.',
    'Make today count — tomorrow will thank you.',
  ],
  [
    'The sun rises for everyone; the choice to shine is yours.',
    'Compare yourself only to who you were yesterday.',
    'Every moment of effort moves you closer to your goals.',
    'Patience and persistence are the keys to success.',
    'Your mind is powerful — fill it with positive thoughts.',
    'You have everything you need within you right now.',
  ],
  [
    'Energy flows where attention goes.',
    'Plant the seeds of success with daily action.',
    'Water them with patience and consistency.',
    'Soon you will harvest results beyond your expectations.',
    'Stay grateful for the journey and every lesson.',
    'Your best chapter is still ahead of you.',
  ],
  [
    'Do not wait for the perfect moment; take the moment and make it perfect.',
    'Courage grows every time you face your fears.',
    'Each small win builds the confidence for bigger ones.',
    'Your habits today are the blueprint of your future.',
    'Keep your dreams alive and work toward them daily.',
    'You are exactly where you need to be.',
  ],
  [
    'Stars cannot shine without darkness.',
    'Your struggles are polishing your strength.',
    'Keep your head high and your heart focused.',
    'Every day is a second chance to make things right.',
    'Hard times reveal the power within you.',
    'Rise up and show the world what you are made of.',
  ],
  [
    'The best time to plant a tree was twenty years ago; the second best time is now.',
    'Stop delaying — action creates clarity.',
    'Let your work speak louder than your worries.',
    'Celebrate progress, however small it seems.',
    'Kindness and honesty multiply your success.',
    'Start today and let excellence follow.',
  ],
  [
    'Your potential is like an ocean; never settle for a puddle.',
    'Push beyond your comfort zone a little each day.',
    'What feels hard now will feel easy later.',
    'Keep your vision clear and your feet moving.',
    'Surround every goal with persistence and patience.',
    'You were made to do remarkable things.',
  ],
];

type Props = {
  onBack: () => void;
  user: UserProfile | null;
};

export default function LeaveScreen({ onBack, user }: Props) {
  const { width } = useResponsive();
  const today = useMemo(() => {
    const t = new Date();
    return keyOf(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);
  const googleHolidays = useHolidays();
  const festivals = useMemo(() => ({ ...FESTIVALS, ...googleHolidays }), [googleHolidays]);
  const [view, setView] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [leaves, setLeaves] = useState<LeaveMap>({});
  const [dialogKey, setDialogKey] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [pickType, setPickType] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [leaveType, setLeaveType] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastY = useRef(new Animated.Value(-90)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxFwd = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + MAX_FWD_MONTHS, 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLocal = async () => {
      try {
        const raw = await AsyncStorage.getItem(LEAVE_KEY);
        if (!cancelled && raw) {
          const parsedMap = JSON.parse(raw) as LeaveMap;
          setLeaves(parsedMap);
        }
      } catch {}
    };

    const loadServer = async () => {
      if (!user?.email) return;
      try {
        const res = await fetch(`${API_BASE}/api/leaves`);
        const data = await res.json();
        if (data.success && data.data && typeof data.data === 'object') {
          const serverMap = data.data;
          const userLeaves: LeaveMap = {};
          
          Object.entries(serverMap).forEach(([key, val]: [string, any]) => {
            const parts = key.split('_');
            const date = parts[0];
            const email = parts[1] || val.email;
            
            if (email?.toLowerCase() === user.email?.toLowerCase()) {
              userLeaves[date] = {
                reason: val.reason,
                type: val.type,
                approved: val.approved,
                status: val.status || (val.approved ? 'approved' : 'pending'),
                user: val.user,
                time: val.time,
              };
            }
          });

          if (!cancelled) {
            setLeaves(userLeaves);
            await AsyncStorage.setItem(LEAVE_KEY, JSON.stringify(userLeaves));
          }
        }
      } catch {}
    };

    loadLocal().then(() => loadServer());

    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = (next: LeaveMap) => {
    setLeaves(next);
    AsyncStorage.setItem(LEAVE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    toastY.setValue(-90);
    Animated.timing(toastY, { toValue: 0, duration: 300, useNativeDriver }).start();
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastY, { toValue: -90, duration: 300, useNativeDriver }).start(() => setToastVisible(false));
    }, 2500);
  };

  const submitRequest = async () => {
    if (!dialogKey || !user?.email) return;
    
    const newRecord = {
      reason: reason.trim(),
      type: leaveType ?? undefined,
      approved: false,
      status: 'pending' as LeaveStatus,
      user: user?.name ?? 'Guest',
      email: user.email,
      time: new Date().toLocaleString(),
    };

    // Update locally first for responsive feel
    persist({
      ...leaves,
      [dialogKey]: newRecord,
    });

    setDialogKey(null);
    setReason('');
    setLeaveType(null);
    showToast('Your leave request sent successfully');

    try {
      const res = await fetch(`${API_BASE}/api/leaves`);
      const data = await res.json();
      const currentMap = (data.success && data.data) ? data.data : {};
      currentMap[`${dialogKey}_${user.email}`] = newRecord;

      await fetch(`${API_BASE}/api/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentMap),
      });
    } catch {}
  };

  const removeLeave = async () => {
    if (!dialogKey || !user?.email) return;

    // Update locally first for responsive feel
    const next = { ...leaves };
    delete next[dialogKey];
    persist(next);

    setDialogKey(null);
    setReason('');
    showToast('Leave request cancelled');

    try {
      const res = await fetch(`${API_BASE}/api/leaves`);
      const data = await res.json();
      if (data.success && data.data) {
        const currentMap = data.data;
        delete currentMap[`${dialogKey}_${user.email}`];

        await fetch(`${API_BASE}/api/leaves`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentMap),
        });
      }
    } catch {}
  };

  const goPrev = () => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  const goNext = () => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1));

  const atMaxFwd = view.getFullYear() > maxFwd.getFullYear() || (view.getFullYear() === maxFwd.getFullYear() && view.getMonth() >= maxFwd.getMonth());

  const monthLabel = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const cells: (Date | null)[] = useMemo(() => {
    const y = view.getFullYear();
    const m = view.getMonth();
    const firstWeekday = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const list: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(y, m, d));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [view]);

  const monthStats = useMemo(() => {
    const y = view.getFullYear();
    const m = view.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let sundays = 0;
    let absent = 0;
    const absentDates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(y, m, d);
      if (day.getDay() === 0) sundays++;
      if (leaves[keyOf(y, m, d)]) {
        absent++;
        absentDates.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
    }
    return { present: daysInMonth - sundays - absent, absent, absentDates };
  }, [view, leaves]);

  const todayLabel = useMemo(() => {
  const t = new Date();
  return t.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}, []);

const motivation = useMemo(() => {
  const t = new Date();
  const dayOfYear = Math.floor((t.getTime() - new Date(t.getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONS[dayOfYear % MOTIVATIONS.length].join(' ');
}, []);

const monthFestivals = useMemo(() => {
  const y = view.getFullYear();
  const m = view.getMonth();
  const prefix = `${y}-${String(m + 1).padStart(2, '0')}-`;
  return Object.entries(festivals)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, festival]) => ({
      key,
      name: festival.name,
      emoji: festival.emoji,
      date: new Date(y, m, Number(key.slice(8))),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}, [view]);

const cellSize = (Math.min(width, 420) - 32) / 7;
  const cellHeight = Math.round(cellSize * 1.32);

  return (
    <View style={styles.root}>
      <MorningBackground />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'} Back</Text>
          </Pressable>
          <Text style={styles.title}>Leave Management</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.calCard}>
            <View style={styles.navRow}>
              <Pressable style={styles.navBtn} onPress={goPrev}>
                <Text style={styles.navText}>{'<'}</Text>
              </Pressable>
              <Text style={styles.monthLabel}>{monthLabel}</Text>
              <Pressable style={[styles.navBtn, atMaxFwd && styles.navBtnDisabled]} onPress={goNext} disabled={atMaxFwd}>
                <Text style={styles.navText}>{'>'}</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={[styles.weekDay, w === 'Su' && styles.weekDaySun]}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((date, i) => {
                if (!date) {
                  return <View key={`e${i}`} style={[styles.cell, styles.cellW, { height: cellHeight }]} />;
                }
                const y = date.getFullYear();
                const m = date.getMonth();
                const d = date.getDate();
                const key = keyOf(y, m, d);
                const isSunday = date.getDay() === 0;
                const isToday = key === today;
                const rec = leaves[key];
                const isLeave = !!rec;
                const leaveStatus = statusOf(rec);
                const festival = festivals[key];
                return (
                  <Pressable
                    key={key}
                    style={[
                      styles.cell,
                      styles.cellW,
                      { height: cellHeight },
                      isLeave && styles.cellLeave,
                      leaveStatus === 'approved' && styles.cellApproved,
                      leaveStatus === 'cancelled' && styles.cellCancelled,
                      !isLeave && isToday && styles.cellToday,
                      !isLeave && !isToday && isSunday && styles.cellSunday,
                      !isLeave && !isToday && !isSunday && festival && styles.cellFestival,
                    ]}
                    onPress={() => {
                      if (isSunday) return;
                      if (rec) {
                        setReason(rec?.reason ?? '');
                        setDialogKey(key);
                        return;
                      }
                      setPendingKey(key);
                      setLeaveType(null);
                      setPickType(true);
                    }}
                  >
                    {festival ? (
                      <>
                        <Text style={styles.cellEmoji}>{festival.emoji}</Text>
                        <Text style={styles.cellDaySmall}>{d}</Text>
                      </>
                    ) : (
                      <Text style={styles.cellDay}>{d}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendToday]} />
                <Text style={styles.legendText}>Today</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendBlue]} />
                <Text style={styles.legendText}>Requested</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendRed]} />
                <Text style={styles.legendText}>Approved</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendGrey]} />
                <Text style={styles.legendText}>Cancelled</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendEmoji}>🎉</Text>
                <Text style={styles.legendText}>Festival</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={[styles.statDot, styles.statDotPresent]} />
              <Text style={styles.statLabel}>Number of days present in this month</Text>
              <Text style={[styles.statCount, styles.statCountPresent]}>{monthStats.present}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <View style={[styles.statDot, styles.statDotAbsent]} />
              <Text style={styles.statLabel}>Number of absent in this month</Text>
              <Text style={[styles.statCount, styles.statCountAbsent]}>{monthStats.absent}</Text>
            </View>
            {monthStats.absent > 0 && (
              <Text style={styles.absentDates}>Absent dates: {monthStats.absentDates.join(', ')}</Text>
            )}
          </View>

          <View style={styles.festCard}>
            <Text style={styles.cardTitle}>Festivals &amp; Holidays in {monthLabel}</Text>
            {monthFestivals.length > 0 ? (
              monthFestivals.map((f) => (
                <View key={f.key} style={styles.festRow}>
                  <Text style={styles.festEmoji}>{f.emoji}</Text>
                  <Text style={styles.festName}>{f.name}</Text>
                  <Text style={styles.festDate}>
                    {f.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.festEmpty}>No festivals this month</Text>
            )}
          </View>

          <View style={styles.motivCard}>
            <Text style={styles.cardTitle}>Daily Motivation</Text>
            <Text style={styles.motivDate}>{todayLabel}</Text>
            <Text style={styles.motivText}>{motivation}</Text>
          </View>

          <Text style={styles.hint}>Tap a date to request leave with a reason. Sundays are always red.</Text>
        </ScrollView>

        {toastVisible && (
          <Animated.View style={[styles.toast, { transform: [{ translateY: toastY }] }]} pointerEvents="none">
            <Text style={styles.toastText}>{toastMsg}</Text>
          </Animated.View>
        )}

        <Modal transparent visible={pickType} animationType="fade" onRequestClose={() => setPickType(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.dialogBox}>
              <Text style={styles.dialogTitle}>For which type of leave?</Text>
              {pendingKey && (
                <Text style={styles.dialogDate}>
                  {new Date(`${pendingKey}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              )}
              <ScrollView style={styles.typeList}>
                {LEAVE_TYPES.map((t) => (
                  <Pressable key={t} style={styles.typeRow} onPress={() => setLeaveType(t)}>
                    <View style={[styles.radioOuter, leaveType === t && styles.radioOuterOn]}>
                      {leaveType === t && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.typeLabel, leaveType === t && styles.typeLabelOn]}>{t}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.dialogActions}>
                <Pressable style={[styles.dialogBtn, styles.dialogBtnCancel]} onPress={() => setPickType(false)}>
                  <Text style={styles.dialogBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.dialogBtn, styles.dialogBtnSend, !leaveType && styles.dialogBtnDisabled]}
                  disabled={!leaveType}
                  onPress={() => {
                    setPickType(false);
                    setReason('');
                    setDialogKey(pendingKey);
                  }}
                >
                  <Text style={styles.dialogBtnText}>Next</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={!!dialogKey} animationType="fade" onRequestClose={() => setDialogKey(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.dialogBox}>
              {(() => {
                const rec = dialogKey ? leaves[dialogKey] : undefined;
                const leaveStatus = statusOf(rec);
                const dialogTitle =
                  leaveStatus === 'approved' ? 'Leave Approved' : leaveStatus === 'cancelled' ? 'Leave Cancelled' : rec ? 'Leave Request' : 'Reason for Leave';
                return (
                  <>
                    <Text style={styles.dialogTitle}>{dialogTitle}</Text>
                    {dialogKey && (
                      <Text style={styles.dialogDate}>
                        {new Date(`${dialogKey}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </Text>
                    )}
                    {rec ? (
                      <>
                        {rec.type ? <Text style={styles.dialogStatus}>Type: {rec.type}</Text> : null}
                        <View style={styles.dialogReasonBox}>
                          <Text style={styles.dialogReasonText}>{rec.reason || 'No reason given'}</Text>
                        </View>
                        <Text style={styles.dialogStatus}>
                          {leaveStatus === 'approved'
                            ? 'Approved by management'
                            : leaveStatus === 'cancelled'
                              ? 'Cancelled by management'
                              : 'Pending approval from management'}
                        </Text>
                        {rec.time ? <Text style={styles.dialogStatus}>Raised: {rec.time}</Text> : null}
                        {rec.decidedBy ? (
                          <Text style={styles.dialogStatus}>
                            {leaveStatus === 'approved' ? 'Approved by ' : 'Cancelled by '}
                            {rec.decidedBy}
                            {rec.decidedAt ? ` · ${rec.decidedAt}` : ''}
                          </Text>
                        ) : null}
                      </>
                    ) : (
                      <>
                        {leaveType ? <Text style={styles.dialogStatus}>Type: {leaveType}</Text> : null}
                        <TextInput
                          style={styles.dialogInput}
                          placeholder="Write the reason for leave..."
                          placeholderTextColor={BRAND.textDim}
                          value={reason}
                          onChangeText={setReason}
                          multiline
                        />
                      </>
                    )}
                    <View style={styles.dialogActions}>
                      <Pressable style={[styles.dialogBtn, styles.dialogBtnCancel]} onPress={() => setDialogKey(null)}>
                        <Text style={styles.dialogBtnText}>{rec ? 'Close' : 'Cancel'}</Text>
                      </Pressable>
                      {!rec ? (
                        <Pressable
                          style={[styles.dialogBtn, styles.dialogBtnSend, !reason.trim() && styles.dialogBtnDisabled]}
                          disabled={!reason.trim()}
                          onPress={submitRequest}
                        >
                          <Text style={styles.dialogBtnText}>Send Request</Text>
                        </Pressable>
                      ) : !rec.approved ? (
                        <Pressable style={[styles.dialogBtn, styles.dialogBtnDanger]} onPress={removeLeave}>
                          <Text style={styles.dialogBtnText}>Cancel Request</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </>
                );
              })()}
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
  calCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.55)',
    padding: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(42,16,36,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navText: {
    color: BRAND.primaryLight,
    fontSize: 20,
    fontWeight: '800',
  },
  monthLabel: {
    color: BRAND.text,
    fontSize: 17,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: BRAND.textDim,
    fontSize: 12,
    fontWeight: '700',
  },
  weekDaySun: {
    color: BRAND.redSoft,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellW: {
    width: '14.285714%',
  },
  cell: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellLeave: {
    backgroundColor: 'rgba(65,105,225,0.8)',
    borderColor: '#4169E1',
  },
  cellApproved: {
    backgroundColor: 'rgba(224,80,80,0.8)',
    borderColor: BRAND.red,
  },
  cellCancelled: {
    backgroundColor: 'rgba(120,120,130,0.8)',
    borderColor: '#787880',
  },
  cellToday: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderColor: BRAND.success,
  },
  cellSunday: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderColor: '#D7AB6A',
  },
  cellFestival: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderColor: '#D7AB6A',
  },
  cellDay: {
    color: BRAND.text,
    fontSize: 15,
    fontWeight: '700',
  },
  cellDaySmall: {
    color: BRAND.textDim,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  cellEmoji: {
    fontSize: 24,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendToday: {
    backgroundColor: BRAND.success,
  },
  legendBlue: {
    backgroundColor: '#4169E1',
  },
legendRed: {
    backgroundColor: '#E05050',
  },
  legendGrey: {
    backgroundColor: '#787880',
  },
  legendEmoji: {
    fontSize: 12,
  },
  legendText: {
    color: BRAND.textDim,
    fontSize: 11.5,
    fontWeight: '600',
  },
  statsCard: {
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
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statDotPresent: {
    backgroundColor: BRAND.success,
  },
  statDotAbsent: {
    backgroundColor: BRAND.red,
  },
  statLabel: {
    flex: 1,
    color: BRAND.text,
    fontSize: 13.5,
    fontWeight: '600',
  },
  statCount: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  statCountPresent: {
    color: BRAND.success,
  },
  statCountAbsent: {
    color: BRAND.redSoft,
  },
  statDivider: {
    height: 1,
    backgroundColor: 'rgba(42,16,36,0.5)',
    marginVertical: 12,
  },
  absentDates: {
    color: BRAND.redSoft,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 12,
    lineHeight: 19,
  },
  festCard: {
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
  cardTitle: {
    color: BRAND.primaryLight,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  festRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#D7AB6A',
  },
  festEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  festName: {
    flex: 1,
    color: BRAND.text,
    fontSize: 14,
    fontWeight: '600',
  },
  festDate: {
    color: BRAND.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  festEmpty: {
    color: BRAND.textDim,
    fontSize: 13,
    fontStyle: 'italic',
  },
  motivCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
  },
  motivDate: {
    color: BRAND.textDim,
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  motivText: {
    color: BRAND.text,
    fontSize: 14.5,
    lineHeight: 24,
    fontWeight: '500',
  },
  hint: {
    color: BRAND.textDim,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 320,
  },
  toast: {
    position: 'absolute',
    top: 62,
    alignSelf: 'center',
    zIndex: 100,
    elevation: 100,
    backgroundColor: 'rgba(26,9,22,0.95)',
    borderWidth: 1.5,
    borderColor: '#D7AB6A',
    borderRadius: 4,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  toastText: {
    color: BRAND.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(26,9,22,0.97)',
    borderWidth: 1.5,
    borderColor: '#D7AB6A',
    borderRadius: 16,
    padding: 20,
  },
  dialogTitle: {
    color: BRAND.primaryLight,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  dialogDate: {
    color: BRAND.textDim,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  typeList: {
    maxHeight: 300,
    marginBottom: 14,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(215,171,106,0.18)',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BRAND.textDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterOn: {
    borderColor: BRAND.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND.primary,
  },
  typeLabel: {
    color: BRAND.textDim,
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  typeLabelOn: {
    color: BRAND.primaryLight,
    fontWeight: '800',
  },
  dialogBtnDisabled: {
    opacity: 0.45,
  },
  dialogInput: {
    minHeight: 90,
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderWidth: 1,
    borderColor: '#D7AB6A',
    borderRadius: 10,
    color: BRAND.text,
    fontSize: 14,
    padding: 12,
    textAlignVertical: 'top',
  },
  dialogReasonBox: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderWidth: 1,
    borderColor: '#D7AB6A',
    borderRadius: 10,
    padding: 12,
  },
  dialogReasonText: {
    color: BRAND.text,
    fontSize: 14,
    lineHeight: 21,
  },
  dialogStatus: {
    color: BRAND.textDim,
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  dialogBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  dialogBtnCancel: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderWidth: 1,
    borderColor: '#D7AB6A',
  },
  dialogBtnSend: {
    backgroundColor: '#4169E1',
  },
  dialogBtnApprove: {
    backgroundColor: BRAND.success,
  },
  dialogBtnDanger: {
    backgroundColor: BRAND.red,
  },
  dialogBtnText: {
    color: BRAND.text,
    fontSize: 13.5,
    fontWeight: '800',
  },
});