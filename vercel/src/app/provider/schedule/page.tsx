'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface ScheduledAction {
  id: string;
  patient_id: string;
  patient_name: string;
  action: string;
  date: string;
  completed: boolean;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  patient_id: string;
}

type SortKey = 'patient_name' | 'action' | 'date' | 'completed';

export default function ProviderSchedulePage() {
  const router = useRouter();
  const [actions, setActions] = useState<ScheduledAction[]>([]);
  const [loading, setLoading] = useState(true);

  const [patientId, setPatientId] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState({ type: '' as 'success' | 'error' | '', text: '' });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const stored = localStorage.getItem('provider');
    if (!stored) { router.push('/provider/login'); return; }
    fetchActions();
    fetchPatients();
  }, [router]);

  const fetchActions = async () => {
    try {
      const res = await fetch('/api/scheduled-actions');
      if (res.ok) {
        const json = await res.json();
        setActions(json.actions || json || []);
      }
    } catch { setActions([]); }
    finally { setLoading(false); }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/providers/patients');
      if (res.ok) {
        const json = await res.json();
        setPatients(json.patients || json || []);
      }
    } catch { /* ignore */ }
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 20);
    const q = patientSearch.toLowerCase();
    return patients.filter(p => p.name?.toLowerCase().includes(q) || p.patient_id?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));
  }, [patients, patientSearch]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-gray-400">{sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  );

  const filtered = useMemo(() => {
    let list = actions;
    if (statusFilter === 'completed') list = list.filter(a => a.completed);
    if (statusFilter === 'pending') list = list.filter(a => !a.completed);
    return [...list].sort((a, b) => {
      if (sortKey === 'date') {
        return sortDir === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortKey === 'completed') {
        const av = a.completed ? 1 : 0, bv = b.completed ? 1 : 0;
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const av = (a[sortKey] || '').toLowerCase();
      const bv = (b[sortKey] || '').toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [actions, statusFilter, sortKey, sortDir]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !actionDate || !actionDesc) {
      setResult({ type: 'error', text: 'All fields are required' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/scheduled-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, date: actionDate, action: actionDesc }),
      });
      if (!res.ok) throw new Error('Failed to create');
      setResult({ type: 'success', text: 'Action scheduled' });
      setPatientId('');
      setPatientSearch('');
      setActionDate('');
      setActionDesc('');
      fetchActions();
      setTimeout(() => setResult({ type: '', text: '' }), 3000);
    } catch (err: unknown) {
      setResult({ type: 'error', text: err instanceof Error ? err.message : 'Failed to schedule' });
    } finally { setCreating(false); }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create Scheduled Action</h2>

          {result.text && (
            <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${
              result.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>{result.text}</div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input type="text" value={patientSearch} onChange={(e) => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                  onFocus={() => setShowPatientDropdown(true)}
                  placeholder="Search patient by name or ID…"
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              {showPatientDropdown && filteredPatients.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredPatients.map((p) => (
                    <button key={p.id} type="button"
                      onClick={() => { setPatientId(p.id); setPatientSearch(p.name); setShowPatientDropdown(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-900">{p.name}</span>
                      <span className="text-gray-500 ml-2">{p.patient_id || p.id}</span>
                    </button>
                  ))}
                </div>
              )}
              {patientId && <input type="hidden" value={patientId} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={actionDate} onChange={(e) => setActionDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <input type="text" value={actionDesc} onChange={(e) => setActionDesc(e.target.value)}
                placeholder="e.g. Follow-up screening"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <button type="submit" disabled={creating}
              className="bg-sky-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-800 disabled:opacity-50">
              {creating ? 'Creating…' : 'Schedule Action'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upcoming Actions ({filtered.length})</h2>
            <div className="flex gap-1">
              {(['all', 'pending', 'completed'] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    statusFilter === s ? 'bg-sky-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400">No scheduled actions</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-[1fr_100px_60px_80px] gap-2 text-xs font-medium text-gray-500 px-3 pb-1 border-b border-gray-100">
                <span className="cursor-pointer hover:text-gray-700" onClick={() => handleSort('action')}>
                  Action <SortIcon col="action" />
                </span>
                <span className="cursor-pointer hover:text-gray-700" onClick={() => handleSort('date')}>
                  Date <SortIcon col="date" />
                </span>
                <span className="cursor-pointer hover:text-gray-700" onClick={() => handleSort('patient_name')}>
                  Patient <SortIcon col="patient_name" />
                </span>
                <span className="cursor-pointer hover:text-gray-700" onClick={() => handleSort('completed')}>
                  Status <SortIcon col="completed" />
                </span>
              </div>
              {filtered.map((a) => (
                <div key={a.id} className="grid grid-cols-[1fr_100px_60px_80px] gap-2 border border-gray-100 rounded-lg p-3 items-center">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.action}</p>
                  <p className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500 truncate">{a.patient_name || a.patient_id}</p>
                  {a.completed ? (
                    <span className="text-xs text-emerald-600 font-medium">Done</span>
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">Pending</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
