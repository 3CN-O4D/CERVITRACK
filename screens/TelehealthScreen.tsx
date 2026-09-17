import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { sendMessage } from '../services/api';
import * as db from '../services/db';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'expert';
  timestamp: Date;
}

const EXPERT_NAME = 'Dr. Sarah';
const EXPERT_ROLE = 'HPV Specialist';

const EXPERT_RESPONSES = [
  'Thank you for reaching out. HPV is a very common virus, and most infections clear on their own. Would you like to know more about how it spreads?',
  'That\'s an excellent question! The HPV vaccine is recommended for girls and boys from age 9, with catch-up vaccination available up to age 45 in many countries.',
  'Self-sampling for HPV is a simple, private way to test for high-risk HPV types from the comfort of your home. Would you like me to walk you through the steps?',
  'Regular cervical cancer screening is recommended every 3-5 years for women aged 25-65, depending on the screening method used.',
  'Early-stage cervical cancer often has no symptoms. That\'s why regular screening is so important. Common warning signs include unusual bleeding or pelvic pain.',
  'The HPV vaccine protects against the most common high-risk HPV types (16 and 18) that cause about 70% of cervical cancers. It\'s most effective when given before first exposure to HPV.',
  'After an abnormal screening result, follow-up tests may include colposcopy or a biopsy. Don\'t worry — most abnormal results are not cancer, but they need monitoring.',
  'There are over 100 types of HPV, but only about 14 high-risk types can lead to cancer. Types 6 and 11 cause genital warts but are not linked to cancer.',
  'You can reduce your HPV risk by getting vaccinated, practicing safe sex, avoiding smoking, and attending regular cervical screening appointments.',
  'Results from HPV self-sampling typically take 2-4 weeks. You\'ll be notified by your healthcare provider once they\'re ready. Would you like to discuss next steps?',
  'A healthy immune system clears most HPV infections within 1-2 years. Eating well, exercising, and not smoking all support your immune system\'s ability to fight HPV.',
  'Yes, using condoms reduces but does not eliminate the risk of HPV transmission, as the virus can infect areas not covered by a condom. Vaccination remains the best protection.',
];

const TELEHEALTH_CONTACT_ID = 999;
const WELCOME_MSG = `Hello! I'm ${EXPERT_NAME}, your ${EXPERT_ROLE}. I'm here to answer any questions you have about HPV, cervical cancer screening, vaccines, or women's health. How can I help you today?`;

const QUICK_CHIPS = [
  'What is HPV?',
  'How to self-sample?',
  'Vaccine schedule',
  'When to screen?',
];

let messageCounter = 0;

function msgToChat(d: any): Message {
  return {
    id: 'msg-' + (d.id || Date.now()),
    text: d.content || '',
    sender: d.sender_type === 'expert' ? 'expert' : 'user',
    timestamp: new Date(d.created_at || Date.now()),
  };
}

export default function TelehealthScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        await db.initDatabase();
        const conv = await db.getOrCreateConversation(
          user?.id ?? '',
          TELEHEALTH_CONTACT_ID,
          EXPERT_NAME,
          EXPERT_ROLE,
          1,
        );
        setConversationId(conv.id);

        const existing = await db.getMessages(conv.id);
        if (existing.length > 0) {
          setMessages(existing.map(msgToChat));
        } else {
          setMessages([{
            id: 'welcome',
            text: WELCOME_MSG,
            sender: 'expert',
            timestamp: new Date(),
          }]);
        }
      } catch {
        setMessages([{
          id: 'welcome',
          text: WELCOME_MSG,
          sender: 'expert',
          timestamp: new Date(),
        }]);
      }
      setLoaded(true);
    })();
  }, []);

  const saveAndAddMessage = async (content: string, senderType: string) => {
    if (!conversationId) return null;
    try {
      const saved = await db.saveMessage({
        conversation_id: conversationId,
        sender_id: senderType === 'expert' ? TELEHEALTH_CONTACT_ID : (user?.id || 0),
        sender_type: senderType,
        content,
        created_at: new Date().toISOString(),
      });
      await db.updateConversationLastMessage(conversationId, content);
      return saved;
    } catch {
      return null;
    }
  };

  const sendChatMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const saved = await saveAndAddMessage(trimmed, 'user');
    const userMsg: Message = {
      id: 'msg-' + (saved?.id || Date.now()),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      await sendMessage({ message: trimmed, expertId: 1 });
    } catch {
      // Proceed with local response
    }

    const delay = 1000 + Math.random() * 1500;
    setTimeout(async () => {
      const responseText = EXPERT_RESPONSES[Math.floor(Math.random() * EXPERT_RESPONSES.length)];
      const savedExpert = await saveAndAddMessage(responseText, 'expert');
      const expertMsg: Message = {
        id: 'msg-' + (savedExpert?.id || Date.now()) + '-' + messageCounter++,
        text: responseText,
        sender: 'expert',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, expertMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleChipPress = (chip: string) => {
    sendChatMessage(chip);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const styles = makeStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.expertHeader}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="doctor" size={24} color={colors.primary} />
            </View>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
          </View>
          <View style={styles.expertInfo}>
            <Text style={styles.expertName}>{EXPERT_NAME}</Text>
            <Text style={styles.expertRole}>{EXPERT_ROLE}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.miniDot, { backgroundColor: colors.success }]} />
              <Text style={styles.statusText}>{t('telehealth.expertOnline')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.videoBtn}>
            <Ionicons name="videocam-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.messageRow, msg.sender === 'user' ? styles.userRow : styles.expertRow]}
            >
              {msg.sender === 'expert' && (
                <View style={styles.expertAvatarSmall}>
                  <MaterialCommunityIcons name="doctor" size={16} color={colors.primary} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  msg.sender === 'user' ? styles.userBubble : styles.expertBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    { color: msg.sender === 'user' ? '#FFF' : colors.text },
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    { color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
                  ]}
                >
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageRow, styles.expertRow]}>
              <View style={styles.expertAvatarSmall}>
                <MaterialCommunityIcons name="doctor" size={16} color={colors.primary} />
              </View>
              <View style={[styles.bubble, styles.expertBubble]}>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                  <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                  <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.chipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {QUICK_CHIPS.map((chip, idx) => (
              <TouchableOpacity key={idx} style={styles.chip} onPress={() => handleChipPress(chip)}>
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('telehealth.messageHint')}
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onFocus={scrollToBottom}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
            onPress={() => sendChatMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    expertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.card,
    },
    expertInfo: { flex: 1, marginLeft: 12 },
    expertName: { fontSize: 16, fontWeight: '800', color: colors.text },
    expertRole: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    miniDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    statusText: { fontSize: 11, color: colors.success, fontWeight: '600' },
    videoBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },

    chatArea: { flex: 1 },
    chatContent: { padding: 16, paddingBottom: 8 },

    messageRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
    userRow: { justifyContent: 'flex-end' },
    expertRow: { justifyContent: 'flex-start' },

    expertAvatarSmall: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      marginBottom: 4,
    },

    bubble: {
      maxWidth: '78%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    expertBubble: {
      backgroundColor: colors.card,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleText: { fontSize: 15, lineHeight: 21 },
    timestamp: { fontSize: 10, marginTop: 4, textAlign: 'right', fontWeight: '500' },

    typingDots: { flexDirection: 'row', gap: 4, paddingVertical: 4, paddingHorizontal: 4 },
    dot: { width: 7, height: 7, borderRadius: 4 },

    chipsContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    chipsScroll: { flexDirection: 'row', gap: 8 },
    chip: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.primary },

    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: colors.inputBg,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
  });
