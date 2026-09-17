import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function MonthCalendar({
  value,
  onChange,
  minDate,
}: {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
}) {
  const { colors } = useTheme();
  const today = new Date();
  const initial = value ? new Date(value + 'T12:00:00') : today;
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const min = minDate ? new Date(minDate + 'T00:00:00') : today;
  const minTime = startOfDay(min);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={[s.wrap, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => setCursor(new Date(year, month - 1, 1))} style={s.navBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.monthLabel, { color: colors.text }]}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={() => setCursor(new Date(year, month + 1, 1))} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={s.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={`${w}${i}`} style={[s.weekday, { color: colors.textSecondary }]}>{w}</Text>
        ))}
      </View>

      <View style={s.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={s.cell} />;
          const key = toKey(year, month, day);
          const disabled = startOfDay(new Date(year, month, day)) < minTime;
          const selected = value === key;
          return (
            <TouchableOpacity
              key={key}
              style={[s.cell, selected && { backgroundColor: colors.primary, borderRadius: 10 }]}
              onPress={() => onChange(key)}
              disabled={disabled}
            >
              <Text style={[s.day, { color: selected ? '#FFF' : disabled ? colors.textSecondary + '60' : colors.text }]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navBtn: { padding: 4 },
  monthLabel: { fontSize: 14, fontWeight: '700' },
  weekRow: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 10, fontWeight: '700', paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { fontSize: 13, fontWeight: '600' },
});
