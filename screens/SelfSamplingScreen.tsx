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
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { scanKit, pairKit, collectKit, createKitRequest } from '../services/api';

const VIDEO_URL = 'https://youtu.be/njsHSnDGcDk';

type SamplingStep =
  | 'order'
  | 'pre-scan'
  | 'pre-scan-result'
  | 'learn'
  | 'procedure'
  | 'post-checklist'
  | 'post-scan'
  | 'post-scan-result'
  | 'complete';

interface Step {
  number: number;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5';
  title: string;
  instruction: string;
  tip: string;
}

const STEPS: Step[] = [
  { number: 1, icon: 'hand-wash', iconFamily: 'MaterialCommunityIcons', title: 'Wash Your Hands', instruction: 'Wash your hands thoroughly with soap and warm water for at least 20 seconds. Dry them with a clean towel.', tip: 'Clean hands prevent contamination of the sample and protect you from infection.' },
  { number: 2, icon: 'package-variant-closed', iconFamily: 'MaterialCommunityIcons', title: 'Open the Kit', instruction: 'Open the self-sampling kit carefully without touching the swab tip. Remove the collection tube and the swab from the packaging.', tip: 'Place the kit components on a clean, dry surface before starting. Avoid touching the inside of the tube.' },
  { number: 3, icon: 'hand-pointing-up', iconFamily: 'MaterialCommunityIcons', title: 'Insert the Swab', instruction: 'Stand with your feet apart and knees slightly bent. Gently insert the swab into the vagina about 2-3 inches (5-7 cm), angling it slightly toward your lower back.', tip: 'Relax your muscles and breathe deeply. The swab should slide in easily \u2014 do not force it.' },
  { number: 4, icon: 'rotate-right', iconFamily: 'MaterialCommunityIcons', title: 'Rotate the Swab', instruction: 'Rotate the swab gently in a circular motion for 15-30 seconds, making sure it contacts the vaginal walls.', tip: 'Count to 20 slowly while rotating to ensure enough time has passed.' },
  { number: 5, icon: 'test-tube', iconFamily: 'MaterialCommunityIcons', title: 'Place in Collection Tube', instruction: 'Carefully withdraw the swab without touching anything else. Place the swab tip-first into the collection tube. Snap or cut the handle at the marked line so the tube can be sealed.', tip: 'Hold the tube steady on a flat surface to avoid spills. Make sure the swab tip is fully inside the tube.' },
  { number: 6, icon: 'seal', iconFamily: 'MaterialCommunityIcons', title: 'Seal and Label', instruction: 'Tightly close the cap on the collection tube. Write your unique patient code on the label. Attach the label to the tube. Place the tube in the biohazard bag and seal it.', tip: 'Double-check that your code is correct and legible. Store the sealed bag in a cool, dry place until you return it to the clinic.' },
];

const CHECKLIST_ITEMS = [
  { key: 'swab_tube', label: 'Swab placed correctly in collection tube' },
  { key: 'cap_sealed', label: 'Tube cap sealed tightly — no leaks' },
  { key: 'no_spillage', label: 'No spillage during the entire process' },
  { key: 'labeled', label: 'Sample tube labeled with patient code' },
  { key: 'hazard_bag', label: 'Tube placed in biohazard bag' },
  { key: 'bag_sealed', label: 'Biohazard bag sealed properly' },
];

