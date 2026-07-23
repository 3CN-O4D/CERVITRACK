import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { scanKit, pairKit, collectKit } from '../services/api';

interface Step {
  number: number;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5';
  title: string;
  instruction: string;
  tip: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: 'hand-wash',
    iconFamily: 'MaterialCommunityIcons',
    title: 'Wash Your Hands',
    instruction: 'Wash your hands thoroughly with soap and warm water for at least 20 seconds. Dry them with a clean towel.',
    tip: 'Clean hands prevent contamination of the sample and protect you from infection.',
  },
  {
    number: 2,
    icon: 'package-variant-closed',
    iconFamily: 'MaterialCommunityIcons',
    title: 'Open the Kit',
    instruction: 'Open the self-sampling kit carefully without touching the swab tip. Remove the collection tube and the swab from the packaging.',
    tip: 'Place the kit components on a clean, dry surface before starting. Avoid touching the inside of the tube.',
  },
  {
    number: 3,
    icon: 'hand-pointing-up',
    iconFamily: 'MaterialCommunityIcons',
    title: 'Insert the Swab',
    instruction: 'Stand with your feet apart and knees slightly bent. Gently insert the swab into the vagina about 2-3 inches (5-7 cm), angling it slightly toward your lower back. Follow the diagram included in your kit.',
    tip: 'Relax your muscles and breathe deeply. The swab should slide in easily — do not force it.',
  },
  {
    number: 4,
    icon: 'rotate-right',
    iconFamily: 'MaterialCommunityIcons',
    title: 'Rotate the Swab',
    instruction: 'Rotate the swab gently in a circular motion for 15-30 seconds, making sure it contacts the vaginal walls. This collects enough cells for testing.',
    tip: 'Count to 20 slowly while rotating to ensure enough time has passed. A gentle rotation is all that is needed.',
  },
  {
    number: 5,
    icon: 'test-tube',
    iconFamily: 'MaterialCommunityIcons',
    title: 'Place in Collection Tube',
    instruction: 'Carefully withdraw the swab without touching anything else. Place the swab tip-first into the collection tube. Snap or cut the handle at the marked line so the tube can be sealed.',
    tip: 'Hold the tube steady on a flat surface to avoid spills. Make sure the swab tip is fully inside the tube.',
  },
  {
    number: 6,
    icon: 'seal',
    iconFamily: 'MaterialCommunityIcons',
    title: 'Seal and Label',
    instruction: 'Tightly close the cap on the collection tube. Write your unique patient code on the label provided. Attach the label to the tube. Place the tube in the biohazard bag and seal it.',
    tip: 'Double-check that your code is correct and legible. Store the sealed bag in a cool, dry place until you return it to the clinic.',
  },
];

const FAQS = [
  {
    question: 'How long does the test take?',
    answer: 'The entire self-sampling process takes about 5-10 minutes from opening the kit to sealing the tube. The actual swab insertion and rotation takes only 30-60 seconds.',
  },
  {
    question: 'Is self-sampling painful?',
    answer: 'No, self-sampling is generally painless. You may feel mild pressure or a slight tickling sensation, but it should not cause pain. If you experience discomfort, try relaxing and breathing deeply. The swab is very thin and flexible.',
  },
  {
    question: 'When will I get my results?',
    answer: 'Results are typically available within 2-4 weeks. Your healthcare provider will contact you with the results. If your test is positive, they will guide you on next steps which may include follow-up testing at a clinic.',
  },
  {
    question: 'Can I do self-sampling during my period?',
    answer: 'It is best to avoid self-sampling during menstruation, as blood can interfere with test results. Wait until at least 3-5 days after your period has ended. Also avoid using vaginal creams, lubricants, or douches for 48 hours before sampling.',
  },
  {
    question: 'How accurate is self-sampling compared to a clinic test?',
    answer: 'HPV self-sampling has been shown to be highly accurate and comparable to clinician-collected samples. Studies report sensitivity of 96-99% for detecting high-risk HPV when using PCR-based testing methods, which is the standard.',
  },
];

