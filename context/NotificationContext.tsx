import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { getItem, setItem } from '../services/storage';
import { getNotifications as apiGetNotifications, markNotificationRead as apiMarkRead, markAllNotificationsRead as apiMarkAllRead } from '../services/api';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'screening' | 'vaccine' | 'appointment' | 'reminder' | 'alert';
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const NOTIF_KEY = '@cervitrack_notifications';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const raw = await getItem(NOTIF_KEY);
      if (raw) {
        try {
          setNotifications(JSON.parse(raw));
        } catch {
          // ignore
        }
      }
    })();
  }, []);

  // Try to fetch from API when user is available
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const serverNotifs = await apiGetNotifications(user.id);
        if (serverNotifs && serverNotifs.length > 0) {
          const mapped = serverNotifs.map((n: any) => ({
            id: String(n.id),
            title: n.title,
            message: n.message,
            type: n.type,
            read: Boolean(n.read),
            createdAt: n.created_at,
          }));
          setNotifications(mapped);
          await setItem(NOTIF_KEY, JSON.stringify(mapped));
        }
      } catch {
        // offline — local data already loaded
      }
    })();
  }, [user?.id]);

  const persist = useCallback(async (items: Notification[]) => {
    setNotifications(items);
    await setItem(NOTIF_KEY, JSON.stringify(items));
  }, []);

  const addNotification = useCallback(
    (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
      const newNotif: Notification = {
        ...n,
        id: generateId(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      persist([newNotif, ...notifications]);
    },
    [notifications, persist],
  );

  const markRead = useCallback(
    (id: string) => {
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      persist(updated);
      if (user?.id) {
        apiMarkRead(Number(id), user.id).catch(() => {});
      }
    },
    [notifications, persist, user?.id],
  );

  const markAllRead = useCallback(() => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    persist(updated);
    if (user?.id) {
      apiMarkAllRead(user.id).catch(() => {});
    }
  }, [notifications, persist, user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markRead,
        markAllRead,
      }}
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
