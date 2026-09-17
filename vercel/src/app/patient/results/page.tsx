'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

interface ResultCard {
  id: string;
  type: 'screening' | 'test' | 'lab' | 'vaccine';
  date: string;
  result: string;
  subtitle: string;
}

export default function PatientResults() {
  const router = useRouter();
  const [user, setUser] = useState({ id: '' });
  const [screenings, setScreenings] = useState<ResultCard[]>([]);
  const [vaccines, setVaccines] = useState<ResultCard[]>([]);
  const [testResults, setTestResults] = useState<ResultCard[]>([]);
  const [labResults, setLabResults] = useState<ResultCard[]>([]);
  const [sampleKits, setSampleKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session} } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      setUser({ id: session.user.id });

      // Screenings
      try {
        const res = await apiFetch('/api/screenings?profile_id=' + session.user.id);
        if (res.ok) {
          const d = await res.json();
          const items = (d.screenings || []).map((s: any) => ({
            id: s.id, type: 'screening', date: s.created_at, result: s.verdict || '', subtitle: `Risk: ${s.risk_tier || ''}`,
          }));
          setScreenings(items);
        }
      } catch { }

      // Vaccines
      try {
        const res = await apiFetch('/api/vaccines?user_id=' + session.user.id);
        if (res.ok) {
          const d = await res.json();
          const items: ResultCard[] = (Array.isArray(d) ? d : []).map((v: any) => ({
            id: v.id, type: 'vaccine' as const, date: v.date, result: v.status || '', subtitle: `${v.name} — ${v.hospital || ''}`,
          }));
          setVaccines(items);
        }
      } catch { }

      // Test results
      try {
        const res = await apiFetch('/api/test-results?user_id=' + session.user.id);
        if (res.ok) {
          const d = await res.json();
          const items: ResultCard[] = (Array.isArray(d) ? d : []).map((t: any) => ({
            id: t.id, type: 'test' as const, date: t.created_at, result: t.result || '', subtitle: `Date: ${t.date || ''}`,
          }));
          setTestResults(items);
        }
      } catch { }

      // Lab results
      try {
        const res = await apiFetch('/api/lab-results?user_id=' + session.user.id);
        if (res.ok) {
          const d = await res.json();
          const items: ResultCard[] = (Array.isArray(d) ? d : []).map((l: any) => ({
            id: l.id, type: 'lab' as const, date: l.created_at, result: l.result || '', subtitle: `${l.patient_name || ''} — ${l.result || ''}`,
          }));
          setLabResults(items);
        }
      } catch { }

      // Sample kits with results
      try {
        const res = await apiFetch('/api/sample-kits?patientId=' + session.user.id + '&limit=20');
        if (res.ok) {
          const d = await res.json();
          const kits = (d.data || []).map((k: any) => ({
            id: k.id, barcode: k.barcode, type: 'kit', date: k.created_at, result: k.result || '—', subtitle: `Status: ${k.status || ''} — ${k.patient_name || ''}`,
          }));
          setSampleKits(kits);
        }
      } catch { }

      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) return <div className="h-96 flex items-center justify-center text-gray-500">Loading…</div>;

  const section = (title: string, cards: ResultCard[]) => (
    <div key={title} className="space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2 mb-3">{title}</h2>
      {cards.length === 0 ? (
        <p className="text-gray-500">No results yet.</p>
      ) : (
        <ul className="space-y-2">
          {cards.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg border p-3 bg-white shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <div>
                <p className="font-medium">{c.result || '—'}</p>
                <p className="text-xs text-gray-500">{c.date || '—'}</p>
                <p className="text-sm text-gray-500">{c.subtitle || ''}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Results</h1>

      {section('Screenings', screenings)}
      {section('Vaccines', vaccines)}
      {section('Self-Test Results', testResults)}
      {section('Lab Results', labResults)}
      {section('Test Kits', sampleKits.map((k) => ({
        ...k, subtitle: `Barcode: ${k.barcode} — ${k.result === 'positive' ? 'Positive' : k.result === 'negative' ? 'Negative' : k.result} — ${k.status}`,
      })))}
    </div>
  );
}