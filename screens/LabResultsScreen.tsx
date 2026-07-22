import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const labResults = [
  { test: 'HPV DNA Test', result: 'Negative', date: '2026-06-15', status: 'normal' as const },
  { test: 'Pap Smear', result: 'Normal', date: '2026-06-15', status: 'normal' as const },
  { test: 'Complete Blood Count', result: 'Normal', date: '2026-05-20', status: 'normal' as const },
  { test: 'HIV Rapid Test', result: 'Negative', date: '2026-05-20', status: 'normal' as const },
];

const statusColor = (status: string, colors: any) =>
  status === 'normal' ? colors.success : status === 'abnormal' ? colors.danger : colors.warning;

export default function LabResultsScreen() {
  const { colors } = useTheme();
  const s = styles(colors);

  return (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <MaterialCommunityIcons name="flask" size={26} color={colors.primary} />
        <Text style={s.headerTitle}>Lab Results</Text>
      </View>
      {labResults.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="flask-outline" size={48} color={colors.textSecondary} />
          <Text style={s.emptyText}>No lab results yet</Text>
        </View>
      ) : (
        labResults.map((r, i) => (
          <View key={i} style={s.resultCard}>
            <View style={s.resultRow}>
              <View style={[s.dot, { backgroundColor: statusColor(r.status, colors) }]} />
              <View style={s.resultTextWrap}>
                <Text style={s.testName}>{r.test}</Text>
                <Text style={s.testDate}>{r.date}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: statusColor(r.status, colors) + '20' }]}>
                <Text style={[s.badgeText, { color: statusColor(r.status, colors) }]}>{r.result}</Text>
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
  emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 12 },
  resultCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  resultTextWrap: { flex: 1 },
  testName: { fontSize: 14, fontWeight: '700', color: colors.text },
  testDate: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
