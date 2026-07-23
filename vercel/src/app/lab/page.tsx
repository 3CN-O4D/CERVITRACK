'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Kit {
  id: string;
  barcode: string;
  kitType: string;
  status: string;
  patientName?: string;
  collectionMethod?: string;
  result?: string;
  events: KitEvent[];
}

interface KitEvent {
  id: string;
  action: string;
  scannedBy: string;
  scannedByName: string;
  location?: string;
  notes?: string;
  timestamp: string;
}

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

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-700',
  PAIRED: 'bg-amber-100 text-amber-700',
  COLLECTED: 'bg-green-100 text-green-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  IN_LAB: 'bg-cyan-100 text-cyan-700',
  PROCESSED: 'bg-emerald-100 text-emerald-700',
};

const STATUS_BG: Record<string, string> = {
  IN_TRANSIT: 'bg-purple-50',
  IN_LAB: 'bg-cyan-50',
  COLLECTED: 'bg-green-50',
  PROCESSED: 'bg-emerald-50',
  REGISTERED: 'bg-blue-50',
  PAIRED: 'bg-amber-50',
};

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

  const [barcode, setBarcode] = useState('');
  const [scannedKit, setScannedKit] = useState<Kit | null>(null);
  const [kitLoading, setKitLoading] = useState(false);
  const [kitError, setKitError] = useState('');
  const [kitSuccess, setKitSuccess] = useState('');
  const [kitAction, setKitAction] = useState<'receive' | 'results' | null>(null);
  const [kitResult, setKitResult] = useState('');
  const [kitNotes, setKitNotes] = useState('');
  const [kitTab, setKitTab] = useState<'scan' | 'queue'>('scan');
  const [queueSearch, setQueueSearch] = useState('');
  const [queueSortKey, setQueueSortKey] = useState<'patient' | 'date' | 'type' | 'status'>('date');
  const [queueSortDir, setQueueSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const go = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', go);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', go); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => { fetchQueue(); }, [filter]);

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

  async function scanKit() {
    const code = barcode.trim();
    if (!code) return;
    setKitLoading(true);
    setKitError('');
    setKitSuccess('');
    setScannedKit(null);
    try {
      const res = await fetch(`/api/sample-kits/scan/${code}`);
      if (res.ok) {
        setScannedKit(await res.json());
      } else if (res.status === 404) {
        setKitError('Kit not found. Check the barcode.');
      } else {
        setKitError('Failed to scan barcode');
      }
    } catch { setKitError('Network error'); }
    finally { setKitLoading(false); }
  }

  async function handleKitReceive() {
    if (!scannedKit) return;
    setSubmitting(true);
    setKitError('');
    try {
      const res = await fetch('/api/sample-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'receive', barcode: scannedKit.barcode, receivedBy: 'lab_tech', receivedByName: 'Lab Technician', facilityId: 'lab', notes: kitNotes }),
      });
      if (res.ok) {
        setScannedKit(await res.json());
        setKitSuccess('Sample received at lab');
        setKitAction(null);
        setKitNotes('');
      } else {
        const err = await res.json();
        setKitError(err.message || 'Failed');
      }
    } catch { setKitError('Network error'); }
    finally { setSubmitting(false); }
  }

  async function handleKitResults() {
    if (!scannedKit || !kitResult) return;
    setSubmitting(true);
    setKitError('');
    try {
      const res = await fetch('/api/sample-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'results', barcode: scannedKit.barcode, technicianId: 'lab_tech', technicianName: 'Lab Technician', result: kitResult, notes: kitNotes, facilityId: 'lab' }),
      });
      if (res.ok) {
        setScannedKit(await res.json());
        setKitSuccess('Results entered');
        setKitAction(null);
        setKitResult('');
        setKitNotes('');
      } else {
        const err = await res.json();
        setKitError(err.message || 'Failed');
      }
    } catch { setKitError('Network error'); }
    finally { setSubmitting(false); }
  }

  async function submitResult() {
    if (!selected || !result) return;
    setSubmitting(true);
    try {
      const payload = { screeningId: selected.id, result, notes, offlineId: isOnline ? undefined : `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`, clientTimestamp: new Date().toISOString() };
      if (isOnline) {
        const res = await fetch('/api/lab-results/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Failed to submit result');
        localStorage.setItem('lab_synced', String(Number(localStorage.getItem('lab_synced') || 0) + 1));
      } else {
        const queue = JSON.parse(localStorage.getItem('lab_offlineQueue') || '[]');
        queue.push(payload);
        localStorage.setItem('lab_offlineQueue', JSON.stringify(queue));
        localStorage.setItem('lab_pending', String(Number(localStorage.getItem('lab_pending') || 0) + 1));
      }
      setSelected(null);
      setResult('');
      setNotes('');
      fetchQueue();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally { setSubmitting(false); }
  }

  async function syncOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem('lab_offlineQueue') || '[]');
    if (queue.length === 0) return;
    try {
      const res = await fetch('/api/screenings/sync-batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batchId: `batch_${Date.now()}`, items: queue }) });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      localStorage.removeItem('lab_offlineQueue');
      localStorage.setItem('lab_pending', '0');
      localStorage.setItem('lab_synced', String(Number(localStorage.getItem('lab_synced') || 0) + data.synced));
      localStorage.setItem('lab_lastSync', new Date().toISOString());
      fetchQueue();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Sync failed'); }
  }

  const resultOptions = ['NORMAL', 'POSITIVE', 'INCONCLUSIVE', 'ABNORMAL', 'UNSATISFACTORY'];
  const typeLabels: Record<string, string> = { VIA: 'VIA', PAP_SMEAR: 'Pap Smear', HPV_DNA: 'HPV DNA', COLPOSCOPY: 'Colposcopy' };

  const filteredQueue = (() => {
    let list = screenings;
    if (queueSearch) {
      const q = queueSearch.toLowerCase();
      list = list.filter(s => `${s.patient?.firstName} ${s.patient?.lastName}`.toLowerCase().includes(q) || s.patient?.nationalIdOrPassport?.toLowerCase().includes(q) || s.type?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (queueSortKey === 'patient') {
        const av = `${a.patient?.firstName} ${a.patient?.lastName}`;
        const bv = `${b.patient?.firstName} ${b.patient?.lastName}`;
        return queueSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (queueSortKey === 'date') {
        return queueSortDir === 'asc' ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      const av = a[queueSortKey] || '';
      const bv = b[queueSortKey] || '';
      return queueSortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  })();

  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="flex gap-2 mb-6">
          <button onClick={() => setKitTab('scan')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${kitTab === 'scan' ? 'bg-sky-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Scan Kit Barcode
          </button>
          <button onClick={() => setKitTab('queue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${kitTab === 'queue' ? 'bg-sky-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Lab Queue
          </button>
        </div>

        {kitTab === 'scan' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Sample Kit</h2>
              <div className="flex gap-2">
                <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Enter or scan kit barcode..."
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sky-500"
                  onKeyDown={(e) => e.key === 'Enter' && scanKit()} />
                <button onClick={scanKit} disabled={!barcode.trim() || kitLoading}
                  className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  {kitLoading ? 'Scanning...' : 'Scan'}
                </button>
              </div>
              <p className="text-gray-400 text-xs mt-2">Scan the barcode on the sample kit</p>
            </div>

            {kitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{kitError}</div>}
            {kitSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{kitSuccess}</div>}

            {scannedKit && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className={`px-6 py-4 ${STATUS_BG[scannedKit.status] || 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900 font-mono">{scannedKit.barcode}</span>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[scannedKit.status] || 'bg-gray-100 text-gray-700'}`}>
                          {scannedKit.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{scannedKit.kitType} · {scannedKit.patientName || 'Unassigned'}</div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {scannedKit.status === 'IN_TRANSIT' && !kitAction && (
                      <button onClick={() => setKitAction('receive')}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-medium transition-colors">
                        Receive Sample at Lab
                      </button>
                    )}
                    {scannedKit.status === 'COLLECTED' && !kitAction && (
                      <button onClick={() => setKitAction('receive')}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-medium transition-colors">
                        Mark as Received at Lab
                      </button>
                    )}
                    {scannedKit.status === 'IN_LAB' && !kitAction && (
                      <button onClick={() => setKitAction('results')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors">
                        Enter Lab Results
                      </button>
                    )}
                    {scannedKit.status === 'PROCESSED' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                        <p className="text-emerald-700 font-bold">Results: {scannedKit.result}</p>
                        <p className="text-gray-500 text-sm mt-1">This kit has been processed</p>
                      </div>
                    )}
                    {scannedKit.status === 'REGISTERED' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p className="text-blue-700 font-medium">Kit registered but not yet paired to a patient</p>
                      </div>
                    )}
                    {scannedKit.status === 'PAIRED' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                        <p className="text-amber-700 font-medium">Kit paired to {scannedKit.patientName}</p>
                        <p className="text-gray-500 text-sm mt-1">Waiting for sample collection</p>
                      </div>
                    )}
                  </div>

                  {kitAction === 'receive' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                      <textarea value={kitNotes} onChange={(e) => setKitNotes(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                        rows={2} placeholder="Condition of sample, arrival notes..." />
                      <div className="flex gap-3">
                        <button onClick={() => { setKitAction(null); setKitNotes(''); }}
                          className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100">Cancel</button>
                        <button onClick={handleKitReceive} disabled={submitting}
                          className="flex-1 bg-cyan-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50">
                          {submitting ? 'Processing...' : 'Confirm Receipt'}
                        </button>
                      </div>
                    </div>
                  )}

                  {kitAction === 'results' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Result</label>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {resultOptions.map((r) => (
                          <button key={r} onClick={() => setKitResult(r)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${kitResult === r ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                      <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                      <textarea value={kitNotes} onChange={(e) => setKitNotes(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                        rows={3} placeholder="Quality notes, specimen observations..." />
                      <div className="flex gap-3">
                        <button onClick={() => { setKitAction(null); setKitResult(''); setKitNotes(''); }}
                          className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100">Cancel</button>
                        <button onClick={handleKitResults} disabled={!kitResult || submitting}
                          className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                          {submitting ? 'Saving...' : 'Submit Results'}
                        </button>
                      </div>
                    </div>
                  )}

                  {scannedKit.events && scannedKit.events.length > 0 && (
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-3">Kit History</h4>
                      <div className="space-y-2">
                        {scannedKit.events.map((evt) => (
                          <div key={evt.id} className="flex gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                              evt.action === 'PROCESSED' ? 'bg-emerald-500' :
                              evt.action === 'IN_LAB' ? 'bg-cyan-500' :
                              evt.action === 'IN_TRANSIT' ? 'bg-purple-500' :
                              evt.action === 'COLLECTED' ? 'bg-green-500' : 'bg-sky-500'
                            }`} />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{evt.action}</div>
                              <div className="text-xs text-gray-500">{evt.scannedByName} · {new Date(evt.timestamp).toLocaleString()}</div>
                              {evt.notes && <div className="text-xs text-gray-400 mt-1">{evt.notes}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {kitTab === 'queue' && (
          <>
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

            <div className="flex gap-2 mb-6">
              {['PENDING', 'COMPLETED', 'ALL'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-sky-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {f === 'PENDING' ? 'Pending Review' : f === 'COMPLETED' ? 'Completed' : 'All'}
                </button>
              ))}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

            <div className="mb-6">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input type="text" value={queueSearch} onChange={(e) => setQueueSearch(e.target.value)}
                  placeholder="Search patient name, ID, or type…"
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-sky-500" />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading lab queue...</div>
            ) : filteredQueue.length === 0 ? (
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
                      {([['patient', 'Patient'], ['type', 'Type'], ['date', 'Date'], ['status', 'Status']] as [typeof queueSortKey, string][]).map(([key, label]) => (
                        <th key={key} className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => { if (queueSortKey === key) setQueueSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setQueueSortKey(key); setQueueSortDir('asc'); } }}>
                          {label} {queueSortKey === key ? (queueSortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </th>
                      ))}
                      <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueue.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-sm text-gray-900">{s.patient.firstName} {s.patient.lastName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                            {typeLabels[s.type] || s.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                            s.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                          }`}>{s.result || s.status}</span>
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
          </>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Enter Lab Result</h3>
            <p className="text-sm text-gray-500 mb-6">{selected.patient.firstName} {selected.patient.lastName} — {typeLabels[selected.type] || selected.type}</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {resultOptions.map((r) => (
                <button key={r} onClick={() => setResult(r)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${result === r ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
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
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
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