export default function SelfSamplingScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [barcode, setBarcode] = useState('');
  const [kitStatus, setKitStatus] = useState<string | null>(null);
  const [kitLoading, setKitLoading] = useState(false);
  const [kitMessage, setKitMessage] = useState('');

  const handleScanKit = async () => {
    if (!barcode.trim()) return;
    setKitLoading(true);
    setKitMessage('');
    setKitStatus(null);
    try {
      const found = await scanKit(barcode.trim());
      if (found) {
        setKitStatus(found.status);
        if (found.status === 'REGISTERED') {
          const paired = await pairKit(barcode, {
            patientId: 'self', patientName: 'Patient',
            pairedBy: 'self', pairedByName: 'Patient (Self)',
          });
          if (paired) { setKitStatus('PAIRED'); setKitMessage('Kit paired to your account'); }
        } else if (found.status === 'PAIRED') {
          const collected = await collectKit(barcode, {
            collectedBy: 'self', collectedByName: 'Patient (Self-Collection)',
            collectionMethod: 'HPV_SELF', location: 'home',
          });
          if (collected) { setKitStatus('COLLECTED'); setKitMessage('Sample collection confirmed!'); }
        } else {
          setKitMessage(`Kit status: ${found.status}`);
        }
      } else {
        setKitMessage('Kit not found. Check the barcode number.');
      }
    } catch {
      setKitMessage('Network error — try again later');
    } finally {
      setKitLoading(false);
    }
  };

  const getIcon = (step: Step, size: number) => {
    const color = colors.primary;
    switch (step.iconFamily) {
      case 'Ionicons':
        return <Ionicons name={step.icon as any} size={size} color={color} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={step.icon as any} size={size} color={color} />;
      default:
        return <MaterialCommunityIcons name={step.icon as any} size={size} color={color} />;
    }
  };

  const styles = makeStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons name="hand-peace" size={32} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>HPV Self-Sampling Guide</Text>
          <Text style={styles.heroSubtitle}>
            Collect your own sample in the privacy of your home. Follow these simple steps for accurate results.
          </Text>
        </View>

        <TouchableOpacity style={styles.videoGuideBtn}>
          <View style={styles.videoIconWrap}>
            <Ionicons name="play" size={20} color="#FFF" />
          </View>
          <Text style={styles.videoGuideText}>Watch Video Guide</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>

        {STEPS.map((step, idx) => (
          <View key={step.number} style={styles.stepCard}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>{step.number}</Text>
            </View>
            <View style={styles.stepConnector}>
              {idx < STEPS.length - 1 && <View style={styles.connectorLine} />}
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepIconWrap}>{getIcon(step, 24)}</View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepInstruction}>{step.instruction}</Text>
              <View style={styles.tipContainer}>
                <Ionicons name="bulb-outline" size={14} color={colors.warning} />
                <Text style={styles.tipText}>{step.tip}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.faqSection}>
          <View style={styles.faqHeader}>
            <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>

          {FAQS.map((faq, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
              activeOpacity={0.7}
            >
              <View style={styles.faqQuestionRow}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === idx ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </View>
              {expandedFaq === idx && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.kitScanSection}>
          <View style={styles.kitScanHeader}>
            <MaterialCommunityIcons name="barcode" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Scan Your Kit Barcode</Text>
          </View>
          <Text style={styles.kitScanDesc}>
            After collecting your sample, scan the barcode on your kit to pair and confirm collection.
          </Text>
          <View style={styles.kitScanRow}>
            <TextInput
              style={[styles.kitScanInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Enter kit barcode..."
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              style={[styles.kitScanBtn, { backgroundColor: colors.primary }]}
              onPress={handleScanKit}
              disabled={!barcode.trim() || kitLoading}
            >
              {kitLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="scan" size={18} color="#FFF" />}
            </TouchableOpacity>
          </View>
          {kitStatus && (
            <View style={[styles.kitStatusBadge, {
              backgroundColor: kitStatus === 'COLLECTED' ? '#F0FDF4' : kitStatus === 'PAIRED' ? '#FFFBEB' : '#EFF6FF'
            }]}>
              <Text style={[styles.kitStatusText, {
                color: kitStatus === 'COLLECTED' ? '#16A34A' : kitStatus === 'PAIRED' ? '#D97706' : '#2563EB'
              }]}>{kitStatus}</Text>
            </View>
          )}
          {kitMessage ? <Text style={styles.kitScanMessage}>{kitMessage}</Text> : null}
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            This guide is for informational purposes only. Always follow the specific instructions provided with your self-sampling kit and consult your healthcare provider with any questions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { paddingBottom: 40 },

    heroSection: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 20,
    },
    heroIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 8,
      paddingHorizontal: 10,
    },

    videoGuideBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      marginHorizontal: 20,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
      gap: 10,
    },
    videoIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoGuideText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
      flex: 1,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 14,
      paddingHorizontal: 20,
    },

    stepCard: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 6,
      position: 'relative',
    },
    stepNumberBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    stepNumberText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    stepConnector: {
      width: 32,
      alignItems: 'center',
      position: 'absolute',
      top: 32,
      left: 20,
      bottom: 0,
      zIndex: 1,
    },
    connectorLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.primaryLight,
    },
    stepContent: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginLeft: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    stepTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
    stepInstruction: { fontSize: 13, color: colors.text, lineHeight: 19 },
    tipContainer: {
      flexDirection: 'row',
      backgroundColor: colors.primaryLight,
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
      gap: 6,
      alignItems: 'flex-start',
    },
    tipText: { fontSize: 12, color: colors.text, flex: 1, lineHeight: 17 },

    faqSection: { paddingTop: 10, paddingBottom: 10 },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      gap: 8,
      marginBottom: 4,
    },
    faqItem: {
      backgroundColor: colors.card,
      marginHorizontal: 20,
      marginBottom: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    faqQuestionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    faqQuestion: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1, paddingRight: 8 },
    faqAnswer: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    disclaimer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 8,
      alignItems: 'flex-start',
    },
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
      flex: 1,
    },

    kitScanSection: {
      marginHorizontal: 20,
      marginTop: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    kitScanHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    kitScanDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 12 },
    kitScanRow: { flexDirection: 'row', gap: 8 },
    kitScanInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
    kitScanBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    kitStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 10, alignSelf: 'flex-start' },
    kitStatusText: { fontSize: 12, fontWeight: '700' },
    kitScanMessage: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  });
