import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNotifications, Notification } from '../context/NotificationContext';

const NOTIF_ROUTES: Record<string, string> = {
  screening: 'Screening',
  vaccine: 'Vaccine',
  appointment: 'AppointmentBooking',
  reminder: 'Reminders',
  alert: 'MyHealth',
  lab_result: 'LabResults',
};

const typeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'screening': return { name: 'test-tube' as const, family: MaterialCommunityIcons };
    case 'vaccine': return { name: 'needle' as const, family: MaterialCommunityIcons };
    case 'appointment': return { name: 'calendar-outline' as const, family: Ionicons };
    case 'reminder': return { name: 'alarm-outline' as const, family: Ionicons };
    case 'alert': return { name: 'alert-circle' as const, family: Ionicons };
    case 'lab_result': return { name: 'flask-outline' as const, family: Ionicons };
    default: return { name: 'notifications-outline' as const, family: Ionicons };
  }
};

export default function NotificationScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, markRead, markAllRead, deleteNotification } = useNotifications();
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const s = styles(colors);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete notification', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(id) },
    ]);
  };

  return (
    <ScrollView style={[s.scroll, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Ionicons name="notifications-outline" size={26} color={colors.primary} />
        <Text style={s.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllRead} style={s.markAllBtn}>
            <Text style={s.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      {notifications.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
          <Text style={s.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        notifications.map((n) => {
          const icon = typeIcon(n.type);
          const IconComp = icon.family;
          return (
            <TouchableOpacity
              key={n.id}
              style={[s.notifCard, !n.read && s.unreadCard]}
              onPress={() => {
                markRead(n.id);
                const route = n.type ? NOTIF_ROUTES[n.type] : undefined;
                if (route && navigation?.navigate) {
                  navigation.navigate(route);
                }
              }}
              onLongPress={() => setShowMenu(showMenu === n.id ? null : n.id)}
            >
              <View style={[s.iconWrap, { backgroundColor: colors.primary + '15' }]}>
                <IconComp name={icon.name as any} size={20} color={colors.primary} />
              </View>
              <View style={s.notifTextWrap}>
                <Text style={s.notifTitle}>{n.title}</Text>
                <Text style={s.notifMessage}>{n.message}</Text>
                <Text style={s.notifTime}>
                  {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {!n.read && <View style={s.unreadDot} />}
              <TouchableOpacity style={s.moreBtn} onPress={() => setShowMenu(showMenu === n.id ? null : n.id)}>
                <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              {showMenu === n.id && (
                <View style={[s.contextMenu, { backgroundColor: colors.card }]}>
                  {!n.read && (
                    <TouchableOpacity style={s.menuItem} onPress={() => { markRead(n.id); setShowMenu(null); }}>
                      <Ionicons name="checkmark" size={16} color={colors.text} />
                      <Text style={s.menuText}>Mark read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={s.menuItem} onPress={() => { confirmDelete(n.id); setShowMenu(null); }}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={[s.menuText, { color: colors.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary + '15', borderRadius: 8 },
  markAllText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 12 },
  notifCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', position: 'relative' },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifTextWrap: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  notifMessage: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginTop: 2 },
  notifTime: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 8 },
  moreBtn: { padding: 6, marginLeft: 4 },
  contextMenu: { position: 'absolute', right: 14, top: 44, borderRadius: 12, padding: 6, borderWidth: 1, borderColor: colors.border, zIndex: 999, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14 },
  menuText: { fontSize: 13, fontWeight: '600', color: colors.text },
});
