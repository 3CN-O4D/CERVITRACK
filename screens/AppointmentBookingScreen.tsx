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
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [patientNote, setPatientNote] = useState('');
  const [dateOptions, setDateOptions] = useState<string[]>([]);
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

  const filteredDoctors = useMemo(() => {
    if (!selectedHospital) return doctors;
    return doctors.filter((d: any) => d.hospital === selectedHospital);
  }, [doctors, selectedHospital]);

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
    setSelectedTime('');
    setAnyAvailable(false);
    setBookingNotes('');
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
              </ScrollView>

              {selectedHospital ? (
                <>
                  <Text style={[s.fieldLabel, { color: colors.text }]}>Select Clinician at {selectedHospital}</Text>
                  {filteredDoctors.length === 0 && (
                    <>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>No clinicians listed at this hospital.</Text>
                      <TouchableOpacity
                        style={[s.anyAvailableBtn, { borderColor: colors.primary }, anyAvailable && { backgroundColor: colors.primary }]}
                        onPress={() => { setAnyAvailable(!anyAvailable); setSelectedDoctor(null); }}
                      >
                        <MaterialCommunityIcons name="account-question" size={18} color={anyAvailable ? '#FFF' : colors.primary} />
                        <Text style={[s.anyAvailableText, { color: anyAvailable ? '#FFF' : colors.primary }]}>
                          {anyAvailable ? '✓ Any Available Selected' : 'Any Available — I\'ll take whoever is free'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {filteredDoctors.map((doc) => (
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
                        <Text style={[s.doctorSpecialty, { color: colors.textSecondary }]}>{doc.specialty || 'Clinician'}</Text>
                      </View>
                      {selectedDoctor?.id === doc.id && (
                        <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>Please select a hospital first.</Text>
              )}

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
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  timeChipText: { fontSize: 13, fontWeight: '600' },
  anyAvailableBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1.5, marginBottom: 12 },
  anyAvailableText: { fontSize: 14, fontWeight: '600', flex: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
