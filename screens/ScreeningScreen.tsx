import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { submitScreening, fetchData } from '../services/api';
import { getItem, setItem } from '../services/storage';

const { width } = Dimensions.get('window');

type AnswerValue = string | number | null;
interface AnswerMap {
  [key: string]: AnswerValue;
}

interface QuestionConfig {
  key: string;
  title: string;
  type: 'number' | 'single';
  options?: { label: string; value: string }[];
  condition: (a: AnswerMap) => boolean;
}

const ageThreshold = 18;
const riskAgeThreshold = 30;
const riskParityThreshold = 3;
const highRiskThreshold = 8;
const moderateRiskThreshold = 4;



function calculateRisk(answers: AnswerMap): { score: number; level: string; factors: { label: string; active: boolean }[] } {
  let score = 0;
  const factors: { label: string; active: boolean }[] = [];
  const age = answers.age as number | null;
  const ageNum = age || 0;
  const births = answers.births as number | null;
  const pregnancies = answers.pregnancies as string | null;
  const vaccine = answers.vaccine as string | null;
  const ageFirstIntercourse = answers.ageFirstIntercourse as string | null;
  const periodStart = answers.periodStart as string | null;
  const partners = answers.partners as string | null;
  const newPartners = answers.newPartners as string | null;
  const condomUse = answers.condomUse as string | null;
  const stiHistory = answers.stiHistory as string | null;
  const contraceptives = answers.contraceptives as string | null;
  const previous = answers.previous as string | null;
  const lastResult = answers.lastResult as string | null;
  const hiv = answers.hiv as string | null;
  const immunocompromised = answers.immunocompromised as string | null;
  const diabetes = answers.diabetes as string | null;
  const smoking = answers.smoking as string | null;
  const alcohol = answers.alcohol as string | null;
  const exercise = answers.exercise as string | null;
  const diet = answers.diet as string | null;
  const symptoms = answers.symptoms as string | null;
  const symptomDuration = answers.symptomDuration as string | null;
  const family = answers.family as string | null;
  const familyOther = answers.familyOther as string | null;
  const distance = answers.distance as string | null;
  const cycleRegular = answers.cycleRegular as string | null;

  // Age risk
  if (ageNum >= 50) { score += 2; factors.push({ label: 'Age 50+ (higher risk)', active: true }); }
  else if (ageNum >= riskAgeThreshold) { score += 1; factors.push({ label: 'Age 30+', active: true }); }
  else factors.push({ label: 'Age 30+', active: false });

  // Early menstruation
  if (periodStart === 'under12') { score += 1; factors.push({ label: 'Early first period (under 12)', active: true }); }
  else factors.push({ label: 'Early first period', active: false });

  // Irregular cycles
  if (cycleRegular === 'irregular') { score += 1; factors.push({ label: 'Irregular menstrual cycles', active: true }); }
  else factors.push({ label: 'Irregular cycles', active: false });

  // Pregnancies
  if (pregnancies === '3_4' || pregnancies === '5plus') { score += 1; factors.push({ label: '3+ pregnancies', active: true }); }
  else factors.push({ label: '3+ pregnancies', active: false });

  if (births !== null && births >= riskParityThreshold) { score += 1; factors.push({ label: '3+ births', active: true }); }
  else factors.push({ label: '3+ births', active: false });

  // Early sexual activity
  if (ageFirstIntercourse === 'under16') { score += 2; factors.push({ label: 'First intercourse under 16 (high risk)', active: true }); }
  else if (ageFirstIntercourse === '16_18') { score += 1; factors.push({ label: 'First intercourse before 18', active: true }); }
  else factors.push({ label: 'First intercourse under 18', active: false });

  // Multiple partners
  if (partners === '7plus') { score += 2; factors.push({ label: '7+ lifetime partners (high risk)', active: true }); }
  else if (partners === '4_6') { score += 1; factors.push({ label: '4-6 lifetime partners', active: true }); }
  else factors.push({ label: 'Multiple partners', active: false });

  // New partners
  if (newPartners === '2plus') { score += 1; factors.push({ label: 'New partners in last year', active: true }); }
  else factors.push({ label: 'New partners', active: false });

  // No condom use
  if (condomUse === 'never') { score += 1; factors.push({ label: 'No condom use', active: true }); }
  else factors.push({ label: 'No condom use', active: false });

  // STI history
  if (stiHistory === 'recurring') { score += 2; factors.push({ label: 'Recurring STI history', active: true }); }
  else if (stiHistory === 'treated') { score += 1; factors.push({ label: 'Past STI history', active: true }); }
  else factors.push({ label: 'STI history', active: false });

  // Long-term contraceptives
  if (contraceptives === 'long_term') { score += 1; factors.push({ label: 'Long-term hormonal contraceptives', active: true }); }
  else factors.push({ label: 'Long-term contraceptives', active: false });

  // No/delayed screening
  if (previous === 'never') { score += 2; factors.push({ label: 'Never screened (high risk)', active: true }); }
  else if (previous === 'old') { score += 1; factors.push({ label: 'Last screening over 3 years ago', active: true }); }
  else factors.push({ label: 'Up-to-date screening', active: false });

  // Previous abnormal result
  if (lastResult === 'abnormal' || lastResult === 'hpv_positive') { score += 2; factors.push({ label: 'Previous abnormal screening result', active: true }); }
  else factors.push({ label: 'Previous abnormal result', active: false });

  // HIV
  if (hiv === 'positive') { score += 2; factors.push({ label: 'HIV positive (high risk)', active: true }); }
  else factors.push({ label: 'HIV positive', active: false });

  // Immunocompromised
  if (immunocompromised && immunocompromised !== 'no') { score += 2; factors.push({ label: 'Immunocompromised', active: true }); }
  else factors.push({ label: 'Immunocompromised', active: false });

  // Diabetes
  if (diabetes && diabetes !== 'no') { score += 1; factors.push({ label: 'Diabetes', active: true }); }
  else factors.push({ label: 'Diabetes', active: false });

  // Not vaccinated
  if (vaccine === 'none') { score += 1; factors.push({ label: 'Not vaccinated', active: true }); }
  else factors.push({ label: 'Not vaccinated', active: false });

  // Smoking
  if (smoking === 'yes') { score += 2; factors.push({ label: 'Current smoker (high risk)', active: true }); }
  else if (smoking === 'quit') { score += 1; factors.push({ label: 'Past smoker', active: true }); }
  else factors.push({ label: 'Smoker', active: false });

  // Alcohol
  if (alcohol === 'daily') { score += 2; factors.push({ label: 'Daily alcohol consumption', active: true }); }
  else if (alcohol === 'weekly') { score += 1; factors.push({ label: 'Weekly alcohol consumption', active: true }); }
  else factors.push({ label: 'Alcohol consumption', active: false });

  // No exercise
  if (exercise === 'never') { score += 1; factors.push({ label: 'Sedentary (no exercise)', active: true }); }
  else factors.push({ label: 'Sedentary', active: false });

  // Poor diet
  if (diet === 'unhealthy') { score += 1; factors.push({ label: 'Poor diet', active: true }); }
  else factors.push({ label: 'Poor diet', active: false });

  // Symptoms
  if (symptoms && symptoms !== 'none') {
    score += 2;
    factors.push({ label: 'Has symptoms', active: true });
    if (symptoms === 'multiple') { score += 1; factors.push({ label: 'Multiple symptoms', active: true }); }
    if (symptomDuration === 'chronic') { score += 1; factors.push({ label: 'Chronic symptoms (3+ months)', active: true }); }
    else factors.push({ label: 'Chronic symptoms', active: false });
  } else {
    factors.push({ label: 'Has symptoms', active: false });
    factors.push({ label: 'Multiple symptoms', active: false });
    factors.push({ label: 'Chronic symptoms', active: false });
  }

  // Family history
  if (family === 'immediate') { score += 2; factors.push({ label: 'Immediate family cervical cancer', active: true }); }
  else if (family === 'extended') { score += 1; factors.push({ label: 'Extended family cervical cancer', active: true }); }
  else factors.push({ label: 'Family history', active: false });
  if (familyOther && familyOther !== 'no') { score += 1; factors.push({ label: 'Other family cancer history', active: true }); }
  else factors.push({ label: 'Other family cancer', active: false });

  // Distance to care
  if (distance === 'far') { score += 1; factors.push({ label: 'Far from health facility', active: true }); }
  else factors.push({ label: 'Far from health facility', active: false });

  const level = score >= highRiskThreshold ? 'High' : score >= moderateRiskThreshold ? 'Moderate' : 'Low';
  return { score, level, factors };
}

