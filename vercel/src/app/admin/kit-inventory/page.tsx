'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface KitStats {
  total: number;
  available: number;
  givenOut: number;
  inPipeline: number;
  requested: number;
  registered: number;
  paired: number;
  collected: number;
  inTransit: number;
  inLab: number;
  processed: number;
  unregistered: number;
}

interface KitLedgerItem {
  id: number;
  barcode: string;
  kitType: string;
  status: string;
  facilityId: string;
  patientName: string;
  collectionMethod: string;
  result: string;
  currentLocation: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  UNREGISTERED: { label: 'Unregistered', color: '#6B7280', bg: '#F3F4F6', icon: '📦' },
  REGISTERED: { label: 'Available', color: '#2563EB', bg: '#DBEAFE', icon: '✓' },
  PAIRED: { label: 'Given Out', color: '#D97706', bg: '#FEF3C7', icon: '👤' },
  COLLECTED: { label: 'Sample Taken', color: '#7C3AED', bg: '#EDE9FE', icon: '🧪' },
  IN_TRANSIT: { label: 'In Transit', color: '#0891B2', bg: '#ECFEFF', icon: '🚚' },
  IN_LAB: { label: 'At Lab', color: '#059669', bg: '#D1FAE5', icon: '🔬' },
  PROCESSED: { label: 'Processed', color: '#059669', bg: '#D1FAE5', icon: '📄' },
};

