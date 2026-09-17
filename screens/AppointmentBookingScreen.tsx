import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { searchClinicians, requestAppointment, getPatientAppointments } from '../services/api';
import MonthCalendar from '../components/MonthCalendar';

interface Appointment {
  id: number;
  title: string;
  doctor: string;
  specialty: string;
  hospital: string;
  date: string;
  notes: string;
  custom_text: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';
  provider_id?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function isPast(dateStr: string): boolean {
  return new Date(dateStr + 'T23:59:59') < new Date();
}

export default function AppointmentBookingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showBooking, setShowBooking] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [clinicianSearch, setClinicianSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [patientNote, setPatientNote] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [anyAvailable, setAnyAvailable] = useState(false);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00',
  ];

  const uniqueHospitals = useMemo(() => {
    const hospitals = new Set(doctors.map((d: any) => d.hospital).filter(Boolean));
    return Array.from(hospitals).sort();
  }, [doctors]);

  const visibleDoctors = useMemo(() => {
    const q = clinicianSearch.trim().toLowerCase();
    return doctors.filter((d: any) => {
      if (selectedHospital && d.hospital !== selectedHospital) return false;
      if (!q) return true;
      return `${d.name || ''} ${d.specialty || ''} ${d.hospital || ''}`.toLowerCase().includes(q);
    });
  }, [doctors, selectedHospital, clinicianSearch]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clinicians, apts] = await Promise.all([
        searchClinicians().catch(() => []),
        user?.id ? getPatientAppointments(user.id).catch(() => []) : Promise.resolve([]),
      ]);
      setDoctors(clinicians);
      setAppointments(apts.map((a: any) => ({
        id: a.id,
        title: a.title || 'Appointment',
        doctor: a.provider?.name || a.facility_name || 'Doctor',
        specialty: a.provider?.specialty || '',
        hospital: a.provider?.hospital || a.facility_location || '',
        date: a.date,
        notes: a.notes || '',
        custom_text: a.custom_text || '',
        status: a.status || 'pending',
        provider_id: a.provider_id,
      })));
    } catch {} finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openBookingForm = () => {
    setSelectedDoctor(null);
    setSelectedHospital('');
    setClinicianSearch('');
    setSelectedDate('');
    setSelectedTime('');
    setAnyAvailable(false);
    setBookingNotes('');
    setPatientNote('');
    setShowBooking(true);
  };

  const handleBook = async () => {
    if (!selectedDate) {
      Alert.alert('Required', 'Please select a date.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Required', 'Please select a time.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to book an appointment.');
      return;
    }
    if (!selectedDoctor && !anyAvailable) {
      Alert.alert('Required', 'Please select a clinician or tap "Any Available".');
      return;
    }
    setBookingLoading(true);
    try {
      const providerId = selectedDoctor?.id || '';
      const doctorName = anyAvailable ? 'Any Available' : (selectedDoctor?.name || 'Clinician');
      await requestAppointment(
        user.id,
        providerId,
        selectedDate,
        selectedTime,
        `Appointment with ${doctorName}`,
        bookingNotes,
        patientNote,
      );
      setShowBooking(false);
      Alert.alert('Appointment Requested', `Your request for ${formatDate(selectedDate)} with ${doctorName} has been sent.`);

      const doctorTime = selectedTime || '09:00';
      const [hourStr, minStr] = doctorTime.split(':');
      const apptDate = new Date(selectedDate + `T${hourStr}:${minStr}:00`);
      const now = Date.now();

      // Helper to schedule a notification
      const schedule = async (opts: { title: string; body: string; date: Date; channelId?: string; type?: string }) => {
        if (opts.date.getTime() <= now) return;
        const channelId = opts.channelId || 'reminders';
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: opts.title,
              body: opts.body,
              sound: 'default',
              priority: channelId === 'alarms'
                ? Notifications.AndroidNotificationPriority.MAX
                : Notifications.AndroidNotificationPriority.HIGH,
              ...(Platform.OS === 'android' ? { channelId } : {}),
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: opts.date } as any,
          });
        } catch { /* best-effort */ }
      };

      // Build reminder timeline
      const reminders = [];

      // 1. Previous day at 20:00 — first heads up
      const prevEvening = new Date(apptDate);
      prevEvening.setDate(prevEvening.getDate() - 1);
      prevEvening.setHours(20, 0, 0, 0);
      reminders.push({
        title: 'Appointment Tomorrow',
        body: `Reminder: you have an appointment with ${doctorName} tomorrow at ${apptDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}.`,
        date: prevEvening,
      });

      // 2. Day-of at 08:00 — morning reminder
      const morningOf = new Date(apptDate);
      morningOf.setHours(8, 0, 0, 0);
      if (morningOf.getTime() < apptDate.getTime()) {
        reminders.push({
          title: 'Appointment Today',
          body: `Your appointment with ${doctorName} is today at ${apptDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}.`,
          date: morningOf,
        });
      }

      // 3. 2 hours before — getting close
      const twoHoursBefore = new Date(apptDate.getTime() - 2 * 60 * 60 * 1000);
      if (twoHoursBefore.getTime() > now && twoHoursBefore.getTime() > morningOf.getTime()) {
        reminders.push({
          title: 'Appointment Soon',
          body: `Your appointment with ${doctorName} is in about 2 hours at ${apptDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}.`,
          date: twoHoursBefore,
        });
      }

      // Schedule all reminders
      for (const r of reminders) {
        await schedule({ ...r, channelId: 'reminders' });
      }

      // 4. 20 minutes before — ALARM (rings persistently)
      const twentyMinBefore = new Date(apptDate.getTime() - 20 * 60 * 1000);
      if (twentyMinBefore.getTime() > now) {
        await schedule({
          title: '⚠ Appointment in 20 Minutes',
          body: `Your appointment with ${doctorName} is in 20 minutes at ${apptDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}.`,
          date: twentyMinBefore,
          channelId: 'alarms',
        });
      }

      // 5. At appointment time — ALARM (due, rings persistently)
      if (apptDate.getTime() > now) {
        await schedule({
          title: '🔔 Appointment Due Now',
          body: `Your appointment with ${doctorName} is starting now at ${apptDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}.`,
          date: apptDate,
          channelId: 'alarms',
        });
      }

      addNotification({
        title: 'Appointment Booked',
        message: `Appointment with ${doctorName} on ${formatDate(selectedDate)}`,
        type: 'appointment',
      });

      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const filtered = filterStatus === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filterStatus);

  const activeAppointments = appointments.filter((a) => a.status === 'upcoming' || a.status === 'pending');

  return (
    <View style={s.container}>
      <ScrollView
        style={s.scrollInner}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Appointments</Text>
          <Text style={[s.headerSub, { color: colors.textSecondary }]}>
            {activeAppointments.length} active
          </Text>
        </View>

        <View style={s.filterRow}>
          {['all', 'pending', 'upcoming', 'completed', 'cancelled'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, { backgroundColor: colors.inputBg, borderColor: colors.border }, filterStatus === f && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setFilterStatus(f)}
            >
              <Text style={[s.filterText, { color: filterStatus === f ? '#FFF' : colors.textSecondary }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={56} color={colors.textSecondary} />
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>No appointments</Text>
            <Text style={[s.emptySub, { color: colors.textSecondary }]}>Book a screening or follow-up visit</Text>
          </View>
        ) : (
          filtered.map((apt) => {
            const past = isPast(apt.date) && apt.status === 'upcoming';
            const statusColor = apt.status === 'completed' ? colors.success : apt.status === 'cancelled' ? colors.warning : apt.status === 'pending' ? '#F59E0B' : colors.primary;
            return (
              <View key={apt.id} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.cardTop}>
                  <View style={s.cardLeft}>
                    <View style={[s.dateBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Text style={[s.dateDay, { color: colors.text }]}>{new Date(apt.date + 'T12:00:00').getDate()}</Text>
                      <Text style={[s.dateMonth, { color: colors.textSecondary }]}>
                        {new Date(apt.date + 'T12:00:00').toLocaleDateString('en-KE', { month: 'short' })}
                      </Text>
                    </View>
                    <View style={s.cardInfo}>
                      <Text style={[s.cardTitle, { color: colors.text }]} numberOfLines={1}>{apt.title}</Text>
                      <Text style={[s.cardDoctor, { color: colors.textSecondary }]}>{apt.doctor}</Text>
                      {apt.specialty ? <Text style={[s.cardDetail, { color: colors.textSecondary }]}>{apt.specialty} · {apt.hospital}</Text> : null}
                    </View>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[s.statusText, { color: statusColor }]}>
                      {past ? 'Overdue' : apt.status}
                    </Text>
                  </View>
                </View>
                {apt.custom_text ? (
                  <View style={[s.customTextBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }]}>
                    <Ionicons name="chatbubble-outline" size={12} color={colors.primary} />
                    <Text style={[s.customText, { color: colors.primary }]}>{apt.custom_text}</Text>
                  </View>
                ) : null}
                {apt.notes ? (
                  <Text style={[s.notes, { color: colors.textSecondary }]}>{apt.notes}</Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={[s.bookBtn, { backgroundColor: colors.primary }]} onPress={openBookingForm}>
        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        <Text style={s.bookBtnText}>Book New Appointment</Text>
      </TouchableOpacity>

      {showBooking && (
        <View style={s.bookingOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
          <View style={[s.bookingModal, { backgroundColor: colors.card }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.bookingHeader}>
                <Text style={[s.bookingTitle, { color: colors.text }]}>New Appointment</Text>
                <TouchableOpacity onPress={() => setShowBooking(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={[s.fieldLabel, { color: colors.text }]}>Search Clinician</Text>
              <TextInput
                style={[s.searchInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                placeholder="Search by name, specialty or hospital..."
                placeholderTextColor={colors.textSecondary}
                value={clinicianSearch}
                onChangeText={setClinicianSearch}
              />

              <Text style={[s.fieldLabel, { color: colors.text }]}>Filter by Hospital (optional)</Text>
              {uniqueHospitals.length === 0 && (
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>No hospitals available.</Text>
              )}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {uniqueHospitals.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[s.hospitalChip, { backgroundColor: colors.inputBg, borderColor: colors.border }, selectedHospital === h && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => { setSelectedHospital(selectedHospital === h ? '' : h); setSelectedDoctor(null); }}
                  >
                    <Text style={[s.hospitalChipText, { color: selectedHospital === h ? '#FFF' : colors.text }]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[s.fieldLabel, { color: colors.text }]}>Select Clinician</Text>
              <TouchableOpacity
                style={[s.anyAvailableBtn, { borderColor: colors.primary }, anyAvailable && { backgroundColor: colors.primary }]}
                onPress={() => { setAnyAvailable(!anyAvailable); setSelectedDoctor(null); }}
              >
                <MaterialCommunityIcons name="account-question" size={18} color={anyAvailable ? '#FFF' : colors.primary} />
                <Text style={[s.anyAvailableText, { color: anyAvailable ? '#FFF' : colors.primary }]}>
                  {anyAvailable ? '✓ Any Available Selected' : 'Any Available — I\'ll take whoever is free'}
                </Text>
              </TouchableOpacity>
              {visibleDoctors.length === 0 && (
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
                  {doctors.length === 0 ? 'No clinicians available yet.' : 'No clinicians match your search.'}
                </Text>
              )}
              {visibleDoctors.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[s.doctorItem, { backgroundColor: colors.inputBg, borderColor: colors.border }, selectedDoctor?.id === doc.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                  onPress={() => { setSelectedDoctor(doc); setAnyAvailable(false); }}
                >
                  <View style={[s.avatar, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[s.avatarText, { color: colors.primary }]}>
                      {doc.name?.split(' ').slice(-2).map((n: string) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={s.doctorInfo}>
                    <Text style={[s.doctorName, { color: colors.text }]}>{doc.name}</Text>
                    <Text style={[s.doctorSpecialty, { color: colors.textSecondary }]}>
                      {[doc.specialty, doc.hospital].filter(Boolean).join(' · ') || 'Clinician'}
                    </Text>
                  </View>
                  {selectedDoctor?.id === doc.id && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={[s.fieldLabel, { color: colors.text }]}>Select Date</Text>
              <MonthCalendar value={selectedDate} onChange={setSelectedDate} />

              <Text style={[s.fieldLabel, { color: colors.text }]}>Select Time</Text>
              <View style={s.timeRow}>
                {timeSlots.map((t) => {
                  const selected = selectedTime === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[s.timeChip, { backgroundColor: colors.inputBg, borderColor: colors.border }, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setSelectedTime(t)}
                    >
                      <Text style={[s.timeChipText, { color: selected ? '#FFF' : colors.text }]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[s.fieldLabel, { color: colors.text }]}>Your Note (optional)</Text>
              <TextInput
                style={[s.notesInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                placeholder="Reason for visit, symptoms, questions..."
                placeholderTextColor={colors.textSecondary}
                value={patientNote}
                onChangeText={setPatientNote}
                multiline
              />

              <Text style={[s.fieldLabel, { color: colors.text }]}>Additional Notes (optional)</Text>
              <TextInput
                style={[s.notesInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                placeholder="Anything else you'd like to mention..."
                placeholderTextColor={colors.textSecondary}
                value={bookingNotes}
                onChangeText={setBookingNotes}
                multiline
              />

              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: (!selectedDate || !selectedTime) ? colors.border : colors.primary }, bookingLoading && { opacity: 0.6 }]}
                onPress={handleBook}
                disabled={bookingLoading || !selectedDate || !selectedTime}
              >
                {bookingLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.submitText}>Request Appointment</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scrollInner: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16, paddingTop: 60 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  headerSub: { fontSize: 14, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 14, gap: 8, marginHorizontal: 16, marginBottom: 20,
  },
  bookBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flexDirection: 'row', flex: 1, gap: 14 },
  dateBox: { width: 48, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dateDay: { fontSize: 18, fontWeight: '800' },
  dateMonth: { fontSize: 11, fontWeight: '600', marginTop: -2 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDoctor: { fontSize: 13, marginTop: 2 },
  cardDetail: { fontSize: 12, marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  customTextBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, padding: 10, borderRadius: 10, borderWidth: 1,
  },
  customText: { flex: 1, fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
  notes: { fontSize: 13, marginTop: 10, fontStyle: 'italic' },
  bookingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bookingModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  bookingTitle: { fontSize: 20, fontWeight: '800' },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  doctorItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 14, fontWeight: '700' },
  doctorSpecialty: { fontSize: 12, marginTop: 1 },
  doctorHospital: { fontSize: 11 },
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  dateChipText: { fontSize: 13, fontWeight: '600' },
  hospitalChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  hospitalChipText: { fontSize: 13, fontWeight: '600' },
  refreshDates: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'center' },
  refreshDatesText: { fontSize: 13, fontWeight: '600' },
  notesInput: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, minHeight: 80, textAlignVertical: 'top' },
  searchInput: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  timeChipText: { fontSize: 13, fontWeight: '600' },
  anyAvailableBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1.5, marginBottom: 12 },
  anyAvailableText: { fontSize: 14, fontWeight: '600', flex: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
