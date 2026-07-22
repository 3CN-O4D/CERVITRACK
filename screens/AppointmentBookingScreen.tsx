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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getItem, setItem } from '../services/storage';

interface Appointment {
  id: string;
  title: string;
  doctor: string;
  specialty: string;
  hospital: string;
  date: string;
  notes: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';
  createdAt: string;
}

const DOCTORS = [
  { name: 'Dr. Sarah Kimani', specialty: 'Gynecologic Oncology', hospital: 'Nairobi Women\'s Hospital' },
  { name: 'Dr. John Mwangi', specialty: 'Obstetrics & Gynecology', hospital: 'Kenyatta National Hospital' },
  { name: 'Dr. Grace Achieng', specialty: 'Gynecologic Oncology', hospital: 'Moi Teaching Hospital' },
  { name: 'Dr. Peter Kamau', specialty: 'General Medicine (Women\'s Health)', hospital: 'Aga Khan University Hospital' },
  { name: 'Dr. Faith Nyambura', specialty: 'Obstetrics & Gynecology', hospital: 'Coast General Hospital' },
  { name: 'Dr. David Omondi', specialty: 'Gynecologic Oncology', hospital: 'Nairobi Hospital' },
  { name: 'Nurse Mercy Wanjiku', specialty: 'Cervical Screening Specialist', hospital: 'Community Clinic' },
  { name: 'Dr. Laura Chebet', specialty: 'Obstetrics & Gynecology', hospital: 'Eldoret Hospital' },
];

const APPOINTMENTS_KEY = '@cervitrack_appointments';

