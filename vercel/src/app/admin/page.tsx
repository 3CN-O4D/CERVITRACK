'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardData {
  total_users: number;
  screenings_today: number;
  screenings_week: number;
  screenings_month: number;
  high_risk_alerts: number;
  hpv_positive: number;
  followups_completed: number;
  recent_screenings: Array<{
    id: string;
    user_name: string;
    verdict: string;
    risk_tier: string;
    created_at: string;
  }>;
}

interface KitStats {
  total: number;
  registered: number;
  paired: number;
  collected: number;
  inTransit: number;
  inLab: number;
  processed: number;
  byStatus: Record<string, number>;
}

interface Kit {
  id: string;
  barcode: string;
  kitType: string;
  status: string;
  patientName?: string;
  facilityId?: string;
  createdAt: string;
  updatedAt: string;
  events: KitEvent[];
}

interface KitEvent {
  id: string;
  action: string;
  scannedBy: string;
  scannedByName: string;
  location?: string;
  notes?: string;
  timestamp: string;
}

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-700',
  PAIRED: 'bg-amber-100 text-amber-700',
  COLLECTED: 'bg-green-100 text-green-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  IN_LAB: 'bg-cyan-100 text-cyan-700',
  PROCESSED: 'bg-emerald-100 text-emerald-700',
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [kitStats, setKitStats] = useState<KitStats | null>(null);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'dashboard' | 'kits' | 'tracking'>('dashboard');
  const [barcode, setBarcode] = useState('');
  const [scannedKit, setScannedKit] = useState<Kit | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [kitFilter, setKitFilter] = useState('');

  useEffect(() => { fetchDashboard(); fetchKits(); }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function fetchKits() {
    try {
      const url = kitFilter ? `/api/sample-kits?status=${kitFilter}` : '/api/sample-kits';
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setKits(d.data || []);
      }
    } catch { /* ignore */ }

    try {
      const res = await fetch('/api/sample-kits/stats');
      if (res.ok) setKitStats(await res.json());
    } catch { /* ignore */ }
  }

  async function scanKit() {
    const code = barcode.trim();
    if (!code) return;
    setScanLoading(true);
    setScanError('');
    setScannedKit(null);
    try {
      const res = await fetch(`/api/sample-kits/scan/${code}`);
      if (res.ok) { setScannedKit(await res.json()); setTab('tracking'); }
      else if (res.status === 404) setScanError('Kit not found');
      else setScanError('Scan failed');
    } catch { setScanError('Network error'); }
    finally { setScanLoading(false); }
  }

  useEffect(() => { fetchKits(); }, [kitFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-sky-700">CerviTrack</Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-600">Admin Panel</span>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-sky-700">Home</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          {(['dashboard', 'kits', 'tracking'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-sky-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {t === 'dashboard' ? 'Dashboard' : t === 'kits' ? 'Kit Inventory' : 'Track Kit'}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

        {tab === 'dashboard' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading dashboard...</div>
            ) : data ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', value: data.total_users, color: 'text-sky-600' },
                    { label: 'Screenings Today', value: data.screenings_today, color: 'text-emerald-600' },
                    { label: 'High Risk Alerts', value: data.high_risk_alerts, color: 'text-red-600' },
                    { label: 'HPV Positive', value: data.hpv_positive, color: 'text-amber-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                      <div className={`text-2xl font-bold ${color}`}>{value}</div>
                      <div className="text-xs text-gray-500 mt-1">{label}</div>
                    </div>
                  ))}
                </div>

                {kitStats && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Kit Pipeline Overview</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        { label: 'Registered', value: kitStats.registered, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                        { label: 'Paired', value: kitStats.paired, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                        { label: 'Collected', value: kitStats.collected, color: 'bg-green-50 text-green-700 border-green-200' },
                        { label: 'In Transit', value: kitStats.inTransit, color: 'bg-purple-50 text-purple-700 border-purple-200' },
                        { label: 'At Lab', value: kitStats.inLab, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                        { label: 'Processed', value: kitStats.processed, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className={`rounded-lg border p-3 text-center ${color}`}>
                          <div className="text-xl font-bold">{value}</div>
                          <div className="text-xs mt-1">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(data.recent_screenings || []).length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Recent Screenings</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {data.recent_screenings.map((s) => (
                        <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{s.user_name}</div>
                            <div className="text-xs text-gray-500">{new Date(s.created_at).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              s.risk_tier === 'HIGH' ? 'bg-red-100 text-red-700' : s.risk_tier === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                            }`}>{s.risk_tier}</span>
                            <span className="text-xs text-gray-500">{s.verdict}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-gray-400">No dashboard data available</div>
            )}
          </div>
        )}

        {tab === 'kits' && (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setKitFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!kitFilter ? 'bg-sky-700 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>All</button>
              {['REGISTERED', 'PAIRED', 'COLLECTED', 'IN_TRANSIT', 'IN_LAB', 'PROCESSED'].map((s) => (
                <button key={s} onClick={() => setKitFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${kitFilter === s ? 'bg-sky-700 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Barcode</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Patient</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Updated</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {kits.map((k) => (
                    <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">{k.barcode}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{k.kitType}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{k.patientName || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[k.status] || 'bg-gray-100 text-gray-700'}`}>
                          {k.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{new Date(k.updatedAt).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { setBarcode(k.barcode); setScannedKit(k); setTab('tracking'); }}
                          className="text-sky-600 text-xs font-medium hover:text-sky-700">Track</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {kits.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No kits found</div>}
            </div>
          </div>
        )}

        {tab === 'tracking' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Track Kit by Barcode</h2>
              <div className="flex gap-2">
                <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Enter or scan kit barcode..."
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sky-500"
                  onKeyDown={(e) => e.key === 'Enter' && scanKit()} />
                <button onClick={scanKit} disabled={!barcode.trim() || scanLoading}
                  className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  {scanLoading ? 'Scanning...' : 'Track'}
                </button>
              </div>
            </div>

            {scanError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{scanError}</div>}

            {scannedKit && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900 font-mono">{scannedKit.barcode}</span>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[scannedKit.status] || 'bg-gray-100 text-gray-700'}`}>
                          {scannedKit.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{scannedKit.kitType} · {scannedKit.patientName || 'Unassigned'}</div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Movement Timeline</h4>
                  {scannedKit.events && scannedKit.events.length > 0 ? (
                    <div className="relative ml-3 border-l-2 border-gray-200 space-y-4">
                      {scannedKit.events.map((evt, i) => (
                        <div key={evt.id} className="relative pl-6">
                          <div className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white ${
                            i === scannedKit.events.length - 1 ? 'bg-sky-500' : 'bg-gray-300'
                          }`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{evt.action}</span>
                              <span className="text-xs text-gray-400">{new Date(evt.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-gray-500">By: {evt.scannedByName}</div>
                            {evt.location && <div className="text-xs text-gray-500">Location: {evt.location}</div>}
                            {evt.notes && <div className="text-xs text-gray-400 mt-1 italic">{evt.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No events recorded for this kit</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
