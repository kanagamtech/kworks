import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MorningBackground from '../components/MorningBackground';
import Text from '../components/AppText';
import type { UserProfile } from '../types';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#D7AB6A',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  success: '#D7AB6A',
};

const TICKETS_KEY = 'kworks_it_tickets';
const IT_EMAIL = 'it-support@kworks.com';
const MGMT_EMAIL = 'management@kworks.com';

export type TicketMessage = {
  id: string;
  sender: string;
  role: 'user' | 'support' | 'management';
  body: string;
  time: string;
};

export type Ticket = {
  id: string;
  from: string;
  to: string;
  cc: string;
  subject: string;
  createdAt: string;
  status: 'open' | 'resolved';
  messages: TicketMessage[];
};

export const SUPPORT_DEPARTMENTS = {
  management: { label: 'Management', email: 'management@kworks.com', tagline: 'Facing a work-related issue?' },
  hr: { label: 'HR', email: 'hr@kworks.com', tagline: 'Facing an HR-related issue?' },
  finance: { label: 'FINANCE', email: 'finance@kworks.com', tagline: 'Facing a finance-related issue?' },
  it: { label: 'IT', email: 'it-support@kworks.com', tagline: 'Facing a technical issue?' },
} as const;

export type SupportDept = keyof typeof SUPPORT_DEPARTMENTS;

type Props = {
  onBack: () => void;
  user: UserProfile | null;
  department?: SupportDept;
};

const nowLabel = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
  ' · ' +
  new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

let ticketSeq = 1;

