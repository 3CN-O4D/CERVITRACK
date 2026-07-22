import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const HALF_W = (width - 40 - CARD_GAP) / 2;

const vaccines = [
  { name: 'HPV Dose 1', date: 'Aug 15, 2026', status: 'upcoming' as const },
  { name: 'HPV Dose 2', date: 'Oct 15, 2026', status: 'upcoming' as const },
  { name: 'HPV Dose 3', date: 'Feb 15, 2027', status: 'upcoming' as const },
];

const appointments = [
  { title: 'Annual Screening', date: '2026-07-20', doctor: 'Dr. Sarah Kimani', location: 'Nairobi Women\'s Hospital', status: 'completed' as const },
  { title: 'Follow-up Visit', date: '2026-08-05', doctor: 'Dr. John Mwangi', location: 'Kenyatta Clinic', status: 'upcoming' as const },
  { title: 'HPV Vaccine Dose 1', date: '2026-08-15', doctor: 'Nurse Mercy', location: 'Community Clinic', status: 'due' as const },
  { title: 'HPV Vaccine Dose 2', date: '2026-10-15', doctor: 'Nurse Mercy', location: 'Community Clinic', status: 'scheduled' as const },
];

const screeningHistory: { date: string; result: string; type: string }[] = [];

function CircularProgress({
  size = 140,
  strokeWidth = 12,
  progress = 0.75,
  color,
  children,
}: {
  size?: number;
  strokeWidth?: number;
  progress?: number;
  color: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const half = size / 2;
  const innerSize = size - strokeWidth * 2;
  const pct = Math.min(progress, 1);
  const rightAngle = Math.min(pct * 360, 180) - 90;
  const leftAngle = pct > 0.5 ? (pct - 0.5) * 360 + 90 : 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: half,
        borderWidth: strokeWidth,
        borderColor: colors.border,
      }} />
      <View style={{
        position: 'absolute',
        width: half,
        height: size,
        right: 0,
        overflow: 'hidden',
      }}>
        <View style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: strokeWidth,
          borderColor: color,
          left: -half,
          transform: [{ rotate: `${rightAngle}deg` }],
        }} />
      </View>
      {pct > 0.5 && (
        <View style={{
          position: 'absolute',
          width: half,
          height: size,
          left: 0,
          overflow: 'hidden',
        }}>
          <View style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: color,
            right: -half,
            transform: [{ rotate: `${leftAngle}deg` }],
          }} />
        </View>
      )}
      <View style={{
        width: innerSize,
        height: innerSize,
        borderRadius: innerSize / 2,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}>
        {children}
      </View>
    </View>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyHealthScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');

  const hpvFreeDays = (() => {
    if (user?.lastHealedDate) {
      const start = new Date(user.lastHealedDate);
      const now = new Date();
      return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 365;
  })();

  const healthScore = 0;
  const scoreColor = healthScore >= 80 ? colors.success : healthScore >= 50 ? colors.warning : colors.danger;

  const vaccineIcon = (status: string) => {
    switch (status) {
      case 'done': return { name: 'checkmark-circle' as const, color: colors.success };
      case 'missed': return { name: 'close-circle' as const, color: colors.danger };
      default: return { name: 'time-outline' as const, color: colors.warning };
    }
  };

  const statusDotColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'missed': return colors.danger;
      case 'rescheduled': return '#F59E0B';
      case 'due': return '#92400E';
      case 'scheduled':
      case 'upcoming': return '#3B82F6';
      default: return colors.primary;
    }
  };
  const markedDates: Record<string, any> = {};
  appointments.forEach((a) => {
    const key = a.date;
    const isSelected = key === selectedDate;
    markedDates[key] = {
      marked: true,
      dotColor: statusDotColor(a.status),
      selected: isSelected,
      selectedColor: colors.primary + '30',
    };
  });
  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = { selected: true, selectedColor: colors.primary + '20' };
  }

  const selectedAppointments = appointments.filter((a) => a.date === selectedDate);

  return (
    <ScrollView style={[s.scroll, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <MaterialCommunityIcons name="heart-pulse" size={26} color={colors.primary} />
        <Text style={[s.headerTitle, { color: colors.text }]}>My Health</Text>
      </View>

      {/* Health Score */}
      <View style={[s.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CircularProgress size={140} strokeWidth={12} progress={healthScore / 100} color={scoreColor}>
          <Text style={[s.scoreValue, { color: scoreColor }]}>{healthScore}</Text>
          <Text style={[s.scoreLabel, { color: colors.textSecondary }]}>Health Score</Text>
        </CircularProgress>
        <Text style={[s.scoreDesc, { color: colors.textSecondary }]}>
          Based on your screening history, risk factors, and lifestyle
        </Text>
      </View>

      {/* HPV-Free Counter */}
      <View style={[s.hpvCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
        <Text style={s.hpvEmoji}>{user?.lastHealedDate ? '🎉' : '📋'}</Text>
        <View style={s.hpvTextWrap}>
          {user?.lastHealedDate ? (
            <>
              <Text style={[s.hpvCount, { color: colors.success }]}>{hpvFreeDays.toLocaleString()}</Text>
              <Text style={[s.hpvLabel, { color: colors.text }]}>days HPV-free!</Text>
            </>
          ) : (
            <>
              <Text style={[s.hpvPrompt, { color: colors.primary }]}>No screening data yet</Text>
              <Text style={[s.hpvLabel, { color: colors.textSecondary }]}>
                Go for your first screening to track your HPV-free journey
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Calendar Card */}
      <View style={[s.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.calHeader}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={[s.calTitle, { color: colors.text }]}>Appointment Calendar</Text>
        </View>
        <Calendar
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#fff',
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textSecondary + '50',
            arrowColor: colors.primary,
            monthTextColor: colors.text,
            indicatorColor: colors.primary,
          }}
          markedDates={markedDates}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        />
        {selectedAppointments.length > 0 && (
          <View style={s.selectedAppts}>
            <Text style={[s.selectedDateLabel, { color: colors.textSecondary }]}>
              {formatDate(selectedDate)}
            </Text>
            {selectedAppointments.map((a, i) => (
              <View key={i} style={s.apptRow}>
                <View style={[s.apptDot, { backgroundColor: colors.primary }]} />
                <View style={s.apptTextWrap}>
                  <Text style={[s.apptTitle, { color: colors.text }]}>{a.title}</Text>
                  <Text style={[s.apptMeta, { color: colors.textSecondary }]}>{a.doctor} · {a.location}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {selectedDate && selectedAppointments.length === 0 && (
          <Text style={[s.noAppts, { color: colors.textSecondary }]}>No appointments on this date</Text>
        )}
      </View>

      {/* Risk Timeline */}
      <Text style={[s.sectionTitle, { color: colors.text }]}>Screening History</Text>
      <View style={[s.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {screeningHistory.map((item, i) => (
          <View key={i} style={s.timelineItem}>
            <View style={s.timelineDotWrap}>
              <View style={[s.timelineDot, { backgroundColor: item.result === 'Normal' ? colors.success : colors.warning }]} />
              {i < screeningHistory.length - 1 && <View style={[s.timelineLine, { backgroundColor: colors.border }]} />}
            </View>
            <View style={s.timelineContent}>
              <View style={s.timelineRow}>
                <Text style={[s.timelineDate, { color: colors.textSecondary }]}>{item.date}</Text>
                <View style={[s.resultBadge, { backgroundColor: item.result === 'Normal' ? colors.success + '15' : colors.warning + '15' }]}>
                  <Text style={[s.resultText, { color: item.result === 'Normal' ? colors.success : colors.warning }]}>{item.result}</Text>
                </View>
              </View>
              <Text style={[s.timelineType, { color: colors.text }]}>{item.type}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Vaccine Status + Upcoming Appointments side by side */}
      <View style={s.twoCol}>
        {/* Vaccine Status */}
        <View style={[s.colCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.colHeader}>
            <MaterialCommunityIcons name="needle" size={18} color={colors.primary} />
            <Text style={[s.colTitle, { color: colors.text }]}>Vaccines</Text>
          </View>
          {vaccines.map((v, i) => {
            const vi = vaccineIcon(v.status);
            return (
              <View key={i} style={s.vaccineRow}>
                <Ionicons name={vi.name} size={18} color={vi.color} />
                <View style={s.vaccineTextWrap}>
                  <Text style={[s.vaccineName, { color: colors.text }]}>{v.name}</Text>
                  <Text style={[s.vaccineDate, { color: colors.textSecondary }]}>{v.date}</Text>
                </View>
                <View style={[s.statusChip, { backgroundColor: v.status === 'upcoming' ? colors.primary + '15' : colors.success + '15' }]}>
                  <Text style={[s.statusChipText, { color: v.status === 'upcoming' ? colors.primary : colors.success }]}>
                    {v.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Upcoming Appointments */}
        <View style={[s.colCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.colHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={[s.colTitle, { color: colors.text }]}>Upcoming</Text>
          </View>
          {appointments.filter((a) => new Date(a.date) >= new Date()).slice(0, 3).map((a, i) => (
            <TouchableOpacity key={i} style={s.apptItem} onPress={() => setSelectedDate(a.date)}>
              <View style={[s.apptDot, { backgroundColor: statusDotColor(a.status) }]} />
              <View style={s.apptTextWrap}>
                <Text style={[s.apptTitle, { color: colors.text }]}>{a.title}</Text>
                <Text style={[s.apptMeta, { color: colors.textSecondary }]}>{formatDate(a.date)} · {a.doctor}</Text>
              </View>
              <View style={[s.statusChip, { backgroundColor: statusDotColor(a.status) + '20' }]}>
                <Text style={[s.statusChipText, { color: statusDotColor(a.status) }]}>{a.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {appointments.filter((a) => new Date(a.date) >= new Date()).length === 0 && (
            <Text style={[s.noAppts, { color: colors.textSecondary }]}>No upcoming appointments</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  calendarCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  calTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  selectedAppts: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectedDateLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  noAppts: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  scoreCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreDesc: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
  hpvCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
  },
  hpvEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  hpvTextWrap: {
    flex: 1,
  },
  hpvCount: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  hpvPrompt: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  hpvLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  timelineCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineDotWrap: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 10,
    fontWeight: '800',
  },
  timelineType: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  twoCol: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginBottom: 30,
  },
  colCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  colTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  vaccineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vaccineTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  vaccineName: {
    fontSize: 13,
    fontWeight: '600',
  },
  vaccineDate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  apptItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  apptDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginRight: 10,
  },
  apptTextWrap: {
    flex: 1,
  },
  apptTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  apptMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
});
