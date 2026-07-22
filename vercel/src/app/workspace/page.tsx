'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface Screening {
  id: string;
  patientId: string;
  type: string;
  status: string;
  result: string | null;
  findings: string | null;
  createdAt: string;
}

export default function WorkspaceDashboard() {
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientScreenings, setPatientScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewScreening, setShowNewScreening] = useState(false);
  const [screeningForm, setScreeningForm] = useState({ type: 'VIA', findings: '', result: '', riskLevel: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('provider_data');
    if (!stored) { router.push('/provider/login'); return; }
    setProvider(JSON.parse(stored));
    fetchPatients();
  }, [router]);

  async function fetchPatients() {
    setLoading(true);
    try {
      const res = await fetch(`/api/providers/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      setPatients(data.patients || data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function viewPatient(id: string) {
    try {
      const [patientRes, screeningsRes] = await Promise.all([
        fetch(`/api/providers/patient/${id}`),
        fetch(`/api/screening/history?patientId=${id}`),
      ]);
      if (patientRes.ok) {
        const data = await patientRes.json();
        setSelectedPatient(data.patient || data);
      }
      if (screeningsRes.ok) {
        const data = await screeningsRes.json();
        setPatientScreenings(data.screenings || data.data || []);
      }
    } catch {}
  }

  async function submitScreening() {
    if (!selectedPatient) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/screening/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          type: screeningForm.type,
          findings: screeningForm.findings,
          result: screeningForm.result || undefined,
          riskLevel: screeningForm.riskLevel || undefined,
          providerId: provider?.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit screening');
      setShowNewScreening(false);
      setScreeningForm({ type: 'VIA', findings: '', result: '', riskLevel: '' });
      viewPatient(selectedPatient.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  const screeningTypes = [
    { value: 'VIA', label: 'Visual Inspection with Acetic Acid' },
    { value: 'PAP_SMEAR', label: 'Pap Smear' },
    { value: 'HPV_DNA', label: 'HPV DNA Test' },
    { value: 'COLPOSCOPY', label: 'Colposcopy' },
  ];
  const riskColors: Record<string, string> = {
    LOW: 'bg-emerald-100 text-emerald-700',
    MODERATE: 'bg-amber-100 text-amber-700',
    HIGH: 'bg-red-100 text-red-700',
    CRITICAL: 'bg-red-600 text-white',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-sky-700">CerviTrack</Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-600">Clinician Workspace</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {provider && <span className="text-gray-500">Dr. {provider.name || provider.firstName}</span>}
            <Link href="/" className="text-gray-500 hover:text-sky-700">Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-bold text-gray-900 mb-4">Patients</h2>
              <div className="flex gap-2 mb-4">
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPatients()}
                  placeholder="Search by name or ID..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <button onClick={fetchPatients} className="bg-sky-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-sky-700">Search</button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
              ) : patients.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No patients found</div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {patients.map((p) => (
                    <button key={p.id} onClick={() => viewPatient(p.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedPatient?.id === p.id ? 'border-sky-300 bg-sky-50' : 'border-gray-100 hover:bg-gray-50'
                      }`}>
                      <div className="font-medium text-sm text-gray-900">{p.firstName} {p.lastName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.nationalIdOrPassport} &middot; {p.gender}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Patient Detail / Workspace */}
          <div className="lg:col-span-2">
            {!selectedPatient ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-sky-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Select a patient to begin</p>
                <p className="text-sm text-gray-400 mt-1">Search and select from the patient list on the left</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Patient Info Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span>ID: {selectedPatient.nationalIdOrPassport}</span>
                        <span>DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</span>
                        <span>{selectedPatient.gender}</span>
                        <span>{selectedPatient.phone}</span>
                        <span>{selectedPatient.county}</span>
                      </div>
                    </div>
                    <button onClick={() => setShowNewScreening(true)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
                      + New Screening
                    </button>
                  </div>
                </div>

                {/* Screening History */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Screening History</h3>
                  {patientScreenings.length === 0 ? (
                    <p className="text-sm text-gray-400">No screenings recorded yet</p>
                  ) : (
                    <div className="space-y-3">
                      {patientScreenings.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{s.type.replace('_', ' ')}</span>
                            {s.findings && <p className="text-xs text-gray-500 mt-0.5">{s.findings}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              s.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>{s.status}</span>
                            {s.result && (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                s.result === 'NORMAL' ? 'bg-emerald-100 text-emerald-700' :
                                s.result === 'POSITIVE' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>{s.result}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Screening Modal */}
      {showNewScreening && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">New Screening</h3>
            <p className="text-sm text-gray-500 mb-6">{selectedPatient.firstName} {selectedPatient.lastName}</p>

            <label className="block text-sm font-medium text-gray-700 mb-2">Screening Type</label>
            <select value={screeningForm.type} onChange={(e) => setScreeningForm({ ...screeningForm, type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4">
              {screeningTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Findings</label>
            <textarea value={screeningForm.findings} onChange={(e) => setScreeningForm({ ...screeningForm, findings: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 resize-none" rows={3}
              placeholder="Describe visual inspection findings, abnormal areas..." />

            <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['NORMAL', 'POSITIVE', 'INCONCLUSIVE'].map((r) => (
                <button key={r} onClick={() => setScreeningForm({ ...screeningForm, result: r })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    screeningForm.result === r ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-200 hover:bg-gray-50'
                  }`}>{r}</button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].map((r) => (
                <button key={r} onClick={() => setScreeningForm({ ...screeningForm, riskLevel: r })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    screeningForm.riskLevel === r ? `${riskColors[r]} border-current` : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}>{r}</button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowNewScreening(false)}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={submitScreening} disabled={!screeningForm.findings || submitting}
                className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Saving...' : 'Save Screening'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
