import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';
import { getFacilities, bookAppointment } from '../services/api';

interface Facility {
  id: number;
  name: string;
  location: string;
  distance: string;
  phone: string;
  hours: string;
  services: string[];
  lat: number;
  lng: number;
}

interface BookedAppointment {
  facilityName: string;
  date: string;
  notes: string;
  bookingRef: string;
}

const MOCK_FACILITIES: Facility[] = [
  {
    id: 1,
    name: 'Kenyatta National Hospital',
    location: 'Hospital Rd, Nairobi',
    distance: '2.3 km',
    phone: '+254202727000',
    hours: '24 hours',
    services: ['HPV Screening', 'Vaccination', 'Colposcopy', 'Treatment'],
    lat: -1.2921,
    lng: 36.8219,
  },
  {
    id: 2,
    name: 'Moi Teaching & Referral Hospital',
    location: 'Nandi Rd, Eldoret',
    distance: '5.1 km',
    phone: '+254532033000',
    hours: '24 hours',
    services: ['HPV Screening', 'Vaccination', 'Cancer Treatment'],
    lat: 0.5143,
    lng: 35.2698,
  },
  {
    id: 3,
    name: 'Coast General Hospital',
    location: 'Moi Ave, Mombasa',
    distance: '1.8 km',
    phone: '+254412314000',
    hours: '24 hours',
    services: ['HPV Screening', 'Vaccination', 'Maternal Health'],
    lat: -4.0435,
    lng: 39.6682,
  },
  {
    id: 4,
    name: 'Aga Khan University Hospital',
    location: '3rd Parklands Ave, Nairobi',
    distance: '3.5 km',
    phone: '+254203774000',
    hours: '06:00 - 22:00',
    services: ['HPV Screening', 'Vaccination', 'Colposcopy', 'Nutrition Counseling'],
    lat: -1.2611,
    lng: 36.8086,
  },
  {
    id: 5,
    name: 'Kisumu County Referral Hospital',
    location: 'Oginga Odinga Rd, Kisumu',
    distance: '4.2 km',
    phone: '+254572025000',
    hours: '24 hours',
    services: ['HPV Screening', 'Vaccination', 'Treatment'],
    lat: -0.1022,
    lng: 34.7617,
  },
  {
    id: 6,
    name: 'Nakuru PGH Annex',
    location: 'State House Rd, Nakuru',
    distance: '2.7 km',
    phone: '+254512216100',
    hours: '07:00 - 20:00',
    services: ['HPV Screening', 'Vaccination', 'Wellness Programs'],
    lat: -0.3072,
    lng: 36.0794,
  },
  {
    id: 7,
    name: 'Machakos Level 5 Hospital',
    location: 'Machakos Town',
    distance: '6.0 km',
    phone: '+254451212000',
    hours: '24 hours',
    services: ['HPV Screening', 'Vaccination', 'Community Outreach'],
    lat: -1.5177,
    lng: 37.2634,
  },
  {
    id: 8,
    name: 'Meru Teaching & Referral Hospital',
    location: 'Meru Town',
    distance: '8.4 km',
    phone: '+254642031000',
    hours: '24 hours',
    services: ['HPV Screening', 'Vaccination', 'Cancer Screening'],
    lat: 0.0474,
    lng: 37.6495,
  },
];

