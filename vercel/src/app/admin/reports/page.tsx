'use client';

import { useState, useEffect, useCallback } from 'react';

interface Report {
  id: string;
  user_id: string;
  type: string;
  content: string;
  created_at: string;
}

export default function AdminReportsPage() {
  const [userId, setUserId] = useState('');
  const [reportType, setReportType] = useState('general');
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [message, setMessage] = useState({ type: '' as 'success' | 'error' | '', text: '' });

  const fetchReports = useCallback(async (uid: string) => {
    if (!uid) return;
    setLoadingReports(true);
    try {
      const res = await fetch(`/api/admin/reports?user_id=${uid}`);
      if (!res.ok) throw new Error('Failed to load reports');
      const json = await res.json();
      setReports(json.reports || json || []);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchReports(userId);
  }, [userId, fetchReports]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setMessage({ type: 'error', text: 'User ID is required' });
      return;
    }
    setGenerating(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, type: reportType }),
      });
      if (!res.ok) throw new Error('Failed to generate report');
      setMessage({ type: 'success', text: 'Report generated successfully' });
      fetchReports(userId);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to generate report' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Generate Report</h2>

          {message.text && (
            <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user UUID"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="general">General</option>
                <option value="screening">Screening</option>
                <option value="vaccination">Vaccination</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={generating}
              className="bg-sky-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-800 disabled:opacity-50"
            >
              {generating ? 'Generating…' : 'Generate Report'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Existing Reports</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user UUID to view reports"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 mb-4"
            />
          </div>

          {loadingReports ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-gray-400">No reports found for this user</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {reports.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">{r.type}</span>
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{r.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
