import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getLabResults } from '../services/api';

const statusColor = (result: string, colors: any) => {
  const r = result.toLowerCase();
  if (r.includes('negative') || r.includes('normal') || r.includes('clear')) return colors.success;
  if (r.includes('positive') || r.includes('abnormal') || r.includes('high')) return colors.danger;
  return colors.warning;
};

export default function LabResultsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadResults = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getLabResults(user.id);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadResults(); }, [loadResults]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  };

  const s = styles(colors);

  return (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <View style={s.header}>
        <MaterialCommunityIcons name="flask" size={26} color={colors.primary} />
        <Text style={s.headerTitle}>Lab Results</Text>
      </View>
      {results.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="flask-outline" size={48} color={colors.textSecondary} />
          <Text style={s.emptyText}>No lab results yet</Text>
          <Text style={s.emptySub}>Results will appear here when your tests are processed</Text>
        </View>
      ) : (
        results.map((r) => (
          <View key={r.id} style={s.resultCard}>
            <View style={s.resultRow}>
              <View style={[s.dot, { backgroundColor: statusColor(r.result, colors) }]} />
              <View style={s.resultTextWrap}>
                <Text style={s.testName}>{r.result || 'Test Result'}</Text>
                <Text style={s.testDate}>{r.patient_name || ''}</Text>
                {r.notes ? <Text style={s.testNotes}>{r.notes}</Text> : null}
                <Text style={s.testTime}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
              <View style={[s.badge, { backgroundColor: statusColor(r.result, colors) + '20' }]}>
                <Text style={[s.badgeText, { color: statusColor(r.result, colors) }]}>
                  {r.result?.toLowerCase().includes('negative') || r.result?.toLowerCase().includes('normal') ? 'Normal' : r.result?.toLowerCase().includes('positive') ? 'Positive' : 'Result'}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textSecondary, marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  resultCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  resultTextWrap: { flex: 1 },
  testName: { fontSize: 14, fontWeight: '700', color: colors.text },
  testDate: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, marginTop: 2 },
  testNotes: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  testTime: { fontSize: 10, fontWeight: '500', color: colors.textSecondary, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
