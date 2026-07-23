'use client';

import { useState, useEffect, useMemo } from 'react';

type Filter = 'all' | 'at-risk' | 'healthy';
type SortKey = 'name' | 'email' | 'county' | 'role' | 'risk_index' | 'created_at' | 'latest_risk_tier';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  county: string;
  role: string;
  risk_index: number;
  created_at: string;
  latest_verdict: string;
  latest_risk_tier: string;
  photo?: string;
}

const RISK_LABELS: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-700' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'county', label: 'County' },
  { key: 'role', label: 'Role' },
  { key: 'risk_index', label: 'Risk Index' },
  { key: 'created_at', label: 'Created' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { fetchUsers(filter); }, [filter]);

  const fetchUsers = async (f: Filter) => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/admin/users';
      if (f === 'at-risk') url = '/api/admin/users/at-risk';
      if (f === 'healthy') url = '/api/admin/users/healthy';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load users');
      const json = await res.json();
      setUsers(json.users || json || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally { setLoading(false); }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-gray-400">
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const filtered = useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.county?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (sortKey === 'risk_index') { av = Number(av) as any; bv = Number(bv) as any; }
      if (sortKey === 'created_at') { av = new Date(av as string).getTime() as any; bv = new Date(bv as string).getTime() as any; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, search, sortKey, sortDir]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All Users' },
    { key: 'at-risk', label: 'At-Risk' },
    { key: 'healthy', label: 'Healthy' },
  ];

  const initials = (name: string) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const avatarColor = (id: string) => {
    const colors = ['#6C5CE7', '#00C853', '#FF4D4D', '#FFB800', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];
    return colors[(id || '').charCodeAt(0) % colors.length];
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users ({filtered.length})</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, county, role…"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-sky-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                {SORT_COLUMNS.map((col) => (
                  <th key={col.key} className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort(col.key)}>
                    {col.label}<SortIcon col={col.key} />
                  </th>
                ))}
                <th className="px-6 py-3 font-medium">Latest Screening</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No users found</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {u.photo ? (
                        <img src={u.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: avatarColor(u.id) }}>
                          {initials(u.name)}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{u.email}</td>
                  <td className="px-6 py-3 text-gray-600">{u.county || '—'}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{u.role}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`font-medium ${(u.risk_index || 0) >= 7 ? 'text-red-600' : (u.risk_index || 0) >= 4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {u.risk_index ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    {u.latest_risk_tier && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${RISK_LABELS[u.latest_risk_tier]?.bg || 'bg-gray-50'} ${RISK_LABELS[u.latest_risk_tier]?.text || 'text-gray-700'}`}>
                        {u.latest_verdict} / {u.latest_risk_tier}
                      </span>
                    )}
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
