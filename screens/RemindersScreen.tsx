import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getVaccineData, getAppointments } from '../services/api';

interface ScheduledReminder {
  identifier: string;
  title: string;
  body: string;
  date: Date;
  source: 'vaccine' | 'appointment' | 'custom';
  sourceName: string;
  fired: boolean;
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-KE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' ' + date.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return 'Past due';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `In ${minutes}m`;
}

export default function RemindersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  const [dbReminders, setDbReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'past'>('scheduled');

  const s = styles(colors);

  const loadReminders = useCallback(async () => {
    try {
      // Get all scheduled local notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const mapped: ScheduledReminder[] = scheduled.map((n) => {
        const content = n.content;
        const trigger = n.trigger as any;
        let date = new Date();
        if (trigger?.date) {
          date = new Date(trigger.date);
        } else if (trigger?.seconds) {
          date = new Date(Date.now() + trigger.seconds * 1000);
        }

        let source: 'vaccine' | 'appointment' | 'custom' = 'custom';
        let sourceName = '';
        const title = content.title || '';
        const body = content.body || '';
        if (title.includes('Vaccine')) {
          source = 'vaccine';
          sourceName = body.split(' is scheduled')[0].split('Reminder:')[1]?.trim() || 'Vaccine';
        } else if (title.includes('Appointment')) {
          source = 'appointment';
          sourceName = 'Appointment';
        }

        return {
          identifier: n.identifier,
          title,
          body,
          date,
          source,
          sourceName,
          fired: date.getTime() < Date.now(),
        };
      });
      setReminders(mapped);

      // Also load DB reminders (vaccine reminders)
      if (user?.id) {
        const vaccines = await getVaccineData(user.id);
        const appointments = await getAppointments(user.id);
        const dbItems = [
          ...vaccines.filter((v: any) => v.reminder_day || v.reminder_before).map((v: any) => ({
            type: 'vaccine',
            name: v.name || v.dueDate,
            date: v.date || v.dueDate,
            reminder_day: v.reminder_day,
            reminder_before: v.reminder_before,
            id: v.id,
          })),
          ...appointments.filter((a: any) => a.status === 'pending' || a.status === 'upcoming').map((a: any) => ({
            type: 'appointment',
            name: a.title || 'Appointment',
            date: a.date,
            id: a.id,
          })),
        ];
        setDbReminders(dbItems);
      }
    } catch (e) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadReminders(); }, [loadReminders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const cancelReminder = async (identifier: string) => {
    Alert.alert(
      'Cancel Reminder',
      'Are you sure you want to cancel this reminder?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Reminder',
          style: 'destructive',
          onPress: async () => {
            await Notifications.cancelScheduledNotificationAsync(identifier);
            setReminders((prev) => prev.filter((r) => r.identifier !== identifier));
            addNotification({
              title: 'Reminder Cancelled',
              message: 'The reminder has been removed.',
              type: 'reminder',
            });
          },
        },
      ],
    );
  };

  const cancelAllReminders = async () => {
    Alert.alert(
      'Cancel All Reminders',
      'This will cancel ALL scheduled reminders. Are you sure?',
      [
        { text: 'Keep All', style: 'cancel' },
        {
          text: 'Cancel All',
          style: 'destructive',
          onPress: async () => {
            await Notifications.cancelAllScheduledNotificationsAsync();
            setReminders([]);
            addNotification({
              title: 'All Reminders Cancelled',
              message: 'All scheduled reminders have been removed.',
              type: 'reminder',
            });
          },
        },
      ],
    );
  };

  const now = Date.now();
  const scheduledReminders = reminders.filter((r) => !r.fired).sort((a, b) => a.date.getTime() - b.date.getTime());
  const pastReminders = reminders.filter((r) => r.fired);
  const displayReminders = activeTab === 'scheduled' ? scheduledReminders : pastReminders;

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'vaccine': return 'medical';
      case 'appointment': return 'calendar';
      default: return 'notifications';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'vaccine': return colors.primary;
      case 'appointment': return colors.success;
      default: return colors.warning;
    }
  };

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>My Reminders</Text>
        <TouchableOpacity onPress={cancelAllReminders} style={s.cancelAllBtn}>
          <Text style={[s.cancelAllText, { color: colors.danger }]}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.subtitle, { color: colors.textSecondary }]}>
        {scheduledReminders.length} active reminder{scheduledReminders.length !== 1 ? 's' : ''}
      </Text>

      {/* Tab Bar */}
      <View style={s.tabRow}>
        {(['scheduled', 'past'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, { backgroundColor: activeTab === tab ? colors.primary : colors.card, borderColor: colors.border }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, { color: activeTab === tab ? '#FFF' : colors.text }]}>
              {tab === 'scheduled' ? `Active (${scheduledReminders.length})` : `Past (${pastReminders.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scheduled Reminders from DB */}
      {dbReminders.length > 0 && (
        <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Reminder Settings</Text>
          {dbReminders.map((r, i) => (
            <View key={i} style={[s.dbReminderRow, { borderBottomColor: colors.border }]}>
              <View style={[s.dbIcon, { backgroundColor: (r.type === 'vaccine' ? colors.primary : colors.success) + '15' }]}>
                <Ionicons name={r.type === 'vaccine' ? 'medical' : 'calendar'} size={18} color={r.type === 'vaccine' ? colors.primary : colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.dbName, { color: colors.text }]}>{r.name}</Text>
                <Text style={[s.dbDetail, { color: colors.textSecondary }]}>
                  {r.type === 'vaccine' ? (
                    <>
                      {r.reminder_day ? 'Day-of reminder ON' : ''}
                      {r.reminder_day && r.reminder_before ? ' · ' : ''}
                      {r.reminder_before ? 'Day-before reminder ON' : ''}
                      {!r.reminder_day && !r.reminder_before ? 'No reminders set' : ''}
                    </>
                  ) : (
                    <>Appointment on {r.date}</>
                  )}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Local Scheduled Notifications */}
      {loading ? (
        <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading reminders...</Text>
      ) : displayReminders.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary + '50'} />
          <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
            {activeTab === 'scheduled' ? 'No active reminders' : 'No past reminders'}
          </Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            {activeTab === 'scheduled'
              ? 'Set reminders from Vaccines or Appointments'
              : 'Past reminders will appear here'}
          </Text>
        </View>
      ) : (
        displayReminders.map((r) => (
          <View
            key={r.identifier}
            style={[s.reminderCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: r.fired ? 0.6 : 1 }]}
          >
            <View style={[s.reminderIcon, { backgroundColor: getSourceColor(r.source) + '15' }]}>
              <Ionicons name={getSourceIcon(r.source) as any} size={20} color={getSourceColor(r.source)} />
            </View>
            <View style={s.reminderInfo}>
              <Text style={[s.reminderTitle, { color: colors.text }]} numberOfLines={1}>{r.title}</Text>
              <Text style={[s.reminderBody, { color: colors.textSecondary }]} numberOfLines={2}>{r.body}</Text>
              <View style={s.reminderMeta}>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                <Text style={[s.reminderTime, { color: colors.textSecondary }]}>
                  {formatDateTime(r.date)}
                </Text>
                <Text style={[s.reminderCountdown, { color: r.fired ? colors.textSecondary : colors.primary }]}>
                  {r.fired ? 'Fired' : timeUntil(r.date)}
                </Text>
              </View>
            </View>
            {!r.fired && (
              <TouchableOpacity style={s.deleteBtn} onPress={() => cancelReminder(r.identifier)}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', flex: 1, textAlign: 'center' },
  cancelAllBtn: { padding: 4 },
  cancelAllText: { fontSize: 13, fontWeight: '600' },
  subtitle: { fontSize: 13, fontWeight: '500', marginBottom: 16 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '700' },
  sectionCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  dbReminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5 },
  dbIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dbName: { fontSize: 14, fontWeight: '600' },
  dbDetail: { fontSize: 12, marginTop: 2 },
  reminderCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, gap: 12,
  },
  reminderIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reminderInfo: { flex: 1 },
  reminderTitle: { fontSize: 14, fontWeight: '700' },
  reminderBody: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  reminderMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  reminderTime: { fontSize: 11, fontWeight: '500', flex: 1 },
  reminderCountdown: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { padding: 8 },
  loadingText: { fontSize: 13, textAlign: 'center', marginTop: 40 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 16 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
});
