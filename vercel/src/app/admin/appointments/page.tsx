'use client';

import { useState, useEffect, useMemo } from 'react';

interface Appointment {
  id: string;
  patient_name: string;
  patient_email: string;
  title: string;
  facility: string;
  date: string;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  upcoming: 'bg-sky-50 text-sky-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

type SortKey = 'patient_name' | 'title' | 'date' | 'status' | 'created_at';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/admin/appointments');
      if (!res.ok) throw new Error('Failed to load appointments');
      const json = await res.json();
      setAppointments(Array.isArray(json) ? json : json.appointments || []);
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
    let list = appointments;
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.patient_name?.toLowerCase().includes(q) ||
        a.patient_email?.toLowerCase().includes(q) ||
        a.title?.toLowerCase().includes(q) ||
        a.facility?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (sortKey === 'date' || sortKey === 'created_at') { av = new Date(av as string).getTime() as any; bv = new Date(bv as string).getTime() as any; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [appointments, search, statusFilter, sortKey, sortDir]);

  const statuses = ['all', 'pending', 'upcoming', 'completed', 'cancelled'];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Appointments ({filtered.length})</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, title, facility…"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        <div className="flex gap-1">
          {statuses.map((s) => (
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
                {([['patient_name', 'Patient'], ['title', 'Title / Facility'], ['date', 'Date'], ['status', 'Status'], ['created_at', 'Created']] as [SortKey, string][]).map(([key, label]) => (
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
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No appointments found</td></tr>
              ) : filtered.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{a.patient_name}</td>
                  <td className="px-6 py-3 text-gray-600">
                    <div>{a.title}</div>
                    {a.facility && <div className="text-xs text-gray-400">{a.facility}</div>}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[a.status] || 'bg-gray-50 text-gray-700'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