export default function KitInventoryPage() {
  const [stats, setStats] = useState<KitStats | null>(null);
  const [ledger, setLedger] = useState<KitLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalKits, setTotalKits] = useState(0);

  // Register modal
  const [showRegister, setShowRegister] = useState(false);
  const [registerMode, setRegisterMode] = useState<'single' | 'bulk'>('single');
  const [registerBarcode, setRegisterBarcode] = useState('');
  const [bulkBarcodes, setBulkBarcodes] = useState('');
  const [registerFacility, setRegisterFacility] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<any>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/sample-kits/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await fetch(`/api/sample-kits?${params.toString()}`);
      const data = await res.json();
      setLedger(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalKits(data.total || 0);
    } catch (e) {
      console.error('Failed to load ledger:', e);
    } finally {
      setLedgerLoading(false);
    }
  }, [filterStatus, search, page]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadLedger(); }, [loadLedger]);

  const handleRegister = async () => {
    setRegistering(true);
    setRegisterResult(null);
    try {
      if (registerMode === 'single') {
        if (!registerBarcode.trim()) return;
        const res = await fetch('/api/sample-kits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            barcode: registerBarcode.trim(),
            facilityId: registerFacility || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setRegisterResult({ success: 1, message: `Kit ${registerBarcode} registered successfully` });
          setRegisterBarcode('');
        } else {
          setRegisterResult({ errors: 1, message: data.message || 'Failed' });
        }
      } else {
        const barcodes = bulkBarcodes.split(/[\n,]+/).map((b: string) => b.trim()).filter(Boolean);
        if (barcodes.length === 0) return;
        const res = await fetch('/api/sample-kits/bulk-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcodes,
            facilityId: registerFacility || undefined,
          }),
        });
        const data = await res.json();
        setRegisterResult(data);
        setBulkBarcodes('');
      }
      await loadStats();
      await loadLedger();
    } catch (e: any) {
      setRegisterResult({ errors: 1, message: e.message });
    } finally {
      setRegistering(false);
    }
  };

  const kitCounts = [
    { key: 'total', label: 'Total Kits', count: stats?.total || 0, color: '#1F2937', bg: '#F9FAFB', border: '#E5E7EB' },
    { key: 'available', label: 'Available', count: stats?.available || 0, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    { key: 'givenOut', label: 'Given Out', count: stats?.givenOut || 0, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    { key: 'inPipeline', label: 'In Pipeline', count: stats?.inPipeline || 0, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { key: 'inLab', label: 'At Lab', count: stats?.inLab || 0, color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
    { key: 'processed', label: 'Processed', count: stats?.processed || 0, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    { key: 'requested', label: 'Requested', count: stats?.requested || 0, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kit Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Complete ledger of all kits in the system</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { loadStats(); loadLedger(); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Refresh
          </button>
          <button onClick={() => setShowRegister(true)} className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Register Kits
          </button>
        </div>
      </div>

      {/* Dashboard Counts */}
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {kitCounts.map((c) => (
          <div key={c.key} className="rounded-xl p-4 border-2" style={{ backgroundColor: c.bg, borderColor: c.border }}>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.count}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: c.color }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Status Flow Visualization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Kit Lifecycle</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['REGISTERED', 'PAIRED', 'COLLECTED', 'IN_TRANSIT', 'IN_LAB', 'PROCESSED'].map((st, i) => {
            const cfg = STATUS_CONFIG[st];
            const count = stats?.[st.toLowerCase() as keyof KitStats] || 0;
            return (
              <div key={st} className="flex items-center">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className="text-2xl mb-1">{cfg.icon}</div>
                  <div className="text-lg font-bold" style={{ color: cfg.color }}>{count}</div>
                  <div className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</div>
                </div>
                {i < 5 && (
                  <svg className="w-6 h-6 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Kit Ledger</h3>
          <div className="flex-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search barcode or patient..."
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Barcode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Facility</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Result</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ledgerLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading ledger...</td></tr>
              ) : ledger.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No kits found</td></tr>
              ) : ledger.map((kit) => {
                const cfg = STATUS_CONFIG[kit.status] || STATUS_CONFIG.REGISTERED;
                return (
                  <tr key={kit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-gray-900">{kit.barcode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{kit.kitType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{kit.patientName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{kit.facilityId || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${kit.result !== '—' ? 'text-gray-900' : 'text-gray-400'}`}>
                        {kit.result}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {new Date(kit.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">{totalKits} kits total</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowRegister(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Register New Kits</h2>
              <button onClick={() => setShowRegister(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setRegisterMode('single')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${registerMode === 'single' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Single Kit
              </button>
              <button
                onClick={() => setRegisterMode('bulk')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${registerMode === 'bulk' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Bulk Register
              </button>
            </div>

            {/* Facility */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Facility (optional)</label>
              <input
                type="text"
                value={registerFacility}
                onChange={(e) => setRegisterFacility(e.target.value)}
                placeholder="e.g. KNH, Kisumu, etc."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {registerMode === 'single' ? (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Kit Barcode</label>
                <input
                  type="text"
                  value={registerBarcode}
                  onChange={(e) => setRegisterBarcode(e.target.value)}
                  placeholder="Scan or type barcode..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Barcodes (one per line or comma-separated)</label>
                <textarea
                  value={bulkBarcodes}
                  onChange={(e) => setBulkBarcodes(e.target.value)}
                  placeholder="CT-2026-0009&#10;CT-2026-0010&#10;CT-2026-0011"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500"
                  rows={5}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {bulkBarcodes.split(/[\n,]+/).filter((b: string) => b.trim()).length} barcodes entered
                </p>
              </div>
            )}

            {registerResult && (
              <div className={`p-3 rounded-lg mb-4 text-sm ${registerResult.errors ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {registerResult.message || `${registerResult.registered || 0} registered, ${registerResult.skipped || 0} skipped, ${registerResult.errors || 0} errors`}
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={registering || (registerMode === 'single' ? !registerBarcode.trim() : !bulkBarcodes.trim())}
              className="w-full py-3 bg-sky-600 text-white rounded-lg text-sm font-bold hover:bg-sky-700 disabled:opacity-50"
            >
              {registering ? 'Registering...' : registerMode === 'single' ? 'Register Kit' : `Register ${bulkBarcodes.split(/[\n,]+/).filter((b: string) => b.trim()).length} Kits`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
