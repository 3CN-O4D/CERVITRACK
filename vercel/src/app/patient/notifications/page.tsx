'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

export default function PatientNotifications() {
  const router = useRouter();
  const [user, setUser] = useState({ id: '' });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session} } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      setUser({ id: session.user.id });
      try {
        const res = await apiFetch('/api/notifications?user_id=' + session.user.id);
        if (res.ok) {
          const d = await res.json();
          const list = Array.isArray(d) ? d : [];
          setNotifications(list);
          setUnreadCount(list.filter((n: any) => !n.read).length);
        }
      } catch { }
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) return <div className="h-96 flex items-center justify-center text-gray-500">Loading…</div>;

  const typeIcons = { screening: '📋', vaccine: '💉', appointment: '📅', system: 'ℹ️', default: '📢' };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      <div className="flex items-center justify-between mb-4">
        <span>Unread: {unreadCount}</span>
        <button
          onClick={async () => {
            try {
              await apiFetch('/api/notifications/mark-all-read', { method: 'POST' });
              setUnreadCount(0);
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            } catch { }
          }}
          className="text-sm text-primary hover:text-primary/90"
        >
          Mark All Read
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications.</p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-center gap-3 rounded-lg border p-3 bg-white shadow-sm">
              <span className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{n.title || 'Notification'}</p>
                <p className="text-xs text-gray-500">{n.type || 'system'}</p>
              </div>
              {n.read ? null : (
                <button
                  onClick={() =>
                    apiFetch('/api/notifications/' + n.id + '/read', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                    })
                  }
                  className="text-xs text-primary hover:text-primary/90 underline"
                >
                  Mark Read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Link href="/patient/kits" className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors">
          Back to Kit Tracker
        </Link>
      </div>
    </div>
  );
}