function getGuidance(level: string): { title: string; text: string; color: string } {
  switch (level) {
    case 'High':
      return {
        title: 'High Risk',
        text: 'Your screening indicates a high risk. Please consult a healthcare provider immediately for further evaluation and a diagnostic test.',
        color: '#FF4D4D',
      };
    case 'Moderate':
      return {
        title: 'Moderate Risk',
        text: 'Your screening indicates a moderate risk. Schedule a follow-up screening within the next 3 months and discuss your results with a healthcare provider.',
        color: '#FFB800',
      };
    default:
      return {
        title: 'Low Risk',
        text: 'Your screening indicates a low risk. Continue regular checkups and maintain a healthy lifestyle. Schedule your next routine screening as recommended.',
        color: '#00C853',
      };
  }
}

export default function ScreeningScreen() {
  const { colors, isDark } = useTheme();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState<'start' | 'questions' | 'results'>('start');
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [questions, setQuestions] = useState<QuestionConfig[]>([]);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const data = await fetchData('questions');
      if (data && Array.isArray(data)) {
        setQuestions(data.map((q: any) => ({
          ...q,
          condition: q.condition ? new Function('a', `return ${q.condition}`) : () => true,
        })));
      }
    })();
  }, []);

  const visibleQuestions = useMemo(
    () => questions.filter((q) => q.condition(answers)),
    [answers, questions],
  );

  const currentQDef = visibleQuestions[currentQ];
  const totalVisible = visibleQuestions.length;
  const isLastQuestion = currentQ >= totalVisible - 1;
  const progress = totalVisible > 0 ? ((currentQ + 1) / totalVisible) * 100 : 0;

  const risk = useMemo(() => calculateRisk(answers), [answers]);
  const guidance = useMemo(() => getGuidance(risk.level), [risk.level]);

  const animateTransition = useCallback(
    (direction: 1 | -1) => {
      fadeAnim.setValue(0);
      slideAnim.setValue(direction * 40);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [fadeAnim, slideAnim],
  );

  const handleAnswer = useCallback(
    (key: string, value: AnswerValue) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      if (isLastQuestion) {
        setTimeout(() => setStep('results'), 300);
      } else {
        setCurrentQ((prev) => prev + 1);
        animateTransition(1);
      }
    },
    [isLastQuestion, animateTransition],
  );

  const handleSkip = useCallback(() => {
    if (isLastQuestion) {
      setStep('results');
    } else {
      setCurrentQ((prev) => prev + 1);
      animateTransition(1);
    }
  }, [isLastQuestion, animateTransition]);

  const handleSaveAssessment = useCallback(async () => {
    setSaving(true);
    try {
      const verdict = risk.level === 'High' ? 'POSITIVE' : 'NEGATIVE';
      const riskTier = risk.level === 'High' ? 'HIGH' : risk.level === 'Medium' ? 'MODERATE' : 'LOW';
      await submitScreening(user?.id ?? '', {
        verdict,
        risk_tier: riskTier as 'LOW' | 'MODERATE' | 'HIGH',
        score: risk.score,
        age: answers.age ? Number(answers.age) : undefined,
        parity: answers.births ? Number(answers.births) : undefined,
        vaccination: String(answers.vaccine ?? ''),
        smoking: String(answers.smoking ?? ''),
        hiv_status: String(answers.hiv ?? ''),
        symptoms: String(answers.symptoms ?? ''),
        family_history: String(answers.family ?? ''),
        previous_screening: String(answers.previous ?? ''),
      });
      if (user?.id) {
        await setItem(`@cervitrack_screening_${user.id}`, JSON.stringify({
          riskLevel: risk.level,
          score: risk.score,
          date: new Date().toISOString(),
        }));
      }
      addNotification({
        title: 'Screening Complete',
        message: `Your ${risk.level.toLowerCase()} risk assessment has been saved.`,
        type: 'screening',
      });
      setSaved(true);
    } catch {
      Alert.alert('Error', 'Failed to save assessment. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [risk, user, addNotification]);

  const handleRestart = useCallback(() => {
    setAnswers({});
    setCurrentQ(0);
    setStep('start');
    setSaved(false);
  }, []);

  const renderStart = () => (
    <View style={styles.startContainer}>
      <View style={[styles.startIconCircle, { backgroundColor: colors.primaryLight }]}>
        <MaterialCommunityIcons name="shield-search" size={52} color={colors.primary} />
      </View>
      <Text style={[styles.startTitle, { color: colors.text }]}>
        HPV Risk Assessment
      </Text>
      <Text style={[styles.startSubtitle, { color: colors.textSecondary }]}>
        Answer a few questions to assess your risk of cervical cancer. Your
        responses are private and secure. This assessment takes approximately
        2-3 minutes.
      </Text>
      <View style={styles.startFeatures}>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            Adaptive questionnaire
          </Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            Personalized risk score
          </Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            Actionable guidance
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
        onPress={() => {
          setStep('questions');
          animateTransition(1);
        }}
      >
        <Text style={styles.startButtonText}>Start Assessment</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderQuestion = () => {
    if (!currentQDef) return null;

    return (
      <KeyboardAvoidingView
        style={styles.questionContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Step {currentQ + 1} of {totalVisible}
          </Text>
        </View>

        <Animated.View
          style={[
            styles.questionCard,
            {
              backgroundColor: colors.card,
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.questionText, { color: colors.text }]}>
            {currentQDef.title}
          </Text>

          {currentQDef.type === 'number' ? (
            <TextInput
              style={[
                styles.numberInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Enter a number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={
                (answers[currentQDef.key] as string | number | null) != null
                  ? String(answers[currentQDef.key])
                  : ''
              }
              onChangeText={(text) => {
                const sanitized = text.replace(/[^0-9]/g, '');
                setAnswers((prev) => ({
                  ...prev,
                  [currentQDef.key]: sanitized ? parseInt(sanitized, 10) : null,
                }));
              }}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (answers[currentQDef.key] != null) {
                  handleAnswer(currentQDef.key, answers[currentQDef.key]);
                }
              }}
            />
          ) : (
            <View style={styles.optionsGrid}>
              {currentQDef.options?.map((opt) => {
                const isSelected = answers[currentQDef.key] === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.inputBg,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleAnswer(currentQDef.key, opt.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>

        {currentQDef.type === 'number' && (
          <TouchableOpacity
            style={[
              styles.nextButton,
              {
                backgroundColor:
                  answers[currentQDef.key] != null
                    ? colors.primary
                    : colors.border,
              },
            ]}
            activeOpacity={0.8}
            disabled={answers[currentQDef.key] == null}
            onPress={() => handleAnswer(currentQDef.key, answers[currentQDef.key])}
          >
            <Text
              style={[
                styles.nextButtonText,
                {
                  color:
                    answers[currentQDef.key] != null ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {isLastQuestion ? 'See Results' : 'Next'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={
                answers[currentQDef.key] != null ? '#FFFFFF' : colors.textSecondary
              }
            />
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    );
  };

  const renderResults = () => {
    const isHighRisk = risk.level === 'High';
    const isModerateRisk = risk.level === 'Moderate';
    const isLowRisk = risk.level === 'Low';

    const maxScore = 38;
    const scorePct = Math.min(risk.score / maxScore, 1);
    const activeFactors = risk.factors.filter((f) => f.active);
    const barColor = isHighRisk ? '#EF4444' : isModerateRisk ? '#F59E0B' : '#22C55E';
    const barBg = isHighRisk ? '#FEE2E2' : isModerateRisk ? '#FEF3C7' : '#F0FDF4';

    return (
      <ScrollView
        contentContainerStyle={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Risk Bar */}
        <View style={[styles.riskBarCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.riskBarTitle, { color: colors.text }]}>Your Risk Index</Text>
          <View style={styles.riskBarOuter}>
            <View style={[styles.riskBarTrack, { backgroundColor: barBg }]}>
              <View style={[styles.riskBarFill, { width: `${scorePct * 100}%`, backgroundColor: barColor }]} />
            </View>
          </View>
          <View style={styles.riskBarScale}>
            <Text style={styles.riskScaleText}>Low</Text>
            <View style={styles.riskScaleGradient}>
              {['#22C55E', '#86EFAC', '#FDE047', '#F97316', '#EF4444'].map((c, i) => (
                <View key={i} style={[styles.riskScaleStep, { backgroundColor: c }]} />
              ))}
            </View>
            <Text style={styles.riskScaleText}>High</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: barColor + '18' }]}>
            <Text style={[styles.riskBadgeText, { color: barColor }]}>
              {guidance.title} Risk · Score: {risk.score}/{maxScore}
            </Text>
          </View>
        </View>

        <View style={[styles.guidanceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.guidanceTitle, { color: colors.text }]}>
            What this means
          </Text>
          <Text style={[styles.guidanceText, { color: colors.textSecondary }]}>
            {guidance.text}
          </Text>
        </View>

        {activeFactors.length > 0 && (
          <View style={styles.scoreBreakdown}>
            <Text style={[styles.breakdownTitle, { color: colors.text }]}>
              Risk Factors Affecting You ({activeFactors.length})
            </Text>
            {activeFactors.map((item) => (
              <View key={item.label} style={styles.breakdownRow}>
                <Ionicons name="alert-circle" size={16} color={barColor} />
                <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeFactors.length === 0 && (
          <View style={styles.scoreBreakdown}>
            <Text style={[styles.breakdownTitle, { color: colors.text }]}>
              No significant risk factors detected
            </Text>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Continue with regular screenings and a healthy lifestyle.
            </Text>
          </View>
        )}

        {!saved ? (
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={handleSaveAssessment}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Assessment</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.savedBadge, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.savedText, { color: colors.success }]}>
              Assessment saved successfully
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.restartButton, { borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={handleRestart}
        >
          <Ionicons name="refresh" size={18} color={colors.textSecondary} />
          <Text style={[styles.restartButtonText, { color: colors.textSecondary }]}>
            Take Assessment Again
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <MaterialCommunityIcons name="ribbon" size={24} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          AI Screening Scan
        </Text>
        {step === 'questions' && (
          <TouchableOpacity onPress={() => setStep('start')}>
            <Text style={[styles.headerCancel, { color: colors.error }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
      {step === 'start' && renderStart()}
      {step === 'questions' && renderQuestion()}
      {step === 'results' && renderResults()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: -0.3,
  },
  headerCancel: {
    fontSize: 14,
    fontWeight: '600',
  },

  startContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  startIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  startTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  startSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 28,
  },
  startFeatures: {
    alignSelf: 'stretch',
    marginBottom: 36,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },

  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },

  questionCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 20,
    letterSpacing: -0.3,
  },

  numberInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  optionsGrid: {
    gap: 10,
  },
  optionButton: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
  },

  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },

  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  riskBarCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  riskBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  riskBarOuter: {
    width: '100%',
    paddingHorizontal: 4,
  },
  riskBarTrack: {
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  riskBarScale: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  riskScaleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    width: 30,
    textAlign: 'center',
  },
  riskScaleGradient: {
    flex: 1,
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  riskScaleStep: {
    flex: 1,
  },
  riskBadge: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  riskBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  riskBanner: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  riskIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  riskLevelText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  riskScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
  },

  guidanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  guidanceText: {
    fontSize: 14,
    lineHeight: 22,
  },

  scoreBreakdown: {
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  savedText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  restartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
