'use client';

import { useState, useEffect } from 'react';

type Filter = 'all' | 'at-risk' | 'healthy';

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
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers(filter);
  }, [filter]);

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
    } finally {
      setLoading(false);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All Users' },
    { key: 'at-risk', label: 'At-Risk' },
    { key: 'healthy', label: 'Healthy' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-sky-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">County</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Risk Index</th>
                <th className="px-6 py-3 font-medium">Latest Screening</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">Loading…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-3 text-gray-600">{u.email}</td>
                    <td className="px-6 py-3 text-gray-600">{u.phone || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{u.county || '—'}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{u.role}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`font-medium ${
                        (u.risk_index || 0) >= 7 ? 'text-red-600' :
                        (u.risk_index || 0) >= 4 ? 'text-amber-600' :
                        'text-emerald-600'
                      }`}>
                        {u.risk_index ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {u.latest_risk_tier && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.latest_risk_tier === 'high' ? 'bg-red-50 text-red-700' :
                          u.latest_risk_tier === 'medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {u.latest_verdict} / {u.latest_risk_tier}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
