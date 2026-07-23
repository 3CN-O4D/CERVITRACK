import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type NotifType =
  | 'screening' | 'vaccine' | 'appointment' | 'reminder' | 'alert'
  | 'info' | 'admin' | 'provider' | 'results' | 'kit' | 'system'
  | 'cervitrack' | 'general' | string | undefined;

const CHANNEL_MAP: Record<string, string> = {
  reminder: 'reminders',
  appointment: 'reminders',
  vaccine: 'reminders',
  screening: 'results',
  results: 'results',
  kit: 'kit',
  alert: 'cervitrack',
  info: 'cervitrack',
  admin: 'cervitrack',
  provider: 'cervitrack',
  system: 'cervitrack',
};

export function pickChannel(type: NotifType): string {
  if (!type) return 'cervitrack';
  return CHANNEL_MAP[String(type)] || 'cervitrack';
}

// Safely fire a local notification — never throws
export async function fireLocalNotification(title: string, body: string, type?: string) {
  if (!title && !body) return; // empty notification is invalid
  try {
    const channelId = pickChannel(type);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || 'CerviTrack',
        body: body || '',
        sound: 'default',          // default sound
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && channelId ? { channelId } : {}),
      },
      trigger: null, // immediate
    });
  } catch (e) {
    // swallow — never let notifications crash the app
    // console.warn('[notification] fire failed', e);
  }
}

// Schedule a notification at a future date with sound + correct channel
export async function scheduleLocalNotification(opts: {
  title: string;
  body: string;
  type?: string;
  date: Date;
  identifier?: string;
}) {
  const { title, body, type, date } = opts;
  if (!title && !body) return null;
  if (date.getTime() <= Date.now()) return null;

  try {
    const channelId = pickChannel(type);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: title || 'CerviTrack',
        body: body || '',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && channelId ? { channelId } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        ...(Platform.OS === 'android' && channelId ? { channelId } : {}),
      } as any,
    });
    return id;
  } catch (e) {
    return null;
  }
}

// Setup Android channels — should be called once at app start
export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') return;
  try {
    await Promise.allSettled([
      Notifications.setNotificationChannelAsync('cervitrack', {
        name: 'CerviTrack Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C5CE7',
        sound: 'default',
      }),
      Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#F59E0B',
        sound: 'default',
      }),
      Notifications.setNotificationChannelAsync('results', {
        name: 'Test Results',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500, 250, 500],
        lightColor: '#10B981',
        sound: 'default',
      }),
      Notifications.setNotificationChannelAsync('kit', {
        name: 'Sample Kit Tracking',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0891B2',
        sound: 'default',
      }),
    ]);
  } catch { /* silent */ }
}

// Request permissions safely
export async function requestNotificationPermission() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch { /* silent */ }
}
