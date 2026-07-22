'use client';

import { useState, useEffect } from 'react';

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

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: data?.total_users ?? 0, color: 'text-sky-700' },
    { label: 'Screenings Today', value: data?.screenings_today ?? 0, color: 'text-emerald-600' },
    { label: 'Screenings This Week', value: data?.screenings_week ?? 0, color: 'text-emerald-600' },
    { label: 'Screenings This Month', value: data?.screenings_month ?? 0, color: 'text-emerald-600' },
    { label: 'High Risk Alerts', value: data?.high_risk_alerts ?? 0, color: 'text-red-600' },
    { label: 'HPV Positive', value: data?.hpv_positive ?? 0, color: 'text-amber-600' },
    { label: 'Follow-ups Completed', value: data?.followups_completed ?? 0, color: 'text-sky-700' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Screenings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Patient</th>
                <th className="px-6 py-3 font-medium">Verdict</th>
                <th className="px-6 py-3 font-medium">Risk Tier</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent_screenings ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No recent screenings</td>
                </tr>
              ) : (
                data?.recent_screenings.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{s.user_name}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.verdict === 'positive' ? 'bg-red-50 text-red-700' :
                        s.verdict === 'negative' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {s.verdict}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.risk_tier === 'high' ? 'bg-red-50 text-red-700' :
                        s.risk_tier === 'medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {s.risk_tier}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(s.created_at).toLocaleDateString()}
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
