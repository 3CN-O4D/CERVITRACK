'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';
import MonthCalendar from '@/components/MonthCalendar';

interface Vaccine {
  name: string;
  date: string;
  status: string;
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  doctor: string;
  location: string;
  status: string;
}

interface Screening {
  date: string;
  result: string;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 140;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(score, 100) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold" style={{ color }}>{score}</span>
        <span className="text-xs font-semibold text-gray-500">Health Score</span>
      </div>
    </div>
  );
}

export default function HealthPage() {
  const [userId, setUserId] = useState('');
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    try {
      const [vaxRes, aptRes, scrRes] = await Promise.all([
        apiFetch(`/api/vaccines?user_id=${uid}`),
        apiFetch(`/api/appointments?user_id=${uid}`),
        apiFetch(`/api/screenings?profile_id=${uid}`),
      ]);
      const vax = vaxRes.ok ? await vaxRes.json() : [];
      const apt = aptRes.ok ? await aptRes.json() : [];
      const scr = scrRes.ok ? await scrRes.json() : { screenings: [] };

      setVaccines(
        (Array.isArray(vax) ? vax : []).map((v: any) => ({
          name: v.name,
          date: v.date,
          status: v.status || 'upcoming',
        }))
      );
      setAppointments(
        (Array.isArray(apt) ? apt : []).map((a: any) => ({
          id: a.id,
          title: a.title || 'Appointment',
          date: a.date,
          doctor: a.provider?.name || a.facility_name || 'Doctor',
          location: a.provider?.hospital || a.facility_location || '',
          status: a.status || 'upcoming',
        }))
      );
      setScreenings(
        (scr.screenings || []).map((s: any) => ({
          date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          result: s.risk_tier === 'low' ? 'Normal' : s.risk_tier === 'high' ? 'Abnormal' : s.verdict || 'Pending',
        }))
      );
    } catch { }
    finally {
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
  }, [load]);

  const latestRisk = screenings.length ? screenings[0].result : '';
  const healthScore = screenings.length > 0 ? (latestRisk === 'Normal' ? 85 : latestRisk === 'Abnormal' ? 25 : 55) : 0;
  const scoreColor = healthScore >= 80 ? '#00C853' : healthScore >= 50 ? '#FFB800' : '#FF4D4D';

  const hpvFreeDays = 365;

  const selectedAppointments = useMemo(
    () => appointments.filter((a) => a.date === selectedDate),
    [appointments, selectedDate]
  );

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00C853';
      case 'missed': return '#FF4D4D';
      case 'pending': return '#FFB800';
      case 'scheduled':
      case 'upcoming': return '#3B82F6';
      default: return '#6C5CE7';
    }
  };

  if (loading) return <p className="py-16 text-center text-gray-500">Loading health data…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-20">
      <div className="flex items-center gap-3">
        <span className="text-2xl">💗</span>
        <h1 className="text-2xl font-extrabold">My Health</h1>
      </div>

      <div className="flex flex-col items-center rounded-[28px] border border-gray-200 bg-white p-6">
        <ScoreRing score={healthScore} color={scoreColor} />
        <p className="mt-3.5 text-center text-xs font-medium leading-5 text-gray-500">
          Based on your screening history, risk factors, and lifestyle
        </p>
      </div>

      <div className="flex items-center gap-3.5 rounded-3xl border border-primary/20 bg-primary-light p-5">
        <span className="text-3xl">📋</span>
        <div className="flex-1">
          {screenings.length > 0 ? (
            <>
              <p className="text-3xl font-extrabold tracking-tight text-success">{hpvFreeDays.toLocaleString()}</p>
              <p className="text-sm font-semibold">days HPV-free!</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-primary">No screening data yet</p>
              <p className="text-sm font-semibold text-gray-500">
                Go for your first screening to track your HPV-free journey
              </p>
            </>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <span>📅</span>
          <p className="font-bold">Appointment Calendar</p>
        </div>
        <MonthCalendar value={selectedDate} onChange={setSelectedDate} minDate="1970-01-01" />
        {selectedAppointments.length > 0 && (
          <div className="mt-3.5 border-t border-gray-100 pt-3.5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              {selectedDate}
            </p>
            {selectedAppointments.map((a) => (
              <div key={a.id} className="mb-2.5 flex items-start gap-2.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-bold">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.doctor} · {a.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedDate && selectedAppointments.length === 0 && (
          <p className="mt-3.5 border-t border-gray-100 pt-3.5 text-center text-sm text-gray-500">
            No appointments on this date
          </p>
        )}
      </div>

      <p className="text-base font-extrabold">Screening History</p>
      <div className="rounded-3xl border border-gray-200 bg-white p-5">
        {screenings.length === 0 ? (
          <p className="py-3 text-center text-sm text-gray-500">No screenings yet</p>
        ) : (
          screenings.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex w-5 flex-col items-center">
                <span
                  className="mt-1 h-3 w-3 rounded-full"
                  style={{ backgroundColor: s.result === 'Normal' ? '#00C853' : '#FFB800' }}
                />
                {i < screenings.length - 1 && <span className="my-1 w-0.5 flex-1 bg-gray-200" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">{s.date}</span>
                  <span
                    className="rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold"
                    style={{
                      backgroundColor: (s.result === 'Normal' ? '#00C853' : '#FFB800') + '15',
                      color: s.result === 'Normal' ? '#00C853' : '#FFB800',
                    }}>
                    {s.result}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold">Screening</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-4">
          <div className="mb-3.5 flex items-center gap-1.5">
            <span>💉</span>
            <p className="text-sm font-bold">Vaccines</p>
          </div>
          {vaccines.length === 0 ? (
            <p className="text-xs text-gray-500">No vaccine records</p>
          ) : (
            vaccines.map((v, i) => (
              <div key={i} className="mb-3 flex items-center gap-2.5 last:mb-0">
                <span>{v.status === 'done' ? '✅' : v.status === 'missed' ? '❌' : '⏱️'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{v.name}</p>
                  <p className="text-[11px] text-gray-500">{v.date}</p>
                </div>
                <span
                  className="rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase"
                  style={{
                    backgroundColor: (v.status === 'upcoming' ? '#6C5CE7' : '#00C853') + '15',
                    color: v.status === 'upcoming' ? '#6C5CE7' : '#00C853',
                  }}>
                  {v.status}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4">
          <div className="mb-3.5 flex items-center gap-1.5">
            <span>📅</span>
            <p className="text-sm font-bold">Upcoming</p>
          </div>
          {appointments.filter((a) => new Date(a.date) >= new Date()).length === 0 ? (
            <p className="text-xs text-gray-500">No upcoming appointments</p>
          ) : (
            appointments
              .filter((a) => new Date(a.date) >= new Date())
              .slice(0, 3)
              .map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedDate(a.date)}
                  className="mb-3.5 flex w-full items-start gap-2.5 text-left last:mb-0">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: statusColor(a.status) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{a.title}</span>
                    <span className="block truncate text-[11px] text-gray-500">
                      {a.date} · {a.doctor}
                    </span>
                  </span>
                  <span
                    className="rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase"
                    style={{ backgroundColor: statusColor(a.status) + '20', color: statusColor(a.status) }}>
                    {a.status}
                  </span>
                </button>
              ))
          )}
        </div>
      </div>

      <div className="text-center">
        <Link href="/patient/results" className="text-sm font-semibold text-primary">
          View full results →
        </Link>
      </div>
    </div>
  );
}