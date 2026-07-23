'use client';

import { useState, useEffect, useMemo } from 'react';

interface LabResult {
  id: string;
  patient_name: string;
  result: string;
  notes: string;
  created_at: string;
  user_id?: string;
}

type SortKey = 'patient_name' | 'result' | 'created_at';

export default function AdminLabResultsPage() {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { fetchResults(); }, []);

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/admin/lab-results');
      if (!res.ok) throw new Error('Failed to load lab results');
      const json = await res.json();
      setResults(json.results || json || []);
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

  const resultTypes = ['all', 'NORMAL', 'POSITIVE', 'NEGATIVE', 'INCONCLUSIVE', 'ABNORMAL', 'UNSATISFACTORY'];

  const filtered = useMemo(() => {
    let list = results;
    if (resultFilter !== 'all') list = list.filter(r => r.result?.toUpperCase() === resultFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.patient_name?.toLowerCase().includes(q) || r.result?.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (sortKey === 'created_at') { av = new Date(av as string).getTime() as any; bv = new Date(bv as string).getTime() as any; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [results, search, resultFilter, sortKey, sortDir]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Lab Results ({filtered.length})</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, result, notes…"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {resultTypes.map((r) => (
            <button key={r} onClick={() => setResultFilter(r)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                resultFilter === r ? 'bg-sky-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {r === 'all' ? 'All' : r}
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
                {([['patient_name', 'Patient'], ['result', 'Result'], ['notes', 'Notes'], ['created_at', 'Created']] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-50 select-none" onClick={() => handleSort(key)}>
                    {label}<SortIcon col={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No results found</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{r.patient_name}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.result?.toLowerCase().includes('positive') ? 'bg-red-50 text-red-700' :
                      r.result?.toLowerCase().includes('negative') || r.result?.toUpperCase() === 'NORMAL' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>{r.result}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{r.notes || '—'}</td>
                  <td className="px-6 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
