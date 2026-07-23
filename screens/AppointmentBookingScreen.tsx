import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { searchClinicians, requestAppointment, getPatientAppointments } from '../services/api';

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

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showBooking, setShowBooking] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [patientNote, setPatientNote] = useState('');
  const [fallbackDates, setFallbackDates] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const generateFallbackDates = (count = 5): string[] => {
    const dates: string[] = [];
    const start = new Date();
    while (dates.length < count) {
      start.setDate(start.getDate() + Math.floor(Math.random() * 7) + 1);
      const d = start.toISOString().split('T')[0];
      if (!dates.includes(d)) dates.push(d);
    }
    return dates.sort();
  };

  const openBookingForm = () => {
    setSelectedDoctor(null);
    setSelectedDate('');
    setBookingNotes('');
    setPatientNote('');
    setFallbackDates(generateFallbackDates());
    setShowBooking(true);
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate) {
      Alert.alert('Required', 'Please select a doctor and date.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to book an appointment.');
      return;
    }
    setBookingLoading(true);
    try {
      await requestAppointment(
        user.id,
        selectedDoctor.id,
        selectedDate,
        '09:00',
        `Appointment with ${selectedDoctor.name}`,
        bookingNotes,
        patientNote,
      );
      setShowBooking(false);
      Alert.alert('Appointment Requested', `Your request for ${formatDate(selectedDate)} with ${selectedDoctor.name} has been sent.`);
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
          <View style={[s.bookingModal, { backgroundColor: colors.card }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.bookingHeader}>
                <Text style={[s.bookingTitle, { color: colors.text }]}>New Appointment</Text>
                <TouchableOpacity onPress={() => setShowBooking(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={[s.fieldLabel, { color: colors.text }]}>Select Clinician</Text>
              {doctors.length === 0 && (
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>No clinicians available. Try again later.</Text>
              )}
              {doctors.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[s.doctorItem, { backgroundColor: colors.inputBg, borderColor: colors.border }, selectedDoctor?.id === doc.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                  onPress={() => setSelectedDoctor(doc)}
                >
                  <View style={[s.avatar, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[s.avatarText, { color: colors.primary }]}>
                      {doc.name.split(' ').slice(-2).map((n: string) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={s.doctorInfo}>
                    <Text style={[s.doctorName, { color: colors.text }]}>{doc.name}</Text>
                    <Text style={[s.doctorSpecialty, { color: colors.textSecondary }]}>{doc.specialty || 'Clinician'}</Text>
                    <Text style={[s.doctorHospital, { color: colors.textSecondary }]}>{doc.hospital || ''}</Text>
                  </View>
                  {selectedDoctor?.id === doc.id && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={[s.fieldLabel, { color: colors.text }]}>Select Date</Text>
              <View style={s.dateRow}>
                {fallbackDates.map((d) => {
                  const selected = selectedDate === d;
                  const parts = d.split('-');
                  const display = `${parseInt(parts[2])} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(parts[1])-1]}`;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[s.dateChip, { backgroundColor: colors.inputBg, borderColor: colors.border }, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <Text style={[s.dateChipText, { color: selected ? '#FFF' : colors.text }]}>
                        {display}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={s.refreshDates}
                onPress={() => setFallbackDates(generateFallbackDates())}
              >
                <Ionicons name="refresh" size={16} color={colors.primary} />
                <Text style={[s.refreshDatesText, { color: colors.primary }]}>Show more dates</Text>
              </TouchableOpacity>

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
                style={[s.submitBtn, { backgroundColor: (!selectedDoctor || !selectedDate) ? colors.border : colors.primary }, bookingLoading && { opacity: 0.6 }]}
                onPress={handleBook}
                disabled={bookingLoading || !selectedDoctor || !selectedDate}
              >
                {bookingLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.submitText}>Request Appointment</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
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
  refreshDates: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'center' },
  refreshDatesText: { fontSize: 13, fontWeight: '600' },
  notesInput: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
