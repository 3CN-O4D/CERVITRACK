'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Screening {
  id: string;
  patientId: string;
  patient: { firstName: string; lastName: string; nationalIdOrPassport: string };
  type: string;
  status: string;
  result: string | null;
  createdAt: string;
  facilityId: string;
}

interface SyncStatus {
  pending: number;
  synced: number;
  failed: number;
  lastSync: string | null;
}

export default function LabDashboard() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ pending: 0, synced: 0, failed: 0, lastSync: null });
  const [isOnline, setIsOnline] = useState(true);
  const [selected, setSelected] = useState<Screening | null>(null);
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  async function fetchQueue() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/lab-results?status=${filter}`);
      if (!res.ok) throw new Error('Failed to fetch lab queue');
      const data = await res.json();
      setScreenings(data.screenings || data.data || []);
      setSyncStatus({
        pending: Number(localStorage.getItem('lab_pending') || 0),
        synced: Number(localStorage.getItem('lab_synced') || 0),
        failed: Number(localStorage.getItem('lab_failed') || 0),
        lastSync: localStorage.getItem('lab_lastSync'),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }

  async function submitResult() {
    if (!selected || !result) return;
    setSubmitting(true);
    try {
      const payload = {
        screeningId: selected.id,
        result,
        notes,
        offlineId: isOnline ? undefined : `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        clientTimestamp: new Date().toISOString(),
      };

      if (isOnline) {
        const res = await fetch('/api/lab-results/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to submit result');
        const synced = Number(localStorage.getItem('lab_synced') || 0);
        localStorage.setItem('lab_synced', String(synced + 1));
      } else {
        const queue = JSON.parse(localStorage.getItem('lab_offlineQueue') || '[]');
        queue.push(payload);
        localStorage.setItem('lab_offlineQueue', JSON.stringify(queue));
        const pending = Number(localStorage.getItem('lab_pending') || 0);
        localStorage.setItem('lab_pending', String(pending + 1));
      }

      setSelected(null);
      setResult('');
      setNotes('');
      fetchQueue();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function syncOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem('lab_offlineQueue') || '[]');
    if (queue.length === 0) return;

    try {
      const res = await fetch('/api/screenings/sync-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: `batch_${Date.now()}`, items: queue }),
      });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      localStorage.removeItem('lab_offlineQueue');
      localStorage.setItem('lab_pending', '0');
      localStorage.setItem('lab_synced', String(Number(localStorage.getItem('lab_synced') || 0) + data.synced));
      localStorage.setItem('lab_lastSync', new Date().toISOString());
      fetchQueue();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  }

  const resultOptions = ['NORMAL', 'POSITIVE', 'INCONCLUSIVE', 'ABNORMAL', 'UNSATISFACTORY'];
  const typeLabels: Record<string, string> = { VIA: 'VIA', PAP_SMEAR: 'Pap Smear', HPV_DNA: 'HPV DNA', COLPOSCOPY: 'Colposcopy' };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-sky-700">CerviTrack</Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-600">Lab Technician PWA</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span className="text-xs font-medium text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            {syncStatus.pending > 0 && (
              <button onClick={syncOfflineQueue} disabled={!isOnline}
                className="bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Sync {syncStatus.pending} queued
              </button>
            )}
            <Link href="/" className="text-sm text-gray-500 hover:text-sky-700">Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Sync Status Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-violet-600">{syncStatus.pending}</div>
            <div className="text-xs text-gray-500 mt-1">Pending Sync</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{syncStatus.synced}</div>
            <div className="text-xs text-gray-500 mt-1">Synced Today</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{syncStatus.failed}</div>
            <div className="text-xs text-gray-500 mt-1">Failed</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-sm font-semibold text-gray-700">{syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : 'Never'}</div>
            <div className="text-xs text-gray-500 mt-1">Last Sync</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['PENDING', 'COMPLETED', 'ALL'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-sky-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {f === 'PENDING' ? 'Pending Review' : f === 'COMPLETED' ? 'Completed' : 'All'}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        {/* Queue Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading lab queue...</div>
        ) : screenings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Queue is empty</p>
            <p className="text-sm text-gray-400 mt-1">{filter === 'PENDING' ? 'No screenings awaiting results' : 'No records found'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Patient</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {screenings.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-gray-900">{s.patient.firstName} {s.patient.lastName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{s.patient.nationalIdOrPassport}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                        {typeLabels[s.type] || s.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        s.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {s.result || s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.status === 'PENDING' && (
                        <button onClick={() => { setSelected(s); setResult(''); setNotes(''); }}
                          className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700">
                          Enter Result
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Result Entry Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Enter Lab Result</h3>
            <p className="text-sm text-gray-500 mb-6">
              {selected.patient.firstName} {selected.patient.lastName} — {typeLabels[selected.type] || selected.type}
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {resultOptions.map((r) => (
                <button key={r} onClick={() => setResult(r)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    result === r ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {r}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-6 resize-none"
              rows={3} placeholder="Quality notes, specimen observations..." />

            <div className="flex gap-3">
              <button onClick={() => setSelected(null)}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={submitResult} disabled={!result || submitting}
                className="flex-1 bg-sky-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-800 disabled:opacity-50">
                {submitting ? 'Submitting...' : isOnline ? 'Submit Result' : 'Queue for Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
