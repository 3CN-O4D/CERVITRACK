'use client';

import { useState, useEffect } from 'react';

interface LabResult {
  id: string;
  patient_name: string;
  result: string;
  notes: string;
  created_at: string;
}

export default function AdminLabResultsPage() {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/admin/lab-results');
      if (!res.ok) throw new Error('Failed to load lab results');
      const json = await res.json();
      setResults(json.results || json || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load lab results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Lab Results</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Patient</th>
                <th className="px-6 py-3 font-medium">Result</th>
                <th className="px-6 py-3 font-medium">Notes</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No lab results</td></tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{r.patient_name}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.result?.toLowerCase().includes('positive') ? 'bg-red-50 text-red-700' :
                        r.result?.toLowerCase().includes('negative') ? 'bg-emerald-50 text-emerald-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {r.result}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{r.notes || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
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
