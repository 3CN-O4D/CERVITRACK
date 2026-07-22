import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getAssistantResponse } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const WELCOME_SUGGESTIONS = [
  'What is HPV?',
  'How to prevent cervical cancer?',
  'When should I screen?',
  'HPV vaccine in Kenya',
  'Cervical cancer symptoms',
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: "Hello! I'm your CerviTrack health assistant. Ask me anything about HPV, cervical cancer, screening, or prevention. I'll suggest follow-up questions based on what you ask.",
  sender: 'ai',
  timestamp: new Date(),
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AIAssistantScreen() {
  const { colors, isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(WELCOME_SUGGESTIONS);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, typing]);

  const addMessage = useCallback((text: string, sender: 'user' | 'ai') => {
    const msg: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleResponse = useCallback(async (question: string) => {
    setTyping(true);
    try {
      const result = await getAssistantResponse(question);
      setTyping(false);
      addMessage(result.response, 'ai');
      // Pick 5 random follow-ups, or fewer if less available
      const shuffled = shuffleArray(result.followUps);
      setSuggestions(shuffled.slice(0, 5));
    } catch {
      setTyping(false);
      addMessage('Sorry, I had trouble responding. Please try again.', 'ai');
    }
  }, [addMessage]);

  const handleSendWithText = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q) return;
    addMessage(q, 'user');
    setInput('');
    await handleResponse(q);
  }, [addMessage, handleResponse]);

  const handleSend = useCallback(async () => {
    await handleSendWithText(input);
  }, [input, handleSendWithText]);

  const handleSuggestion = useCallback((suggestion: string) => {
    setInput('');
    handleSendWithText(suggestion);
  }, [handleSendWithText]);

  const s = styles(colors, isDark);

  const renderMessage = ({ item }: { item: Message }) => {
    const isAi = item.sender === 'ai';
    return (
      <View style={[s.messageRow, isAi ? s.aiRow : s.userRow]}>
        {isAi && (
          <View style={s.avatar}>
            <Text style={s.avatarText}>AI</Text>
          </View>
        )}
        <View style={[s.bubble, isAi ? s.aiBubble : s.userBubble]}>
          <Text style={[s.bubbleText, { color: isAi ? colors.text : '#FFF' }]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const renderTyping = () => (
    <View style={[s.messageRow, s.aiRow]}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>AI</Text>
      </View>
      <View style={[s.bubble, s.aiBubble, s.typingBubble]}>
        <View style={s.typingDots}>
          <View style={[s.dot, { backgroundColor: colors.textSecondary }]} />
          <View style={[s.dot, { backgroundColor: colors.textSecondary }]} />
          <View style={[s.dot, { backgroundColor: colors.textSecondary }]} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={s.headerLeft}>
            <View style={[s.headerAvatar, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="brain" size={22} color="#FFF" />
            </View>
            <View>
              <Text style={[s.headerTitle, { color: colors.text }]}>AI Health Assistant</Text>
              <Text style={[s.headerSub, { color: colors.success }]}>Online</Text>
            </View>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={s.chatArea}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={typing ? renderTyping : null}
        />

        <View style={[s.suggestionsRow, { borderTopColor: colors.border }]}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              style={[s.chip, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}
              activeOpacity={0.7}
              onPress={() => handleSuggestion(suggestion)}
            >
              <Text style={[s.chipText, { color: colors.primary }]}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            ref={inputRef}
            style={[s.textInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="Ask about HPV, screening..."
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.border }]}
            disabled={!input.trim()}
            onPress={handleSend}
          >
            <Ionicons name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1 },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800' },
    headerSub: { fontSize: 12, fontWeight: '600' },
    chatArea: { padding: 16, paddingBottom: 8 },
    messageRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
    aiRow: { justifyContent: 'flex-start' },
    userRow: { justifyContent: 'flex-end' },
    avatar: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: '#6C5CE7',
      justifyContent: 'center', alignItems: 'center', marginRight: 8,
    },
    avatarText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
    bubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    aiBubble: { borderBottomLeftRadius: 4 },
    userBubble: { borderBottomRightRadius: 4 },
    bubbleText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    typingBubble: { paddingVertical: 12, paddingHorizontal: 20 },
    typingDots: { flexDirection: 'row', gap: 5 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    suggestionsRow: {
      flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12,
      paddingVertical: 8, gap: 6, borderTopWidth: 1,
    },
    chip: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
    },
    chipText: { fontSize: 12, fontWeight: '700' },
    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12,
      paddingVertical: 8, borderTopWidth: 1, gap: 8,
    },
    textInput: {
      flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
      fontSize: 14, maxHeight: 100, borderWidth: 1,
    },
    sendBtn: {
      width: 44, height: 44, borderRadius: 22, justifyContent: 'center',
      alignItems: 'center', marginBottom: 2,
    },
  });
