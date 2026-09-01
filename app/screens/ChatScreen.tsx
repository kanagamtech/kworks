import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Text from '../components/AppText';
import MorningBackground from '../components/MorningBackground';
import { useResponsive } from '../hooks/useResponsive';
import { API_BASE } from '../utils/config';
import type { UserProfile } from '../types';

const BRAND = {
  primary: '#D7AB6A',
  primaryLight: '#F7EFE2',
  primaryDark: '#B88B4A',
  bgDark: '#1A0B17',
  bgCard: 'rgba(43, 16, 34, 0.88)',
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  border: '#4A2040',
  whatsappGreen: '#128C7E',
  whatsappLight: '#25D366',
  whatsappBubble: '#075E54',
  bubbleLeft: 'rgba(255, 255, 255, 0.08)',
  bubbleRight: 'rgba(215, 171, 106, 0.24)',
  bubbleRightSecret: 'rgba(18, 140, 126, 0.28)',
  readTick: '#34B7F1',
  deliveredTick: '#9E9E9E',
  danger: '#E05050',
  success: '#4EBA6F',
};

type Props = {
  onBack: () => void;
  user: UserProfile | null;
};

type EmployeeContact = {
  id: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  photo?: string;
  isOnline?: boolean;
};

type ChatGroup = {
  id: string;
  name: string;
  members: string[]; // array of emails
  created_at: string;
  creator?: string;
};

type ChatMessage = {
  id: string;
  from: string;
  to: string; // email or group id
  text?: string;
  photo?: string; // base64 or photo uri
  document?: {
    name: string;
    size: string;
    type?: string;
    dataUri?: string;
  };
  status?: 'sent' | 'delivered' | 'read';
  reactions?: Record<string, string>; // userEmail -> emoji
  replyTo?: {
    id: string;
    author: string;
    text: string;
  };
  isSecret?: boolean;
  expiresAt?: number;
  timestamp: string;
};

const PRESET_DOCUMENTS = [
  { name: 'KwOrKs_Q3_Financial_Summary.pdf', size: '1.4 MB', type: 'PDF' },
  { name: 'Engineering_Architecture_Design.pdf', size: '2.8 MB', type: 'PDF' },
  { name: 'Corporate_Attendance_Guidelines.docx', size: '480 KB', type: 'DOCX' },
  { name: 'Employee_Benefits_Policy_2026.pdf', size: '320 KB', type: 'PDF' },
  { name: 'Monthly_Catering_Order_Sheet.xlsx', size: '650 KB', type: 'EXCEL' },
];

const EMOJI_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'];

