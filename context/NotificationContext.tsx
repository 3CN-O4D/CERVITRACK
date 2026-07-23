import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase/client';
import { getItem, setItem } from '../services/storage';
import { fireLocalNotification } from '../services/notifications';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);
const NOTIF_KEY = '@cervitrack_notifications';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load cached notifications from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const raw = await getItem(NOTIF_KEY);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as AppNotification[];
        if (Array.isArray(parsed)) setNotifications(parsed);
      } catch { /* corrupted cache — ignore */ }
    })();
  }, []);

  const persist = useCallback(async (items: AppNotification[]) => {
    setNotifications(items);
    await setItem(NOTIF_KEY, JSON.stringify(items)).catch(() => {});
  }, []);

  const addNotification = useCallback(
    (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
      const newNotif: AppNotification = {
        ...n,
        id: generateId(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      persist([newNotif, ...notifications]);
      fireLocalNotification(n.title, n.message, n.type).catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifications, persist],
  );

  const markRead = useCallback(
    (id: string) => {
      persist(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [notifications, persist],
  );

  const markAllRead = useCallback(() => {
    persist(notifications.map((n) => ({ ...n, read: true })));
  }, [notifications, persist]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export default NotificationContext;