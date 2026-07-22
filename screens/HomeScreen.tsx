import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme, type ThemeColors } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { getItem } from '../services/storage';

const { width } = Dimensions.get('window');
const CARD_GAP = 10;
const STAT_CARD_W = (width - 40 - CARD_GAP * 2) / 3;
const ACTION_CARD_W = (width - 40 - CARD_GAP) / 2;

const timePeriods = ['Today', 'Week', 'Month', '3M', '6M', '1Y'];

const riskFactors = [
  { label: 'Age (30+)', met: true },
  { label: 'Multiple Pregnancies', met: false },
  { label: 'Reported Symptoms', met: true },
  { label: 'Smoking History', met: false },
  { label: 'Family History', met: true },
  { label: 'HPV Vaccinated', met: false },
];

export default function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [riskExpanded, setRiskExpanded] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Month');
  const [riskLevel, setRiskLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    getItem(`@cervitrack_screening_${user.id}`).then((raw) => {
      if (raw) {
        try {
          const data = JSON.parse(raw);
          setRiskLevel(data.riskLevel || null);
        } catch { /* ignore */ }
      }
    });
  }, [user?.id]);

  const isHighRisk = riskLevel === 'High';
  const isAssessed = riskLevel !== null;
  const s = styles(colors);
  const firstName = (user?.name || 'User').split(' ')[0];
  const stats = { screenings: 0, hpvPositive: 0, followups: 0 };
  const regionalStats = { registered: 0, screened: 0, hpvPositive: 0 };

  const quickActions = [
    { icon: 'calendar-outline', label: 'Appointments', color: colors.primary, sub: 'View schedule' },
    { icon: 'chatbubbles-outline', label: 'Talk to Nurse', color: colors.success, sub: 'Online now' },
    { icon: 'flask-outline', label: 'Lab Results', color: colors.warning, sub: 'View results' },
    { icon: 'syringe-outline', label: 'Vaccines', color: colors.danger, sub: 'Track doses' },
    { icon: 'test-tube-outline', label: 'Self-Sampling', color: '#8B5CF6', sub: 'Step-by-step' },
    { icon: 'document-text-outline', label: 'Self-Assessment', color: '#EC4899', sub: 'Risk check' },
    { icon: 'book-outline', label: 'Health Library', color: '#06B6D4', sub: 'Learn more' },
    { icon: 'chatbubble-ellipses', label: 'AI Assistant', color: '#8B5CF6', sub: 'Ask anything' },
  ];

  const handleAction = (label: string) => {
    switch (label) {
      case 'Appointments':
        navigation.navigate('AppointmentBooking');
        break;
      case 'Talk to Nurse':
        navigation.navigate('Messages');
        break;
      case 'Lab Results':
        navigation.navigate('LabResults');
        break;
      case 'Vaccines':
        navigation.navigate('Vaccines');
        break;
      case 'Self-Sampling':
        navigation.navigate('SelfSampling');
        break;
      case 'Health Library':
        navigation.navigate('HealthLibrary');
        break;
      case 'Self-Assessment':
        navigation.navigate('RiskAssessment');
        break;
      case 'AI Assistant':
        navigation.navigate('AIAssistant');
        break;
      case 'Screening Info':
        navigation.navigate('ScreeningInfo');
        break;
    }
  };

  return (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.brandRow}>
          <FontAwesome5 name="ribbon" size={22} color={colors.primary} />
          <Text style={s.brandText}>CerviTrack</Text>
        </View>
        <TouchableOpacity style={s.bellBtn} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <View style={s.greetingCard}>
        <View style={s.avatar}>
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={s.avatarImage} />
          ) : (
            <Text style={s.avatarText}>{firstName[0]}</Text>
          )}
        </View>
        <View style={s.greetingTextWrap}>
          <Text style={s.greetingHello}>Hello, {firstName}</Text>
          <Text style={s.greetingSub}>Welcome back to your health dashboard</Text>
        </View>
      </View>

      {/* Risk Status Card */}
      <TouchableOpacity
        style={[s.riskCard, {
          borderColor: !isAssessed ? colors.textSecondary + '40' : isHighRisk ? colors.danger + '40' : colors.success + '40'
        }]}
        onPress={() => isAssessed ? setRiskExpanded(!riskExpanded) : navigation.navigate('RiskAssessment')}
        activeOpacity={0.8}
      >
        <View style={s.riskHeader}>
          <View style={[s.riskIconWrap, {
            backgroundColor: !isAssessed ? colors.textSecondary + '15' : isHighRisk ? colors.danger + '15' : colors.success + '15'
          }]}>
            <Ionicons
              name={!isAssessed ? 'help-circle-outline' : isHighRisk ? 'alert-circle' : 'shield-checkmark'}
              size={28}
              color={!isAssessed ? colors.textSecondary : isHighRisk ? colors.danger : colors.success}
            />
          </View>
          <View style={s.riskTextWrap}>
            <Text style={s.riskLabel}>Risk Status</Text>
            <Text style={[s.riskValue, {
              color: !isAssessed ? colors.textSecondary : isHighRisk ? colors.danger : colors.success
            }]}>
              {!isAssessed ? 'Not Assessed' : isHighRisk ? 'High Risk' : 'Low Risk'}
            </Text>
          </View>
          <Ionicons
            name={!isAssessed ? 'arrow-forward' : riskExpanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textSecondary}
          />
        </View>
        {isAssessed && riskExpanded && (
          <View style={s.riskDetails}>
            <Text style={s.riskFactorsTitle}>Contributing Factors</Text>
            {riskFactors.map((f, i) => (
              <View key={i} style={s.riskFactorRow}>
                <Ionicons
                  name={f.met ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={f.met ? colors.success : colors.danger}
                />
                <Text style={s.riskFactorLabel}>{f.label}</Text>
                <View style={[s.riskFactorBadge, { backgroundColor: f.met ? colors.success + '15' : colors.danger + '15' }]}>
                  <Text style={[s.riskFactorBadgeText, { color: f.met ? colors.success : colors.danger }]}>
                    {f.met ? 'YES' : 'NO'}
                  </Text>
                </View>
              </View>
            ))}
            <View style={s.adviceBox}>
              <Ionicons name="bulb-outline" size={18} color={colors.warning} />
              <Text style={s.adviceText}>
                {isHighRisk
                  ? 'Please schedule an appointment with your gynecologist as soon as possible. Early detection is key.'
                  : 'Great job! Continue with regular screenings and maintain a healthy lifestyle.'}
              </Text>
            </View>
          </View>
        )}
        {!isAssessed && (
          <Text style={[s.assessPrompt, { color: colors.textSecondary }]}>
            Tap to take the risk assessment questionnaire
          </Text>
        )}
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}>
          <MaterialCommunityIcons name="test-tube" size={22} color={colors.primary} />
          <Text style={s.statNumber}>{stats.screenings}</Text>
          <Text style={s.statLabel}>Screenings</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.danger + '30' }]}>
          <MaterialCommunityIcons name="virus" size={22} color={colors.danger} />
          <Text style={[s.statNumber, { color: colors.danger }]}>{stats.hpvPositive}</Text>
          <Text style={s.statLabel}>HPV+ Cases</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.success + '30' }]}>
          <Ionicons name="checkmark-done" size={22} color={colors.success} />
          <Text style={[s.statNumber, { color: colors.success }]}>{stats.followups}</Text>
          <Text style={s.statLabel}>Follow-ups</Text>
        </View>
      </View>

      {/* Quick Actions Grid */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.actionsGrid}>
        {quickActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleAction(action.label)}
          >
            <View style={[s.actionIconWrap, { backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon as any} size={22} color={action.color} />
            </View>
            <Text style={s.actionLabel}>{action.label}</Text>
            <Text style={s.actionSub}>{action.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Regional Stats */}
      <Text style={s.sectionTitle}>Regional Statistics</Text>
      <View style={s.periodRow}>
        {timePeriods.map((p) => (
          <TouchableOpacity
            key={p}
            style={[s.periodChip, { backgroundColor: colors.inputBg, borderColor: colors.border }, selectedPeriod === p && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setSelectedPeriod(p)}
          >
            <Text style={[s.periodText, { color: selectedPeriod === p ? '#FFF' : colors.textSecondary }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.regionalRow}>
        <View style={[s.regionalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={s.regionalNumber}>{regionalStats.registered.toLocaleString()}</Text>
          <Text style={s.regionalLabel}>Registered</Text>
        </View>
        <View style={[s.regionalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={s.regionalNumber}>{regionalStats.screened.toLocaleString()}</Text>
          <Text style={s.regionalLabel}>Screened</Text>
        </View>
        <View style={[s.regionalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.regionalNumber, { color: colors.danger }]}>{regionalStats.hpvPositive}</Text>
          <Text style={s.regionalLabel}>HPV+</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  greetingTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  greetingHello: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  greetingSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  riskCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  assessPrompt: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  riskLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  riskValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  riskDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  riskFactorsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  riskFactorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskFactorLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 10,
  },
  riskFactorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskFactorBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  adviceBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  adviceText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: STAT_CARD_W,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: 24,
  },
  actionCard: {
    width: ACTION_CARD_W,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  actionSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
  },
  regionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  regionalCard: {
    width: STAT_CARD_W,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  regionalNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  regionalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
});