function generateFallbackDates(count = 5): string[] {
  const dates: string[] = [];
  const start = new Date();
  while (dates.length < count) {
    start.setDate(start.getDate() + Math.floor(Math.random() * 7) + 1);
    const d = start.toISOString().split('T')[0];
    if (!dates.includes(d)) dates.push(d);
  }
  return dates.sort();
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
  const s = styles(colors);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBooking, setShowBooking] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [fallbackDates, setFallbackDates] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const uid = user?.id || 'guest';
      const raw = await getItem(`${APPOINTMENTS_KEY}_${uid}`);
      if (raw) setAppointments(JSON.parse(raw));
    } catch {} finally {
      setLoading(false);
    }
  };

  const saveAppointments = async (list: Appointment[]) => {
    const uid = user?.id || 'guest';
    await setItem(`${APPOINTMENTS_KEY}_${uid}`, JSON.stringify(list));
  };

  const openBookingForm = () => {
    setSelectedDoctor('');
    setSelectedDate('');
    setBookingNotes('');
    setFallbackDates(generateFallbackDates());
    setShowBooking(true);
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate) {
      Alert.alert('Required', 'Please select a doctor and date.');
      return;
    }
    setBookingLoading(true);
    const doctor = DOCTORS.find((d) => d.name === selectedDoctor)!;
    const apt: Appointment = {
      id: 'CRV-' + Date.now().toString(36).toUpperCase(),
      title: `Appointment with ${selectedDoctor}`,
      doctor: selectedDoctor,
      specialty: doctor.specialty,
      hospital: doctor.hospital,
      date: selectedDate,
      notes: bookingNotes,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    };
    const updated = [apt, ...appointments];
    setAppointments(updated);
    await saveAppointments(updated);

    setShowBooking(false);
    setBookingLoading(false);
    Alert.alert('Appointment Booked', `${formatDate(selectedDate)}\n${selectedDoctor}\n${doctor.hospital}`);
  };

  const cancelAppointment = (id: string) => {
    const updated = appointments.map((a) =>
      a.id === id ? { ...a, status: 'cancelled' as const } : a
    );
    setAppointments(updated);
    saveAppointments(updated);
  };

  const filtered = filterStatus === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filterStatus);

  const activeAppointments = appointments.filter((a) => a.status === 'upcoming' || a.status === 'pending');

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Appointments</Text>
        <Text style={s.headerSub}>
          {activeAppointments.length} upcoming
        </Text>
      </View>

      <View style={s.filterRow}>
        {['all', 'upcoming', 'completed', 'cancelled'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filterStatus === f && s.filterChipActive]}
            onPress={() => setFilterStatus(f)}
          >
            <Text style={[s.filterText, filterStatus === f && s.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.bookBtn} onPress={openBookingForm}>
        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        <Text style={s.bookBtnText}>Book New Appointment</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={s.emptyState}>
          <MaterialCommunityIcons name="calendar-blank" size={56} color={colors.textSecondary} />
          <Text style={s.emptyText}>No appointments</Text>
          <Text style={s.emptySub}>Book a screening or follow-up visit</Text>
        </View>
      ) : (
        <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
          {filtered.map((apt) => {
            const past = isPast(apt.date) && apt.status === 'upcoming';
            return (
              <View key={apt.id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.cardLeft}>
                    <View style={s.dateBox}>
                      <Text style={s.dateDay}>{new Date(apt.date + 'T12:00:00').getDate()}</Text>
                      <Text style={s.dateMonth}>
                        {new Date(apt.date + 'T12:00:00').toLocaleDateString('en-KE', { month: 'short' })}
                      </Text>
                    </View>
                    <View style={s.cardInfo}>
                      <Text style={s.cardTitle} numberOfLines={1}>{apt.title}</Text>
                      <Text style={s.cardDoctor}>{apt.doctor}</Text>
                      <Text style={s.cardDetail}>{apt.specialty} · {apt.hospital}</Text>
                    </View>
                  </View>
                  <View style={[
                    s.statusBadge,
                    apt.status === 'upcoming' && (past ? s.statusPast : s.statusUpcoming),
                    apt.status === 'completed' && s.statusCompleted,
                    apt.status === 'cancelled' && s.statusCancelled,
                  ]}>
                    <Text style={s.statusText}>
                      {past ? 'Overdue' : apt.status}
                    </Text>
                  </View>
                </View>
                {apt.notes ? (
                  <Text style={s.notes}>{apt.notes}</Text>
                ) : null}
                {apt.status === 'upcoming' && !past && (
                  <TouchableOpacity
                    style={s.cancelBtn}
                    onPress={() => cancelAppointment(apt.id)}
                  >
                    <Text style={s.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {showBooking && (
        <View style={s.bookingOverlay}>
          <View style={s.bookingModal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.bookingHeader}>
                <Text style={s.bookingTitle}>New Appointment</Text>
                <TouchableOpacity onPress={() => setShowBooking(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={s.fieldLabel}>Select Doctor</Text>
              {DOCTORS.map((doc) => (
                <TouchableOpacity
                  key={doc.name}
                  style={[s.doctorItem, selectedDoctor === doc.name && s.doctorItemSelected]}
                  onPress={() => setSelectedDoctor(doc.name)}
                >
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>
                      {doc.name.split(' ').slice(-2).map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={s.doctorInfo}>
                    <Text style={s.doctorName}>{doc.name}</Text>
                    <Text style={s.doctorSpecialty}>{doc.specialty}</Text>
                    <Text style={s.doctorHospital}>{doc.hospital}</Text>
                  </View>
                  {selectedDoctor === doc.name && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={s.fieldLabel}>Select Date</Text>
              <View style={s.dateRow}>
                {fallbackDates.map((d) => {
                  const selected = selectedDate === d;
                  const parts = d.split('-');
                  const display = `${parseInt(parts[2])} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(parts[1])-1]}`;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[s.dateChip, selected && s.dateChipSelected]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <Text style={[s.dateChipText, selected && s.dateChipTextSelected]}>
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
                <Text style={s.refreshDatesText}>Show more dates</Text>
              </TouchableOpacity>

              <Text style={s.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={s.notesInput}
                placeholder="Reason for visit, questions..."
                placeholderTextColor={colors.textSecondary}
                value={bookingNotes}
                onChangeText={setBookingNotes}
                multiline
              />

              <TouchableOpacity
                style={[s.submitBtn, bookingLoading && s.submitBtnDisabled]}
                onPress={handleBook}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.submitText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: 16,
      paddingTop: 60,
    },
    header: { marginBottom: 16 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
    headerSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    filterTextActive: { color: '#FFF' },
    bookBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      gap: 8,
      marginBottom: 20,
    },
    bookBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
    emptyText: { fontSize: 18, fontWeight: '700', color: colors.textSecondary, marginTop: 16 },
    emptySub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    list: { flex: 1 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    cardLeft: { flexDirection: 'row', flex: 1, gap: 14 },
    dateBox: {
      width: 48,
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateDay: { fontSize: 18, fontWeight: '800', color: colors.text },
    dateMonth: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: -2 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    cardDoctor: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    cardDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusUpcoming: { backgroundColor: '#E3F2FD' },
    statusCompleted: { backgroundColor: '#E8F5E9' },
    statusCancelled: { backgroundColor: '#FFF3E0' },
    statusPast: { backgroundColor: '#FFEBEE' },
    statusText: { fontSize: 11, fontWeight: '700', color: '#333' },
    notes: { fontSize: 13, color: colors.textSecondary, marginTop: 10, fontStyle: 'italic' },
    cancelBtn: { marginTop: 10, alignSelf: 'flex-end' },
    cancelText: { color: colors.error || '#E53935', fontSize: 13, fontWeight: '700' },
    bookingOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    bookingModal: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '85%',
    },
    bookingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    bookingTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    doctorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    doctorItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 13, fontWeight: '700', color: colors.primary },
    doctorInfo: { flex: 1 },
    doctorName: { fontSize: 14, fontWeight: '700', color: colors.text },
    doctorSpecialty: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    doctorHospital: { fontSize: 11, color: colors.textSecondary },
    dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    dateChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dateChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
    dateChipTextSelected: { color: '#FFF' },
    refreshDates: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
      alignSelf: 'center',
    },
    refreshDatesText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    notesInput: {
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  });
