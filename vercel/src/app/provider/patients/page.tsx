'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Patient {
  id: string;
  name: string;
  email: string;
  patient_id: string;
  county: string;
}

type SortKey = 'name' | 'email' | 'patient_id' | 'county';

export default function ProviderPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const stored = localStorage.getItem('provider');
    if (!stored) { router.push('/provider/login'); return; }
    fetchPatients();
  }, [router]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/providers/patients');
      if (res.ok) {
        const json = await res.json();
        setPatients(json.patients || json || []);
      }
    } catch { setPatients([]); }
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
    let list = patients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.patient_id?.toLowerCase().includes(q) || p.county?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const av = (a[sortKey] || '').toLowerCase();
      const bv = (b[sortKey] || '').toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [patients, search, sortKey, sortDir]);

  const columns: [SortKey, string][] = [['name', 'Name'], ['email', 'Email'], ['patient_id', 'Patient ID'], ['county', 'County']];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Patients ({filtered.length})</h1>

      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, ID, or county…"
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                {columns.map(([key, label]) => (
                  <th key={key} className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-50 select-none" onClick={() => handleSort(key)}>
                    {label}<SortIcon col={key} />
                  </th>
                ))}
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No patients found</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-3 text-gray-600">{p.email}</td>
                  <td className="px-6 py-3 text-gray-600 font-mono text-xs">{p.patient_id || p.id}</td>
                  <td className="px-6 py-3 text-gray-600">{p.county || '—'}</td>
                  <td className="px-6 py-3">
                    <Link href={`/provider/patient/${p.id}`} className="text-sky-700 text-sm font-medium hover:underline">View</Link>
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
