'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ScheduledAction {
  id: string;
  patient_id: string;
  patient_name: string;
  action: string;
  date: string;
  completed: boolean;
}

export default function ProviderSchedulePage() {
  const router = useRouter();
  const [actions, setActions] = useState<ScheduledAction[]>([]);
  const [loading, setLoading] = useState(true);

  const [patientId, setPatientId] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState({ type: '' as 'success' | 'error' | '', text: '' });

  useEffect(() => {
    const stored = localStorage.getItem('provider');
    if (!stored) { router.push('/provider/login'); return; }
    fetchActions();
  }, [router]);

  const fetchActions = async () => {
    try {
      const res = await fetch('/api/scheduled-actions');
      if (res.ok) {
        const json = await res.json();
        setActions(json.actions || json || []);
      }
    } catch {
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !actionDate || !actionDesc) {
      setResult({ type: 'error', text: 'All fields are required' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/scheduled-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, date: actionDate, action: actionDesc }),
      });
      if (!res.ok) throw new Error('Failed to create');
      setResult({ type: 'success', text: 'Action scheduled' });
      setPatientId('');
      setActionDate('');
      setActionDesc('');
      fetchActions();
      setTimeout(() => setResult({ type: '', text: '' }), 3000);
    } catch (err: unknown) {
      setResult({ type: 'error', text: err instanceof Error ? err.message : 'Failed to schedule' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create Scheduled Action</h2>

          {result.text && (
            <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${
              result.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {result.text}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter patient UUID"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <input
                type="text"
                value={actionDesc}
                onChange={(e) => setActionDesc(e.target.value)}
                placeholder="e.g. Follow-up screening"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-sky-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-800 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Schedule Action'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Upcoming Actions</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : actions.length === 0 ? (
            <p className="text-sm text-gray-400">No scheduled actions</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {actions.map((a) => (
                <div key={a.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.patient_name || a.patient_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString()}</p>
                      {a.completed && (
                        <span className="text-xs text-emerald-600 font-medium">Completed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