export default function SelfSamplingScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState<SamplingStep>('order');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [barcode, setBarcode] = useState('');
  const [barcode2, setBarcode2] = useState('');
  const [kitLoading, setKitLoading] = useState(false);
  const [kitMessage, setKitMessage] = useState('');
  const [kitStatus, setKitStatus] = useState<string | null>(null);
  const [requestingKit, setRequestingKit] = useState(false);
  const [kitBarcode, setKitBarcode] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [collectLoading, setCollectLoading] = useState(false);

  const handleRequestKit = async () => {
    if (!user?.id) { Alert.alert('Error', 'Please log in to request a kit.'); return; }
    Alert.alert('Request Self-Sampling Kit', 'A kit will be prepared for you. You will be contacted when it is ready for pickup or delivery.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request Kit',
        onPress: async () => {
          setRequestingKit(true);
          try {
            await createKitRequest(user.id);
            setRequestingKit(false);
            Alert.alert('Kit Requested', 'Your request has been submitted. We will contact you shortly.', [
              { text: 'OK', onPress: () => setStep('pre-scan') },
            ]);
          } catch { setRequestingKit(false); Alert.alert('Error', 'Failed to submit request. Please try again.'); }
        },
      },
    ]);
  };

  const handlePreScan = async () => {
    if (!barcode.trim()) return;
    setKitLoading(true);
    setKitMessage('');
    setKitStatus(null);
    try {
      const found = await scanKit(barcode.trim());
      if (found) {
        setKitStatus(found.status);
        setKitBarcode(barcode.trim());
        setKitMessage(found.status === 'REGISTERED' ? 'Kit found. Link it to your account to begin.' : `Kit status: ${found.status}`);
        setStep('pre-scan-result');
      } else {
        setKitMessage('Kit not found. Check the barcode number.');
      }
    } catch { setKitMessage('Network error \u2014 try again later'); }
    finally { setKitLoading(false); }
  };

  const handleLinkKit = async () => {
    if (!kitBarcode || !user?.id) return;
    setKitLoading(true);
    try {
      const paired = await pairKit(kitBarcode, { patientId: user.id, patientName: user.name || 'Patient', pairedBy: 'self', pairedByName: user.name || 'Patient (Self)' });
      if (paired) {
        setKitStatus('PAIRED');
        Alert.alert('Kit Linked', 'This kit is now linked to your account. Proceed to learn how to take your sample.', [
          { text: 'Continue', onPress: () => setStep('learn') },
        ]);
      } else {
        Alert.alert('Error', 'Failed to link kit. Please try again.');
      }
    } catch { Alert.alert('Error', 'Network error. Please try again.'); }
    finally { setKitLoading(false); }
  };

  const toggleChecklist = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = CHECKLIST_ITEMS.every(item => checklist[item.key]);

  const handlePostScan = async () => {
    if (!barcode2.trim()) return;
    setKitLoading(true);
    setKitMessage('');
    try {
      const collected = await collectKit(barcode2.trim(), {
        collectedBy: 'self', collectedByName: user?.name || 'Patient (Self-Collection)',
        collectionMethod: 'HPV_SELF', location: 'home', notes: 'Self-collected after completing sampling checklist',
      });
      if (collected) {
        setStep('post-scan-result');
      } else {
        setKitMessage('Failed to confirm collection. Please try again.');
      }
    } catch { setKitMessage('Network error \u2014 try again later'); }
    finally { setKitLoading(false); }
  };

  const styles = makeStyles(colors, isDark);

  const renderProgress = (current: string, labels: string[]) => {
    const stageOrder = ['order', 'pre-scan', 'learn', 'post-checklist', 'post-scan', 'complete'];
    const currentIdx = stageOrder.indexOf(current);
    return (
      <View style={styles.progressRow}>
        {labels.map((l, i) => (
          <View key={i} style={styles.progressStep}>
            <View style={[styles.progressDot, { backgroundColor: i <= currentIdx ? colors.primary : colors.border }]} />
            {i < labels.length - 1 && <View style={[styles.progressLine, { backgroundColor: i < currentIdx ? colors.primary : colors.border }]} />}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ─── STEP: ORDER ─── */}
        {step === 'order' && (
          <>
            <View style={styles.heroSection}>
              <View style={styles.heroIconWrap}>
                <MaterialCommunityIcons name="hand-peace" size={32} color={colors.primary} />
              </View>
              <Text style={styles.heroTitle}>HPV Self-Sampling</Text>
              <Text style={styles.heroSubtitle}>
                Collect your own sample in the privacy of your home. Start by requesting a free self-sampling kit.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleRequestKit}
              disabled={requestingKit}
            >
              {requestingKit ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="cube-outline" size={20} color="#FFF" />
              )}
              <Text style={styles.primaryBtnText}>Request a Self-Sampling Kit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={() => setStep('pre-scan')}>
              <Text style={styles.skipBtnText}>I already have a kit — scan barcode</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── STEP: PRE-SCAN ─── */}
        {step === 'pre-scan' && (
          <>
            <View style={styles.heroSection}>
              <View style={styles.heroIconWrap}>
                <MaterialCommunityIcons name="barcode-scan" size={32} color={colors.primary} />
              </View>
              <Text style={styles.heroTitle}>Step 1: Scan Your Kit</Text>
              <Text style={styles.heroSubtitle}>
                Enter the barcode number on your self-sampling kit to link it to your account.
              </Text>
            </View>

            <View style={styles.scanSection}>
              <TextInput
                style={[styles.scanInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Enter kit barcode..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.scanBtn, { backgroundColor: colors.primary }]}
                onPress={handlePreScan}
                disabled={!barcode.trim() || kitLoading}
              >
                {kitLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="search" size={18} color="#FFF" />}
                <Text style={styles.scanBtnText}>Find Kit</Text>
              </TouchableOpacity>
              {kitMessage ? <Text style={[styles.statusMsg, { color: kitStatus ? colors.success : colors.error }]}>{kitMessage}</Text> : null}
            </View>
          </>
        )}

        {/* ─── STEP: PRE-SCAN RESULT (Kit found, show link button) ─── */}
        {step === 'pre-scan-result' && (
          <>
            <View style={styles.heroSection}>
              <View style={[styles.heroIconWrap, { backgroundColor: colors.success + '20' }]}>
                <MaterialCommunityIcons name="check-circle" size={32} color={colors.success} />
              </View>
              <Text style={styles.heroTitle}>Kit Found</Text>
              <Text style={styles.heroSubtitle}>
                Barcode: {kitBarcode}
                {'\n'}Status: {kitStatus}
              </Text>
            </View>

            <View style={styles.statusCard}>
              <MaterialCommunityIcons name="qrcode" size={40} color={colors.primary} />
              <Text style={styles.statusCardTitle}>Link this kit to your account</Text>
              <Text style={styles.statusCardDesc}>
                Once linked, proceed to watch the instructional video and collect your sample.
              </Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
                onPress={handleLinkKit}
                disabled={kitLoading}
              >
                {kitLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="link" size={18} color="#FFF" />}
                <Text style={styles.primaryBtnText}>Link Kit to My Account</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── STEP: LEARN ─── */}
        {step === 'learn' && (
          <>
            <View style={styles.heroSection}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="play-circle" size={32} color={colors.primary} />
              </View>
              <Text style={styles.heroTitle}>Step 2: Learn the Procedure</Text>
              <Text style={styles.heroSubtitle}>
                Watch the video guide and read the step-by-step instructions before collecting your sample.
              </Text>
            </View>

            <TouchableOpacity style={styles.videoBtn} onPress={() => Linking.openURL(VIDEO_URL)}>
              <View style={styles.videoIcon}>
                <Ionicons name="play" size={18} color="#FFF" />
              </View>
              <Text style={styles.videoBtnText}>Watch Video Guide</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="clipboard-list" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>
            </View>

            {STEPS.map((s, idx) => {
              const IconComp = s.iconFamily === 'Ionicons' ? Ionicons : s.iconFamily === 'FontAwesome5' ? FontAwesome5 : MaterialCommunityIcons;
              return (
                <View key={s.number} style={styles.stepCard}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{s.number}</Text>
                  </View>
                  {idx < STEPS.length - 1 && <View style={styles.stepLine} />}
                  <View style={styles.stepBody}>
                    <View style={styles.stepIconWrap}>
                      <IconComp name={s.icon as any} size={22} color={colors.primary} />
                    </View>
                    <Text style={styles.stepCardTitle}>{s.title}</Text>
                    <Text style={styles.stepInstruction}>{s.instruction}</Text>
                    <View style={styles.tipBox}>
                      <Ionicons name="bulb-outline" size={14} color={colors.warning} />
                      <Text style={styles.tipText}>{s.tip}</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => setStep('post-checklist')}
            >
              <Text style={styles.primaryBtnText}>I\u2019ve Read the Instructions \u2014 Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </>
        )}

        {/* ─── STEP: POST-CHECKLIST ─── */}
        {step === 'post-checklist' && (
          <>
            <View style={styles.heroSection}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="checkbox" size={32} color={colors.primary} />
              </View>
              <Text style={styles.heroTitle}>Step 3: Confirm Precautions</Text>
              <Text style={styles.heroSubtitle}>
                Before marking your sample as collected, confirm that all steps were followed correctly.
              </Text>
            </View>

            <View style={styles.checklistSection}>
              <Text style={styles.checklistTitle}>Sampling Checklist</Text>
              <Text style={styles.checklistDesc}>
                Tick each item to confirm it was completed properly.
              </Text>
              {CHECKLIST_ITEMS.map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.checkItem, { borderColor: checklist[item.key] ? colors.success + '50' : colors.border }]}
                  onPress={() => toggleChecklist(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, { backgroundColor: checklist[item.key] ? colors.success : 'transparent', borderColor: checklist[item.key] ? colors.success : colors.border }]}>
                    {checklist[item.key] && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                  <Text style={styles.checkLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.checklistProgress}>
              <Text style={styles.checklistProgressText}>{CHECKLIST_ITEMS.filter(i => checklist[i.key]).length} of {CHECKLIST_ITEMS.length} confirmed</Text>
              <View style={styles.checklistProgressBar}>
                <View style={[styles.checklistProgressFill, { width: `${(CHECKLIST_ITEMS.filter(i => checklist[i.key]).length / CHECKLIST_ITEMS.length) * 100}%`, backgroundColor: colors.success }]} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: allChecked ? colors.primary : colors.border }]}
              onPress={() => allChecked && setStep('post-scan')}
              disabled={!allChecked}
            >
              <Text style={[styles.primaryBtnText, { color: allChecked ? '#FFF' : colors.textSecondary }]}>
                {allChecked ? 'All Confirmed \u2014 Scan Sample' : 'Complete All Checks to Continue'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── STEP: POST-SCAN ─── */}
        {step === 'post-scan' && (
          <>
            <View style={styles.heroSection}>
              <View style={styles.heroIconWrap}>
                <MaterialCommunityIcons name="barcode-scan" size={32} color={colors.primary} />
              </View>
              <Text style={styles.heroTitle}>Step 4: Scan to Confirm</Text>
              <Text style={styles.heroSubtitle}>
                Scan the barcode on your sealed biohazard bag to confirm your sample is ready for return.
              </Text>
            </View>

            <View style={styles.scanSection}>
              <TextInput
                style={[styles.scanInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                value={barcode2}
                onChangeText={setBarcode2}
                placeholder="Enter kit barcode..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.scanBtn, { backgroundColor: colors.primary }]}
                onPress={handlePostScan}
                disabled={!barcode2.trim() || kitLoading}
              >
                {kitLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="checkmark-circle" size={18} color="#FFF" />}
                <Text style={styles.scanBtnText}>Confirm Sample Taken</Text>
              </TouchableOpacity>
              {kitMessage ? <Text style={[styles.statusMsg, { color: colors.error }]}>{kitMessage}</Text> : null}
            </View>
          </>
        )}

        {/* ─── STEP: POST-SCAN RESULT (success) ─── */}
        {step === 'post-scan-result' && (
          <>
            <View style={styles.heroSection}>
              <View style={[styles.heroIconWrap, { backgroundColor: colors.success + '20' }]}>
                <MaterialCommunityIcons name="party-popper" size={32} color={colors.success} />
              </View>
              <Text style={styles.heroTitle}>Sample Collected!</Text>
              <Text style={styles.heroSubtitle}>
                Your self-sampling kit has been marked as collected. Thank you for taking control of your health!
              </Text>
            </View>

            <View style={styles.successCard}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={48} color={colors.success} />
              <Text style={styles.successTitle}>What happens next?</Text>
              <View style={styles.successStep}>
                <View style={styles.successDot} />
                <Text style={styles.successStepText}>Return the sealed biohazard bag to your nearest clinic</Text>
              </View>
              <View style={styles.successStep}>
                <View style={styles.successDot} />
                <Text style={styles.successStepText}>The clinic will send it to the lab for testing</Text>
              </View>
              <View style={styles.successStep}>
                <View style={styles.successDot} />
                <Text style={styles.successStepText}>You will receive your results within 2\u20134 weeks</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setStep('order');
                setBarcode('');
                setBarcode2('');
                setKitBarcode('');
                setKitMessage('');
                setKitStatus(null);
                setChecklist({});
              }}
            >
              <Ionicons name="home" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Start Over</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── FAQ (visible on learn + procedure steps) ─── */}
        {(step === 'learn' || step === 'procedure') && (
          <View style={styles.faqSection}>
            <View style={styles.faqHeader}>
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>FAQs</Text>
            </View>
            {FAQS.map((faq, idx) => (
              <TouchableOpacity key={idx} style={styles.faqItem} onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)} activeOpacity={0.7}>
                <View style={styles.faqRow}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons name={expandedFaq === idx ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                </View>
                {expandedFaq === idx && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            This guide is for informational purposes only. Always follow the specific instructions provided with your self-sampling kit and consult your healthcare provider with any questions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const FAQS = [
  { question: 'How long does the test take?', answer: 'The entire self-sampling process takes about 5-10 minutes from opening the kit to sealing the tube.' },
  { question: 'Is self-sampling painful?', answer: 'No, self-sampling is generally painless. You may feel mild pressure but it should not cause pain.' },
  { question: 'When will I get my results?', answer: 'Results are typically available within 2-4 weeks. Your healthcare provider will contact you.' },
  { question: 'Can I do self-sampling during my period?', answer: 'It is best to avoid self-sampling during menstruation. Wait until at least 3-5 days after your period has ended.' },
  { question: 'How accurate is self-sampling?', answer: 'HPV self-sampling has been shown to be highly accurate, with 96-99% sensitivity for detecting high-risk HPV.' },
];

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { paddingBottom: 40 },

    heroSection: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
    heroIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    heroTitle: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
    heroSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 8, paddingHorizontal: 10 },

    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, gap: 10 },
    primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
    skipBtn: { alignItems: 'center', paddingVertical: 14, marginHorizontal: 20 },
    skipBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

    progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 0 },
    progressStep: { flexDirection: 'row', alignItems: 'center' },
    progressDot: { width: 10, height: 10, borderRadius: 5 },
    progressLine: { width: 24, height: 2, marginHorizontal: 2 },

    scanSection: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
    scanInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 12, textAlign: 'center', letterSpacing: 2 },
    scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, gap: 8 },
    scanBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
    statusMsg: { fontSize: 13, textAlign: 'center', marginTop: 10, fontWeight: '500' },

    statusCard: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center' },
    statusCardTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 12 },
    statusCardDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginTop: 6 },

    videoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, marginHorizontal: 20, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 20, gap: 10 },
    videoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    videoBtnText: { fontSize: 15, fontWeight: '700', color: colors.primary, flex: 1 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, marginBottom: 10, marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1 },

    stepCard: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 6, position: 'relative' },
    stepNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    stepNumText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
    stepLine: { width: 2, flex: 1, backgroundColor: colors.primaryLight, position: 'absolute', top: 30, left: 35, zIndex: 1 },
    stepBody: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, marginLeft: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    stepIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    stepCardTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
    stepInstruction: { fontSize: 13, color: colors.text, lineHeight: 18 },
    tipBox: { flexDirection: 'row', backgroundColor: colors.primaryLight, padding: 10, borderRadius: 10, marginTop: 10, gap: 6, alignItems: 'flex-start' },
    tipText: { fontSize: 12, color: colors.text, flex: 1, lineHeight: 16 },

    checklistSection: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20 },
    checklistTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 4 },
    checklistDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
    checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    checkLabel: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 18 },

    checklistProgress: { marginHorizontal: 20, marginTop: 12, marginBottom: 16 },
    checklistProgressText: { fontSize: 13, color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
    checklistProgressBar: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
    checklistProgressFill: { height: 6, borderRadius: 3 },

    successCard: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center' },
    successTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12, marginBottom: 16 },
    successStep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, alignSelf: 'flex-start' },
    successDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
    successStepText: { fontSize: 13, color: colors.textSecondary, flex: 1 },

    faqSection: { paddingTop: 16, paddingBottom: 10 },
    faqHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, marginBottom: 6 },
    faqItem: { backgroundColor: colors.card, marginHorizontal: 20, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
    faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1, paddingRight: 8 },
    faqAnswer: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },

    disclaimer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 6, alignItems: 'flex-start' },
    disclaimerText: { fontSize: 11, color: colors.textSecondary, lineHeight: 16, flex: 1 },
  });
