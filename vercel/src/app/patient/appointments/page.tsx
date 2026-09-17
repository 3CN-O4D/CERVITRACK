'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

interface Provider {
  id: string;
  name: string;
  specialty?: string;
  hospital?: string;
  county?: string;
}

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function nextDates(count = 14): string[] {
  const out: string[] = [];
  const start = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function isPast(dateStr: string): boolean {
  return new Date(dateStr + 'T23:59:59') < new Date();
}

export default function PatientAppointments() {
  const [userId, setUserId] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const [showBooking, setShowBooking] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [anyAvailable, setAnyAvailable] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [patientNote, setPatientNote] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      if (!active) return;
      setUserId(session.user.id);
      await Promise.all([loadAppointments(session.user.id), loadProviders()]);
      if (active) setLoading(false);
    }
    init();
    return () => { active = false; };
  }, []);

  async function loadAppointments(uid: string) {
    try {
      const res = await apiFetch('/api/appointments?user_id=' + uid);
      if (res.ok) {
        const d = await res.json();
        setAppointments(Array.isArray(d) ? d : []);
      }
    } catch { }
  }

  async function loadProviders() {
    try {
      const res = await apiFetch('/api/providers');
      if (res.ok) {
        const d = await res.json();
        setProviders(Array.isArray(d) ? d : []);
      }
    } catch { }
  }

  const hospitals = useMemo(
    () => Array.from(new Set(providers.map((p) => p.hospital).filter(Boolean))).sort() as string[],
    [providers]
  );
  const hospitalProviders = useMemo(
    () => (selectedHospital ? providers.filter((p) => p.hospital === selectedHospital) : providers),
    [providers, selectedHospital]
  );
  const dates = useMemo(() => nextDates(14), []);

  const filtered = filterStatus === 'all' ? appointments : appointments.filter((a) => a.status === filterStatus);
  const activeCount = appointments.filter((a) => a.status === 'upcoming' || a.status === 'pending').length;

  function openBooking() {
    setSelectedHospital('');
    setSelectedProvider(null);
    setAnyAvailable(false);
    setSelectedDate('');
    setSelectedTime('');
    setPatientNote('');
    setError('');
    setShowBooking(true);
  }

  async function book() {
    if (!selectedDate || !selectedTime) { setError('Please select a date and time.'); return; }
    if (!selectedProvider && !anyAvailable) { setError('Select a clinician or choose "Any Available".'); return; }
    setBooking(true);
    setError('');
    try {
      const providerName = anyAvailable ? 'Any Available' : selectedProvider?.name || 'Clinician';
      const res = await apiFetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          provider_id: selectedProvider?.id || '',
          date: selectedDate,
          time: selectedTime,
          title: `Appointment with ${providerName}`,
          notes: '',
          custom_text: patientNote,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        setError(e.error || 'Failed to book appointment');
        return;
      }
      setShowBooking(false);
      await loadAppointments(userId);
    } catch {
      setError('Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    upcoming: 'bg-primary/10 text-primary',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="flex h-96 items-center justify-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Appointments</h1>
          <p className="text-sm text-gray-500">{activeCount} active</p>
        </div>
        <button onClick={openBooking}
          className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90">
          + Book
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'upcoming', 'completed', 'cancelled'].map((f) => (
          <button key={f} onClick={() => setFilterStatus(f)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filterStatus === f ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((a) => {
          const past = isPast(a.date) && a.status === 'upcoming';
          const d = a.date ? new Date(a.date + 'T12:00:00') : null;
          return (
            <div key={a.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-12 flex-col items-center justify-center rounded-xl border bg-primary-light">
                  <span className="text-lg font-extrabold leading-none text-primary">{d ? d.getDate() : '—'}</span>
                  <span className="text-[11px] font-semibold text-gray-500">{d ? MONTHS[d.getMonth()] : ''}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{a.title || 'Appointment'}</p>
                  <p className="truncate text-xs text-gray-500">{a.facility_name || 'Facility TBD'}</p>
                  {a.time && <p className="mt-0.5 text-xs text-gray-500">{a.date} at {a.time}</p>}
                </div>
                <span className={`rounded-lg px-2 py-1 text-[11px] font-bold capitalize ${statusStyles[a.status] || 'bg-gray-100 text-gray-700'}`}>
                  {past ? 'overdue' : a.status}
                </span>
              </div>
              {a.custom_text && (
                <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs font-semibold italic text-primary">
                  {a.custom_text}
                </div>
              )}
              {a.notes && <p className="mt-2 text-xs italic text-gray-500">{a.notes}</p>}
            </div>
          );
        })}
      </div>

      {!filtered.length && (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="text-4xl">📅</p>
          <p className="mt-3 font-bold">No appointments</p>
          <p className="text-sm text-gray-500">Book a screening or follow-up visit</p>
        </div>
      )}

      <Link href="/patient/kits" className="inline-block text-sm font-semibold text-primary">
        ← Back to Kit Tracker
      </Link>

      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">New Appointment</h2>
              <button onClick={() => setShowBooking(false)} className="text-2xl leading-none text-gray-400">×</button>
            </div>

            <label className="text-xs font-bold">Select Hospital</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {hospitals.length === 0 && <p className="text-xs text-gray-500">No hospitals available.</p>}
              {hospitals.map((h) => (
                <button key={h} onClick={() => { setSelectedHospital(selectedHospital === h ? '' : h); setSelectedProvider(null); }}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                    selectedHospital === h ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}>
                  {h}
                </button>
              ))}
            </div>

            <label className="mt-5 block text-xs font-bold">Select Clinician</label>
            <div className="mt-2 space-y-2">
              <button onClick={() => { setAnyAvailable(!anyAvailable); setSelectedProvider(null); }}
                className={`flex w-full items-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${
                  anyAvailable ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-primary'
                }`}>
                <span>❓</span>{anyAvailable ? 'Any Available Selected' : "Any Available — I'll take whoever is free"}
              </button>
              {hospitalProviders.map((p) => (
                <button key={p.id} onClick={() => { setSelectedProvider(p); setAnyAvailable(false); }}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left ${
                    selectedProvider?.id === p.id ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50'
                  }`}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {p.name.split(' ').slice(-2).map((n) => n[0]).join('')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{p.name}</span>
                    <span className="block truncate text-xs text-gray-500">{p.specialty || 'Clinician'}</span>
                  </span>
                  {selectedProvider?.id === p.id && <span className="text-primary">✓</span>}
                </button>
              ))}
            </div>

            <label className="mt-5 block text-xs font-bold">Select Date</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {dates.map((d) => {
                const parts = d.split('-');
                return (
                  <button key={d} onClick={() => setSelectedDate(d)}
                    className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                      selectedDate === d ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}>
                    {parseInt(parts[2], 10)} {MONTHS[parseInt(parts[1], 10) - 1]}
                  </button>
                );
              })}
            </div>

            <label className="mt-5 block text-xs font-bold">Select Time</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIME_SLOTS.map((t) => (
                <button key={t} onClick={() => setSelectedTime(t)}
                  className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
                    selectedTime === t ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            <label className="mt-5 block text-xs font-bold">Your Note (optional)</label>
            <textarea value={patientNote} onChange={(e) => setPatientNote(e.target.value)} rows={3}
              placeholder="Reason for visit, symptoms, questions…"
              className="mt-2 w-full rounded-2xl border-2 border-gray-200 p-3 text-sm focus:border-primary focus:outline-none" />

            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <button onClick={book} disabled={booking || !selectedDate || !selectedTime}
              className="mt-5 w-full rounded-2xl bg-primary px-6 py-4 font-bold text-white transition-colors hover:bg-primary/90 disabled:bg-gray-300">
              {booking ? 'Requesting…' : 'Request Appointment'}
            </button>
            {selectedDate && <p className="mt-2 text-center text-xs text-gray-500">Requesting for {formatDate(selectedDate)}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