export default function ITSupportScreen({ onBack, user, department = 'it' }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<'landing' | 'compose' | 'sent' | 'list' | 'thread'>('landing');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [sentId, setSentId] = useState('');
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userEmail = user?.email ?? 'guest@kworks.com';
  const dept = SUPPORT_DEPARTMENTS[department];
  const deptName = dept.label === 'FINANCE' ? 'Finance' : dept.label === 'IT' ? 'IT' : dept.label;
  const to = dept.email;

  useEffect(() => {
    AsyncStorage.getItem(TICKETS_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setTickets(JSON.parse(raw) as Ticket[]);
          } catch {}
        }
      })
      .catch(() => {});
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, []);

  useEffect(() => {
    if (adminAuthed) setView('list');
  }, [adminAuthed]);

  const persist = (next: Ticket[]) => {
    setTickets(next);
    AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(next)).catch(() => {});
  };

  const adminLogout = () => {
    setAdminAuthed(false);
    setView('landing');
  };

  const sendTicket = () => {
    const subj = subject.trim();
    const body = message.trim();
    if (!subj || !body) return;
    const ticket: Ticket = {
      id: `TKT-${String(ticketSeq++).padStart(4, '0')}`,
      from: userEmail,
      to: to,
      cc: MGMT_EMAIL,
      subject: subj,
      createdAt: nowLabel(),
      status: 'open',
      messages: [
        {
          id: `m${Date.now()}`,
          sender: userEmail,
          role: 'user',
          body,
          time: nowLabel(),
        },
      ],
    };
    const next = [ticket, ...tickets];
    persist(next);
    setSubject('');
    setMessage('');
    setActiveId(ticket.id);
    if (adminAuthed) {
      setView('thread');
    } else {
      setSentId(ticket.id);
      setView('sent');
    }

    replyTimer.current = setTimeout(() => {
      setTickets((prev) => {
        const updated = prev.map((t) =>
          t.id === ticket.id
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  {
                    id: `m${Date.now()}`,
                    sender: `${dept.label} Desk`,
                    role: 'support' as const,
                    body: `Thank you for reporting "${t.subject}". Our team has received your request and will look into the issue. We will update you here shortly.`,
                    time: nowLabel(),
                  },
                ],
              }
            : t
        );
        AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    }, 2000);
  };

  const sendReply = () => {
    const body = reply.trim();
    if (!body || !activeId) return;
    setReply('');
    setTickets((prev) => {
      const updated = prev.map((t) =>
        t.id === activeId
          ? {
              ...t,
              messages: [
                ...t.messages,
                {
                  id: `m${Date.now()}`,
                  sender: userEmail,
                  role: 'user' as const,
                  body,
                  time: nowLabel(),
                },
              ],
            }
          : t
      );
      AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const toggleResolve = (id: string) => {
    setTickets((prev) => {
      const updated = prev.map((t) =>
        t.id === id
          ? { ...t, status: (t.status === 'open' ? 'resolved' : 'open') as 'open' | 'resolved' }
          : t
      );
      AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const active = tickets.find((t) => t.id === activeId) ?? null;

  const roleName = (role: 'user' | 'support' | 'management') =>
    role === 'user' ? userEmail : role === 'support' ? `${dept.label} Desk` : 'Management';

  const bubbleStyle = (role: 'user' | 'support' | 'management') =>
    role === 'user' ? styles.bubbleUser : role === 'support' ? styles.bubbleSupport : styles.bubbleMgmt;

  return (
    <View style={styles.root}>
      <MorningBackground />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (adminAuthed ? (view === 'list' ? onBack() : setView('list')) : onBack())}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>{'<'} Back</Text>
          </Pressable>
          <Text style={styles.title}>{view === 'thread' ? 'Ticket' : adminAuthed ? `${deptName} · Admin` : `${deptName} Support`}</Text>
          {adminAuthed && view === 'list' ? (
            <Pressable onPress={adminLogout} style={styles.backBtn}>
              <Text style={styles.backText}>Logout</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
        </View>

        {view === 'landing' && (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.landingCard}>
              <Text style={styles.landingTitle}>{dept.tagline}</Text>
              <Text style={styles.landingSub}>
                Raise a ticket and our {deptName} team will receive it right away. No login needed.
              </Text>
              <Pressable style={styles.sendBtn} onPress={() => setView('compose')}>
                <Text style={styles.sendBtnText}>+ Raise a Ticket</Text>
              </Pressable>
              <Pressable
                style={styles.clearBtn}
                onPress={() => {
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.open('/management', '_blank');
                  } else {
                    Linking.openURL('http://localhost:8082/management').catch(() => {});
                  }
                }}
              >
                <Text style={styles.clearBtnText}>Ticket Clearing Page — Solve Issues</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {view === 'sent' && (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.landingCard}>
              <Text style={styles.sentTitle}>Ticket sent successfully</Text>
              <Text style={styles.sentSub}>
                Your ticket <Text style={styles.sentId}>{sentId}</Text> has been raised and sent to the {deptName}
                team. They will get back to you here soon.
              </Text>
              <Pressable style={styles.sendBtn} onPress={() => setView('compose')}>
                <Text style={styles.sendBtnText}>Raise Another Ticket</Text>
              </Pressable>
              <Pressable style={styles.loginLink} onPress={() => setView('landing')}>
                <Text style={styles.loginLinkText}>Back</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {adminAuthed && view === 'list' && (
          <>
            <View style={styles.inboxMeta}>
              <Text style={styles.inboxCount}>
                {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} · shared with {deptName} &
                Management
              </Text>
            </View>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {tickets.length === 0 && (
                <Text style={styles.emptyText}>
                  No tickets yet. Tap "New Ticket" to write your problem — it will be mailed to {deptName} with
                  Management in Cc.
                </Text>
              )}
              {tickets.map((t) => (
                <Pressable
                  key={t.id}
                  style={styles.ticketCard}
                  onPress={() => {
                    setActiveId(t.id);
                    setView('thread');
                  }}
                >
                  <View style={styles.ticketHead}>
                    <Text style={styles.ticketSubject} numberOfLines={1}>
                      {t.subject}
                    </Text>
                    <View style={[styles.statusChip, t.status === 'resolved' && styles.statusChipResolved]}>
                      <Text style={[styles.statusText, t.status === 'resolved' && styles.statusTextResolved]}>
                        {t.status === 'open' ? 'OPEN' : 'RESOLVED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ticketFrom} numberOfLines={1}>
                    From: {t.from} · To: {t.to} · Cc: {t.cc}
                  </Text>
                  <Text style={styles.ticketSnippet} numberOfLines={2}>
                    {t.messages[t.messages.length - 1].body}
                  </Text>
                  <Text style={styles.ticketDate}>{t.createdAt}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.fab} onPress={() => setView('compose')}>
              <Text style={styles.fabText}>New Ticket</Text>
            </Pressable>
          </>
        )}

        {view === 'compose' && (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.composeCard}>
              <Text style={styles.composeTitle}>Write your problem</Text>
              <Text style={styles.fieldLabel}>From</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{userEmail}</Text>
              </View>
              <Text style={styles.fieldLabel}>To</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{to}</Text>
              </View>
              <Text style={styles.fieldLabel}>Cc</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{MGMT_EMAIL}</Text>
              </View>
              <Text style={styles.fieldLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Laptop not charging"
                placeholderTextColor={BRAND.textDim}
                value={subject}
                onChangeText={setSubject}
              />
              <Text style={styles.fieldLabel}>Describe your problem</Text>
              <TextInput
                style={[styles.input, styles.inputBody]}
                placeholder="Write the details of the issue you are facing..."
                placeholderTextColor={BRAND.textDim}
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <Pressable
                style={[styles.sendBtn, (!subject.trim() || !message.trim()) && styles.sendBtnDisabled]}
                disabled={!subject.trim() || !message.trim()}
                onPress={sendTicket}
              >
                <Text style={styles.sendBtnText}>Send Ticket</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {adminAuthed && view === 'thread' && active && (
          <>
            <View style={styles.threadHeader}>
              <Text style={styles.threadSubject} numberOfLines={1}>
                {active.subject}
              </Text>
              <Text style={styles.threadMeta} numberOfLines={1}>
                From: {active.from} · To: {active.to} · Cc: {active.cc}
              </Text>
              <Pressable
                style={[styles.statusChip, active.status === 'resolved' && styles.statusChipResolved]}
                onPress={() => toggleResolve(active.id)}
              >
                <Text style={[styles.statusText, active.status === 'resolved' && styles.statusTextResolved]}>
                  {active.status === 'open' ? 'OPEN — tap to resolve' : 'RESOLVED — tap to reopen'}
                </Text>
              </Pressable>
            </View>
            <KeyboardAvoidingView
              style={styles.threadWrap}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView contentContainerStyle={styles.threadBody} showsVerticalScrollIndicator={false}>
                {active.messages.map((m) => (
                  <View
                    key={m.id}
                    style={[styles.bubbleRow, m.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowOther]}
                  >
                    <View style={[styles.bubble, bubbleStyle(m.role)]}>
                      <Text style={styles.bubbleSender} numberOfLines={1}>
                        {roleName(m.role)}
                      </Text>
                      <Text style={styles.bubbleBody}>{m.body}</Text>
                      <Text style={styles.bubbleTime}>{m.time}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.replyBar}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Type your reply..."
                  placeholderTextColor={BRAND.textDim}
                  value={reply}
                  onChangeText={setReply}
                  multiline
                />
                <Pressable style={[styles.replyBtn, !reply.trim() && styles.replyBtnDisabled]} disabled={!reply.trim()} onPress={sendReply}>
                  <Text style={styles.replyBtnText}>Send</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  landingCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.55)',
    padding: 22,
    alignItems: 'center',
    marginTop: 20,
  },
  landingTitle: {
    color: BRAND.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  landingSub: {
    color: BRAND.textDim,
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  sentTitle: {
    color: BRAND.primaryLight,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  sentSub: {
    color: BRAND.text,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  sentId: {
    color: BRAND.primaryLight,
    fontWeight: '800',
  },
  loginLink: {
    marginTop: 16,
    padding: 6,
  },
  loginLinkText: {
    color: BRAND.textDim,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  loginNote: {
    color: BRAND.textDim,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 10,
  },
  loginError: {
    color: '#E07A70',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
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
  inboxMeta: {
    alignItems: 'center',
    paddingTop: 14,
  },
  inboxCount: {
    color: BRAND.textDim,
    fontSize: 12.5,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 100,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  emptyText: {
    color: BRAND.textDim,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 30,
    maxWidth: 320,
    fontStyle: 'italic',
  },
  ticketCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.55)',
    padding: 13,
    marginBottom: 12,
  },
  ticketHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketSubject: {
    flex: 1,
    color: BRAND.text,
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
  },
  statusChip: {
    borderRadius: 10,
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderWidth: 1,
    borderColor: BRAND.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusChipResolved: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderColor: BRAND.success,
  },
  statusText: {
    color: BRAND.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusTextResolved: {
    color: BRAND.success,
  },
  ticketFrom: {
    color: BRAND.textDim,
    fontSize: 11,
    marginTop: 6,
  },
  ticketSnippet: {
    color: BRAND.text,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  ticketDate: {
    color: BRAND.primaryLight,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: BRAND.primary,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  composeCard: {
    width: '100%',
    maxWidth: 420,
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    backgroundColor: 'rgba(26,9,22,0.55)',
    padding: 16,
    justifyContent: 'space-evenly',
  },
  composeTitle: {
    color: BRAND.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  fieldLabel: {
    color: BRAND.primaryLight,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 5,
  },
  fieldBox: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldValue: {
    color: BRAND.text,
    fontSize: 13.5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: BRAND.text,
    fontSize: 14,
  },
  inputBody: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  sendBtn: {
    marginTop: 18,
    backgroundColor: BRAND.primary,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
sendBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  clearBtn: {
    alignSelf: 'stretch',
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D7AB6A',
    backgroundColor: 'transparent',
  },
  clearBtnText: {
    color: '#D7AB6A',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  threadHeader: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(215,171,106,0.35)',
  },
  threadSubject: {
    color: BRAND.text,
    fontSize: 15,
    fontWeight: '800',
  },
  threadMeta: {
    color: BRAND.textDim,
    fontSize: 11,
    marginTop: 4,
  },
  threadWrap: {
    flex: 1,
  },
  threadBody: {
    padding: 14,
    paddingBottom: 20,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleUser: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderTopRightRadius: 4,
  },
  bubbleSupport: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderTopLeftRadius: 4,
  },
  bubbleMgmt: {
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderTopLeftRadius: 4,
  },
  bubbleSender: {
    color: BRAND.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 3,
  },
  bubbleBody: {
    color: BRAND.text,
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTime: {
    color: BRAND.textDim,
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(215,171,106,0.35)',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7AB6A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: BRAND.text,
    fontSize: 14,
    maxHeight: 90,
  },
  replyBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  replyBtnDisabled: {
    opacity: 0.4,
  },
  replyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});