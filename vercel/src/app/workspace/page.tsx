'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BarcodeScanner from '@/components/BarcodeScanner';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  nationalIdOrPassport: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  county: string;
  facilityId: string;
}

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
  type: string;
  status: string;
  result: string | null;
  findings: string | null;
  createdAt: string;
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
  IN_TRANSIT: 'bg-purple-50', IN_LAB: 'bg-cyan-50', COLLECTED: 'bg-green-50',
  PROCESSED: 'bg-emerald-50', REGISTERED: 'bg-blue-50', PAIRED: 'bg-amber-50',
};

export default function WorkspaceDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [tab, setTab] = useState<'patients' | 'kits'>('patients');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSortKey, setPatientSortKey] = useState<'name' | 'county' | 'nationalId'>('name');
  const [patientSortDir, setPatientSortDir] = useState<'asc' | 'desc'>('asc');
  const [kitPatientSearch, setKitPatientSearch] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Kit state
  const [barcode, setBarcode] = useState('');
  const [scannedKit, setScannedKit] = useState<Kit | null>(null);
  const [kitLoading, setKitLoading] = useState(false);
  const [kitError, setKitError] = useState('');
  const [kitSuccess, setKitSuccess] = useState('');
  const [kitAction, setKitAction] = useState<'pair' | 'collect' | 'transit' | null>(null);
  const [kitNotes, setKitNotes] = useState('');
  const [kitToLocation, setKitToLocation] = useState('');
  const [selectedKitPatient, setSelectedKitPatient] = useState('');

  useEffect(() => {
    fetchData();
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [patientsRes, screeningsRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/screenings'),
      ]);
      if (patientsRes.ok) {
        const pData = await patientsRes.json();
        setPatients(pData.patients || pData.data || []);
      }
      if (screeningsRes.ok) {
        const sData = await screeningsRes.json();
        setScreenings(sData.screenings || sData.data || []);
      }
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  }

  const filteredPatients = useMemo(() => {
    let list = patients;
    if (patientSearch) {
      const q = patientSearch.toLowerCase();
      list = list.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.nationalIdOrPassport?.toLowerCase().includes(q) ||
        p.county?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av = '', bv = '';
      if (patientSortKey === 'name') { av = `${a.firstName} ${a.lastName}`; bv = `${b.firstName} ${b.lastName}`; }
      else if (patientSortKey === 'county') { av = a.county || ''; bv = b.county || ''; }
      else { av = a.nationalIdOrPassport || ''; bv = b.nationalIdOrPassport || ''; }
      return patientSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [patients, patientSearch, patientSortKey, patientSortDir]);

  const filteredKitPatients = useMemo(() => {
    if (!kitPatientSearch) return patients;
    const q = kitPatientSearch.toLowerCase();
    return patients.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.nationalIdOrPassport?.toLowerCase().includes(q));
  }, [patients, kitPatientSearch]);

  async function scanKit() {
    const code = barcode.trim();
    if (!code) return;
    setKitLoading(true);
    setKitError('');
    setKitSuccess('');
    setScannedKit(null);
    try {
      const res = await fetch(`/api/sample-kits/scan/${code}`);
      if (res.ok) { setScannedKit(await res.json()); }
      else if (res.status === 404) { setKitError('Kit not found. Check the barcode.'); }
      else { setKitError('Failed to scan barcode'); }
    } catch { setKitError('Network error'); }
    finally { setKitLoading(false); }
  }

  async function scanKitWithCode(code: string) {
    setBarcode(code);
    setKitLoading(true);
    setKitError('');
    setKitSuccess('');
    setScannedKit(null);
    try {
      const res = await fetch(`/api/sample-kits/scan/${code}`);
      if (res.ok) { setScannedKit(await res.json()); }
      else if (res.status === 404) { setKitError('Kit not found. Check the barcode.'); }
      else { setKitError('Failed to scan barcode'); }
    } catch { setKitError('Network error'); }
    finally { setKitLoading(false); }
  }

  async function handleKitPair() {
    if (!scannedKit || !selectedKitPatient) return;
    setKitLoading(true);
    setKitError('');
    try {
      const patient = patients.find(p => p.id === selectedKitPatient);
      const res = await fetch('/api/sample-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pair', barcode: scannedKit.barcode, patientId: selectedKitPatient,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
          pairedBy: 'clinician', pairedByName: 'Clinician',
        }),
      });
      if (res.ok) { setScannedKit(await res.json()); setKitSuccess('Kit paired successfully'); setKitAction(null); setSelectedKitPatient(''); }
      else { const err = await res.json(); setKitError(err.message || 'Failed'); }
    } catch { setKitError('Network error'); }
    finally { setKitLoading(false); }
  }

  async function handleKitCollect(method: string) {
    if (!scannedKit) return;
    setKitLoading(true);
    setKitError('');
    try {
      const res = await fetch('/api/sample-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'collect', barcode: scannedKit.barcode, collectedBy: 'clinician', collectedByName: 'Clinician',
          collectionMethod: method, facilityId: 'clinic', notes: kitNotes,
        }),
      });
      if (res.ok) { setScannedKit(await res.json()); setKitSuccess('Collection confirmed'); setKitAction(null); setKitNotes(''); }
      else { const err = await res.json(); setKitError(err.message || 'Failed'); }
    } catch { setKitError('Network error'); }
    finally { setKitLoading(false); }
  }

  async function handleKitTransit() {
    if (!scannedKit || !kitToLocation) return;
    setKitLoading(true);
    setKitError('');
    try {
      const res = await fetch('/api/sample-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transit', barcode: scannedKit.barcode, scannedBy: 'clinician', scannedByName: 'Clinician',
          fromLocation: 'clinic', toLocation: kitToLocation, facilityId: 'clinic', notes: kitNotes,
        }),
      });
      if (res.ok) { setScannedKit(await res.json()); setKitSuccess('Kit marked in transit'); setKitAction(null); setKitToLocation(''); setKitNotes(''); }
      else { const err = await res.json(); setKitError(err.message || 'Failed'); }
    } catch { setKitError('Network error'); }
    finally { setKitLoading(false); }
  }

  return (
    <div className="min-h-screen bg-teal-50">
      <header className="bg-teal-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold">CerviTrack</Link>
            <span className="text-teal-400">|</span>
            <span className="text-sm font-medium text-teal-200">Clinician Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            {installPrompt && (
              <button onClick={async () => { installPrompt.prompt(); const { outcome } = await installPrompt.userChoice; if (outcome === 'accepted') setInstallPrompt(null); }}
                className="bg-teal-700 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-teal-500">
                Install App
              </button>
            )}
            <Link href="/" className="text-sm text-teal-200 hover:text-white">Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('patients')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'patients' ? 'bg-teal-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Patients
          </button>
          <button onClick={() => setTab('kits')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'kits' ? 'bg-teal-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Kit Scanner
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

        {tab === 'patients' && (
          loading ? (
            <div className="text-center py-20 text-gray-400">Loading patients...</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Patient List ({filteredPatients.length})</h2>
                  <div className="flex gap-1">
                    {([['name', 'Name'], ['county', 'County'], ['nationalId', 'ID']] as [typeof patientSortKey, string][]).map(([key, label]) => (
                      <button key={key} onClick={() => { if (patientSortKey === key) setPatientSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setPatientSortKey(key); setPatientSortDir('asc'); } }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${patientSortKey === key ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {label} {patientSortKey === key ? (patientSortDir === 'asc' ? '↑' : '↓') : ''}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input type="text" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search by name, ID, county, or phone…"
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-sky-500" />
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {filteredPatients.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400 text-sm">No patients found</div>
                ) : filteredPatients.map((p) => (
                  <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{p.firstName} {p.lastName}</div>
                      <div className="text-xs text-gray-500">{p.nationalIdOrPassport} · {p.county}</div>
                    </div>
                    <button onClick={() => setSelectedPatient(p)}
                      className="text-sky-600 text-sm font-medium hover:text-sky-700">View</button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {tab === 'kits' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Kit Barcode</h2>
              <div className="flex gap-2">
                <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Enter or scan kit barcode..."
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && scanKit()} />
                <button onClick={() => setShowCamera(true)}
                  className="bg-teal-100 hover:bg-teal-200 text-teal-700 px-4 py-3 rounded-lg font-medium transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </button>
                <button onClick={scanKit} disabled={!barcode.trim() || kitLoading}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  {kitLoading ? 'Scanning...' : 'Scan'}
                </button>
              </div>
              <p className="text-gray-400 text-xs mt-2">Scan the kit barcode to pair, collect, or track samples</p>
            </div>

            {kitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{kitError}</div>}
            {kitSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{kitSuccess}</div>}

            {scannedKit && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className={`px-6 py-4 ${STATUS_BG[scannedKit.status] || 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 font-mono">{scannedKit.barcode}</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[scannedKit.status] || 'bg-gray-100 text-gray-700'}`}>
                      {scannedKit.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{scannedKit.kitType} · {scannedKit.patientName || 'Unassigned'}</div>
                </div>

                <div className="p-6 space-y-3">
                  {scannedKit.status === 'REGISTERED' && !kitAction && (
                    <button onClick={() => setKitAction('pair')}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium transition-colors">
                      Pair to Patient
                    </button>
                  )}
                  {scannedKit.status === 'PAIRED' && !kitAction && (
                    <button onClick={() => setKitAction('collect')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                      Confirm Collection
                    </button>
                  )}
                  {(scannedKit.status === 'PAIRED' || scannedKit.status === 'COLLECTED') && !kitAction && (
                    <button onClick={() => setKitAction('transit')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors">
                      Send to Lab / Collection Point
                    </button>
                  )}
                  {scannedKit.status === 'PROCESSED' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                      <p className="text-emerald-700 font-bold">Results: {scannedKit.result}</p>
                    </div>
                  )}

                  {kitAction === 'pair' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Select Patient</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input type="text" value={kitPatientSearch} onChange={(e) => setKitPatientSearch(e.target.value)}
                          placeholder="Search patient by name or ID…"
                          className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-sky-500" />
                      </div>
                      <select value={selectedKitPatient} onChange={(e) => setSelectedKitPatient(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        <option value="">Choose a patient...</option>
                        {filteredKitPatients.map((p) => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.nationalIdOrPassport}</option>
                        ))}
                      </select>
                      <div className="flex gap-3">
                        <button onClick={() => { setKitAction(null); setSelectedKitPatient(''); }}
                          className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100">Cancel</button>
                        <button onClick={handleKitPair} disabled={!selectedKitPatient || kitLoading}
                          className="flex-1 bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
                          {kitLoading ? 'Pairing...' : 'Pair Kit'}
                        </button>
                      </div>
                    </div>
                  )}

                  {kitAction === 'collect' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Collection Method</label>
                      <div className="space-y-2">
                        {[{ id: 'HPV_CLINICIAN', label: 'Clinician-Collected Cervical Swab' },
                          { id: 'HPV_SELF', label: 'Supervised Self-Collection' },
                          { id: 'VIA', label: 'VIA (Visual Inspection)' }].map((m) => (
                          <button key={m.id} onClick={() => handleKitCollect(m.id)}
                            className="w-full text-left bg-white hover:bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm font-medium text-gray-700 transition-colors">
                            {m.label}
                          </button>
                        ))}
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mt-2">Notes (optional)</label>
                      <textarea value={kitNotes} onChange={(e) => setKitNotes(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} placeholder="Collection notes..." />
                      <button onClick={() => { setKitAction(null); setKitNotes(''); }}
                        className="w-full text-gray-500 hover:text-gray-700 text-sm py-2">Cancel</button>
                    </div>
                  )}

                  {kitAction === 'transit' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Destination</label>
                      <input type="text" value={kitToLocation} onChange={(e) => setKitToLocation(e.target.value)}
                        placeholder="e.g., County Referral Lab, Collection Point..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                      <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                      <textarea value={kitNotes} onChange={(e) => setKitNotes(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} placeholder="Transit notes..." />
                      <div className="flex gap-3">
                        <button onClick={() => { setKitAction(null); setKitToLocation(''); setKitNotes(''); }}
                          className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100">Cancel</button>
                        <button onClick={handleKitTransit} disabled={!kitToLocation || kitLoading}
                          className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                          {kitLoading ? 'Processing...' : 'Send Kit'}
                        </button>
                      </div>
                    </div>
                  )}

                  {scannedKit.events && scannedKit.events.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
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
      </main>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
            <p className="text-sm text-gray-500 mb-4">ID: {selectedPatient.nationalIdOrPassport} · {selectedPatient.county}</p>
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-gray-900">{selectedPatient.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">DOB</span><span className="text-gray-900">{selectedPatient.dateOfBirth}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="text-gray-900">{selectedPatient.gender}</span></div>
            </div>
            <button onClick={() => setSelectedPatient(null)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium">Close</button>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Scan Barcode</h3>
            <BarcodeScanner
              onScan={(code) => { setBarcode(code); setShowCamera(false); scanKitWithCode(code); }}
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
