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
  deleteNotification: (id: string) => void;
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

  // Pull server-created notifications (appointments, results, alerts) and merge
  // them with locally generated ones.
  useEffect(() => {
    let active = true;

    const sync = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const { getNotifications } = await import('../services/api');
        const remote = await getNotifications(session.user.id).catch(() => []);
        if (!active || !Array.isArray(remote)) return;

        setNotifications((prev) => {
          const remoteMapped: AppNotification[] = remote.map((r: any) => ({
            id: `remote_${r.id}`,
            title: r.title || 'Notification',
            message: r.message || '',
            type: r.type,
            read: !!r.read,
            createdAt: r.created_at || new Date().toISOString(),
          }));
          const signature = (n: AppNotification) => `${n.title}|${n.message}|${(n.createdAt || '').slice(0, 16)}`;
          const remoteSignatures = new Set(remoteMapped.map(signature));
          const localKept = prev.filter(
            (n) => !String(n.id).startsWith('remote_') && !remoteSignatures.has(signature(n)),
          );
          const merged = [...remoteMapped, ...localKept].sort(
            (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
          );
          setItem(NOTIF_KEY, JSON.stringify(merged)).catch(() => {});
          return merged;
        });
      } catch { /* offline — keep cache */ }
    };

    sync();
    const { data: sub } = supabase.auth.onAuthStateChange(() => sync());
    const interval = setInterval(sync, 60000);
    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
      clearInterval(interval);
    };
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

  const deleteNotification = useCallback(
    (id: string) => {
      persist(notifications.filter((n) => n.id !== id));
      // Fire-and-forget remote delete
      import('../services/api').then(m => m.deleteNotification(Number(id), '')).catch(() => {});
    },
    [notifications, persist],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markRead, deleteNotification, markAllRead }}
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