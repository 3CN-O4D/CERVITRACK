import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getLabResults, getKitResults } from '../services/api';

interface Result {
  id: string;
  source: 'lab' | 'kit';
  title: string;
  result: string;
  notes: string;
  date: string;
}

const resultColor = (result: string, colors: any) => {
  const r = result.toLowerCase();
  if (r.includes('negative') || r.includes('normal') || r.includes('clear')) return colors.success;
  if (r.includes('positive') || r.includes('abnormal') || r.includes('high')) return colors.danger;
  return colors.warning;
};

const resultLabel = (result: string) => {
  const r = result.toLowerCase();
  if (r.includes('negative') || r.includes('normal') || r.includes('clear')) return 'Normal';
  if (r.includes('positive') || r.includes('abnormal') || r.includes('high')) return 'Abnormal';
  return 'Result';
};

export default function MyResultsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadResults = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [labData, kitData] = await Promise.all([
        getLabResults(user.id).catch(() => []),
        getKitResults(user.id).catch(() => []),
      ]);

      const labResults: Result[] = labData.map((r: any) => ({
        id: `lab-${r.id}`,
        source: 'lab' as const,
        title: r.result || 'Lab Result',
        result: r.result || '',
        notes: r.notes || r.patient_name || '',
        date: r.created_at,
      }));

      const kitResults: Result[] = kitData.map((r: any) => ({
        id: `kit-${r.id}`,
        source: 'kit' as const,
        title: `${r.kit_type || 'HPV'} Test`,
        result: r.result || '',
        notes: r.result_notes || '',
        date: r.processed_at || r.created_at,
      }));

      const combined = [...labResults, ...kitResults].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setResults(combined);
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

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: colors.bg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <MaterialCommunityIcons name="clipboard-check" size={26} color={colors.primary} />
        <Text style={[s.headerTitle, { color: colors.text }]}>My Results</Text>
      </View>

      {results.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>No results yet</Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>Your lab and kit test results will appear here</Text>
        </View>
      ) : (
        <>
          <View style={[s.summaryCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
            <Text style={[s.summaryText, { color: colors.primary }]}>
              {results.length} result{results.length > 1 ? 's' : ''} available
            </Text>
            <View style={s.summaryIcons}>
              <View style={[s.summaryBadge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[s.summaryBadgeText, { color: colors.success }]}>
                  {results.filter(r => r.result.toLowerCase().includes('negative') || r.result.toLowerCase().includes('normal')).length} Normal
                </Text>
              </View>
              <View style={[s.summaryBadge, { backgroundColor: colors.danger + '20' }]}>
                <Text style={[s.summaryBadgeText, { color: colors.danger }]}>
                  {results.filter(r => r.result.toLowerCase().includes('positive') || r.result.toLowerCase().includes('abnormal')).length} Abnormal
                </Text>
              </View>
            </View>
          </View>

          {results.map((r) => (
            <View key={r.id} style={[s.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.resultTop}>
                <View style={[s.sourceIcon, { backgroundColor: r.source === 'lab' ? colors.primary + '15' : '#0891B2' + '15' }]}>
                  <MaterialCommunityIcons
                    name={r.source === 'lab' ? 'flask' : 'test-tube'}
                    size={20}
                    color={r.source === 'lab' ? colors.primary : '#0891B2'}
                  />
                </View>
                <View style={s.resultInfo}>
                  <Text style={[s.resultTitle, { color: colors.text }]}>{r.title}</Text>
                  <Text style={[s.resultSource, { color: colors.textSecondary }]}>
                    {r.source === 'lab' ? 'Lab Result' : 'Self-Sampling Kit'}
                  </Text>
                </View>
                {r.result ? (
                  <View style={[s.resultBadge, { backgroundColor: resultColor(r.result, colors) + '20' }]}>
                    <Text style={[s.resultBadgeText, { color: resultColor(r.result, colors) }]}>
                      {resultLabel(r.result)}
                    </Text>
                  </View>
                ) : null}
              </View>
              {r.notes ? (
                <Text style={[s.resultNotes, { color: colors.textSecondary }]}>{r.notes}</Text>
              ) : null}
              <Text style={[s.resultDate, { color: colors.textSecondary }]}>
                {r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  backBtn: { padding: 4, marginRight: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  summaryCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20,
  },
  summaryText: { fontSize: 14, fontWeight: '700' },
  summaryIcons: { flexDirection: 'row', gap: 8 },
  summaryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  summaryBadgeText: { fontSize: 11, fontWeight: '700' },
  resultCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sourceIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 15, fontWeight: '700' },
  resultSource: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  resultBadgeText: { fontSize: 11, fontWeight: '800' },
  resultNotes: { fontSize: 12, marginTop: 10, lineHeight: 18 },
  resultDate: { fontSize: 10, fontWeight: '600', marginTop: 8 },
});
