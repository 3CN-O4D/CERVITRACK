'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

interface CountyAdminUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  county?: string;
  created_at?: string;
}

export default function CountyPage() {
  const [county, setCounty] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<CountyAdminUser[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: profile } = await supabase
          .from('users')
          .select('county')
          .eq('id', session.user.id)
          .maybeSingle();
        const c = profile?.county || '';
        setCounty(c);

        const [statsRes, usersRes] = await Promise.all([
          apiFetch(`/api/admin/stats${c ? `?county=${encodeURIComponent(c)}` : ''}`),
          apiFetch(`/api/admin/users${c ? `?county=${encodeURIComponent(c)}` : ''}`),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch {
        /* apiFetch redirects on auth failure */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const countyLines = stats?.countyStats || [];
  const line = countyLines.find((c: any) => c.county === county) || countyLines[0] || {};
  const total = stats?.overallTotals || {};

  const cards = [
    { label: 'Patients', value: line.patients ?? total.totalUsers ?? 0 },
    { label: 'Screenings', value: line.screenings ?? total.totalScreenings ?? 0 },
    { label: 'Positive', value: line.positive ?? 0, accent: true },
    { label: 'High Risk', value: line.high_risk ?? 0, accent: true },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">County Overview</h1>
          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-sm font-semibold">
            {county || 'All counties'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Surveillance summary for the selected county health program.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`bg-white rounded-xl border p-5 shadow-sm ${c.accent ? 'border-rose-200' : 'border-gray-200'}`}>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.accent ? 'text-rose-600' : 'text-gray-900'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">County Users</h2>
          <span className="text-sm text-gray-500">{users.length} users</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">County</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-6 py-3 font-medium text-gray-900">{u.name || '—'}</td>
                <td className="px-6 py-3 text-gray-600">{u.email || '—'}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">{u.role || '—'}</span>
                </td>
                <td className="px-6 py-3 text-gray-600">{u.county || '—'}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-400" colSpan={4}>No users in this county yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}