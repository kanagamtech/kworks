import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  text: '#FFFFFF',
  textDim: '#CBAF8C',
  border: '#4A2040',
  whatsappGreen: '#128C7E',
  whatsappLightGreen: '#E2F7CB',
  bubbleLeft: 'rgba(255,255,255,0.08)',
  bubbleRight: 'rgba(215,171,106,0.22)',
  danger: '#E05050',
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
};

type ChatGroup = {
  id: string;
  name: string;
  members: string[]; // array of emails
  created_at: string;
};

type ChatMessage = {
  id: string;
  from: string;
  to: string; // email or group id
  text?: string;
  photo?: string; // base64 photo
  document?: {
    name: string;
    size: string;
  };
  timestamp: string;
};

const MOCK_DOCUMENTS = [
  { name: 'Monthly_Sales_Report.pdf', size: '1.2 MB' },
  { name: 'Kworks_Product_Design.pdf', size: '3.4 MB' },
  { name: 'Onboarding_Guidelines.docx', size: '420 KB' },
  { name: 'Leave_Policy_2026.pdf', size: '280 KB' },
];

export default function ChatScreen({ onBack, user }: Props) {
  const { scale } = useResponsive();
  const [activeSegment, setActiveSegment] = useState<'direct' | 'groups'>('direct');
  
  // Data States
  const [contacts, setContacts] = useState<EmployeeContact[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Selection States
  const [selectedContact, setSelectedContact] = useState<EmployeeContact | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  
  // Message Sending
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Modal states
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  // Create Group Form
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]); // array of emails
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const flatListRef = useRef<FlatList | null>(null);

  // Load contacts (employees)
  useEffect(() => {
    fetch(`${API_BASE}/api/employees`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const others = res.data.filter(
            (e: any) => e.email?.toLowerCase() !== user?.email?.toLowerCase()
          );
          setContacts(others);
        }
      })
      .catch(() => {});
  }, [user]);

  // Fetch groups on mount and whenever segment changes to groups
  const fetchGroups = () => {
    fetch(`${API_BASE}/api/chat/groups`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          // Filter groups where the current user is a member
          const myGroups = res.data.filter((g: ChatGroup) =>
            g.members?.some(
              (m) => m.toLowerCase() === user?.email?.toLowerCase()
            )
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

  // Message polling for active conversations
  useEffect(() => {
    if ((!selectedContact && !selectedGroup) || !user?.email) return;

    const fetchMessages = () => {
      fetch(`${API_BASE}/api/chat`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            let filtered: ChatMessage[] = [];
            if (selectedContact) {
              // Direct messages between current user & selected contact
              filtered = res.data.filter(
                (m: ChatMessage) =>
                  (m.from?.toLowerCase() === user.email?.toLowerCase() &&
                    m.to?.toLowerCase() === selectedContact.email?.toLowerCase()) ||
                  (m.from?.toLowerCase() === selectedContact.email?.toLowerCase() &&
                    m.to?.toLowerCase() === user.email?.toLowerCase())
              );
            } else if (selectedGroup) {
              // Group messages matching the group ID
              filtered = res.data.filter(
                (m: ChatMessage) => m.to === selectedGroup.id
              );
            }
            setMessages(filtered);
          }
        })
        .catch(() => {});
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedContact, selectedGroup, user]);

  const handleSendMessage = (customPayload?: Partial<ChatMessage>) => {
    if (!selectedContact && !selectedGroup) return;
    if (!inputText.trim() && !customPayload && !isSending) return;

    setIsSending(true);
    const toId = selectedContact ? selectedContact.email : selectedGroup!.id;
    const payload = {
      from: user?.email ?? 'guest@kworks.com',
      to: toId,
      text: inputText.trim() || undefined,
      ...customPayload,
    };

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

  const handleSelectMockDoc = (doc: { name: string; size: string }) => {
    setShowDocPicker(false);
    handleSendMessage({
      document: doc,
      text: doc.name,
    });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Group Name Required', 'Please enter a group name.');
      return;
    }
    if (selectedMembers.length === 0) {
      Alert.alert('Members Required', 'Please select at least one group member.');
      return;
    }

    setIsCreatingGroup(true);
    // Group members includes selected members + current user
    const groupPayload = {
      name: newGroupName.trim(),
      members: [...selectedMembers, user!.email],
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
          Alert.alert('Success', 'Group created successfully!');
          setNewGroupName('');
          setSelectedMembers([]);
          setShowCreateGroupModal(false);
          fetchGroups();
        }
      })
      .catch(() => {
        setIsCreatingGroup(false);
        Alert.alert('Error', 'Network error. Could not create group.');
      });
  };

  const toggleMemberSelection = (email: string) => {
    setSelectedMembers((prev) =>
      prev.includes(email) ? prev.filter((m) => m !== email) : [...prev, email]
    );
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.root}>
      <MorningBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Contact/Groups List screen */}
        {!selectedContact && !selectedGroup ? (
          <View style={{ flex: 1 }}>
            <View style={[styles.topBar, { paddingTop: 44 }]}>
              <Pressable onPress={onBack} style={styles.backBtn}>
                <Text style={styles.backText}>{'<'} Back</Text>
              </Pressable>
              <Text style={styles.title}>Company Chat</Text>
              <View style={styles.backBtn} />
            </View>

            {/* Segment Controls */}
            <View style={styles.segmentRow}>
              <Pressable
                style={[styles.segmentBtn, activeSegment === 'direct' && styles.segmentBtnActive]}
                onPress={() => setActiveSegment('direct')}
              >
                <Text style={[styles.segmentText, activeSegment === 'direct' && styles.segmentTextActive]}>
                  Direct Messages
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segmentBtn, activeSegment === 'groups' && styles.segmentBtnActive]}
                onPress={() => setActiveSegment('groups')}
              >
                <Text style={[styles.segmentText, activeSegment === 'groups' && styles.segmentTextActive]}>
                  Group Chats
                </Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {activeSegment === 'direct' ? (
                <>
                  <Text style={styles.sectionTitle}>EMPLOYEES DIRECTORY</Text>
                  {contacts.length === 0 ? (
                    <Text style={styles.emptyText}>No other onboarded employees found.</Text>
                  ) : (
                    contacts.map((contact) => (
                      <Pressable
                        key={contact.id}
                        style={styles.contactRow}
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
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          <Text style={styles.contactSub}>{contact.role || 'Employee'} &middot; {contact.department || 'General'}</Text>
                        </View>
                        <Text style={styles.chatArrow}>{'>'}</Text>
                      </Pressable>
                    ))
                  )}
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>MY GROUPS</Text>
                    <Pressable
                      style={styles.createGroupHeaderBtn}
                      onPress={() => setShowCreateGroupModal(true)}
                    >
                      <Text style={styles.createGroupHeaderBtnText}>+ Create Group</Text>
                    </Pressable>
                  </View>

                  {groups.length === 0 ? (
                    <Text style={styles.emptyText}>You haven't joined any group chats yet.</Text>
                  ) : (
                    groups.map((group) => (
                      <Pressable
                        key={group.id}
                        style={styles.contactRow}
                        onPress={() => setSelectedGroup(group)}
                      >
                        <View style={styles.avatarWrap}>
                          <View style={[styles.avatarFallback, { backgroundColor: BRAND.primary }]}>
                            <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>G</Text>
                          </View>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.contactName}>{group.name}</Text>
                          <Text style={styles.contactSub}>{group.members.length} members</Text>
                        </View>
                        <Text style={styles.chatArrow}>{'>'}</Text>
                      </Pressable>
                    ))
                  )}
                </>
              )}
            </ScrollView>
          </View>
        ) : (
          /* Active chat view */
          <View style={{ flex: 1 }}>
            <View style={[styles.chatBar, { paddingTop: 44 }]}>
              <Pressable
                onPress={() => {
                  setSelectedContact(null);
                  setSelectedGroup(null);
                  setMessages([]);
                }}
                style={styles.backBtn}
              >
                <Text style={styles.backText}>{'<'} Back</Text>
              </Pressable>
              <View style={styles.headerInfo}>
                <Text style={styles.chatTitle} numberOfLines={1}>
                  {selectedContact ? selectedContact.name : selectedGroup!.name}
                </Text>
                <Text style={styles.chatSub} numberOfLines={1}>
                  {selectedContact ? selectedContact.role || 'Employee' : 'Group Chat'}
                </Text>
              </View>
              <View style={styles.backBtn} />
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
              renderItem={({ item }) => {
                const mine = item.from?.toLowerCase() === user?.email?.toLowerCase();
                const senderName = contacts.find(c => c.email.toLowerCase() === item.from.toLowerCase())?.name || item.from;

                return (
                  <View style={[styles.bubbleWrap, mine ? styles.bubbleRightWrap : styles.bubbleLeftWrap]}>
                    <View style={[styles.bubble, mine ? styles.bubbleRight : styles.bubbleLeft]}>
                      {/* Show sender name if in group chat */}
                      {selectedGroup && !mine && (
                        <Text style={styles.bubbleSenderName}>{senderName}</Text>
                      )}

                      {/* Render Photo */}
                      {item.photo && (
                        <Image source={{ uri: item.photo }} style={styles.bubbleImage} />
                      )}

                      {/* Render Document */}
                      {item.document && (
                        <View style={styles.docBox}>
                          <Text style={{ fontSize: 24, marginRight: 8 }}>📄</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.docName} numberOfLines={1}>{item.document.name}</Text>
                            <Text style={styles.docSize}>{item.document.size}</Text>
                          </View>
                        </View>
                      )}

                      {/* Render text caption */}
                      {item.text && (!item.document || item.text !== item.document.name) && (
                        <Text style={styles.bubbleText}>{item.text}</Text>
                      )}

                      <View style={styles.bubbleMeta}>
                        <Text style={styles.bubbleTime}>{formatTime(item.timestamp)}</Text>
                        {mine && <Text style={styles.doubleTick}>✓✓</Text>}
                      </View>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No messages yet. Send a message to start conversation!</Text>
              }
            />

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <Pressable style={styles.attachBtn} onPress={() => setShowAttachMenu(true)}>
                <Text style={styles.attachBtnText}>+</Text>
              </Pressable>

              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor={BRAND.textDim}
                multiline
              />
              <Pressable
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={() => handleSendMessage()}
                disabled={!inputText.trim()}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Attachment Options Modal Sheet */}
        <Modal visible={showAttachMenu} transparent animationType="slide" onRequestClose={() => setShowAttachMenu(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowAttachMenu(false)}>
            <View style={styles.sheetContent}>
              <Text style={styles.sheetTitle}>Send Attachment</Text>
              <Pressable style={styles.sheetRow} onPress={handlePickPhoto}>
                <Text style={styles.sheetIcon}>📷</Text>
                <Text style={styles.sheetText}>Send Photo / Receipt</Text>
              </Pressable>
              <Pressable
                style={styles.sheetRow}
                onPress={() => {
                  setShowAttachMenu(false);
                  setShowDocPicker(true);
                }}
              >
                <Text style={styles.sheetIcon}>📄</Text>
                <Text style={styles.sheetText}>Send Document File</Text>
              </Pressable>
              <Pressable style={[styles.sheetRow, { borderBottomWidth: 0 }]} onPress={() => setShowAttachMenu(false)}>
                <Text style={[styles.sheetText, { color: BRAND.danger, fontWeight: 'bold', width: '100%', textAlign: 'center' }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Mock Document Picker Modal */}
        <Modal visible={showDocPicker} transparent animationType="fade" onRequestClose={() => setShowDocPicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowDocPicker(false)}>
            <View style={[styles.sheetContent, { maxHeight: '60%' }]}>
              <Text style={styles.sheetTitle}>Select Document</Text>
              {MOCK_DOCUMENTS.map((doc, idx) => (
                <Pressable
                  key={idx}
                  style={styles.sheetRow}
                  onPress={() => handleSelectMockDoc(doc)}
                >
                  <Text style={styles.sheetIcon}>📄</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{doc.name}</Text>
                    <Text style={{ color: BRAND.textDim, fontSize: 11 }}>{doc.size}</Text>
                  </View>
                </Pressable>
              ))}
              <Pressable style={[styles.sheetRow, { borderBottomWidth: 0 }]} onPress={() => setShowDocPicker(false)}>
                <Text style={[styles.sheetText, { color: BRAND.danger, fontWeight: 'bold', width: '100%', textAlign: 'center' }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Create Group Modal */}
        <Modal visible={showCreateGroupModal} transparent animationType="slide" onRequestClose={() => setShowCreateGroupModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.groupModalCard}>
              <Text style={styles.groupModalTitle}>Create New Group</Text>
              
              <Text style={styles.groupLabel}>GROUP NAME</Text>
              <TextInput
                style={styles.groupInput}
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="e.g. Sales Team"
                placeholderTextColor={BRAND.textDim}
              />

              <Text style={styles.groupLabel}>SELECT GROUP MEMBERS</Text>
              <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
                {contacts.map((contact) => {
                  const isSelected = selectedMembers.includes(contact.email);
                  return (
                    <Pressable
                      key={contact.id}
                      style={[styles.memberRow, isSelected && styles.memberRowActive]}
                      onPress={() => toggleMemberSelection(contact.email)}
                    >
                      <Text style={styles.memberName}>{contact.name}</Text>
                      <Text style={{ color: BRAND.primary }}>{isSelected ? '✓ Selected' : '+ Add'}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  style={[styles.groupBtn, { backgroundColor: BRAND.danger }]}
                  onPress={() => {
                    setShowCreateGroupModal(false);
                    setNewGroupName('');
                    setSelectedMembers([]);
                  }}
                >
                  <Text style={styles.groupBtnText}>Cancel</Text>
                </Pressable>
                
                {isCreatingGroup ? (
                  <ActivityIndicator color={BRAND.primary} style={{ flex: 1 }} />
                ) : (
                  <Pressable
                    style={[styles.groupBtn, { backgroundColor: BRAND.primary, flex: 1 }]}
                    onPress={handleCreateGroup}
                  >
                    <Text style={styles.groupBtnText}>Create Group</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { minWidth: 80 },
  backText: { color: BRAND.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: BRAND.primary },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42,16,36,0.5)',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    padding: 6,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentBtnActive: { backgroundColor: BRAND.primary },
  segmentText: { color: BRAND.textDim, fontWeight: '700', fontSize: 13 },
  segmentTextActive: { color: '#FFFFFF' },
  listContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.primary,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42,16,36,0.65)',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  createGroupHeaderBtn: { backgroundColor: 'rgba(215,171,106,0.15)', borderWidth: 1, borderColor: BRAND.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  createGroupHeaderBtnText: { color: BRAND.primary, fontSize: 11, fontWeight: '800' },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { width: '100%', height: '100%', backgroundColor: BRAND.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BRAND.primary, fontSize: 18, fontWeight: '800' },
  contactName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  contactSub: { fontSize: 11, color: BRAND.textDim, marginTop: 2 },
  chatArrow: { fontSize: 16, color: BRAND.primary, fontWeight: '600' },
  emptyText: { color: BRAND.textDim, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  chatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(26,9,22,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  headerInfo: { alignItems: 'center', flex: 1 },
  chatTitle: { fontSize: 16, fontWeight: '800', color: BRAND.primary },
  chatSub: { fontSize: 11, color: BRAND.textDim, marginTop: 1 },
  bubbleWrap: { flexDirection: 'row', width: '100%', marginVertical: 4 },
  bubbleLeftWrap: { justifyContent: 'flex-start' },
  bubbleRightWrap: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleLeft: {
    backgroundColor: BRAND.bubbleLeft,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.15)',
  },
  bubbleRight: {
    backgroundColor: BRAND.bubbleRight,
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(215,171,106,0.3)',
  },
  bubbleSenderName: { fontSize: 11, fontWeight: 'bold', color: BRAND.primary, marginBottom: 4 },
  bubbleImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 6, resizeMode: 'cover' },
  bubbleText: { color: '#FFFFFF', fontSize: 14, lineHeight: 18 },
  bubbleMeta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 },
  bubbleTime: { fontSize: 9, color: BRAND.textDim },
  doubleTick: { fontSize: 9, color: BRAND.primary, fontWeight: 'bold' },
  docBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 8, padding: 8, marginBottom: 4 },
  docName: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  docSize: { color: BRAND.textDim, fontSize: 10 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(26,9,22,0.95)',
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    gap: 8,
  },
  attachBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(215,171,106,0.15)', alignItems: 'center', justifyContent: 'center' },
  attachBtnText: { color: BRAND.primary, fontSize: 22, fontWeight: 'bold' },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(42,16,36,0.65)',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: { backgroundColor: BRAND.primary, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10, justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetContent: { backgroundColor: '#210B1B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 2, borderTopColor: BRAND.primary },
  sheetTitle: { color: BRAND.primary, fontSize: 15, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BRAND.border, gap: 12 },
  sheetIcon: { fontSize: 20 },
  sheetText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  groupModalCard: { backgroundColor: '#210B1B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 2, borderTopColor: BRAND.primary, width: '100%' },
  groupModalTitle: { color: BRAND.primary, fontSize: 16, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  groupLabel: { fontSize: 11, fontWeight: '700', color: BRAND.textDim, letterSpacing: 0.5, marginTop: 10, marginBottom: 6 },
  groupInput: { backgroundColor: 'rgba(26,9,22,0.6)', borderWidth: 1, borderColor: BRAND.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#FFFFFF', fontSize: 14, marginBottom: 12 },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(74,32,64,0.3)', paddingHorizontal: 4 },
  memberRowActive: { backgroundColor: 'rgba(215,171,106,0.08)' },
  memberName: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  groupBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  groupBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
