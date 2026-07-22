'use client';

import { useState, useEffect } from 'react';

interface StatsData {
  total_patients: number;
  total_screenings: number;
  total_vaccinations: number;
  county_prevalence: Array<{
    county: string;
    patients: number;
    screenings: number;
    positive: number;
    negative: number;
    high_risk: number;
    low_risk: number;
  }>;
  age_distribution: Array<{
    age_group: string;
    count: number;
  }>;
  verdict_breakdown: {
    positive: number;
    negative: number;
    inconclusive: number;
  };
  risk_tier_breakdown: {
    high: number;
    medium: number;
    low: number;
  };
  monthly_trends: Array<{
    month: string;
    screenings: number;
    positive: number;
    negative: number;
  }>;
}

export default function AdminStatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-screen text-gray-500">Loading stats…</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Statistics</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Patients</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">{data?.total_patients ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Screenings</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{data?.total_screenings ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Vaccinations</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">{data?.total_vaccinations ?? 0}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Verdict Breakdown</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Positive</span>
                <span className="font-medium text-red-600">{data?.verdict_breakdown?.positive ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Negative</span>
                <span className="font-medium text-emerald-600">{data?.verdict_breakdown?.negative ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Inconclusive</span>
                <span className="font-medium text-amber-600">{data?.verdict_breakdown?.inconclusive ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Risk Tier Breakdown</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">High Risk</span>
                <span className="font-medium text-red-600">{data?.risk_tier_breakdown?.high ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Medium Risk</span>
                <span className="font-medium text-amber-600">{data?.risk_tier_breakdown?.medium ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Low Risk</span>
                <span className="font-medium text-emerald-600">{data?.risk_tier_breakdown?.low ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Age Group Distribution</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Age Group</th>
                <th className="px-6 py-3 font-medium">Count</th>
              </tr>
            </thead>
            <tbody>
              {(data?.age_distribution ?? []).length === 0 ? (
                <tr><td colSpan={2} className="px-6 py-6 text-center text-gray-400">No data</td></tr>
              ) : (
                data?.age_distribution.map((a) => (
                  <tr key={a.age_group} className="border-b border-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{a.age_group}</td>
                    <td className="px-6 py-3 text-gray-600">{a.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">County Prevalence</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">County</th>
                <th className="px-6 py-3 font-medium">Patients</th>
                <th className="px-6 py-3 font-medium">Screenings</th>
                <th className="px-6 py-3 font-medium">Positive</th>
                <th className="px-6 py-3 font-medium">Negative</th>
                <th className="px-6 py-3 font-medium">High Risk</th>
                <th className="px-6 py-3 font-medium">Low Risk</th>
              </tr>
            </thead>
            <tbody>
              {(data?.county_prevalence ?? []).length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-6 text-center text-gray-400">No data</td></tr>
              ) : (
                data?.county_prevalence.map((c) => (
                  <tr key={c.county} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{c.county}</td>
                    <td className="px-6 py-3 text-gray-600">{c.patients}</td>
                    <td className="px-6 py-3 text-gray-600">{c.screenings}</td>
                    <td className="px-6 py-3 text-red-600 font-medium">{c.positive}</td>
                    <td className="px-6 py-3 text-emerald-600">{c.negative}</td>
                    <td className="px-6 py-3 text-red-600">{c.high_risk}</td>
                    <td className="px-6 py-3 text-emerald-600">{c.low_risk}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Monthly Screening Trends</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Month</th>
                <th className="px-6 py-3 font-medium">Screenings</th>
                <th className="px-6 py-3 font-medium">Positive</th>
                <th className="px-6 py-3 font-medium">Negative</th>
              </tr>
            </thead>
            <tbody>
              {(data?.monthly_trends ?? []).length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-6 text-center text-gray-400">No data</td></tr>
              ) : (
                data?.monthly_trends.map((m) => (
                  <tr key={m.month} className="border-b border-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{m.month}</td>
                    <td className="px-6 py-3 text-gray-600">{m.screenings}</td>
                    <td className="px-6 py-3 text-red-600">{m.positive}</td>
                    <td className="px-6 py-3 text-emerald-600">{m.negative}</td>
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
