'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

interface CustomReminder {
  id: string;
  title: string;
  date: string;
  source: 'custom';
}

interface DbReminder {
  type: 'vaccine' | 'appointment';
  name: string;
  date: string;
  reminder_day?: boolean;
  reminder_before?: boolean;
  id: string | number;
}

interface DisplayReminder {
  id: string;
  title: string;
  body: string;
  date: Date;
  source: 'vaccine' | 'appointment' | 'custom';
  fired: boolean;
}

const STORE_KEY = 'cervitrack_reminders';

function formatDateTime(date: Date): string {
  return (
    date.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
  );
}

function timeUntil(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff < 0) return 'Past due';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `In ${minutes}m`;
}

export default function RemindersPage() {
  const [userId, setUserId] = useState('');
  const [dbReminders, setDbReminders] = useState<DbReminder[]>([]);
  const [custom, setCustom] = useState<CustomReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'past'>('scheduled');
  const [showModal, setShowModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const load = useCallback(async (uid: string) => {
    try {
      const [vaxRes, aptRes] = await Promise.all([
        apiFetch(`/api/vaccines?user_id=${uid}`),
        apiFetch(`/api/appointments?user_id=${uid}`),
      ]);
      const vaccines = vaxRes.ok ? await vaxRes.json() : [];
      const appointments = aptRes.ok ? await aptRes.json() : [];
      setDbReminders([
        ...(Array.isArray(vaccines) ? vaccines : [])
          .filter((v: any) => v.reminder_day || v.reminder_before)
          .map((v: any) => ({
            type: 'vaccine' as const,
            name: v.name || v.date,
            date: v.date,
            reminder_day: !!v.reminder_day,
            reminder_before: !!v.reminder_before,
            id: v.id,
          })),
        ...(Array.isArray(appointments) ? appointments : [])
          .filter((a: any) => a.status === 'pending' || a.status === 'upcoming')
          .map((a: any) => ({
            type: 'appointment' as const,
            name: a.title || 'Appointment',
            date: a.date,
            id: a.id,
          })),
      ]);
    } catch {
      setDbReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUserId(session.user.id);
      await load(session.user.id);
    }
    init();
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setCustom(JSON.parse(raw));
    } catch { }
  }, [load]);

  function persist(next: CustomReminder[]) {
    setCustom(next);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }

  const reminders = useMemo<DisplayReminder[]>(() => {
    const items: DisplayReminder[] = [];
    for (const r of dbReminders) {
      const d = new Date(r.date + 'T09:00:00');
      items.push({
        id: `${r.type}-${r.id}`,
        title: r.type === 'vaccine' ? `Vaccine: ${r.name}` : r.name,
        body:
          r.type === 'vaccine'
            ? `Reminder: ${r.name} is scheduled on ${r.date}`
            : `Appointment on ${r.date}`,
        date: d,
        source: r.type,
        fired: d.getTime() < Date.now(),
      });
    }
    for (const c of custom) {
      const d = new Date(c.date);
      items.push({
        id: c.id,
        title: c.title,
        body: `Reminder: ${c.title}`,
        date: d,
        source: 'custom',
        fired: d.getTime() < Date.now(),
      });
    }
    return items;
  }, [dbReminders, custom]);

  const scheduled = reminders.filter((r) => !r.fired).sort((a, b) => a.date.getTime() - b.date.getTime());
  const past = reminders.filter((r) => r.fired);
  const display = activeTab === 'scheduled' ? scheduled : past;

  function addCustom() {
    if (!customTitle.trim() || !customDate) return;
    const time = customTime || '09:00';
    const next = [
      ...custom,
      { id: 'custom-' + Date.now(), title: customTitle.trim(), date: `${customDate}T${time}:00`, source: 'custom' as const },
    ];
    persist(next);
    setShowModal(false);
    setCustomTitle('');
    setCustomDate('');
    setCustomTime('');
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Reminder Set', { body: `"${customTitle.trim()}" has been scheduled.` });
    }
  }

  function cancelReminder(id: string) {
    persist(custom.filter((c) => c.id !== id));
  }

  function clearAll() {
    if (!confirm('This will cancel ALL custom reminders. Are you sure?')) return;
    persist([]);
  }

  const sourceMeta = (source: string) => {
    switch (source) {
      case 'vaccine':
        return { icon: '💉', color: '#6C5CE7' };
      case 'appointment':
        return { icon: '📅', color: '#00C853' };
      default:
        return { icon: '🔔', color: '#FFB800' };
    }
  };

  return (
    <div className="mx-auto max-w-3xl pb-20">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="flex-1 text-center text-2xl font-extrabold">My Reminders</h1>
        <button onClick={clearAll} className="text-sm font-semibold text-danger">
          Clear All
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        {scheduled.length} active reminder{scheduled.length !== 1 ? 's' : ''}
      </p>

      <button
        onClick={() => setShowModal(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-bold text-white">
        ⏰ Set Reminder
      </button>

      <div className="mb-4 flex gap-2">
        {(['scheduled', 'past'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-bold ${
              activeTab === tab ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-800'
            }`}>
            {tab === 'scheduled' ? `Active (${scheduled.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {dbReminders.length > 0 && (
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="mb-3 font-bold">Reminder Settings</p>
          {dbReminders.map((r, i) => {
            const m = sourceMeta(r.type);
            return (
              <div key={i} className="flex items-center gap-3 border-b border-gray-100 py-2.5 last:border-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: m.color + '15' }}>
                  {m.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {r.type === 'vaccine'
                      ? [r.reminder_day ? 'Day-of reminder ON' : '', r.reminder_before ? 'Day-before reminder ON' : '']
                          .filter(Boolean)
                          .join(' · ') || 'No reminders set'
                      : `Appointment on ${r.date}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">Loading reminders...</p>
      ) : display.length === 0 ? (
        <div className="flex flex-col items-center py-14">
          <span className="text-5xl opacity-40">🔕</span>
          <p className="mt-4 font-bold text-gray-500">
            {activeTab === 'scheduled' ? 'No active reminders' : 'No past reminders'}
          </p>
          <p className="mt-1 text-center text-sm text-gray-400">
            {activeTab === 'scheduled'
              ? 'Set reminders from Vaccines or Appointments'
              : 'Past reminders will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {display.map((r) => {
            const m = sourceMeta(r.source);
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5"
                style={{ opacity: r.fired ? 0.6 : 1 }}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl" style={{ backgroundColor: m.color + '15' }}>
                  {m.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{r.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{r.body}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
                    <span>🕒</span>
                    <span className="flex-1">{formatDateTime(r.date)}</span>
                    <span className={`font-bold ${r.fired ? 'text-gray-400' : 'text-primary'}`}>
                      {r.fired ? 'Fired' : timeUntil(r.date)}
                    </span>
                  </div>
                </div>
                {!r.fired && r.source === 'custom' && (
                  <button onClick={() => cancelReminder(r.id)} className="p-2 text-danger">
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">Set Reminder</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl leading-none text-gray-400">
                ×
              </button>
            </div>

            <label className="text-xs font-bold">Title</label>
            <input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Take medication"
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-primary"
            />

            <label className="mt-3.5 block text-xs font-bold">Date</label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-primary"
            />

            <label className="mt-3.5 block text-xs font-bold">Time (optional — defaults to 09:00)</label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-primary"
            />

            <button
              onClick={addCustom}
              disabled={!customTitle.trim() || !customDate}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-bold text-white disabled:bg-gray-300">
              ✅ Set Reminder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}