import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotifications, Notification } from '../context/NotificationContext';

const typeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'screening': return { name: 'test-tube' as const, family: MaterialCommunityIcons };
    case 'vaccine': return { name: 'needle' as const, family: MaterialCommunityIcons };
    case 'appointment': return { name: 'calendar-outline' as const, family: Ionicons };
    case 'reminder': return { name: 'alarm-outline' as const, family: Ionicons };
    case 'alert': return { name: 'alert-circle' as const, family: Ionicons };
  }
};

export default function NotificationScreen() {
  const { colors } = useTheme();
  const { notifications, markRead, markAllRead } = useNotifications();
  const s = styles(colors);

  return (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
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
              onPress={() => markRead(n.id)}
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
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary + '15', borderRadius: 8 },
  markAllText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 12 },
  notifCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifTextWrap: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  notifMessage: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginTop: 2 },
  notifTime: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 8 },
});
