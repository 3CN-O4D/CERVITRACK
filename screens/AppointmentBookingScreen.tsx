import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { supabase } from '../lib/supabase/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Clinician {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  county: string;
  years_experience: number;
  photo: string;
  bio: string;
  approval_status: string;
  online: boolean;
}

interface Facility {
  id: number;
  name: string;
  county: string;
  sub_county: string;
  ward: string;
}

interface Appointment {
  id: number;
  title: string;
  doctor: string;
  specialty: string;
  hospital: string;
  date: string;
  notes: string;
  custom_text: string;
  status: string;
  provider_id?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function generateDateOptions(count = 21): string[] {
  const dates: string[] = [];
  const start = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function AppointmentBookingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [hospitals, setHospitals] = useState<Facility[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [filteredClinicians, setFilteredClinicians] = useState<Clinician[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Facility | null>(null);
  const [selectedClinician, setSelectedClinician] = useState<Clinician | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [patientNote, setPatientNote] = useState('');
  const [dateOptions, setDateOptions] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [searchHospital, setSearchHospital] = useState('');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [step, setStep] = useState<'hospital' | 'doctor' | 'date'>('hospital');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [facilitiesRes, cliniciansRes, aptsRes] = await Promise.all([
        supabase.from('facilities').select('id, name, county, sub_county, ward').order('name'),
        supabase.from('providers').select('*').eq('approval_status', 'approved').order('name'),
        user?.id ? supabase.from('appointments').select('*, provider:providers(name, specialty, hospital)').eq('user_id', user.id).order('date', { ascending: false }) : Promise.resolve({ data: [] }),
      ]);

      setHospitals(facilitiesRes.data || []);
      setClinicians(cliniciansRes.data || []);
      setAppointments((aptsRes.data || []).map((a: any) => ({
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
    setSelectedHospital(null);
    setSelectedClinician(null);
    setSelectedDate('');
    setPatientNote('');
    setDateOptions(generateDateOptions());
    setSearchHospital('');
    setSearchDoctor('');
    setStep('hospital');
    setShowBooking(true);
  };

  const handleSelectHospital = (h: Facility) => {
    setSelectedHospital(h);
    const docs = clinicians.filter(
      (c) => c.hospital?.toLowerCase().includes(h.name.toLowerCase()) || c.county?.toLowerCase().includes(h.county?.toLowerCase() || '')
    );
    setFilteredClinicians(docs);
    setSelectedClinician(null);
    setStep('doctor');
  };

  const handleSelectClinician = (c: Clinician) => {
    setSelectedClinician(c);
    setStep('date');
  };

  const handleBook = async () => {
    if (!selectedDate || !user?.id) {
      Alert.alert('Required', 'Please select a date.');
      return;
    }
    setBookingLoading(true);
    try {
      const payload: any = {
        user_id: user.id,
        provider_id: selectedClinician?.id || null,
        date: selectedDate,
        time: '09:00',
        title: `Appointment with ${selectedClinician?.name || selectedHospital?.name || 'Clinician'}`,
        facility: selectedHospital?.name || '',
        facility_name: selectedHospital?.name || '',
        facility_location: `${selectedHospital?.county || ''}`.trim(),
        custom_text: patientNote,
        status: 'pending',
      };

      const { data, error } = await supabase.from('appointments').insert(payload).select().single();
      if (error) throw error;

      setShowBooking(false);
      Alert.alert('Success', `Appointment requested for ${formatDate(selectedDate)}.`);

      const apptDate = new Date(selectedDate + 'T09:00:00');
      const dayBefore = new Date(apptDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      if (dayBefore.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Appointment Reminder', body: `Appointment tomorrow at 09:00.` },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBefore, channelId: 'reminders' },
        });
      }

      addNotification({ title: 'Appointment Booked', message: `Appointment on ${formatDate(selectedDate)}`, type: 'appointment' });
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(h =>
    h.name.toLowerCase().includes(searchHospital.toLowerCase()) ||
    h.county?.toLowerCase().includes(searchHospital.toLowerCase())
  );

  const filteredDocs = filteredClinicians.filter(c =>
    c.name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
    c.specialty?.toLowerCase().includes(searchDoctor.toLowerCase())
  );

  const filteredApts = filterStatus === 'all'
    ? appointments
    : appointments.filter(a => a.status === filterStatus);

  const activeCount = appointments.filter(a => a.status === 'upcoming' || a.status === 'pending').length;
  const styles = createStyles(colors, insets);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Appointments</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{activeCount} active</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['all', 'pending', 'upcoming', 'completed', 'cancelled'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, { backgroundColor: colors.inputBg, borderColor: colors.border }, filterStatus === f && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setFilterStatus(f)}
            >
              <Text style={[styles.filterText, { color: filterStatus === f ? '#FFF' : colors.textSecondary }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredApts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={56} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No appointments</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Book a screening or follow-up visit</Text>
          </View>
        ) : (
          filteredApts.map((apt) => {
            const isOverdue = apt.status === 'upcoming' && new Date(apt.date + 'T23:59:59') < new Date();
            const statusColor = apt.status === 'completed' ? '#22C55E' : apt.status === 'cancelled' ? '#EF4444' : apt.status === 'pending' ? '#F59E0B' : isOverdue ? '#EF4444' : colors.primary;
            return (
              <View key={apt.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.dateBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Text style={[styles.dateDay, { color: colors.text }]}>{new Date(apt.date + 'T12:00:00').getDate()}</Text>
                      <Text style={[styles.dateMonth, { color: colors.textSecondary }]}>
                        {new Date(apt.date + 'T12:00:00').toLocaleDateString('en-KE', { month: 'short' })}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{apt.title}</Text>
                      <Text style={[styles.cardDoctor, { color: colors.textSecondary }]}>{apt.doctor}</Text>
                      {apt.specialty && <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>{apt.specialty} · {apt.hospital}</Text>}
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{isOverdue ? 'Overdue' : apt.status}</Text>
                  </View>
                </View>
                {apt.custom_text && (
                  <View style={[styles.customTextBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }]}>
                    <Ionicons name="chatbubble-outline" size={12} color={colors.primary} />
                    <Text style={[styles.customText, { color: colors.primary }]}>{apt.custom_text}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.bookBtn, { backgroundColor: colors.primary }]} onPress={openBookingForm}>
        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        <Text style={styles.bookBtnText}>Book New Appointment</Text>
      </TouchableOpacity>

      {/* Booking Modal */}
      {showBooking && (
        <View style={styles.bookingOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={[styles.bookingModal, { backgroundColor: colors.card }]}>
              <View style={styles.bookingHeader}>
                <Text style={[styles.bookingTitle, { color: colors.text }]}>New Appointment</Text>
                <TouchableOpacity onPress={() => setShowBooking(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
              </View>

              {/* Step Indicators */}
              <View style={styles.stepIndicator}>
                {['hospital', 'doctor', 'date'].map((s, i) => (
                  <TouchableOpacity key={s} disabled={i > ['hospital', 'doctor', 'date'].indexOf(step)} onPress={() => { if (i <= ['hospital', 'doctor', 'date'].indexOf(step)) setStep(s as any); }} style={styles.stepItem}>
                    <View style={[styles.stepDot, { backgroundColor: ['hospital', 'doctor', 'date'].indexOf(step) >= i ? colors.primary : colors.border }]}>
                      <Text style={[styles.stepDotText, { color: '#FFF' }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepLabel, { color: ['hospital', 'doctor', 'date'].indexOf(step) >= i ? colors.primary : colors.textSecondary }, { fontSize: 11 }]}>
                      {s === 'hospital' ? 'Hospital' : s === 'doctor' ? 'Doctor' : 'Date'}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '75%' }}>
                {/* Step 1: Select Hospital */}
                {step === 'hospital' && (
                  <>
                    <Text style={[styles.stepTitle, { color: colors.text }]}>1. Select Hospital</Text>
                    <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Ionicons name="search" size={18} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search hospitals..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchHospital}
                        onChangeText={setSearchHospital}
                      />
                    </View>
                    {filteredHospitals.map((h) => (
                      <TouchableOpacity
                        key={h.id}
                        style={[styles.selectItem, { backgroundColor: colors.inputBg, borderColor: colors.border }, selectedHospital?.id === h.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                        onPress={() => handleSelectHospital(h)}
                      >
                        <View style={[styles.selectItemIcon, { backgroundColor: colors.primary + '20' }]}>
                          <Ionicons name="business" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.selectItemInfo}>
                          <Text style={[styles.selectItemName, { color: colors.text }]}>{h.name}</Text>
                          <Text style={[styles.selectItemDetail, { color: colors.textSecondary }]}>{h.county}{h.sub_county ? ` · ${h.sub_county}` : ''}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* Step 2: Select Doctor */}
                {step === 'doctor' && (
                  <>
                    <Text style={[styles.stepTitle, { color: colors.text }]}>2. Select Doctor</Text>
                    <Text style={[styles.selectedInfo, { color: colors.textSecondary }]}>
                      Hospital: {selectedHospital?.name}
                    </Text>
                    <TouchableOpacity onPress={() => setStep('hospital')} style={{ marginBottom: 12 }}>
                      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>← Change hospital</Text>
                    </TouchableOpacity>
                    <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Ionicons name="search" size={18} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search doctors..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchDoctor}
                        onChangeText={setSearchDoctor}
                      />
                    </View>
                    {filteredDocs.length === 0 && (
                      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginVertical: 20 }}>
                        No doctors available at this hospital. Select another hospital.
                      </Text>
                    )}
                    {filteredDocs.map((doc) => (
                      <TouchableOpacity
                        key={doc.id}
                        style={[styles.selectItem, { backgroundColor: colors.inputBg, borderColor: colors.border }, selectedClinician?.id === doc.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                        onPress={() => handleSelectClinician(doc)}
                      >
                        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {doc.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </Text>
                        </View>
                        <View style={styles.selectItemInfo}>
                          <Text style={[styles.selectItemName, { color: colors.text }]}>{doc.name}</Text>
                          <Text style={[styles.selectItemDetail, { color: colors.textSecondary }]}>{doc.specialty || 'Clinician'}</Text>
                          {doc.years_experience > 0 && <Text style={[styles.selectItemDetail, { color: colors.textSecondary }]}>{doc.years_experience} years exp.</Text>}
                        </View>
                        {selectedClinician?.id === doc.id && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                    {filteredDocs.length > 0 && (
                      <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: selectedClinician ? colors.primary : colors.border }]}
                        onPress={handleSelectClinician.bind(null, selectedClinician!)}
                        disabled={!selectedClinician}
                      >
                        <Text style={styles.nextBtnText}>Next: Select Date →</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Step 3: Select Date & Confirm */}
                {step === 'date' && (
                  <>
                    <Text style={[styles.stepTitle, { color: colors.text }]}>3. Select Date</Text>
                    <View style={styles.selectedSummary}>
                      <Text style={[styles.selectedInfo, { color: colors.textSecondary }]}>
                        {selectedClinician?.name} @ {selectedHospital?.name}
                      </Text>
                      <TouchableOpacity onPress={() => setStep('doctor')}>
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>← Change</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Available Dates</Text>
                    <View style={styles.dateGrid}>
                      {dateOptions.map((d) => {
                        const selected = selectedDate === d;
                        const parts = d.split('-');
                        const day = parseInt(parts[2]);
                        const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(parts[1]) - 1];
                        const weekday = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d + 'T12:00:00').getDay()];
                        return (
                          <TouchableOpacity
                            key={d}
                            style={[styles.dateCard, { backgroundColor: colors.inputBg, borderColor: colors.border }, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                            onPress={() => setSelectedDate(d)}
                          >
                            <Text style={[styles.dateCardWeekday, { color: selected ? '#FFF' : colors.textSecondary }]}>{weekday}</Text>
                            <Text style={[styles.dateCardDay, { color: selected ? '#FFF' : colors.text }]}>{day}</Text>
                            <Text style={[styles.dateCardMonth, { color: selected ? '#FFF' : colors.textSecondary }]}>{month}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <TouchableOpacity onPress={() => setDateOptions(generateDateOptions())} style={{ alignSelf: 'center', marginVertical: 8 }}>
                      <Text style={{ color: colors.primary, fontSize: 13 }}>Show more dates</Text>
                    </TouchableOpacity>

                    <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 12 }]}>Note (optional)</Text>
                    <TextInput
                      style={[styles.notesInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                      placeholder="Reason for visit, symptoms..."
                      placeholderTextColor={colors.textSecondary}
                      value={patientNote}
                      onChangeText={setPatientNote}
                      multiline
                    />

                    <TouchableOpacity
                      style={[styles.submitBtn, { backgroundColor: !selectedDate ? colors.border : colors.primary }, bookingLoading && { opacity: 0.6 }]}
                      onPress={handleBook}
                      disabled={bookingLoading || !selectedDate}
                    >
                      {bookingLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Confirm Booking</Text>}
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: insets.top + 10, paddingBottom: 100 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  headerSub: { fontSize: 14, marginTop: 2 },
  filterRow: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  filterText: { fontSize: 13, fontWeight: '600' },
  bookBtn: {
    position: 'absolute', bottom: insets.bottom + 10, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 14, gap: 8,
  },
  bookBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
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
  customTextBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, padding: 10, borderRadius: 10, borderWidth: 1 },
  customText: { flex: 1, fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
  bookingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bookingModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  bookingTitle: { fontSize: 20, fontWeight: '800' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, position: 'relative' },
  stepItem: { alignItems: 'center', zIndex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepDotText: { fontSize: 12, fontWeight: '700' },
  stepLabel: { marginTop: 4 },
  stepLine: { position: 'absolute', top: 14, left: '15%', right: '15%', height: 2 },
  stepTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  selectItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, gap: 12 },
  selectItemIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selectItemInfo: { flex: 1 },
  selectItemName: { fontSize: 15, fontWeight: '700' },
  selectItemDetail: { fontSize: 12, marginTop: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
  selectedInfo: { fontSize: 13, marginBottom: 4 },
  nextBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  nextBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  selectedSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateCard: { width: '22%', alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  dateCardWeekday: { fontSize: 11, fontWeight: '600' },
  dateCardDay: { fontSize: 18, fontWeight: '800', marginVertical: 2 },
  dateCardMonth: { fontSize: 11, fontWeight: '600' },
  notesInput: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 16, marginBottom: 20 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
