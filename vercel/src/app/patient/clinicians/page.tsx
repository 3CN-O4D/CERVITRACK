'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';

interface Clinician {
  id: string;
  name: string;
  specialty?: string;
  hospital?: string;
  county?: string;
  years_experience?: number;
  bio?: string;
}

const SPECIALTIES = [
  { label: 'All Specialties', value: '' },
  { label: 'Oncologist', value: 'oncologist' },
  { label: 'Gynecologist', value: 'gynecologist' },
  { label: 'Nurse Practitioner', value: 'nurse_practitioner' },
  { label: 'Public Health Officer', value: 'public_health_officer' },
  { label: 'Pathologist', value: 'pathologist' },
  { label: 'General Practitioner', value: 'general_practitioner' },
  { label: 'Other', value: 'other' },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function CliniciansPage() {
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (specialty) params.set('specialty', specialty);
      if (hospital) params.set('hospital', hospital);
      const res = await apiFetch('/api/providers?' + params.toString());
      const data = res.ok ? await res.json() : [];
      setClinicians(Array.isArray(data) ? data : []);
    } catch {
      setClinicians([]);
    } finally {
      setLoading(false);
    }
  }, [query, specialty, hospital]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const hospitals = useMemo(
    () => Array.from(new Set(clinicians.map((c) => c.hospital).filter(Boolean))).sort() as string[],
    [clinicians]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-20">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🧑‍⚕️</span>
        <h1 className="text-2xl font-extrabold">Find Clinician</h1>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5">
        <span>🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, hospital, specialty..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-gray-400">
            ✕
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {SPECIALTIES.map((sp) => (
          <button
            key={sp.value}
            onClick={() => setSpecialty(sp.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              specialty === sp.value
                ? 'border-primary bg-primary text-white'
                : 'border-gray-200 bg-white text-gray-600'
            }`}>
            {sp.label}
          </button>
        ))}
      </div>

      {hospitals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setHospital('')}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              !hospital ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-600'
            }`}>
            All Hospitals
          </button>
          {hospitals.map((h) => (
            <button
              key={h}
              onClick={() => setHospital(hospital === h ? '' : h)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                hospital === h ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-600'
              }`}>
              {h}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading clinicians…</p>
      ) : clinicians.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="text-4xl">👥</p>
          <p className="mt-3 font-bold">No clinicians found</p>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clinicians.map((c) => (
            <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-sm font-extrabold text-primary">
                  {initials(c.name || '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs font-bold text-primary">{c.specialty || 'Clinician'}</p>
                  <p className="text-xs text-gray-500">{c.hospital || 'Not specified'}</p>
                  {c.county && <p className="text-[11px] text-gray-500">{c.county}</p>}
                  {!!c.years_experience && c.years_experience > 0 && (
                    <p className="mt-0.5 text-[11px] font-semibold text-purple-500">
                      {c.years_experience} years experience
                    </p>
                  )}
                </div>
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-success" />
              </div>
              {c.bio && <p className="mt-2.5 line-clamp-2 text-xs text-gray-500">{c.bio}</p>}
              <div className="mt-3.5 flex gap-2.5">
                <Link
                  href={`/patient/messages?contact=${encodeURIComponent(c.id)}`}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white">
                  💬 Chat
                </Link>
                <Link
                  href="/patient/appointments"
                  className="flex items-center gap-1.5 rounded-xl bg-success px-4 py-2.5 text-xs font-bold text-white">
                  📅 Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}