export default function FacilityScreen() {
  const { colors, isDark } = useTheme();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>(MOCK_FACILITIES);
  const [loading, setLoading] = useState(true);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      const data = await getFacilities();
      if (data && data.length > 0) {
        const enriched = data.map((f, i) => {
          const idx = i % MOCK_FACILITIES.length;
          return { ...MOCK_FACILITIES[idx], id: f.id, name: f.name };
        });
        setFacilities(enriched);
      }
    } catch {
      // Use default mock
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = useMemo(() => {
    if (!searchQuery.trim()) return facilities;
    const q = searchQuery.toLowerCase();
    return facilities.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q) || f.services.some((s) => s.toLowerCase().includes(q)),
    );
  }, [searchQuery, facilities]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = (lat: number, lng: number, name: string) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url!);
  };

  const openBooking = (facility: Facility) => {
    setSelectedFacility(facility);
    setSelectedDate('');
    setBookingNotes('');
    setBookingModalVisible(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedFacility || !selectedDate) return;
    setBookingLoading(true);
    try {
      await bookAppointment({
        facility: selectedFacility.name,
        date: selectedDate,
        user_id: user?.id ?? '',
      });
      const ref = 'CRV-' + Date.now().toString(36).toUpperCase();
      const apt: BookedAppointment = {
        facilityName: selectedFacility.name,
        date: selectedDate,
        notes: bookingNotes,
        bookingRef: ref,
      };
      setBookedAppointments((prev) => [apt, ...prev]);
      addNotification({
        title: 'Appointment Booked',
        message: `Your appointment at ${selectedFacility.name} on ${selectedDate} has been confirmed. Reference: ${ref}`,
        type: 'appointment',
      });
      setBookingModalVisible(false);
      Alert.alert('Booking Confirmed', `Reference: ${ref}\nDate: ${selectedDate}\nFacility: ${selectedFacility.name}`);
    } catch {
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const styles = makeStyles(colors, isDark);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.nearestSection}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.nearestTitle}>{t('facility.nearestFacility')}</Text>
            <Text style={styles.nearestName}>{facilities[0]?.name}</Text>
            <Text style={styles.nearestDist}>{facilities[0]?.distance} away</Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('common.search') + ' facilities...'}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionTitle}>{filteredFacilities.length} Facilities Near You</Text>

          {filteredFacilities.map((facility) => (
            <View key={facility.id} style={styles.facilityCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <FontAwesome5 name="hospital" size={18} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.facilityName}>{facility.name}</Text>
                  <Text style={styles.facilityLocation}>
                    <Ionicons name="location-outline" size={12} color={colors.textSecondary} /> {facility.location}
                  </Text>
                </View>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{facility.distance}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.infoText}>{facility.hours}</Text>
                <Ionicons name="call-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 16 }} />
                <Text style={styles.infoText}>{facility.phone}</Text>
              </View>

              <View style={styles.servicesRow}>
                {facility.services.map((service, idx) => (
                  <View key={idx} style={styles.serviceChip}>
                    <Text style={styles.serviceChipText}>{service}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(facility.phone)}>
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionBtnText}>{t('facility.callNow')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDirections(facility.lat, facility.lng, facility.name)}>
                  <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionBtnText}>{t('facility.directions')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.bookBtn]} onPress={() => openBooking(facility)}>
                  <MaterialCommunityIcons name="calendar-plus" size={16} color="#FFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{t('facility.bookAppointment')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {bookedAppointments.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>My Appointments</Text>
              {bookedAppointments.map((apt, idx) => (
                <View key={idx} style={styles.appointmentCard}>
                  <View style={styles.apptIconWrap}>
                    <MaterialCommunityIcons name="calendar-check" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.apptInfo}>
                    <Text style={styles.apptFacility}>{apt.facilityName}</Text>
                    <Text style={styles.apptDate}>{apt.date}</Text>
                    {apt.notes ? <Text style={styles.apptNotes}>{apt.notes}</Text> : null}
                    <Text style={styles.apptRef}>Ref: {apt.bookingRef}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={bookingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selectedFacility && <Text style={styles.modalFacility}>{selectedFacility.name}</Text>}

            <Text style={styles.label}>Select Date</Text>
            <Calendar
              onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
              markedDates={selectedDate ? { [selectedDate]: { selected: true, selectedColor: colors.primary } } : {}}
              theme={{
                calendarBackground: colors.card,
                todayTextColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#FFF',
                dayTextColor: colors.text,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textSectionTitleColor: colors.textSecondary,
                backgroundColor: colors.card,
              }}
            />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any special requests..."
              placeholderTextColor={colors.textSecondary}
              value={bookingNotes}
              onChangeText={setBookingNotes}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitBtn, !selectedDate && { opacity: 0.5 }]}
              onPress={handleBookAppointment}
              disabled={!selectedDate || bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centered: { justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16, paddingBottom: 40 },

    nearestSection: {
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    nearestTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 6,
    },
    nearestName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginTop: 2,
    },
    nearestDist: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },

    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 12,
      marginTop: 4,
    },

    facilityCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    cardIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardHeaderText: { flex: 1, marginLeft: 12 },
    facilityName: { fontSize: 15, fontWeight: '700', color: colors.text },
    facilityLocation: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    distanceBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    distanceText: { fontSize: 12, fontWeight: '700', color: colors.primary },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    infoText: { fontSize: 13, color: colors.textSecondary, marginLeft: 4 },

    servicesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
      gap: 6,
    },
    serviceChip: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    serviceChipText: { fontSize: 11, fontWeight: '600', color: colors.primary },

    actionRow: {
      flexDirection: 'row',
      marginTop: 14,
      gap: 8,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
      gap: 6,
    },
    actionBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
    bookBtn: { backgroundColor: colors.primary, borderColor: colors.primary },

    appointmentCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    apptIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    apptInfo: { flex: 1, marginLeft: 12 },
    apptFacility: { fontSize: 14, fontWeight: '700', color: colors.text },
    apptDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    apptNotes: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
    apptRef: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 4 },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    modalFacility: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 12 },
    notesInput: {
      backgroundColor: colors.inputBg,
      borderRadius: 10,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      minHeight: 70,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  });
