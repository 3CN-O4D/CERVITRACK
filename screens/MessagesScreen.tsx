import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getItem, setItem } from '../services/storage';
import { supabase } from '../lib/supabase/client';
import {
  getChatContacts,
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage as apiSendMessage,
  onMessagesInsert,
} from '../services/api';

const { width } = Dimensions.get('window');

interface Contact {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  hospital?: string;
  online: boolean;
  lastMessage: string;
  lastTime: string;
  unread: number;
  initials: string;
}

interface Message {
  id: string;
  type: 'text' | 'image' | 'audio';
  content: string;
  sent: boolean;
  time: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: number;
}

const SEED_CONTACTS: any[] = [];

const CONTACTS_KEY = '@cervitrack_contacts';

const avatarColors = ['#6C5CE7', '#00C853', '#FF4D4D', '#FFB800', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];

function getAvatarColor(id: string) {
  return avatarColors[parseInt(id) % avatarColors.length];
}

function getCurrentTime() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatTimeAgo(dateStr: string) {
  const now = new Date();
  const parts = dateStr.split(/[: ]/);
  let h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const ampm = parts[2];
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const msgDate = new Date();
  msgDate.setHours(h, m, 0);
  const diff = (now.getTime() - msgDate.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return dateStr;
}

function StatusIcon({ status }: { status: 'sent' | 'delivered' | 'read' }) {
  if (status === 'sent') return <Ionicons name="checkmark" size={14} color="#7E84A3" />;
  if (status === 'delivered') return <Ionicons name="checkmark-done" size={14} color="#7E84A3" />;
  return <Ionicons name="checkmark-done" size={14} color="#6C5CE7" />;
}

/* ─── MessagesList ─── */

export default function MessagesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      // Fetch approved clinicians from providers table
      try {
        const { searchClinicians } = await import('../services/api');
        const clinicians = await searchClinicians();
        if (clinicians && clinicians.length > 0) {
          const mapped: Contact[] = clinicians.map((c: any) => ({
            id: String(c.id),
            name: c.name,
            role: 'Clinician',
            specialty: c.specialty || '',
            hospital: c.hospital || '',
            online: true,
            lastMessage: 'Tap to start chatting',
            lastTime: '',
            unread: 0,
            initials: c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          }));
          setContacts(mapped);
          await setItem(`${CONTACTS_KEY}_${user?.id || 'default'}`, JSON.stringify(mapped));
          setLoaded(true);
          return;
        }
      } catch { /* fall through */ }

      // Fallback: try chat_contacts table
      try {
        const dbContacts = await getChatContacts();
        if (dbContacts && dbContacts.length > 0) {
          const mapped: Contact[] = dbContacts.map((c: any) => ({
            id: String(c.id),
            name: c.name,
            role: c.role || 'Provider',
            specialty: c.specialty || '',
            hospital: c.hospital || '',
            online: c.online ?? false,
            lastMessage: 'Tap to start chatting',
            lastTime: '',
            unread: 0,
            initials: c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          }));
          setContacts(mapped);
          await setItem(`${CONTACTS_KEY}_${user?.id || 'default'}`, JSON.stringify(mapped));
          setLoaded(true);
          return;
        }
      } catch { /* fall through */ }

      // Fallback to local storage
      const uid = user?.id || 'default';
      const raw = await getItem(`${CONTACTS_KEY}_${uid}`);
      if (raw) {
        setContacts(JSON.parse(raw));
      }
      setLoaded(true);
    })();
  }, [user?.id]);

  // Refresh contacts from AsyncStorage every time screen focuses
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const uid = user?.id || 'default';
      const raw = await getItem(`${CONTACTS_KEY}_${uid}`);
      if (raw) setContacts(JSON.parse(raw));
    });
    return unsubscribe;
  }, [navigation, user?.id]);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase()),
  );

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={[s.contactItem, { borderBottomColor: colors.border }]}
      onPress={() => navigation.navigate('ChatDetail', { contact: item })}
      activeOpacity={0.7}
    >
      <View style={s.avatarWrap}>
        <View style={[s.contactAvatar, { backgroundColor: getAvatarColor(item.id) }]}>
          <Text style={s.contactInitials}>{item.initials}</Text>
        </View>
        {item.online && <View style={s.onlineDot} />}
      </View>
      <View style={s.contactInfo}>
        <View style={s.contactRow}>
          <Text style={[s.contactName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[s.contactTime, { color: colors.textSecondary }]}>{item.lastTime}</Text>
        </View>
        {item.specialty ? (
          <Text style={[s.contactSpecialty, { color: colors.primary }]} numberOfLines={1}>
            {item.specialty} · {item.hospital}
          </Text>
        ) : null}
        <View style={s.contactRow}>
          <Text style={[s.contactPreview, { color: colors.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unread > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={s.mlistHeader}>
        <Text style={[s.mlistTitle, { color: colors.text }]}>Messages</Text>
      </View>

      <View style={[s.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[s.searchInput, { color: colors.text }]}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
      />
    </View>
  );
}

/* ─── ChatDetail ─── */

export function ChatDetail({ navigation, route }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { contact } = route.params as { contact: Contact };
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const uid = user?.id || 'default';
  const msgStorageKey = `@cervitrack_msgs_${uid}_${contact.id}`;
  const contactsKey = `${CONTACTS_KEY}_${uid}`;
  const [conversationId, setConversationId] = useState<number | null>(null);

  // Create or get conversation from Supabase
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      // First, find or create a chat_contacts entry for this provider
      let chatContactId: number | null = null;
      try {
        const { data: existing } = await supabase
          .from('chat_contacts')
          .select('id')
          .eq('name', contact.name)
          .maybeSingle();
        if (existing) {
          chatContactId = existing.id;
        } else {
          const { data: newContact } = await supabase
            .from('chat_contacts')
            .insert({
              name: contact.name,
              role: contact.role || 'clinician',
              specialty: contact.specialty || '',
              hospital: contact.hospital || '',
              online: contact.online ?? true,
            })
            .select('id')
            .single();
          if (newContact) chatContactId = newContact.id;
        }
      } catch { /* continue without chat_contacts */ }

      if (chatContactId) {
        try {
          const conv = await getOrCreateConversation(
            user.id, chatContactId, contact.name, contact.role, contact.online,
          );
          if (conv) {
            setConversationId(conv.id);
            const dbMessages = await getMessages(conv.id);
            if (dbMessages && dbMessages.length > 0) {
              const mapped: Message[] = dbMessages.map((m: any) => ({
                id: String(m.id),
                type: m.message_type || 'text',
                content: m.content || '',
                sent: m.sender_id === user.id,
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read' as const,
                createdAt: new Date(m.created_at).getTime(),
              }));
              setMessages(mapped);
              setLoaded(true);
              return;
            }
          }
        } catch { /* fall through to local */ }
      }

      // Fallback to local storage
      const raw = await getItem(msgStorageKey);
      if (raw) {
        try { setMessages(JSON.parse(raw)); } catch {}
      }
      setLoaded(true);
    })();
  }, [msgStorageKey, user?.id, contact.id]);

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!conversationId || !user?.id) return;
    const sub = onMessagesInsert(conversationId, (msg: any) => {
      if (msg.sender_id === user.id) return; // skip own messages (already added)
      const incoming: Message = {
        id: String(msg.id),
        type: msg.message_type || 'text',
        content: msg.content || '',
        sent: false,
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
        createdAt: new Date(msg.created_at).getTime(),
      };
      setMessages((prev) => [...prev, incoming]);
    });
    return () => { sub.unsubscribe(); };
  }, [conversationId, user?.id]);

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      setItem(msgStorageKey, JSON.stringify(messages));
    }
  }, [messages, msgStorageKey]);

  const updateContactLastMessage = useCallback(async (text: string) => {
    const raw = await getItem(contactsKey);
    if (!raw) return;
    const list: Contact[] = JSON.parse(raw);
    const idx = list.findIndex((c) => c.id === contact.id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        lastMessage: text,
        lastTime: 'Just now',
        unread: 0,
      };
      await setItem(contactsKey, JSON.stringify(list));
    }
  }, [contactsKey, contact.id]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    const now = Date.now();
    const newMsg: Message = {
      id: now.toString(),
      type: 'text',
      content: text,
      sent: true,
      time: getCurrentTime(),
      status: 'sent',
      createdAt: now,
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText('');
    updateContactLastMessage(text);

    // Send to Supabase if we have a conversation
    if (conversationId && user?.id) {
      try {
        await apiSendMessage(text, conversationId, user.id, 'user');
      } catch { /* sent locally, will sync later */ }
    }

    // Simulate delivery/read status
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m));
    }, 1500);
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === newMsg.id ? { ...m, status: 'read' as const } : m));
    }, 3000);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[s.msgRow, item.sent ? s.msgSent : s.msgReceived]}>
      {item.type === 'text' && (
        <View
          style={[
            s.msgBubble,
            item.sent
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
          ]}
        >
          <Text style={[s.msgText, { color: item.sent ? '#FFF' : colors.text }]}>{item.content}</Text>
        </View>
      )}
      {item.type === 'image' && (
        <View style={[s.imageBubble, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
          <Text style={[s.imageLabel, { color: colors.textSecondary }]}>Image</Text>
        </View>
      )}
      {item.type === 'audio' && (
        <View style={[s.audioBubble, { backgroundColor: item.sent ? colors.primary + '20' : colors.inputBg }]}>
          <TouchableOpacity style={[s.playBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="play" size={14} color="#FFF" />
          </TouchableOpacity>
          <View style={s.audioWave}>
            <View style={[s.waveBar, { backgroundColor: item.sent ? colors.primary : colors.textSecondary }]} />
            <View style={[s.waveBar, { height: 18, backgroundColor: item.sent ? colors.primary : colors.textSecondary }]} />
            <View style={[s.waveBar, { backgroundColor: item.sent ? colors.primary : colors.textSecondary }]} />
            <View style={[s.waveBar, { height: 14, backgroundColor: item.sent ? colors.primary : colors.textSecondary }]} />
            <View style={[s.waveBar, { backgroundColor: item.sent ? colors.primary : colors.textSecondary }]} />
          </View>
          <Text style={[s.audioDuration, { color: colors.textSecondary }]}>{item.content}</Text>
        </View>
      )}
      <View style={s.msgMeta}>
        <Text style={[s.msgTime, { color: colors.textSecondary }]}>{item.time}</Text>
        {item.sent && <StatusIcon status={item.status} />}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[s.chatContainer, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[s.chatHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[s.chatAvatar, { backgroundColor: getAvatarColor(contact.id) }]}>
          <Text style={s.contactInitials}>{contact.initials}</Text>
        </View>
        <View style={s.chatHeaderInfo}>
          <Text style={[s.chatHeaderName, { color: colors.text }]}>{contact.name}</Text>
          <Text style={[s.chatHeaderStatus, { color: contact.online ? colors.success : colors.textSecondary }]}>
            {contact.online ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={s.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          loaded ? (
            <View style={s.emptyChat}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={colors.textSecondary} />
              <Text style={[s.emptyChatText, { color: colors.textSecondary }]}>
                No messages yet. Send a message to start.
              </Text>
            </View>
          ) : null
        }
      />

      <View style={[s.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={[s.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <TextInput
            style={[s.chatInput, { color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
        </View>
        {inputText.trim() ? (
          <TouchableOpacity style={[s.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSend}>
            <Ionicons name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.micBtn}>
            <Ionicons name="mic-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

/* ─── Styles ─── */

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  mlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mlistTitle: { fontSize: 26, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  listContent: { paddingBottom: 20 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatarWrap: { position: 'relative', marginRight: 14 },
  contactAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitials: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  onlineDot: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: '#00C853',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  contactInfo: { flex: 1 },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: { fontSize: 15, fontWeight: '700', flex: 1 },
  contactTime: { fontSize: 11, fontWeight: '500', marginLeft: 8 },
  contactSpecialty: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  contactPreview: { fontSize: 13, fontWeight: '500', flex: 1 },
  unreadBadge: {
    backgroundColor: '#6C5CE7',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  chatContainer: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  backBtn: { padding: 4, marginRight: 8 },
  chatAvatar: {
    width: 40, height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 15, fontWeight: '700' },
  chatHeaderStatus: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 12 },
  emptyChat: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyChatText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  msgRow: { marginBottom: 12, maxWidth: '80%' },
  msgSent: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgReceived: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  msgBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  msgText: { fontSize: 15, fontWeight: '500', lineHeight: 20 },
  imageBubble: {
    width: 160, height: 120,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  imageLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  audioBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    gap: 8,
    minWidth: 160,
  },
  playBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  audioWave: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  waveBar: { width: 3, height: 22, borderRadius: 2 },
  audioDuration: { fontSize: 11, fontWeight: '600' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: 4 },
  msgTime: { fontSize: 10, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 8,
  },
  chatInput: { flex: 1, fontSize: 15, fontWeight: '500', maxHeight: 80, paddingVertical: 8 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  micBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
});
