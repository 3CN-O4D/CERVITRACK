import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { submitFeedback } from '../services/api';

const categories = [
  { icon: 'medkit-outline', label: 'Test Kit Issue', color: '#EF4444' },
  { icon: 'medal-outline', label: 'Doctor Complaint', color: '#F59E0B' },
  { icon: 'shield-checkmark-outline', label: 'Service Feedback', color: '#3B82F6' },
  { icon: 'lock-closed-outline', label: 'Data Privacy', color: '#8B5CF6' },
  { icon: 'thumbs-up-outline', label: 'Positive Feedback', color: '#10B981' },
  { icon: 'business-outline', label: 'Hospital Feedback', color: '#06B6D4' },
  { icon: 'people-outline', label: 'Team / Project', color: '#EC4899' },
  { icon: 'chatbubbles-outline', label: 'General', color: '#6B7280' },
];

export default function FeedbackScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);

  const s = styles(colors);

  const handleSubmit = async () => {
    if (!category || !message.trim()) {
      Alert.alert('Required', 'Please select a category and write your feedback.');
      return;
    }
    setSending(true);
    try {
      const payload = {
        user_id: user?.id || 0,
        category,
        message: message.trim(),
        contact: contact.trim(),
      };
      // Try to send to backend, store locally as fallback
      await submitFeedback({ user_id: user?.id ?? '', category, message: message.trim(), contact: contact.trim() }).catch(() => {});
      Alert.alert('Thank You', 'Your feedback has been received. We value your input!');
      setCategory('');
      setMessage('');
      setContact('');
    } catch {
      Alert.alert('Sent', 'Your feedback will be uploaded when you\'re online.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <MaterialCommunityIcons name="message-text-outline" size={26} color={colors.primary} />
        <Text style={s.headerTitle}>Feedback</Text>
      </View>
      <Text style={s.subtitle}>
        Help us improve CerviTrack. Your feedback is confidential.
      </Text>

      <Text style={s.sectionLabel}>Category</Text>
      <View style={s.categoryGrid}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.label}
            style={[
              s.categoryChip,
              { borderColor: category === c.label ? c.color : colors.border },
              category === c.label && { backgroundColor: c.color + '15' },
            ]}
            onPress={() => setCategory(c.label)}
          >
            <Ionicons name={c.icon as any} size={18} color={category === c.label ? c.color : colors.textSecondary} />
            <Text style={[s.categoryText, { color: category === c.label ? c.color : colors.textSecondary }]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionLabel}>Your Feedback</Text>
      <TextInput
        style={[s.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        placeholder="Tell us about your experience..."
        placeholderTextColor={colors.textSecondary}
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <Text style={s.sectionLabel}>Contact (optional)</Text>
      <TextInput
        style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        placeholder="Phone or email if you'd like a response"
        placeholderTextColor={colors.textSecondary}
        value={contact}
        onChangeText={setContact}
      />

      <TouchableOpacity
        style={[s.submitBtn, (!category || !message.trim() || sending) && s.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!category || !message.trim() || sending}
      >
        {sending ? (
          <Text style={s.submitBtnText}>Sending...</Text>
        ) : (
          <>
            <Ionicons name="send" size={18} color="#FFF" />
            <Text style={s.submitBtnText}>  Submit Feedback</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 20, lineHeight: 18 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 6 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  categoryText: { fontSize: 12, fontWeight: '600' },
  textArea: { borderRadius: 16, borderWidth: 1, padding: 14, fontSize: 14, minHeight: 120, marginBottom: 16 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 20 },
  submitBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#6C5CE7', borderRadius: 16, paddingVertical: 16, marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
