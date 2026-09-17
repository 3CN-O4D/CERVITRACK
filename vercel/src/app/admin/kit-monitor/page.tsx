'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import CodeInput from '@/components/CodeInput';

interface KitLedgerItem {
  id: number;
  barcode: string;
  kitType: string;
  status: string;
  facilityId: string;
  patientName: string;
  currentLocation: string;
  createdAt: string;
  updatedAt: string;
}

interface KitStats {
  total: number;
  registered: number;
  paired: number;
  collected: number;
  inTransit: number;
  inLab: number;
  processed: number;
  available: number;
  inPipeline: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  UNREGISTERED: { label: 'Unregistered', color: '#6B7280', bg: '#F3F4F6', icon: '📦' },
  REGISTERED: { label: 'Pre-Scanned', color: '#2563EB', bg: '#DBEAFE', icon: '✓' },
  PAIRED: { label: 'Given Out', color: '#D97706', bg: '#FEF3C7', icon: '👤' },
  WITH_PATIENT: { label: 'With Patient', color: '#CA8A04', bg: '#FEF9C3', icon: '🏠' },
  COLLECTED: { label: 'Sample Taken', color: '#7C3AED', bg: '#EDE9FE', icon: '🧪' },
  IN_TRANSIT: { label: 'In Transit', color: '#0891B2', bg: '#ECFEFF', icon: '🚚' },
  IN_LAB: { label: 'At Lab', color: '#059669', bg: '#D1FAE5', icon: '🔬' },
  PROCESSED: { label: 'Processed', color: '#059669', bg: '#ECFDF5', icon: '📄' },
};

const REFRESH_MS = 15000;

function timeAgo(iso: string) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function KitMonitorPage() {
  const [stats, setStats] = useState<KitStats | null>(null);
  const [kits, setKits] = useState<KitLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'preregistered' | 'infield' | 'all'>('preregistered');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [live, setLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [located, setLocated] = useState<KitLedgerItem | null>(null);
  const [locateError, setLocateError] = useState('');

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (view === 'preregistered') params.set('status', 'REGISTERED');
      if (facilityFilter) params.set('facilityId', facilityFilter);
      if (search.trim()) params.set('search', search.trim());

      const [kitRes, statsRes] = await Promise.all([
        apiFetch(`/api/sample-kits?${params.toString()}`),
        apiFetch('/api/sample-kits/stats'),
      ]);
      if (kitRes.ok) {
        const d = await kitRes.json();
        let rows: KitLedgerItem[] = d.data || [];
        if (view === 'infield') {
          rows = rows.filter((k) => ['PAIRED', 'WITH_PATIENT', 'COLLECTED', 'IN_TRANSIT', 'IN_LAB'].includes(k.status));
        }
        setKits(rows);
      }
      if (statsRes.ok) setStats(await statsRes.json());
      setLastUpdated(new Date());
    } catch { /* ignore */ }
    setLoading(false);
  }, [view, facilityFilter, search]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [live, load]);

  const facilities = useMemo(
    () => Array.from(new Set(kits.map((k) => k.facilityId).filter(Boolean))).sort(),
    [kits]
  );

  const recentActivity = useMemo(
    () => [...kits].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8),
    [kits]
  );

  async function locate(code: string) {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return;
    setLocateError('');
    setLocated(null);
    try {
      const res = await apiFetch(`/api/sample-kits/scan/${encodeURIComponent(clean)}`);
      if (res.status === 404) { setLocateError(`Kit ${clean} is not registered in the system.`); return; }
      if (!res.ok) { setLocateError('Could not look up that kit. Please try again.'); return; }
      const found = await res.json();
      setLocated(found);
      await load();
    } catch {
      setLocateError('Network error — check your connection and try again.');
    }
  }

  const cards = [
    { label: 'Pre-Scanned', value: stats?.registered || 0, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    { label: 'Given Out', value: stats?.paired || 0, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    { label: 'In Pipeline', value: stats?.inPipeline || 0, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { label: 'At Lab', value: stats?.inLab || 0, color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
    { label: 'Processed', value: stats?.processed || 0, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    { label: 'Total Kits', value: stats?.total || 0, color: '#1F2937', bg: '#F9FAFB', border: '#E5E7EB' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pre-Scanned Kits Monitor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track every kit that has been scanned in, where it is, and when it last moved.
            {lastUpdated && <span className="ml-1 text-gray-400">Updated {timeAgo(lastUpdated.toISOString())}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLive((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              live ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-emerald-500' : 'bg-gray-400'}`} />
            {live ? 'Live' : 'Paused'}
          </button>
          <button onClick={load} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Refresh
          </button>
          <Link href="/admin/kit-inventory" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
            Register Kits
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border-2 p-4" style={{ backgroundColor: c.bg, borderColor: c.border }}>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
            <div className="mt-1 text-xs font-semibold" style={{ color: c.color }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-gray-500">Locate a Kit</h3>
        <p className="mb-3 text-xs text-gray-400">Scan with the camera or type the barcode to pull up its live status and location.</p>
        <CodeInput
          value={search}
          onChange={setSearch}
          onSubmit={locate}
          submitLabel="Locate"
          placeholder="Scan or type kit barcode…"
          buttonClassName="rounded-lg bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
        />
        {locateError && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{locateError}</div>}
        {located && (
          <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-base font-bold text-gray-900">{located.barcode}</span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: (STATUS_CONFIG[located.status] || STATUS_CONFIG.REGISTERED).bg, color: (STATUS_CONFIG[located.status] || STATUS_CONFIG.REGISTERED).color }}
              >
                {(STATUS_CONFIG[located.status] || STATUS_CONFIG.REGISTERED).icon} {(STATUS_CONFIG[located.status] || STATUS_CONFIG.REGISTERED).label}
              </span>
              <span className="text-sm text-gray-600">{located.patientName || 'Unassigned'}</span>
              <span className="text-sm text-gray-500">{located.facilityId || 'No facility'}</span>
              <span className="text-xs text-gray-400">Last movement {timeAgo(located.updatedAt)}</span>
            </div>
            <Link href="/admin/kit-inventory" className="mt-2 inline-block text-xs font-semibold text-sky-700 hover:underline">
              Open full history in Kit Inventory →
            </Link>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {([
            { key: 'preregistered', label: 'Pre-Scanned' },
            { key: 'infield', label: 'In Field' },
            { key: 'all', label: 'All Kits' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                view === t.key ? 'bg-sky-700 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {facilities.length > 0 && (
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Facilities</option>
            {facilities.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Barcode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Facility</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Last Movement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading kits…</td></tr>
              ) : kits.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No kits match this view</td></tr>
              ) : kits.map((k) => {
                const cfg = STATUS_CONFIG[k.status] || STATUS_CONFIG.REGISTERED;
                return (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">{k.barcode}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{k.patientName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{k.facilityId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{k.kitType || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500" title={k.updatedAt ? new Date(k.updatedAt).toLocaleString() : ''}>
                      {timeAgo(k.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {recentActivity.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((k) => {
              const cfg = STATUS_CONFIG[k.status] || STATUS_CONFIG.REGISTERED;
              return (
                <div key={`act-${k.id}`} className="flex items-center gap-3 border-b border-gray-50 pb-2 last:border-0">
                  <span className="text-lg">{cfg.icon}</span>
                  <span className="font-mono text-sm font-semibold text-gray-800">{k.barcode}</span>
                  <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-xs text-gray-400">{k.facilityId || 'No facility'}</span>
                  <span className="ml-auto text-xs text-gray-400">{timeAgo(k.updatedAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
