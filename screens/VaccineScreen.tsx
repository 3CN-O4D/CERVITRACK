import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';
import { getVaccineData, syncVaccineReminder } from '../services/api';

const { width } = Dimensions.get('window');

interface Vaccine {
  id: string;
  name: string;
  hospital: string;
  date: string;
  status: 'upcoming' | 'done' | 'missed';
  remindDayOf: boolean;
  remindDayBefore: boolean;
}

type SortKey = 'date' | 'name';

const initialFormState = { name: '', hospital: '', date: '' };

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(dateStr: string): 'upcoming' | 'done' | 'missed' {
  const diff = daysUntil(dateStr);
  if (diff < 0) return 'missed';
  return 'upcoming';
}

function getStatusColor(status: string, colors: any): string {
  switch (status) {
    case 'done':
      return colors.success;
    case 'missed':
      return colors.error;
    default:
      return colors.primary;
  }
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function VaccineScreen() {
  const { colors, isDark } = useTheme();
  const { addNotification } = useNotifications();
  const { t } = useTranslation();

  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(toDateString(new Date()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderId, setShowReminderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('date');

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    loadVaccines();
  }, []);

  const loadVaccines = async () => {
    try {
      const data = await getVaccineData();
      const mapped: Vaccine[] = data.map((v) => ({
        id: String(v.id),
        name: v.name,
        hospital: '',
        date: v.dueDate,
        status: getStatus(v.dueDate),
        remindDayOf: false,
        remindDayBefore: false,
      }));
      setVaccines(mapped);
    } catch {
      setVaccines([]);
    }
  };

  const addVaccineLocally = useCallback(
    (name: string, hospital: string, date: string) => {
      const newVax: Vaccine = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        name,
        hospital,
        date,
        status: getStatus(date),
        remindDayOf: false,
        remindDayBefore: false,
      };
      setVaccines((prev) => [...prev, newVax]);
    },
    [],
  );

  const markAsDone = useCallback((id: string) => {
    setVaccines((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: v.status === 'done' ? getStatus(v.date) : 'done' } : v)),
    );
  }, []);

  const updateReminder = useCallback(
    (id: string, dayOf: boolean, dayBefore: boolean) => {
      setVaccines((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, remindDayOf: dayOf, remindDayBefore: dayBefore } : v,
        ),
      );
    },
    [],
  );

  const handleAddVaccine = useCallback(() => {
    if (!form.name.trim() || !form.date.trim()) {
      Alert.alert('Required', 'Please enter a vaccine name and date.');
      return;
    }
    addVaccineLocally(form.name.trim(), form.hospital.trim(), form.date);
    setForm(initialFormState);
    setShowAddModal(false);
    addNotification({
      title: 'Vaccine Added',
      message: `${form.name.trim()} scheduled for ${formatDate(form.date)}`,
      type: 'vaccine',
    });
  }, [form, addVaccineLocally, addNotification]);

  const handleSetReminder = useCallback(
    async (vaccine: Vaccine) => {
      try {
        await syncVaccineReminder({
          vaccineId: parseInt(vaccine.id, 36),
          remindBeforeDays: vaccine.remindDayBefore ? 1 : 0,
        });

        const targetDate = new Date(vaccine.date + 'T09:00:00');

        if (vaccine.remindDayOf) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Vaccine Reminder',
              body: `${vaccine.name} is scheduled for today at ${vaccine.hospital || 'your clinic'}.`,
              data: { vaccineId: vaccine.id },
            },
            trigger: new Date(targetDate) as any,
          });
        }

        if (vaccine.remindDayBefore) {
          const dayBefore = new Date(targetDate);
          dayBefore.setDate(dayBefore.getDate() - 1);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Vaccine Reminder',
              body: `Reminder: ${vaccine.name} is tomorrow at ${vaccine.hospital || 'your clinic'}.`,
              data: { vaccineId: vaccine.id },
            },
            trigger: { type: 'date', date: dayBefore.valueOf() } as any,
          });
        }

        addNotification({
          title: 'Reminder Set',
          message: `Reminder${vaccine.remindDayBefore && vaccine.remindDayOf ? 's' : ''} set for ${vaccine.name}.`,
          type: 'reminder',
        });

        Alert.alert('Success', 'Reminder has been scheduled.');
      } catch {
        Alert.alert('Error', 'Failed to set reminder. Please try again.');
      }
      setShowReminderId(null);
    },
    [addNotification],
  );

  const todayStr = toDateString(new Date());

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    vaccines.forEach((v) => {
      const isSelected = v.date === selectedDate;
      marks[v.date] = {
        marked: true,
        dotColor: v.status === 'done' ? colors.success : colors.primary,
        selected: isSelected,
        selectedColor: colors.primary,
        selectedTextColor: '#FFFFFF',
      };
    });
    if (!marks[todayStr]) {
      marks[todayStr] = {
        marked: false,
        selected: todayStr === selectedDate,
        selectedColor: colors.primary,
        selectedTextColor: '#FFFFFF',
        today: true,
      };
    } else if (marks[todayStr]) {
      marks[todayStr].today = true;
    }
    if (selectedDate && !marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: colors.primary,
        selectedTextColor: '#FFFFFF',
      };
    }
    return marks;
  }, [vaccines, selectedDate, todayStr, colors]);

  const selectedVaccines = useMemo(
    () => vaccines.filter((v) => v.date === selectedDate),
    [vaccines, selectedDate],
  );

  const sortedVaccines = useMemo(() => {
    const upcoming = vaccines
      .filter((v) => v.status !== 'missed')
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return a.date.localeCompare(b.date);
      });
    const missed = vaccines.filter((v) => v.status === 'missed');
    return [...upcoming, ...missed];
  }, [vaccines, sortBy]);

  const markDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
      setSelectedDate(dateStr);
    }
  };

  const renderCalendar = () => (
    <Calendar
      current={todayStr}
      onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
      markedDates={markedDates}
      theme={{
        backgroundColor: 'transparent',
        calendarBackground: 'transparent',
        textSectionTitleColor: colors.textSecondary,
        selectedDayBackgroundColor: colors.primary,
        selectedDayTextColor: '#FFFFFF',
        todayTextColor: colors.primary,
        dayTextColor: colors.text,
        textDisabledColor: colors.textSecondary + '50',
        dotColor: colors.primary,
        arrowColor: colors.primary,
        monthTextColor: colors.text,
        indicatorColor: colors.primary,
        textDayFontWeight: '500',
        textMonthFontWeight: '800',
        textDayHeaderFontWeight: '700',
        textDayFontSize: 14,
        textMonthFontSize: 16,
        textDayHeaderFontSize: 12,
      }}
      style={styles.calendar}
    />
  );

  const renderVaccineCard = (v: Vaccine) => {
    const diff = daysUntil(v.date);
    const statusColor = getStatusColor(v.status, colors);
    const isOverdue = v.status === 'missed' && v.date < todayStr;

    return (
      <View
        key={v.id}
        style={[
          styles.vaccineCard,
          { backgroundColor: colors.card, borderLeftColor: statusColor },
        ]}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]}>{v.name}</Text>
            {v.hospital ? (
              <Text style={[styles.cardHospital, { color: colors.textSecondary }]}>
                <Ionicons name="location-outline" size={12} /> {v.hospital}
              </Text>
            ) : null}
            <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
              <Ionicons name="calendar-outline" size={12} /> {formatDate(v.date)}
            </Text>
            {v.status !== 'done' && !isOverdue && (
              <Text
                style={[
                  styles.cardDays,
                  { color: diff <= 3 ? colors.error : colors.primary },
                ]}
              >
                {diff === 0
                  ? 'Today'
                  : diff === 1
                    ? 'Tomorrow'
                    : `${diff} days away`}
              </Text>
            )}
          </View>
          <View style={styles.cardActions}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    v.status === 'done'
                      ? colors.success + '20'
                      : v.status === 'missed'
                        ? colors.error + '20'
                        : colors.primary + '15',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: statusColor },
                ]}
              >
                {v.status === 'done'
                  ? 'Done'
                  : v.status === 'missed'
                    ? 'Missed'
                    : 'Upcoming'}
              </Text>
            </View>
            {v.status !== 'done' && (
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.success + '20' }]}
                onPress={() => markAsDone(v.id)}
              >
                <Ionicons name="checkmark" size={16} color={colors.success} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.remindButton, { backgroundColor: colors.primaryLight }]}
              onPress={() => setShowReminderId(v.id)}
            >
              <Ionicons name="notifications-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderReminderModal = () => {
    if (!showReminderId) return null;
    const vaccine = vaccines.find((v) => v.id === showReminderId);
    if (!vaccine) return null;

    return (
      <Modal
        visible={!!showReminderId}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Set Reminder
              </Text>
              <TouchableOpacity onPress={() => setShowReminderId(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {vaccine.name} - {formatDate(vaccine.date)}
            </Text>

            <View style={styles.reminderOptions}>
              <View style={styles.reminderRow}>
                <Text style={[styles.reminderLabel, { color: colors.text }]}>
                  Remind me on the day
                </Text>
                <Switch
                  value={vaccine.remindDayOf}
                  onValueChange={(val) => {
                    updateReminder(vaccine.id, val, vaccine.remindDayBefore);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                  thumbColor={vaccine.remindDayOf ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.reminderRow}>
                <Text style={[styles.reminderLabel, { color: colors.text }]}>
                  Remind me one day before
                </Text>
                <Switch
                  value={vaccine.remindDayBefore}
                  onValueChange={(val) => {
                    updateReminder(vaccine.id, vaccine.remindDayOf, val);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                  thumbColor={vaccine.remindDayBefore ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmReminderButton,
                {
                  backgroundColor:
                    vaccine.remindDayOf || vaccine.remindDayBefore
                      ? colors.primary
                      : colors.border,
                },
              ]}
              activeOpacity={0.8}
              disabled={!vaccine.remindDayOf && !vaccine.remindDayBefore}
              onPress={() => handleSetReminder(vaccine)}
            >
              <Text
                style={[
                  styles.confirmReminderText,
                  {
                    color:
                      vaccine.remindDayOf || vaccine.remindDayBefore
                        ? '#FFFFFF'
                        : colors.textSecondary,
                  },
                ]}
              >
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Vaccine
            </Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              Vaccine Name
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. HPV Dose 1"
              placeholderTextColor={colors.textSecondary}
              value={form.name}
              onChangeText={(text) => setForm((f) => ({ ...f, name: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              Hospital / Clinic
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. Kenyatta Hospital"
              placeholderTextColor={colors.textSecondary}
              value={form.hospital}
              onChangeText={(text) => setForm((f) => ({ ...f, hospital: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              Date (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. 2026-08-15"
              placeholderTextColor={colors.textSecondary}
              value={form.date}
              onChangeText={(text) => setForm((f) => ({ ...f, date: text }))}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.formButton, { borderColor: colors.border, borderWidth: 1.5 }]}
              onPress={() => {
                setForm(initialFormState);
                setShowAddModal(false);
              }}
            >
              <Text style={[styles.formButtonText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.formButton,
                {
                  backgroundColor: form.name && form.date ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.8}
              disabled={!form.name || !form.date}
              onPress={handleAddVaccine}
            >
              <Text
                style={[
                  styles.formButtonText,
                  {
                    color: form.name && form.date ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: '700',
                  },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSelectedDateVaccines = () => {
    if (selectedVaccines.length === 0) return null;

    return (
      <View style={styles.selectedDateSection}>
        <Text style={[styles.selectedDateTitle, { color: colors.text }]}>
          {formatDate(selectedDate)}
        </Text>
        {selectedVaccines.map(renderVaccineCard)}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCalendar()}
        {renderSelectedDateVaccines()}

        <View style={styles.allVaccinesSection}>
          <View style={styles.allVaccinesHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              All Vaccines
            </Text>
            <View style={styles.sortRow}>
              <TouchableOpacity
                style={[
                  styles.sortChip,
                  {
                    backgroundColor:
                      sortBy === 'date' ? colors.primary + '20' : 'transparent',
                    borderColor: sortBy === 'date' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSortBy('date')}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    {
                      color: sortBy === 'date' ? colors.primary : colors.textSecondary,
                      fontWeight: sortBy === 'date' ? '700' : '500',
                    },
                  ]}
                >
                  Date
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortChip,
                  {
                    backgroundColor:
                      sortBy === 'name' ? colors.primary + '20' : 'transparent',
                    borderColor: sortBy === 'name' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSortBy('name')}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    {
                      color: sortBy === 'name' ? colors.primary : colors.textSecondary,
                      fontWeight: sortBy === 'name' ? '700' : '500',
                    },
                  ]}
                >
                  Name
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {sortedVaccines.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="needle"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No vaccines scheduled
              </Text>
              <TouchableOpacity
                style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.addFirstButtonText}>Add Your First Vaccine</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedVaccines.map(renderVaccineCard)
          )}
        </View>
      </ScrollView>

      {vaccines.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {renderAddModal()}
      {renderReminderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  calendar: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },

  selectedDateSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  selectedDateTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  allVaccinesSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  allVaccinesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 12,
  },

  vaccineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardHospital: {
    fontSize: 13,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 13,
    marginBottom: 4,
  },
  cardDays: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  doneButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remindButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 20,
  },
  addFirstButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },

  reminderOptions: {
    marginBottom: 20,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  reminderLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },

  confirmReminderButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmReminderText: {
    fontSize: 16,
    fontWeight: '700',
  },

  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  formButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
