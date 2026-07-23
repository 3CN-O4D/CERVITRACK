'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BarcodeScanner from '@/components/BarcodeScanner';

interface Batch {
  id: string;
  batch_code: string;
  lab_tech_id: string;
  lab_tech_name: string;
  status: string;
  sample_count: number;
  processed_count: number;
  facility_id: string;
  notes: string;
  submitted_at: string | null;
  created_at: string;
  items: BatchItem[];
}

interface BatchItem {
  id: string;
  batch_id: string;
  kit_barcode: string;
  patient_id: string | null;
  patient_name: string;
  status: string;
  result: string;
  result_notes: string;
  processed_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  receiving: 'bg-amber-100 text-amber-700',
  testing: 'bg-violet-100 text-violet-700',
  submitted: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-gray-100 text-gray-600',
  received: 'bg-blue-100 text-blue-700',
  tested: 'bg-emerald-100 text-emerald-700',
};

const RESULT_OPTIONS = ['NORMAL', 'POSITIVE', 'INCONCLUSIVE', 'ABNORMAL', 'UNSATISFACTORY'];

export default function LabDashboard() {
  const [view, setView] = useState<'dashboard' | 'batch'>('dashboard');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [scanBarcode, setScanBarcode] = useState('');
  const [scanLoading, setScanLoading] = useState(false);

  const [editingItem, setEditingItem] = useState<BatchItem | null>(null);
  const [itemResult, setItemResult] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, statsRes] = await Promise.all([
        fetch('/api/batches'),
        fetch('/api/batches?stats=1'),
      ]);
      if (batchRes.ok) {
        const data = await batchRes.json();
        setBatches(data.data || []);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch { setError('Failed to load batches'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  async function fetchBatch(id: string) {
    try {
      const res = await fetch(`/api/batches/${id}`);
      if (res.ok) {
        const batch = await res.json();
        setActiveBatch(batch);
        setView('batch');
      }
    } catch { setError('Failed to load batch'); }
  }

  async function createBatch() {
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lab_tech_id: 'lab_tech_1', lab_tech_name: 'Lab Technician' }),
      });
      if (res.ok) {
        const batch = await res.json();
        setSuccess(`Batch ${batch.batch_code} created`);
        fetchBatches();
        fetchBatch(batch.id);
      }
    } catch { setError('Failed to create batch'); }
  }

  async function scanIntoBatch() {
    if (!scanBarcode.trim() || !activeBatch) return;
    setScanLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/batches/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_code: activeBatch.batch_code, kit_barcode: scanBarcode.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`${data.patient_name || scanBarcode} added to batch`);
        setScanBarcode('');
        fetchBatch(activeBatch.id);
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to add sample');
      }
    } catch { setError('Network error'); }
    finally { setScanLoading(false); }
  }

  async function recordResult() {
    if (!activeBatch || !editingItem || !itemResult) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/batches/${activeBatch.id}/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: itemResult, result_notes: itemNotes }),
      });
      if (res.ok) {
        setSuccess('Result recorded');
        setEditingItem(null);
        setItemResult('');
        setItemNotes('');
        fetchBatch(activeBatch.id);
      } else {
        const err = await res.json();
        setError(err.message || 'Failed');
      }
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  }

  async function startTesting() {
    if (!activeBatch) return;
    try {
      const res = await fetch(`/api/batches/${activeBatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_testing' }),
      });
      if (res.ok) {
        setSuccess('Batch moved to testing');
        fetchBatch(activeBatch.id);
      } else {
        const err = await res.json();
        setError(err.message || 'Failed');
      }
    } catch { setError('Network error'); }
  }

  async function submitBatch() {
    if (!activeBatch) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/batches/${activeBatch.id}/submit`, {
        method: 'POST',
      });
      if (res.ok) {
        setSuccess('Batch submitted successfully');
        fetchBatch(activeBatch.id);
        fetchBatches();
        setTimeout(() => { setView('dashboard'); setActiveBatch(null); }, 1500);
      } else {
        const err = await res.json();
        setError(err.message || 'Failed');
      }
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  }

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  }

  return (
    <div className="min-h-screen bg-violet-50">
      <header className="bg-violet-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold">CerviTrack</Link>
            <span className="text-violet-400">|</span>
            <span className="text-sm font-medium text-violet-200">Lab Technician</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
              <span className="text-xs font-medium text-violet-200">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            {installPrompt && (
              <button onClick={handleInstall}
                className="bg-violet-700 hover:bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-500">
                Install App
              </button>
            )}
            <Link href="/" className="text-sm text-violet-200 hover:text-white">Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm">{success}</div>}

        {view === 'dashboard' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Lab Dashboard</h1>
              <button onClick={createBatch}
                className="bg-violet-700 hover:bg-violet-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                + New Batch
              </button>
            </div>

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-violet-600">{stats.total}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Batches</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">{stats.receiving}</div>
                  <div className="text-xs text-gray-500 mt-1">Receiving</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-violet-600">{stats.testing}</div>
                  <div className="text-xs text-gray-500 mt-1">Testing</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{stats.submitted}</div>
                  <div className="text-xs text-gray-500 mt-1">Submitted</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalSamples}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Samples</div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No batches yet</p>
                <p className="text-sm text-gray-400 mt-1">Create a batch to start receiving samples</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Batch Code</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Samples</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Progress</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Created</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{b.batch_code}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-700'}`}>
                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{b.sample_count}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div className="bg-violet-600 h-2 rounded-full transition-all"
                                style={{ width: `${b.sample_count > 0 ? (b.processed_count / b.sample_count) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{b.processed_count}/{b.sample_count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => fetchBatch(b.id)}
                            className="text-violet-600 text-sm font-medium hover:text-violet-800">Open</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {view === 'batch' && activeBatch && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => { setView('dashboard'); setActiveBatch(null); fetchBatches(); }}
                className="text-violet-600 hover:text-violet-800 text-sm font-medium">&larr; Back</button>
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{activeBatch.batch_code}</h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[activeBatch.status] || ''}`}>
                {activeBatch.status.charAt(0).toUpperCase() + activeBatch.status.slice(1)}
              </span>
              <span className="text-sm text-gray-500 ml-auto">
                {activeBatch.processed_count}/{activeBatch.sample_count} tested
              </span>
            </div>

            {activeBatch.status === 'receiving' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Samples to Batch</h2>
                <div className="flex gap-2">
                  <input type="text" value={scanBarcode} onChange={(e) => setScanBarcode(e.target.value)}
                    placeholder="Scan or enter kit barcode..."
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && scanIntoBatch()} />
                  <button onClick={() => setShowCamera(true)}
                    className="bg-violet-100 hover:bg-violet-200 text-violet-700 px-4 py-3 rounded-lg font-medium transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                  </button>
                  <button onClick={scanIntoBatch} disabled={!scanBarcode.trim() || scanLoading}
                    className="bg-violet-700 hover:bg-violet-800 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    {scanLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
                <p className="text-gray-400 text-xs mt-2">Scan barcodes or type manually. Kit must be IN_TRANSIT or COLLECTED.</p>
              </div>
            )}

            {activeBatch.items.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Samples ({activeBatch.items.length})</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Barcode</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Patient</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Result</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBatch.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3 font-mono text-sm text-gray-900">{item.kit_barcode}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{item.patient_name || '—'}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || ''}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{item.result || '—'}</td>
                        <td className="px-6 py-3 text-right">
                          {activeBatch.status === 'testing' && item.status !== 'tested' && (
                            <button onClick={() => { setEditingItem(item); setItemResult(''); setItemNotes(''); }}
                              className="bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-violet-700">
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

            {activeBatch.status === 'receiving' && activeBatch.items.length > 0 && (
              <button onClick={startTesting}
                className="w-full bg-violet-700 hover:bg-violet-800 text-white py-3 rounded-lg font-medium transition-colors">
                Start Testing ({activeBatch.items.length} samples)
              </button>
            )}

            {activeBatch.status === 'testing' && activeBatch.processed_count === activeBatch.sample_count && (
              <button onClick={submitBatch} disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors">
                {submitting ? 'Submitting...' : 'Submit Batch'}
              </button>
            )}
          </>
        )}
      </main>

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Enter Lab Result</h3>
            <p className="text-sm text-gray-500 mb-4 font-mono">{editingItem.kit_barcode} &middot; {editingItem.patient_name || 'Unknown'}</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {RESULT_OPTIONS.map((r) => (
                <button key={r} onClick={() => setItemResult(r)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${itemResult === r ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                  {r}
                </button>
              ))}
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea value={itemNotes} onChange={(e) => setItemNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-6 resize-none"
              rows={3} placeholder="Specimen observations..." />
            <div className="flex gap-3">
              <button onClick={() => { setEditingItem(null); setItemResult(''); setItemNotes(''); }}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={recordResult} disabled={!itemResult || submitting}
                className="flex-1 bg-violet-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-800 disabled:opacity-50">
                {submitting ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Scan Barcode</h3>
            <BarcodeScanner
              onScan={(code) => { setScanBarcode(code); setShowCamera(false); }}
              onClose={() => setShowCamera(false)}
            />
            <button onClick={() => setShowCamera(false)}
              className="w-full border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 mt-4">
              Close Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