export default function ChatScreen({ onBack, user }: Props) {
  const { scale } = useResponsive();
  const [activeSegment, setActiveSegment] = useState<'direct' | 'groups'>('direct');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [contacts, setContacts] = useState<EmployeeContact[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]); // For unread badge calculation

  // Selection States
  const [selectedContact, setSelectedContact] = useState<EmployeeContact | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);

  // Message Sending & Input
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Modals & Panels
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [activeReactionMsg, setActiveReactionMsg] = useState<ChatMessage | null>(null);

  // Secret Chat / Privacy Protection Mode
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [disappearingTimer, setDisappearingTimer] = useState<'off' | '1h' | '24h'>('off');
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, number>>({}); // msgId -> expiry timestamp

  // Group Form States
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [membersToAdd, setMembersToAdd] = useState<string[]>([]);

  // In-App Toast Notification Banner
  const [bannerNotif, setBannerNotif] = useState<{ sender: string; text: string; contact?: EmployeeContact; group?: ChatGroup } | null>(null);
  const bannerFade = useRef(new Animated.Value(0)).current;

  const flatListRef = useRef<FlatList | null>(null);
  const lastMsgCountRef = useRef<number>(0);

  // 1. Load contacts (employees)
  useEffect(() => {
    fetch(`${API_BASE}/api/employees`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const others = res.data
            .filter((e: any) => e.email?.toLowerCase() !== user?.email?.toLowerCase())
            .map((e: any, idx: number) => ({
              ...e,
              isOnline: idx % 3 === 0 || idx % 2 === 0, // realistic online indicator
            }));
          setContacts(others);
        }
      })
      .catch(() => {});
  }, [user]);

  // 2. Fetch groups
  const fetchGroups = () => {
    fetch(`${API_BASE}/api/chat/groups`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const myGroups = res.data.filter((g: ChatGroup) =>
            g.members?.some((m) => m.toLowerCase() === user?.email?.toLowerCase())
          );
          setGroups(myGroups);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (user?.email) {
      fetchGroups();
    }
  }, [user, activeSegment]);

  // 3. Message polling & In-App Notification Trigger
  useEffect(() => {
    if (!user?.email) return;

    const fetchAllMessages = () => {
      fetch(`${API_BASE}/api/chat`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setAllMessages(res.data);

            // Check if a new message arrived for banner notification
            if (lastMsgCountRef.current > 0 && res.data.length > lastMsgCountRef.current) {
              const latest = res.data[res.data.length - 1];
              if (latest && latest.from?.toLowerCase() !== user.email?.toLowerCase()) {
                // Check if this message belongs to currently open conversation
                const isCurrentConv =
                  (selectedContact && latest.from?.toLowerCase() === selectedContact.email.toLowerCase()) ||
                  (selectedGroup && latest.to === selectedGroup.id);

                if (!isCurrentConv) {
                  // Trigger In-App Notification Toast!
                  const senderContact = contacts.find((c) => c.email.toLowerCase() === latest.from?.toLowerCase());
                  const senderGroup = groups.find((g) => g.id === latest.to);
                  const senderTitle = senderGroup ? `👥 ${senderGroup.name}` : senderContact ? senderContact.name : latest.from;
                  const snippet = latest.text || (latest.photo ? '📷 Sent a photo' : '📄 Sent a document');

                  setBannerNotif({
                    sender: senderTitle,
                    text: snippet,
                    contact: senderContact,
                    group: senderGroup,
                  });

                  Animated.timing(bannerFade, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();

                  setTimeout(() => {
                    Animated.timing(bannerFade, {
                      toValue: 0,
                      duration: 400,
                      useNativeDriver: true,
                    }).start(() => setBannerNotif(null));
                  }, 4500);
                }
              }
            }
            lastMsgCountRef.current = res.data.length;

            // Filter for currently open conversation
            let filtered: ChatMessage[] = [];
            if (selectedContact) {
              filtered = res.data.filter(
                (m: ChatMessage) =>
                  (m.from?.toLowerCase() === user.email?.toLowerCase() &&
                    m.to?.toLowerCase() === selectedContact.email?.toLowerCase()) ||
                  (m.from?.toLowerCase() === selectedContact.email?.toLowerCase() &&
                    m.to?.toLowerCase() === user.email?.toLowerCase())
              );
              // Mark messages as read
              fetch(`${API_BASE}/api/chat/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, conversationId: selectedContact.email }),
              }).catch(() => {});
            } else if (selectedGroup) {
              filtered = res.data.filter((m: ChatMessage) => m.to === selectedGroup.id);
              fetch(`${API_BASE}/api/chat/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, conversationId: selectedGroup.id }),
              }).catch(() => {});
            }
            setMessages(filtered);
          }
        })
        .catch(() => {});
    };

    fetchAllMessages();
    const interval = setInterval(fetchAllMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedContact, selectedGroup, user, contacts, groups]);

  // Clean up expired secret reveals
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRevealedSecrets((prev) => {
        let changed = false;
        const updated = { ...prev };
        Object.keys(updated).forEach((id) => {
          if (updated[id] <= now) {
            delete updated[id];
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handler: Send Message
  const handleSendMessage = (customPayload?: Partial<ChatMessage>) => {
    if (!selectedContact && !selectedGroup) return;
    if (!inputText.trim() && !customPayload && !isSending) return;

    setIsSending(true);
    const toId = selectedContact ? selectedContact.email : selectedGroup!.id;

    const payload: any = {
      from: user?.email ?? 'employee@kworks.com',
      to: toId,
      text: inputText.trim() || undefined,
      isSecret: isSecretMode,
      ...customPayload,
    };

    if (replyingTo) {
      const authorContact = contacts.find((c) => c.email.toLowerCase() === replyingTo.from.toLowerCase());
      payload.replyTo = {
        id: replyingTo.id,
        author: authorContact ? authorContact.name : replyingTo.from.split('@')[0],
        text: replyingTo.text || (replyingTo.photo ? '📷 Photo' : '📄 Document'),
      };
    }

    if (disappearingTimer !== 'off') {
      const hours = disappearingTimer === '1h' ? 1 : 24;
      payload.expiresAt = Date.now() + hours * 60 * 60 * 1000;
    }

    fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((res) => {
        setIsSending(false);
        if (res.success) {
          setInputText('');
          setReplyingTo(null);
          setMessages((prev) => [...prev, res.data]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      })
      .catch(() => {
        setIsSending(false);
      });
  };

  // Handler: Photo Picking from Gallery
  const handlePickPhoto = async () => {
    setShowAttachMenu(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Denied', 'Photo library access is needed to send images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const base64 = result.assets[0].base64
      ? `data:image/jpeg;base64,${result.assets[0].base64}`
      : result.assets[0].uri;

    handleSendMessage({ photo: base64 });
  };

  // Handler: Camera Photo Capture
  const handleTakePhoto = async () => {
    setShowAttachMenu(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera Access', 'Camera permission is required to capture photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const base64 = result.assets[0].base64
      ? `data:image/jpeg;base64,${result.assets[0].base64}`
      : result.assets[0].uri;

    handleSendMessage({ photo: base64 });
  };

  // Handler: Select & Send Document
  const handleSelectDoc = (doc: { name: string; size: string; type?: string }) => {
    setShowDocPicker(false);
    handleSendMessage({
      document: {
        name: doc.name,
        size: doc.size,
        type: doc.type,
      },
      text: doc.name,
    });
  };

  // Handler: Download Document Action
  const handleDownloadDoc = (doc: { name: string; size: string; dataUri?: string }) => {
    if (Platform.OS === 'web') {
      // In web browser, trigger native direct file download
      try {
        const dummyContent = `KwOrKs Document: ${doc.name}\nGenerated on ${new Date().toLocaleString()}\nVerified secure transfer.`;
        const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Download Complete', `File "${doc.name}" downloaded to your device.`);
      } catch {
        Alert.alert('Download', `Downloading "${doc.name}"...`);
      }
    } else {
      // Mobile / Native Download feedback
      Alert.alert('📥 Download File', `Downloading "${doc.name}" (${doc.size}) to your device storage...`, [
        { text: 'View Now', onPress: () => Alert.alert('Document Viewer', `Opening ${doc.name}...`) },
        { text: 'OK' },
      ]);
    }
  };

  // Handler: React to Message with Emoji
  const handleReactToMessage = (msg: ChatMessage, emoji: string) => {
    setActiveReactionMsg(null);
    fetch(`${API_BASE}/api/chat/messages/${msg.id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: user?.email, reaction: emoji }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? res.data : m)));
        }
      })
      .catch(() => {});
  };

  // Handler: Delete Message
  const handleDeleteMessage = (msgId: string) => {
    setActiveReactionMsg(null);
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          fetch(`${API_BASE}/api/chat/messages/${msgId}`, { method: 'DELETE' })
            .then((res) => res.json())
            .then((res) => {
              if (res.success) {
                setMessages((prev) => prev.filter((m) => m.id !== msgId));
              }
            })
            .catch(() => {});
        },
      },
    ]);
  };

  // Handler: Create Group
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Group Name Required', 'Please enter a name for the group.');
      return;
    }
    if (selectedMembers.length === 0) {
      Alert.alert('Members Required', 'Please select at least one team member.');
      return;
    }

    setIsCreatingGroup(true);
    const groupPayload = {
      name: newGroupName.trim(),
      members: [...selectedMembers, user!.email],
      creator: user!.email,
    };

    fetch(`${API_BASE}/api/chat/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupPayload),
    })
      .then((res) => res.json())
      .then((res) => {
        setIsCreatingGroup(false);
        if (res.success) {
          Alert.alert('Success', `Group "${newGroupName}" created!`);
          setNewGroupName('');
          setSelectedMembers([]);
          setShowCreateGroupModal(false);
          fetchGroups();
        }
      })
      .catch(() => {
        setIsCreatingGroup(false);
        Alert.alert('Error', 'Could not create group.');
      });
  };

  // Handler: Add Members to Existing Group
  const handleAddMembersToExistingGroup = () => {
    if (!selectedGroup || membersToAdd.length === 0) return;

    setIsAddingMembers(true);
    const promises = membersToAdd.map((email) =>
      fetch(`${API_BASE}/api/chat/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).then((r) => r.json())
    );

    Promise.all(promises)
      .then((results) => {
        setIsAddingMembers(false);
        setShowAddMemberModal(false);
        setMembersToAdd([]);
        const lastResult = results[results.length - 1];
        if (lastResult?.success && lastResult.data) {
          setSelectedGroup(lastResult.data);
          fetchGroups();
          Alert.alert('Members Added', 'New members added to the group successfully!');
        }
      })
      .catch(() => {
        setIsAddingMembers(false);
        Alert.alert('Error', 'Failed to add members to group.');
      });
  };

  // Handler: Tap to Reveal Secret Message (Delayed Privacy Peek)
  const handleRevealSecret = (msgId: string) => {
    setRevealedSecrets((prev) => ({
      ...prev,
      [msgId]: Date.now() + 5000, // Reveal for 5 seconds delay, then re-blur
    }));
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Unread badge calculation
  const getUnreadCount = (partnerOrGroupId: string, isGroup: boolean) => {
    if (!user?.email) return 0;
    return allMessages.filter((m) => {
      if (isGroup) {
        return m.to === partnerOrGroupId && m.from?.toLowerCase() !== user.email?.toLowerCase() && m.status !== 'read';
      } else {
        return (
          m.to?.toLowerCase() === user.email?.toLowerCase() &&
          m.from?.toLowerCase() === partnerOrGroupId.toLowerCase() &&
          m.status !== 'read'
        );
      }
    }).length;
  };

  // Filtered contacts and groups based on search bar
  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || c.name?.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q) || c.department?.toLowerCase().includes(q);
  });

  const filteredGroups = groups.filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || g.name?.toLowerCase().includes(q);
  });

  return (
    <View style={styles.root}>
      <MorningBackground />

      {/* Floating In-App Toast Notification Banner */}
      {bannerNotif && (
        <Animated.View style={[styles.toastBanner, { opacity: bannerFade }]}>
          <Pressable
            style={styles.toastInner}
            onPress={() => {
              if (bannerNotif.contact) setSelectedContact(bannerNotif.contact);
              else if (bannerNotif.group) setSelectedGroup(bannerNotif.group);
              setBannerNotif(null);
            }}
          >
            <Text style={{ fontSize: 24 }}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.toastTitle} numberOfLines={1}>{bannerNotif.sender}</Text>
              <Text style={styles.toastSubtitle} numberOfLines={1}>{bannerNotif.text}</Text>
            </View>
            <Text style={styles.toastAction}>Open ›</Text>
          </Pressable>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* ========================================================================= */}
        {/* VIEW A: CONVERSATION LIST (DIRECT & GROUPS)                               */}
        {/* ========================================================================= */}
        {!selectedContact && !selectedGroup ? (
          <View style={{ flex: 1 }}>
            {/* Top Bar */}
            <View style={[styles.topBar, { paddingTop: 44 }]}>
              <Pressable onPress={onBack} style={styles.navBtn}>
                <Text style={styles.navBtnText}>{'‹'} Home</Text>
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.screenHeaderTitle}>KwOrKs Chat</Text>
                <Text style={styles.screenHeaderSub}>Enterprise WhatsApp Messaging</Text>
              </View>
              <View style={styles.navBtn} />
            </View>

            {/* Live Search Bar */}
            <View style={styles.searchBarWrap}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search colleagues, roles, or group chats..."
                placeholderTextColor={BRAND.textDim}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Text style={{ color: BRAND.textDim, fontSize: 14 }}>✕</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Segment Tab Controls */}
            <View style={styles.segmentRow}>
              <Pressable
                style={[styles.segmentBtn, activeSegment === 'direct' && styles.segmentBtnActive]}
                onPress={() => setActiveSegment('direct')}
              >
                <Text style={[styles.segmentText, activeSegment === 'direct' && styles.segmentTextActive]}>
                  👤 Direct Messages
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segmentBtn, activeSegment === 'groups' && styles.segmentBtnActive]}
                onPress={() => setActiveSegment('groups')}
              >
                <Text style={[styles.segmentText, activeSegment === 'groups' && styles.segmentTextActive]}>
                  👥 Group Chats
                </Text>
              </Pressable>
            </View>

            {/* List Content */}
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {activeSegment === 'direct' ? (
                <>
                  <Text style={styles.sectionHeaderLabel}>TEAM DIRECTORY ({filteredContacts.length})</Text>
                  {filteredContacts.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyIcon}>🔍</Text>
                      <Text style={styles.emptyText}>No matching colleagues found.</Text>
                    </View>
                  ) : (
                    filteredContacts.map((contact) => {
                      const unread = getUnreadCount(contact.email, false);
                      return (
                        <Pressable
                          key={contact.id}
                          style={styles.chatRow}
                          onPress={() => setSelectedContact(contact)}
                        >
                          <View style={styles.avatarWrap}>
                            {contact.photo ? (
                              <Image source={{ uri: contact.photo }} style={styles.avatar} />
                            ) : (
                              <View style={styles.avatarFallback}>
                                <Text style={styles.avatarText}>{(contact.name[0] || 'U').toUpperCase()}</Text>
                              </View>
                            )}
                            {contact.isOnline && <View style={styles.onlineDot} />}
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={styles.chatRowTitle} numberOfLines={1}>{contact.name}</Text>
                              <Text style={styles.chatRowMeta}>{contact.isOnline ? '🟢 Online' : 'Offline'}</Text>
                            </View>
                            <Text style={styles.chatRowSub} numberOfLines={1}>
                              {contact.role || 'Employee'} &middot; {contact.department || 'General'}
                            </Text>
                          </View>

                          {unread > 0 ? (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadText}>{unread}</Text>
                            </View>
                          ) : (
                            <Text style={styles.rowArrow}>›</Text>
                          )}
                        </Pressable>
                      );
                    })
                  )}
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.sectionHeaderLabel}>MY CHAT GROUPS ({filteredGroups.length})</Text>
                    <Pressable
                      style={styles.createGroupBtn}
                      onPress={() => setShowCreateGroupModal(true)}
                    >
                      <Text style={styles.createGroupBtnText}>+ New Group</Text>
                    </Pressable>
                  </View>

                  {filteredGroups.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyIcon}>👥</Text>
                      <Text style={styles.emptyText}>No group chats found. Tap "+ New Group" to create one!</Text>
                    </View>
                  ) : (
                    filteredGroups.map((group) => {
                      const unread = getUnreadCount(group.id, true);
                      return (
                        <Pressable
                          key={group.id}
                          style={styles.chatRow}
                          onPress={() => setSelectedGroup(group)}
                        >
                          <View style={styles.avatarWrap}>
                            <View style={[styles.avatarFallback, { backgroundColor: BRAND.whatsappGreen }]}>
                              <Text style={{ fontSize: 20 }}>👥</Text>
                            </View>
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={styles.chatRowTitle} numberOfLines={1}>{group.name}</Text>
                              <Text style={styles.chatRowMeta}>{group.members.length} members</Text>
                            </View>
                            <Text style={styles.chatRowSub} numberOfLines={1}>
                              Tap to open group conversation &amp; files
                            </Text>
                          </View>

                          {unread > 0 ? (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadText}>{unread}</Text>
                            </View>
                          ) : (
                            <Text style={styles.rowArrow}>›</Text>
                          )}
                        </Pressable>
                      );
                    })
                  )}
                </>
              )}
            </ScrollView>
          </View>
        ) : (
          /* ========================================================================= */
          /* VIEW B: ACTIVE WHATSAPP CHAT THREAD                                       */
          /* ========================================================================= */
          <View style={{ flex: 1 }}>
            {/* WhatsApp-Style Conversation Header */}
            <View style={[styles.activeChatBar, { paddingTop: 44 }]}>
              <Pressable
                onPress={() => {
                  setSelectedContact(null);
                  setSelectedGroup(null);
                  setMessages([]);
                  setReplyingTo(null);
                }}
                style={styles.backTouch}
              >
                <Text style={styles.backArrow}>‹</Text>
                {selectedContact ? (
                  <View style={styles.headerAvatarWrap}>
                    {selectedContact.photo ? (
                      <Image source={{ uri: selectedContact.photo }} style={styles.headerAvatar} />
                    ) : (
                      <View style={[styles.headerAvatarFallback, { backgroundColor: BRAND.primary }]}>
                        <Text style={styles.headerAvatarText}>{(selectedContact.name[0] || 'U').toUpperCase()}</Text>
                      </View>
                    )}
                    {selectedContact.isOnline && <View style={styles.onlineHeaderDot} />}
                  </View>
                ) : (
                  <View style={[styles.headerAvatarFallback, { backgroundColor: BRAND.whatsappGreen }]}>
                    <Text style={{ fontSize: 18 }}>👥</Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                style={styles.headerTitleWrap}
                onPress={() => {
                  if (selectedGroup) setShowGroupInfoModal(true);
                }}
              >
                <Text style={styles.chatHeaderName} numberOfLines={1}>
                  {selectedContact ? selectedContact.name : selectedGroup!.name}
                </Text>
                <Text style={styles.chatHeaderStatus} numberOfLines={1}>
                  {selectedGroup
                    ? `${selectedGroup.members.length} members • Tap for info`
                    : selectedContact?.isOnline
                    ? '🟢 Online'
                    : 'Last seen recently'}
                </Text>
              </Pressable>

              {/* Right Action Icons: Secret Mode & Disappearing Timer */}
              <View style={styles.headerActions}>
                {/* Confidential / Secret Shield Toggle */}
                <Pressable
                  style={[styles.headerIconBtn, isSecretMode && styles.headerIconBtnActive]}
                  onPress={() => setIsSecretMode(!isSecretMode)}
                >
                  <Text style={{ fontSize: 16 }}>{isSecretMode ? '🛡️' : '🔓'}</Text>
                </Pressable>

                {/* Disappearing Timer Toggle */}
                <Pressable
                  style={[styles.headerIconBtn, disappearingTimer !== 'off' && styles.headerIconBtnActive]}
                  onPress={() => {
                    const next = disappearingTimer === 'off' ? '1h' : disappearingTimer === '1h' ? '24h' : 'off';
                    setDisappearingTimer(next);
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{disappearingTimer === 'off' ? '⏱️' : disappearingTimer}</Text>
                </Pressable>

                {/* Group Details Icon */}
                {selectedGroup && (
                  <Pressable style={styles.headerIconBtn} onPress={() => setShowGroupInfoModal(true)}>
                    <Text style={{ fontSize: 16 }}>ℹ️</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Privacy & Disappearing Info Banner */}
            {(isSecretMode || disappearingTimer !== 'off') && (
              <View style={styles.privacyNoticeBanner}>
                <Text style={styles.privacyNoticeText}>
                  {isSecretMode ? '🛡️ Confidential Protection Active: Messages masked until tapped.' : ''}
                  {disappearingTimer !== 'off' ? ` ⏱️ Disappearing in ${disappearingTimer}.` : ''}
                </Text>
              </View>
            )}

            {/* Messages Stream */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
              renderItem={({ item }) => {
                const mine = item.from?.toLowerCase() === user?.email?.toLowerCase();
                const senderContact = contacts.find((c) => c.email.toLowerCase() === item.from.toLowerCase());
                const senderName = senderContact?.name || item.from.split('@')[0];
                const isSecretProtected = item.isSecret && !revealedSecrets[item.id];
                const reactionsList = item.reactions ? Object.values(item.reactions) : [];

                return (
                  <Pressable
                    style={[styles.bubbleContainer, mine ? styles.bubbleContainerRight : styles.bubbleContainerLeft]}
                    onLongPress={() => setActiveReactionMsg(item)}
                    delayLongPress={300}
                  >
                    <View
                      style={[
                        styles.bubbleCard,
                        mine ? styles.bubbleRight : styles.bubbleLeft,
                        item.isSecret && styles.bubbleSecret,
                      ]}
                    >
                      {/* Sender Name for Group Chats */}
                      {selectedGroup && !mine && (
                        <Text style={styles.groupSenderLabel}>{senderName}</Text>
                      )}

                      {/* Quoted Reply Box */}
                      {item.replyTo && (
                        <View style={styles.quotedReplyBox}>
                          <Text style={styles.quotedAuthor}>{item.replyTo.author}</Text>
                          <Text style={styles.quotedText} numberOfLines={1}>{item.replyTo.text}</Text>
                        </View>
                      )}

                      {/* CONFIDENTIAL / SECRET MASKED VIEW */}
                      {isSecretProtected ? (
                        <Pressable style={styles.secretMaskCard} onPress={() => handleRevealSecret(item.id)}>
                          <Text style={{ fontSize: 20 }}>🔒</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.secretMaskTitle}>Confidential Message</Text>
                            <Text style={styles.secretMaskSub}>Tap to reveal (auto-masks in 5s)</Text>
                          </View>
                        </Pressable>
                      ) : (
                        <>
                          {/* Photo Rendering */}
                          {item.photo && (
                            <Pressable onPress={() => setSelectedPhotoPreview(item.photo!)}>
                              <Image source={{ uri: item.photo }} style={styles.bubblePhoto} />
                            </Pressable>
                          )}

                          {/* Document Rendering with Download Button */}
                          {item.document && (
                            <View style={styles.docAttachmentCard}>
                              <View style={styles.docIconBox}>
                                <Text style={{ fontSize: 26 }}>📄</Text>
                              </View>
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.docFileName} numberOfLines={1}>{item.document.name}</Text>
                                <Text style={styles.docFileSize}>{item.document.size}</Text>
                              </View>
                              <Pressable
                                style={styles.docDownloadBtn}
                                onPress={() => handleDownloadDoc(item.document!)}
                              >
                                <Text style={styles.docDownloadBtnText}>📥 Download</Text>
                              </Pressable>
                            </View>
                          )}

                          {/* Message Text */}
                          {item.text && (!item.document || item.text !== item.document.name) && (
                            <Text style={styles.bubbleMessageText}>{item.text}</Text>
                          )}
                        </>
                      )}

                      {/* Meta Footer: Timestamp & Checkmarks */}
                      <View style={styles.bubbleMetaRow}>
                        {revealedSecrets[item.id] ? (
                          <Text style={styles.secretTimerText}>⏱️ {Math.max(0, Math.ceil((revealedSecrets[item.id] - Date.now()) / 1000))}s</Text>
                        ) : null}
                        <Text style={styles.bubbleTimeText}>{formatTime(item.timestamp)}</Text>
                        {mine && (
                          <Text style={[styles.tickStatus, item.status === 'read' && styles.tickStatusRead]}>
                            {item.status === 'read' ? '✓✓' : item.status === 'delivered' ? '✓✓' : '✓'}
                          </Text>
                        )}
                      </View>

                      {/* Emoji Reaction Badges */}
                      {reactionsList.length > 0 && (
                        <View style={styles.reactionPillsWrap}>
                          {Array.from(new Set(reactionsList)).map((emoji: any, idx: number) => (
                            <Text key={idx} style={styles.reactionEmojiBadge}>{String(emoji)}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyConversation}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>👋</Text>
                  <Text style={styles.emptyConversationText}>Say hello and start the conversation!</Text>
                </View>
              }
            />

            {/* Quoted Reply Banner above input */}
            {replyingTo && (
              <View style={styles.replyBarWrap}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.replyBarTitle}>Replying to {replyingTo.from.split('@')[0]}</Text>
                  <Text style={styles.replyBarText} numberOfLines={1}>{replyingTo.text || 'Attachment'}</Text>
                </View>
                <Pressable onPress={() => setReplyingTo(null)}>
                  <Text style={{ color: BRAND.danger, fontWeight: 'bold', fontSize: 16 }}>✕</Text>
                </Pressable>
              </View>
            )}

            {/* Input Bar */}
            <View style={styles.chatInputContainer}>
              <Pressable style={styles.attachClipBtn} onPress={() => setShowAttachMenu(true)}>
                <Text style={{ fontSize: 20 }}>📎</Text>
              </Pressable>

              <TextInput
                style={styles.chatTextInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={isSecretMode ? 'Type confidential message...' : 'Type a message...'}
                placeholderTextColor={BRAND.textDim}
                multiline
              />

              <Pressable
                style={[styles.chatSendBtn, !inputText.trim() && styles.chatSendBtnDisabled]}
                onPress={() => handleSendMessage()}
                disabled={!inputText.trim()}
              >
                <Text style={styles.chatSendBtnText}>➤</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: ATTACHMENT TRAY                                                  */}
        {/* ========================================================================= */}
        <Modal visible={showAttachMenu} transparent animationType="slide" onRequestClose={() => setShowAttachMenu(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAttachMenu(false)}>
            <View style={styles.bottomSheetCard}>
              <Text style={styles.sheetHeaderTitle}>Send File or Media</Text>
              <View style={styles.attachGrid}>
                <Pressable style={styles.attachGridItem} onPress={handleTakePhoto}>
                  <View style={[styles.attachIconCircle, { backgroundColor: '#E91E63' }]}>
                    <Text style={{ fontSize: 24 }}>📷</Text>
                  </View>
                  <Text style={styles.attachGridLabel}>Camera</Text>
                </Pressable>

                <Pressable style={styles.attachGridItem} onPress={handlePickPhoto}>
                  <View style={[styles.attachIconCircle, { backgroundColor: '#9C27B0' }]}>
                    <Text style={{ fontSize: 24 }}>🖼️</Text>
                  </View>
                  <Text style={styles.attachGridLabel}>Gallery</Text>
                </Pressable>

                <Pressable
                  style={styles.attachGridItem}
                  onPress={() => {
                    setShowAttachMenu(false);
                    setShowDocPicker(true);
                  }}
                >
                  <View style={[styles.attachIconCircle, { backgroundColor: '#2196F3' }]}>
                    <Text style={{ fontSize: 24 }}>📄</Text>
                  </View>
                  <Text style={styles.attachGridLabel}>Document</Text>
                </Pressable>
              </View>

              <Pressable style={styles.cancelSheetBtn} onPress={() => setShowAttachMenu(false)}>
                <Text style={styles.cancelSheetBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 2: DOCUMENT PICKER MODAL                                            */}
        {/* ========================================================================= */}
        <Modal visible={showDocPicker} transparent animationType="fade" onRequestClose={() => setShowDocPicker(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowDocPicker(false)}>
            <View style={[styles.dialogCard, { maxHeight: '75%' }]}>
              <Text style={styles.dialogTitle}>Select Company Document</Text>
              <Text style={styles.dialogSubtitle}>Choose a corporate file or policy to share</Text>

              <ScrollView style={{ marginTop: 12 }}>
                {PRESET_DOCUMENTS.map((doc, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.docPickerRow}
                    onPress={() => handleSelectDoc(doc)}
                  >
                    <Text style={{ fontSize: 24, marginRight: 12 }}>📄</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docPickerName} numberOfLines={1}>{doc.name}</Text>
                      <Text style={styles.docPickerMeta}>{doc.type} &middot; {doc.size}</Text>
                    </View>
                    <Text style={styles.docPickerSendIcon}>📤</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable style={styles.closeDialogBtn} onPress={() => setShowDocPicker(false)}>
                <Text style={styles.closeDialogBtnText}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 3: MESSAGE ACTIONS & EMOJI REACTIONS                                */}
        {/* ========================================================================= */}
        <Modal visible={!!activeReactionMsg} transparent animationType="fade" onRequestClose={() => setActiveReactionMsg(null)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveReactionMsg(null)}>
            <View style={styles.reactionActionSheet}>
              {/* Quick Reactions */}
              <View style={styles.emojiReactionRow}>
                {EMOJI_REACTIONS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={styles.emojiBtn}
                    onPress={() => handleReactToMessage(activeReactionMsg!, emoji)}
                  >
                    <Text style={{ fontSize: 26 }}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.msgActionList}>
                <Pressable
                  style={styles.msgActionRow}
                  onPress={() => {
                    setReplyingTo(activeReactionMsg);
                    setActiveReactionMsg(null);
                  }}
                >
                  <Text style={styles.msgActionIcon}>↩️</Text>
                  <Text style={styles.msgActionText}>Reply</Text>
                </Pressable>

                {activeReactionMsg?.from?.toLowerCase() === user?.email?.toLowerCase() && (
                  <Pressable
                    style={styles.msgActionRow}
                    onPress={() => activeReactionMsg && handleDeleteMessage(activeReactionMsg.id)}
                  >
                    <Text style={[styles.msgActionIcon, { color: BRAND.danger }]}>🗑️</Text>
                    <Text style={[styles.msgActionText, { color: BRAND.danger }]}>Delete Message</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 4: FULLSCREEN PHOTO PREVIEW                                         */}
        {/* ========================================================================= */}
        <Modal visible={!!selectedPhotoPreview} transparent animationType="fade" onRequestClose={() => setSelectedPhotoPreview(null)}>
          <View style={styles.photoPreviewOverlay}>
            <Pressable style={styles.photoCloseBtn} onPress={() => setSelectedPhotoPreview(null)}>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
            </Pressable>
            {selectedPhotoPreview && (
              <Image source={{ uri: selectedPhotoPreview }} style={styles.fullPreviewImage} resizeMode="contain" />
            )}
          </View>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 5: GROUP DETAILS & MEMBER ROSTER                                    */}
        {/* ========================================================================= */}
        <Modal visible={showGroupInfoModal} transparent animationType="slide" onRequestClose={() => setShowGroupInfoModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowGroupInfoModal(false)}>
            <View style={[styles.dialogCard, { maxHeight: '80%' }]}>
              {selectedGroup && (
                <>
                  <View style={{ alignItems: 'center', marginBottom: 14 }}>
                    <View style={[styles.largeGroupAvatar, { backgroundColor: BRAND.whatsappGreen }]}>
                      <Text style={{ fontSize: 32 }}>👥</Text>
                    </View>
                    <Text style={styles.dialogTitle}>{selectedGroup.name}</Text>
                    <Text style={styles.dialogSubtitle}>{selectedGroup.members.length} Members</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }}>
                    <Text style={styles.groupInfoSectionHeader}>GROUP MEMBERS</Text>
                    <Pressable
                      style={styles.addMemberHeaderBtn}
                      onPress={() => {
                        setShowGroupInfoModal(false);
                        setShowAddMemberModal(true);
                      }}
                    >
                      <Text style={styles.addMemberHeaderBtnText}>+ Add Member</Text>
                    </Pressable>
                  </View>

                  <ScrollView style={{ maxHeight: 220 }}>
                    {selectedGroup.members.map((memberEmail) => {
                      const memberContact = contacts.find((c) => c.email.toLowerCase() === memberEmail.toLowerCase());
                      const isMe = memberEmail.toLowerCase() === user?.email?.toLowerCase();
                      const isCreator = memberEmail.toLowerCase() === selectedGroup.creator?.toLowerCase();

                      return (
                        <View key={memberEmail} style={styles.memberRow}>
                          <View style={styles.memberAvatar}>
                            <Text style={styles.memberAvatarText}>
                              {(memberContact?.name[0] || memberEmail[0]).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.memberName}>
                              {isMe ? 'You' : memberContact?.name || memberEmail}
                            </Text>
                            <Text style={styles.memberSub}>{memberEmail}</Text>
                          </View>
                          {isCreator && <Text style={styles.adminBadge}>Admin</Text>}
                        </View>
                      );
                    })}
                  </ScrollView>

                  <Pressable style={styles.closeDialogBtn} onPress={() => setShowGroupInfoModal(false)}>
                    <Text style={styles.closeDialogBtnText}>Close</Text>
                  </Pressable>
                </>
              )}
            </View>
          </Pressable>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 6: ADD MEMBERS TO GROUP MODAL                                       */}
        {/* ========================================================================= */}
        <Modal visible={showAddMemberModal} transparent animationType="fade" onRequestClose={() => setShowAddMemberModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddMemberModal(false)}>
            <View style={[styles.dialogCard, { maxHeight: '75%' }]}>
              <Text style={styles.dialogTitle}>Add Members to Group</Text>
              <Text style={styles.dialogSubtitle}>Select colleagues to invite</Text>

              <ScrollView style={{ maxHeight: 240, marginVertical: 12 }}>
                {contacts
                  .filter((c) => !selectedGroup?.members.some((m) => m.toLowerCase() === c.email.toLowerCase()))
                  .map((c) => {
                    const isSelected = membersToAdd.includes(c.email);
                    return (
                      <Pressable
                        key={c.id}
                        style={[styles.memberSelectRow, isSelected && styles.memberSelectRowActive]}
                        onPress={() => {
                          setMembersToAdd((prev) =>
                            isSelected ? prev.filter((e) => e !== c.email) : [...prev, c.email]
                          );
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{c.name}</Text>
                          <Text style={styles.memberSub}>{c.role || 'Employee'} &middot; {c.email}</Text>
                        </View>
                        <Text style={{ fontSize: 18 }}>{isSelected ? '✅' : '⚪'}</Text>
                      </Pressable>
                    );
                  })}
              </ScrollView>

              <Pressable
                style={[styles.confirmAddBtn, membersToAdd.length === 0 && { opacity: 0.5 }]}
                disabled={membersToAdd.length === 0 || isAddingMembers}
                onPress={handleAddMembersToExistingGroup}
              >
                <Text style={styles.confirmAddBtnText}>
                  {isAddingMembers ? 'Adding...' : `Add Selected (${membersToAdd.length})`}
                </Text>
              </Pressable>

              <Pressable style={styles.closeDialogBtn} onPress={() => setShowAddMemberModal(false)}>
                <Text style={styles.closeDialogBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 7: CREATE NEW GROUP MODAL                                           */}
        {/* ========================================================================= */}
        <Modal visible={showCreateGroupModal} transparent animationType="slide" onRequestClose={() => setShowCreateGroupModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateGroupModal(false)}>
            <View style={[styles.dialogCard, { maxHeight: '85%' }]}>
              <Text style={styles.dialogTitle}>Create New Group Chat</Text>
              <Text style={styles.dialogSubtitle}>Set up a team room for project coordination</Text>

              <Text style={styles.inputLabel}>GROUP NAME *</Text>
              <TextInput
                style={styles.dialogInput}
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="e.g. Sales Team, Product Launch, Core IT"
                placeholderTextColor={BRAND.textDim}
              />

              <Text style={styles.inputLabel}>SELECT TEAM MEMBERS ({selectedMembers.length})</Text>
              <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
                {contacts.map((c) => {
                  const isSelected = selectedMembers.includes(c.email);
                  return (
                    <Pressable
                      key={c.id}
                      style={[styles.memberSelectRow, isSelected && styles.memberSelectRowActive]}
                      onPress={() => {
                        setSelectedMembers((prev) =>
                          isSelected ? prev.filter((e) => e !== c.email) : [...prev, c.email]
                        );
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{c.name}</Text>
                        <Text style={styles.memberSub}>{c.role || 'Employee'} &middot; {c.department || 'General'}</Text>
                      </View>
                      <Text style={{ fontSize: 18 }}>{isSelected ? '✅' : '⚪'}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable
                style={[styles.confirmAddBtn, (!newGroupName.trim() || selectedMembers.length === 0) && { opacity: 0.5 }]}
                disabled={!newGroupName.trim() || selectedMembers.length === 0 || isCreatingGroup}
                onPress={handleCreateGroup}
              >
                <Text style={styles.confirmAddBtnText}>
                  {isCreatingGroup ? 'Creating Group...' : '🚀 Create Group Chat'}
                </Text>
              </Pressable>

              <Pressable style={styles.closeDialogBtn} onPress={() => setShowCreateGroupModal(false)}>
                <Text style={styles.closeDialogBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F030E',
  },
  // In-App Toast Banner
  toastBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: '#2B1022',
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastTitle: {
    color: BRAND.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  toastSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  toastAction: {
    color: BRAND.primaryLight,
    fontWeight: '800',
    fontSize: 13,
  },
  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  navBtn: {
    minWidth: 60,
  },
  navBtnText: {
    color: BRAND.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  screenHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  screenHeaderSub: {
    color: BRAND.textDim,
    fontSize: 11,
  },
  // Search Bar
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  // Segment Tabs
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: BRAND.primary,
  },
  segmentText: {
    color: BRAND.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#2B1022',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  sectionHeaderLabel: {
    color: BRAND.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 6,
  },
  // Chat Row Item
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(43, 16, 34, 0.72)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: BRAND.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BRAND.success,
    borderWidth: 2,
    borderColor: '#2B1022',
  },
  chatRowTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  chatRowMeta: {
    color: BRAND.textDim,
    fontSize: 11,
  },
  chatRowSub: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: BRAND.whatsappGreen,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  rowArrow: {
    color: BRAND.textDim,
    fontSize: 20,
    fontWeight: '800',
  },
  createGroupBtn: {
    backgroundColor: BRAND.whatsappGreen,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  createGroupBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: BRAND.textDim,
    fontSize: 13,
    textAlign: 'center',
  },
  // Active Chat Top Bar
  activeChatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#220B1C',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  backTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backArrow: {
    color: BRAND.primary,
    fontSize: 26,
    fontWeight: '700',
  },
  headerAvatarWrap: {
    position: 'relative',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  onlineHeaderDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND.success,
    borderWidth: 1.5,
    borderColor: '#220B1C',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 10,
  },
  chatHeaderName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  chatHeaderStatus: {
    color: BRAND.textDim,
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconBtnActive: {
    backgroundColor: BRAND.whatsappGreen,
  },
  privacyNoticeBanner: {
    backgroundColor: 'rgba(18, 140, 126, 0.18)',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.whatsappGreen,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  privacyNoticeText: {
    color: BRAND.whatsappLight,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Bubble Layout
  bubbleContainer: {
    marginVertical: 4,
    maxWidth: '82%',
  },
  bubbleContainerLeft: {
    alignSelf: 'flex-start',
  },
  bubbleContainerRight: {
    alignSelf: 'flex-end',
  },
  bubbleCard: {
    borderRadius: 16,
    padding: 10,
  },
  bubbleLeft: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderBottomLeftRadius: 3,
  },
  bubbleRight: {
    backgroundColor: BRAND.bubbleRight,
    borderBottomRightRadius: 3,
  },
  bubbleSecret: {
    borderWidth: 1,
    borderColor: BRAND.whatsappGreen,
  },
  groupSenderLabel: {
    color: BRAND.primary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  quotedReplyBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderLeftWidth: 3,
    borderLeftColor: BRAND.primary,
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
  },
  quotedAuthor: {
    color: BRAND.primaryLight,
    fontSize: 10.5,
    fontWeight: '800',
  },
  quotedText: {
    color: '#DDD',
    fontSize: 11,
  },
  // Secret Masked Card
  secretMaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(18, 140, 126, 0.18)',
    borderRadius: 10,
    padding: 10,
  },
  secretMaskTitle: {
    color: BRAND.whatsappLight,
    fontSize: 12.5,
    fontWeight: '800',
  },
  secretMaskSub: {
    color: '#AAA',
    fontSize: 10.5,
  },
  bubblePhoto: {
    width: 210,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  docAttachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
  },
  docIconBox: {
    marginRight: 8,
  },
  docFileName: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  docFileSize: {
    color: BRAND.textDim,
    fontSize: 10.5,
  },
  docDownloadBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  docDownloadBtnText: {
    color: '#2B1022',
    fontSize: 11,
    fontWeight: '800',
  },
  bubbleMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 19,
  },
  bubbleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  secretTimerText: {
    color: BRAND.whatsappLight,
    fontSize: 10,
    fontWeight: '800',
    marginRight: 4,
  },
  bubbleTimeText: {
    color: BRAND.textDim,
    fontSize: 10,
  },
  tickStatus: {
    color: BRAND.deliveredTick,
    fontSize: 11,
    fontWeight: '800',
  },
  tickStatusRead: {
    color: BRAND.readTick,
  },
  reactionPillsWrap: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    flexDirection: 'row',
    gap: 2,
    backgroundColor: '#2B1022',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  reactionEmojiBadge: {
    fontSize: 11,
  },
  emptyConversation: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyConversationText: {
    color: BRAND.textDim,
    fontSize: 13,
  },
  // Reply Banner
  replyBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(215, 171, 106, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: BRAND.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  replyBarTitle: {
    color: BRAND.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  replyBarText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  // Chat Input Container
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#220B1C',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    gap: 8,
  },
  attachClipBtn: {
    padding: 6,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13.5,
    maxHeight: 100,
  },
  chatSendBtn: {
    backgroundColor: BRAND.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendBtnDisabled: {
    opacity: 0.4,
  },
  chatSendBtnText: {
    color: '#2B1022',
    fontSize: 15,
    fontWeight: '800',
  },
  // Modals & Bottom Sheets
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: '#2B1022',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: BRAND.primary,
  },
  sheetHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  attachGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  attachGridItem: {
    alignItems: 'center',
  },
  attachIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  attachGridLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelSheetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelSheetBtnText: {
    color: BRAND.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  dialogCard: {
    backgroundColor: '#2B1022',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    alignSelf: 'center',
    width: '92%',
  },
  dialogTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  dialogSubtitle: {
    color: BRAND.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  inputLabel: {
    color: BRAND.primary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  dialogInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    color: '#FFFFFF',
    padding: 10,
    fontSize: 13,
  },
  docPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  docPickerName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  docPickerMeta: {
    color: BRAND.textDim,
    fontSize: 11,
  },
  docPickerSendIcon: {
    fontSize: 18,
  },
  closeDialogBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeDialogBtnText: {
    color: BRAND.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  // Reactions Sheet
  reactionActionSheet: {
    backgroundColor: '#2B1022',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    borderTopWidth: 1.5,
    borderTopColor: BRAND.primary,
  },
  emojiReactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  emojiBtn: {
    padding: 4,
  },
  msgActionList: {
    marginTop: 10,
  },
  msgActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  msgActionIcon: {
    fontSize: 20,
  },
  msgActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Photo Preview Overlay
  photoPreviewOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullPreviewImage: {
    width: '100%',
    height: '80%',
  },
  // Group Info Roster
  largeGroupAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupInfoSectionHeader: {
    color: BRAND.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  addMemberHeaderBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  addMemberHeaderBtnText: {
    color: '#2B1022',
    fontSize: 11,
    fontWeight: '800',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  memberSub: {
    color: BRAND.textDim,
    fontSize: 11,
  },
  adminBadge: {
    color: BRAND.primary,
    fontSize: 10.5,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: BRAND.primary,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  memberSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  memberSelectRowActive: {
    backgroundColor: 'rgba(215, 171, 106, 0.18)',
    borderWidth: 1,
    borderColor: BRAND.primary,
  },
  confirmAddBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmAddBtnText: {
    color: '#2B1022',
    fontSize: 14,
    fontWeight: '800',
  },
});
