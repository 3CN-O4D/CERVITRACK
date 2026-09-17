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
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getItemEnc, setItemEnc } from '../services/storage';
import { supabase } from '../lib/supabase/client';
import { uploadToCloudinary } from '../lib/cloudinary';
import * as ImagePicker from 'expo-image-picker';
import { saveImageLocally, uploadMediaToCloudinary } from '../services/mediaStore';
import {
  getChatContacts,
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage as apiSendMessage,
  sendImageMessage as apiSendImageMessage,
  onConversationChanges,
  editMessage as apiEditMessage,
  deleteMessageForEveryone as apiDeleteMessageForEveryone,
  deleteMessageForMe as apiDeleteMessageForMe,
  markConversationReadClient,
} from '../services/api';
import { saveMessage as saveMessageLocal, getMessageByRemoteId, upsertLocalMessage } from '../services/localDb';

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
  localId?: number;
  remoteId?: string;
  type: 'text' | 'image' | 'audio';
  content: string;
  fileUrl?: string;
  localUri?: string;
  sent: boolean;
  time: string;
  status: 'sent' | 'delivered' | 'read';
  edited?: boolean;
  deleted?: boolean;
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

function formatDayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function sameDay(a: number, b: number) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

/* ─── MessagesList ─── */

export default function MessagesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
            online: false,
            lastMessage: 'Tap to start chatting',
            lastTime: '',
            unread: 0,
            initials: c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          }));
          setContacts(mapped);
          await setItemEnc(`${CONTACTS_KEY}_${user?.id || 'default'}`, JSON.stringify(mapped));
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
          await setItemEnc(`${CONTACTS_KEY}_${user?.id || 'default'}`, JSON.stringify(mapped));
          setLoaded(true);
          return;
        }
      } catch { /* fall through */ }

      // Fallback to local storage
      const uid = user?.id || 'default';
      const raw = await getItemEnc(`${CONTACTS_KEY}_${uid}`);
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
      const raw = await getItemEnc(`${CONTACTS_KEY}_${uid}`);
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
    <View style={[s.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
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
  const insets = useSafeAreaInsets();
  const { contact } = route.params as { contact: Contact };
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const flatListRef = useRef<FlatList>(null);


  const uid = user?.id || 'default';
  const msgStorageKey = `@cervitrack_msgs_${uid}_${contact.id}`;
  const contactsKey = `${CONTACTS_KEY}_${uid}`;
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversationRemoteId, setConversationRemoteId] = useState<string>('');
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);

  const mapRow = (m: any): Message => ({
    id: String(m.id),
    localId: m.id,
    remoteId: m.remote_id ? String(m.remote_id) : undefined,
    type: m.message_type || 'text',
    content: m.content || '',
    fileUrl: m.file_url || '',
    localUri: m.local_uri || '',
    sent: m.sender_id === user?.id,
    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: (['delivered', 'read'].includes(m.status) ? m.status : 'sent') as Message['status'],
    edited: !!m.edited,
    deleted: m.deleted === 0 ? undefined : !!m.deleted,
    createdAt: new Date(m.created_at).getTime(),
  });

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
            if (conv.remote_id) setConversationRemoteId(String(conv.remote_id));
            const dbMessages = await getMessages(conv.id, user.id);
            if (dbMessages && dbMessages.length > 0) {
              setMessages(dbMessages.map(mapRow));
              setLoaded(true);
              if (conv.remote_id) markConversationReadClient(String(conv.remote_id));
              return;
            }
          }
        } catch { /* fall through to local */ }
      }

      // Fallback to local storage
      const raw = await getItemEnc(msgStorageKey);
      if (raw) {
        try { setMessages(JSON.parse(raw)); } catch {}
      }
      setLoaded(true);
    })();
  }, [msgStorageKey, user?.id, contact.id]);

  // Realtime subscription for incoming messages + status/edit/delete updates
  useEffect(() => {
    if (!conversationId || !user?.id) return;
    const sub = onConversationChanges(conversationId, (msg: any, event) => {
      if (event === 'INSERT') {
        if (msg.sender_id === user.id) return; // skip own messages (already added)
        if (Array.isArray(msg.hidden_for) && msg.hidden_for.includes(user.id)) return;
        const incoming: Message = {
          id: String(msg.id),
          remoteId: String(msg.id),
          type: msg.message_type || 'text',
          content: msg.content || '',
          fileUrl: msg.file_url || '',
          sent: false,
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
          createdAt: new Date(msg.created_at).getTime(),
        };
        setMessages((prev) => {
          if (prev.some((p) => p.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        try {
          if (msg.sender_type === 'staff' && conversationRemoteId) {
            markConversationReadClient(conversationRemoteId);
          }
        } catch { /* ignore */ }
      } else {
        const dbMsg = getMessageByRemoteId(String(msg.id));
        setMessages((prev) => prev.map((p) => {
          if (p.remoteId !== String(msg.id)) return p;
          if (msg.deleted_at) {
            return { ...p, deleted: true, content: '' };
          }
          if (msg.sender_id === user.id) {
            return {
              ...p,
              status: (['delivered', 'read'].includes(msg.status) ? msg.status : 'sent') as Message['status'],
              edited: !!msg.edited_at && p.edited,
            };
          }
          return { ...p, content: msg.content || p.content, edited: !!msg.edited_at, status: 'read' };
        }));
        if (dbMsg) {
          try {
            upsertLocalMessage({
              ...dbMsg,
              content: msg.content ?? dbMsg.content,
              status: msg.status || dbMsg.status || 'sent',
              edited: msg.edited_at ? 1 : (dbMsg.edited || 0),
              deleted: msg.deleted_at ? 1 : (dbMsg.deleted || 0),
              read: 1,
              hidden: dbMsg.hidden || 0,
              remote_id: String(msg.id),
              sync_status: 'synced',
            }, 'synced');
          } catch { /* best-effort */ }
        }
      }
    });
    return () => { sub.unsubscribe(); };
  }, [conversationId, user?.id, conversationRemoteId]);

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      setItemEnc(msgStorageKey, JSON.stringify(messages));
    }
  }, [messages, msgStorageKey]);

  const updateContactLastMessage = useCallback(async (text: string) => {
    const raw = await getItemEnc(contactsKey);
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
      await setItemEnc(contactsKey, JSON.stringify(list));
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
        const sent = await apiSendMessage(text, conversationId, user.id, 'user');
        if (sent?.id) {
          setMessages((prev) => prev.map((m) => m.id === newMsg.id
            ? { ...m, id: `remote_${sent.id}`, remoteId: String(sent.id) }
            : m));
        }
      } catch { /* sent locally, will sync later */ }
    }
  };

  const handleConfirmEdit = async () => {
    if (!editing) return;
    const text = inputText.trim();
    if (!text) return;
    const editingId = editing.id;
    setEditing(null);
    if (user?.id) {
      try {
        await apiEditMessage(editingId, text, user.id);
      } catch { /* best-effort */ }
    }
    setMessages((prev) => prev.map((m) => m.localId === editingId ? { ...m, content: text, edited: true } : m));
    setInputText('');
    updateContactLastMessage(text);
  };

  const handleMessageAction = (item: Message) => {
    const options: any[] = [];
    if (!item.deleted) {
      if (item.sent && item.localId !== undefined) {
        options.push(
          { text: 'Edit', onPress: () => { setEditing({ id: item.localId!, text: item.content }); setInputText(item.content); } },
          { text: 'Delete for everyone', style: 'destructive', onPress: () => confirmDelete(item, 'everyone') },
        );
      }
      if (item.localId !== undefined) {
        options.push({ text: 'Delete for me', style: 'destructive', onPress: () => confirmDelete(item, 'me') });
      }
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Message', undefined, options);
  };

  const confirmDelete = (item: Message, mode: 'me' | 'everyone') => {
    const msg = mode === 'everyone' ? 'This deletes the message for everyone. This cannot be undone.' : 'Remove this message from your device.';
    Alert.alert(
      mode === 'everyone' ? 'Delete for everyone?' : 'Delete for me?',
      msg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            if (item.localId === undefined) return;
            try {
              if (mode === 'everyone') {
                if (user?.id) await apiDeleteMessageForEveryone(item.localId, user.id);
              } else {
                await apiDeleteMessageForMe(item.localId);
              }
            } catch { /* best-effort */ }
            setMessages((prev) => prev.filter((m) => m.id !== item.id));
          },
        },
      ],
    );
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll access to send images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const now = Date.now();
    const msgId = now.toString();

    // Save locally first
    const localPath = await saveImageLocally(asset.uri, msgId);

    const newMsg: Message = {
      id: msgId,
      type: 'image',
      content: 'Photo',
      localUri: localPath,
      sent: true,
      time: getCurrentTime(),
      status: 'sent',
      createdAt: now,
    };
    setMessages((prev) => [...prev, newMsg]);
    updateContactLastMessage('📷 Photo');

    // Upload to Cloudinary + send to Supabase
    if (conversationId && user?.id) {
      try {
        const cloudUrl = await uploadMediaToCloudinary(localPath, 'image');
        const fileUrl = cloudUrl || localPath;
        await apiSendImageMessage('Photo', conversationId, user.id, fileUrl, 'user');
      } catch { /* sent locally, will sync later */ }
    }
  };

  const handleStartRecording = async () => {
    Alert.alert('Coming Soon', 'Voice recording will be available in the next update.');
  };

  const handleStopRecording = async () => {
  };

  const handlePlayAudio = async (msg: Message) => {
    Alert.alert('Coming Soon', 'Audio playback will be available in the next update.');
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const prev = index > 0 ? messages[index - 1] : null;
    const showDay = !prev || !sameDay(prev.createdAt, item.createdAt);

    const bubble =
      item.type === 'text' ? (
        <View
          style={[
            s.msgBubble,
            item.sent
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
          ]}
        >
          {item.deleted ? (
            <Text style={[s.msgDeleted, { color: item.sent ? '#FFF' : colors.textSecondary }]}>
              {item.sent ? 'You deleted this message' : 'Message deleted'}
            </Text>
          ) : (
            <Text style={[s.msgText, { color: item.sent ? '#FFF' : colors.text }]}>{item.content}</Text>
          )}
        </View>
      ) : item.type === 'image' ? (
        <View style={[s.imageBubble, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          {item.localUri || item.fileUrl ? (
            <Image source={{ uri: item.localUri || item.fileUrl }} style={s.chatImage} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
              <Text style={[s.imageLabel, { color: colors.textSecondary }]}>Image</Text>
            </>
          )}
        </View>
      ) : (
        <View style={[s.audioBubble, { backgroundColor: item.sent ? colors.primary + '20' : colors.inputBg }]}>
          <TouchableOpacity
            style={[s.playBtn, { backgroundColor: colors.primary }]}
            onPress={() => handlePlayAudio(item)}
          >
            <Ionicons name="mic" size={14} color="#FFF" />
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
      );

    return (
      <View>
        {showDay && (
          <View style={s.dayPill}>
            <Text style={s.dayPillText}>{formatDayLabel(item.createdAt)}</Text>
          </View>
        )}
        <View style={[s.msgRow, item.sent ? s.msgSent : s.msgReceived]}>
          <TouchableOpacity
            activeOpacity={0.8}
            delayLongPress={350}
            onLongPress={() => handleMessageAction(item)}
          >
            {bubble}
            <View style={s.msgMeta}>
              <Text style={[s.msgTime, { color: colors.textSecondary }]}>{item.time}</Text>
              {item.edited && !item.deleted && <Text style={[s.msgEdited, { color: colors.textSecondary }]}>edited</Text>}
              {item.sent && !item.deleted && <StatusIcon status={item.status} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
      <KeyboardAvoidingView
      style={[s.chatContainer, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
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

      {editing && (
        <View style={[s.editBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Text style={[s.editBannerText, { color: colors.text }]} numberOfLines={1}>Editing message</Text>
          <TouchableOpacity onPress={() => { setEditing(null); setInputText(''); }}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[s.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {!editing && (
          <TouchableOpacity style={s.attachBtn} onPress={handlePickImage}>
            <Ionicons name="attach" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
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
        {!!inputText.trim() && (
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: editing ? '#F97316' : colors.primary }]}
            onPress={editing ? handleConfirmEdit : handleSend}
          >
            <Ionicons name={editing ? "checkmark" : "send"} size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

/* ─── Styles ─── */

const s = StyleSheet.create({
  container: { flex: 1 },
  mlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mlistTitle: { fontSize: 26, fontWeight: '800' },
  dayPill: {
    alignSelf: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 12,
  },
  dayPillText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
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
  msgDeleted: { fontSize: 15, fontStyle: 'italic', fontWeight: '500', lineHeight: 20 },
  imageBubble: {
    width: 200, height: 220,
    borderRadius: 16,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chatImage: { width: '100%', height: '100%', borderRadius: 16 },
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
  msgEdited: { fontSize: 10, fontWeight: '500', fontStyle: 'italic' },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  editBannerText: { fontSize: 13, fontWeight: '600', flex: 1, marginRight: 8 },
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
  attachBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
});
