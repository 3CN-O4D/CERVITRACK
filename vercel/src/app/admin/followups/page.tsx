'use client';

import { useState, useEffect, useMemo } from 'react';

interface FollowUp {
  id: string;
  patient_name: string;
  screening_id: string;
  completed: boolean;
  notes: string;
  completed_at: string | null;
}

type SortKey = 'patient_name' | 'completed' | 'completed_at' | 'screening_id';

export default function AdminFollowupsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('completed_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { fetchFollowups(); }, []);

  const fetchFollowups = async () => {
    try {
      const res = await fetch('/api/admin/followups');
      if (!res.ok) throw new Error('Failed to load follow-ups');
      const json = await res.json();
      setFollowups(json.followups || json || []);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-gray-400">{sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  );

  const filtered = useMemo(() => {
    let list = followups;
    if (statusFilter === 'completed') list = list.filter(f => f.completed);
    if (statusFilter === 'pending') list = list.filter(f => !f.completed);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f => f.patient_name?.toLowerCase().includes(q) || f.notes?.toLowerCase().includes(q) || f.screening_id?.toString().includes(q));
    }
    return [...list].sort((a, b) => {
      let av: any = a[sortKey] ?? '', bv: any = b[sortKey] ?? '';
      if (sortKey === 'completed') { av = a.completed ? 1 : 0; bv = b.completed ? 1 : 0; }
      if (sortKey === 'completed_at') { av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [followups, search, statusFilter, sortKey, sortDir]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Follow-ups ({filtered.length})</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, notes, screening ID…"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        <div className="flex gap-1">
          {(['all', 'pending', 'completed'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-sky-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                {([['patient_name', 'Patient'], ['screening_id', 'Screening ID'], ['completed', 'Completed'], ['notes', 'Notes'], ['completed_at', 'Completed At']] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-50 select-none" onClick={() => handleSort(key)}>
                    {label}<SortIcon col={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No follow-ups found</td></tr>
              ) : filtered.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{f.patient_name}</td>
                  <td className="px-6 py-3 text-gray-600 font-mono text-xs">{f.screening_id}</td>
                  <td className="px-6 py-3">
                    {f.completed ? (
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{f.notes || '—'}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {f.completed_at ? new Date(f.completed_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
