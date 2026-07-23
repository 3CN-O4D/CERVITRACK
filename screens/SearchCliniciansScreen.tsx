import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { searchClinicians } from '../services/api';

const SPECIALTIES = [
  { label: 'All Specialties', value: '' },
  { label: 'Oncologist', value: 'oncologist' },
  { label: 'Gynecologist', value: 'gynecologist' },
  { label: 'Nurse Practitioner', value: 'nurse_practitioner' },
  { label: 'Public Health Officer', value: 'public_health_officer' },
  { label: 'Pathologist', value: 'pathologist' },
  { label: 'General Practitioner', value: 'general_practitioner' },
  { label: 'Other', value: 'other' },
];

export default function SearchCliniciansScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [clinicians, setClinicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClinicians = useCallback(async () => {
    try {
      const data = await searchClinicians(query || undefined, undefined, selectedSpecialty || undefined);
      setClinicians(data);
    } catch {
      setClinicians([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedSpecialty]);

  useEffect(() => { loadClinicians(); }, [loadClinicians]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClinicians();
    setRefreshing(false);
  };

  const handleChat = (clinician: any) => {
    navigation.navigate('Messages', {
      screen: 'ChatDetail',
      params: {
        contact: {
          id: clinician.id,
          name: clinician.name,
          role: 'Clinician',
          specialty: clinician.specialty,
          hospital: clinician.hospital,
          online: true,
          initials: clinician.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        },
      },
    });
  };

  const handleBook = (clinician: any) => {
    navigation.navigate('AppointmentBooking');
  };

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { paddingTop: 50 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Find Clinician</Text>
      </View>

      <View style={[s.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[s.searchInput, { color: colors.text }]}
          placeholder="Search by name, hospital, specialty..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
        {SPECIALTIES.map((sp) => (
          <TouchableOpacity
            key={sp.value}
            style={[s.filterChip, { backgroundColor: colors.inputBg, borderColor: colors.border }, selectedSpecialty === sp.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setSelectedSpecialty(sp.value)}
          >
            <Text style={[s.filterText, { color: selectedSpecialty === sp.value ? '#FFF' : colors.textSecondary }]}>
              {sp.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : clinicians.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>No clinicians found</Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        <FlatList
          data={clinicians}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.cardTop}>
                <View style={[s.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[s.avatarText, { color: colors.primary }]}>
                    {item.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={[s.cardName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[s.cardSpecialty, { color: colors.primary }]}>{item.specialty || 'Clinician'}</Text>
                  <Text style={[s.cardHospital, { color: colors.textSecondary }]}>{item.hospital || 'Not specified'}</Text>
                  {item.county ? <Text style={[s.cardCounty, { color: colors.textSecondary }]}>{item.county}</Text> : null}
                  {item.years_experience > 0 && (
                    <Text style={[s.cardExp, { color: colors.textSecondary }]}>{item.years_experience} years experience</Text>
                  )}
                </View>
                <View style={[s.onlineDot, { backgroundColor: colors.success }]} />
              </View>
              {item.bio ? <Text style={[s.cardBio, { color: colors.textSecondary }]} numberOfLines={2}>{item.bio}</Text> : null}
              <View style={s.cardActions}>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleChat(item)}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#FFF" />
                  <Text style={s.actionBtnText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: colors.success }]}
                  onPress={() => handleBook(item)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#FFF" />
                  <Text style={s.actionBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
    paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 12, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  filterRow: { paddingHorizontal: 20, marginBottom: 16, maxHeight: 40 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  filterText: { fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '800' },
  cardSpecialty: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  cardHospital: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  cardCounty: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  cardExp: { fontSize: 11, fontWeight: '600', marginTop: 2, color: '#8B5CF6' },
  onlineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  cardBio: { fontSize: 12, marginTop: 10, lineHeight: 18 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
