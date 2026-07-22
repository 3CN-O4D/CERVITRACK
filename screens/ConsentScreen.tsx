import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const TERMS = {
  dataCollection: `You understand and agree that CerviTrack collects, stores, and processes personal health information you provide, including screening results, medical history, and demographic data. This data is essential for providing accurate risk assessments and connecting you with appropriate care.`,
  dataSharing: `Your data may be shared with registered healthcare facilities, specialists, and community health workers affiliated with CerviTrack for the purpose of providing you with medical follow-up, referrals, and treatment. We take reasonable measures to protect your data but cannot guarantee absolute security.`,
  testAccuracy: `You acknowledge that CerviTrack's screening tools, risk assessments, and self-sampling kits are aids for early detection and are not 100% accurate. False positives and false negatives can occur. You agree to confirm any positive or concerning results with a certified pathologist or licensed healthcare provider before making any medical decisions.`,
  medicalDisclaimer: `CerviTrack is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. In case of emergency, call your local emergency services immediately.`,
  consent: `You consent to CerviTrack processing your personal data as described. You may withdraw consent and request deletion of your data at any time through the app settings. Data deletion may take up to 30 days to fully propagate through all connected systems.`,
};

export default function ConsentScreen({ onAccept }: { onAccept: () => void }) {
  const { colors } = useTheme();
  const [agreed, setAgreed] = useState(false);
  const [read, setRead] = useState(false);

  const s = styles(colors);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View style={s.iconWrap}>
          <Ionicons name="shield-checkmark" size={32} color="#FFF" />
        </View>
        <Text style={s.title}>Welcome to CerviTrack</Text>
        <Text style={s.subtitle}>
          Please review and accept our terms to continue
        </Text>
      </View>

      <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false}
        onScroll={() => setRead(true)} scrollEventThrottle={100}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Data Collection</Text>
          <Text style={s.sectionText}>{TERMS.dataCollection}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Data Sharing</Text>
          <Text style={s.sectionText}>{TERMS.dataSharing}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Test Accuracy & Medical Advice</Text>
          <Text style={s.sectionText}>{TERMS.testAccuracy}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Medical Disclaimer</Text>
          <Text style={s.sectionText}>{TERMS.medicalDisclaimer}</Text>
        </View>

        <View style={[s.section, { marginBottom: 0 }]}>
          <Text style={s.sectionTitle}>Your Consent & Rights</Text>
          <Text style={s.sectionText}>{TERMS.consent}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={s.checkRow}
        onPress={() => setAgreed(!agreed)}
        activeOpacity={0.7}
      >
        <View style={[s.checkbox, agreed && s.checkboxChecked]}>
          {agreed && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
        <Text style={s.checkLabel}>
          I have read and agree to the terms above
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.acceptBtn, (!agreed || !read) && s.acceptBtnDisabled]}
        onPress={onAccept}
        disabled={!agreed || !read}
      >
        <Text style={s.acceptBtnText}>Accept & Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 20,
    },
    iconWrap: {
      width: 64, height: 64, borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 16,
    },
    title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
    subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    scrollArea: { flex: 1, paddingHorizontal: 24 },
    section: { marginBottom: 18 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 6 },
    sectionText: { fontSize: 13, color: colors.text, lineHeight: 20, opacity: 0.85 },
    checkRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 24, paddingVertical: 14,
      borderTopWidth: 1, borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    checkbox: {
      width: 24, height: 24, borderRadius: 6, borderWidth: 2,
      borderColor: colors.textSecondary,
      justifyContent: 'center', alignItems: 'center',
      marginRight: 12,
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkLabel: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
    acceptBtn: {
      backgroundColor: colors.primary, paddingVertical: 16,
      marginHorizontal: 24, marginBottom: 24, borderRadius: 14,
      alignItems: 'center',
    },
    acceptBtnDisabled: { opacity: 0.4 },
    acceptBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  });
