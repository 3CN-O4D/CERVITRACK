'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import PatientSearch from '@/components/PatientSearch';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  county: string;
  sub_county: string;
  ward: string;
  patient_id: string;
  photo: string | null;
  created_at: string;
}

interface Screening {
  id: string;
  profile_id: string;
  screening_type: string;
  screening_date: string;
  result: string;
  risk_level: string;
  notes: string;
  created_at: string;
}

interface Appointment {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  notes: string;
  created_at: string;
}

const SCREENING_TYPES = ['VIA', 'Pap Smear', 'HPV DNA Test', 'Colposcopy'];
const RESULTS = ['Normal', 'Abnormal', 'Inconclusive', 'Positive', 'Negative'];
const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

export default function WorkspaceDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'patients' | 'screenings' | 'new-screening' | 'appointments'>('patients');
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // New screening form
  const [screeningPatient, setScreeningPatient] = useState('');
  const [screeningType, setScreeningType] = useState('VIA');
  const [screeningResult, setScreeningResult] = useState('');
  const [screeningRisk, setScreeningRisk] = useState('low');
  const [screeningNotes, setScreeningNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // New appointment form
  const [apptPatient, setApptPatient] = useState('');
  const [apptTitle, setApptTitle] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth?redirect=/workspace');
      return;
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [patientsRes, screeningsRes, appointmentsRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/screenings'),
        fetch('/api/appointments'),
      ]);
      if (patientsRes.ok) {
        const d = await patientsRes.json();
        setPatients(d.patients || d.data || []);
      }
      if (screeningsRes.ok) {
        const d = await screeningsRes.json();
        setScreenings(d.screenings || d.data || []);
      }
      if (appointmentsRes.ok) {
        const d = await appointmentsRes.json();
        setAppointments(d.appointments || d.data || []);
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const patientMap = useMemo(() => {
    const m: Record<string, Patient> = {};
    patients.forEach(p => { m[p.id] = p; });
    return m;
  }, [patients]);

  const filteredPatients = useMemo(() => {
    if (!search) return patients;
    const q = search.toLowerCase();
    return patients.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.patient_id?.toLowerCase().includes(q) ||
      p.county?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    );
  }, [patients, search]);

  const patientScreenings = useMemo(() => {
    if (!selectedPatient) return [];
    return screenings.filter(s => s.profile_id === selectedPatient.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [screenings, selectedPatient]);

  async function handleNewScreening(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const res = await fetch('/api/screenings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: screeningPatient,
          type: screeningType,
          result: screeningResult || 'Pending',
          riskLevel: screeningRisk,
          notes: screeningNotes,
          date: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setFormSuccess('Screening recorded successfully');
        setScreeningPatient('');
        setScreeningResult('');
        setScreeningNotes('');
        fetchData();
      } else {
        const err = await res.json();
        setFormError(err.message || 'Failed to record screening');
      }
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNewAppointment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: apptPatient,
          title: apptTitle,
          date: apptDate,
          time: apptTime,
          notes: apptNotes,
          status: 'upcoming',
        }),
      });
      if (res.ok) {
        setFormSuccess('Appointment booked');
        setApptPatient('');
        setApptTitle('');
        setApptDate('');
        setApptTime('');
        setApptNotes('');
        fetchData();
      } else {
        const err = await res.json();
        setFormError(err.message || 'Failed to book appointment');
      }
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const tabs = [
    { key: 'patients', label: 'Patients', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
    { key: 'screenings', label: 'Screenings', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'new-screening', label: 'New Screening', icon: 'M12 4.5v15m7.5-7.5h-15' },
    { key: 'appointments', label: 'Appointments', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold">CerviTrack</Link>
            <span className="text-emerald-300">|</span>
            <span className="text-sm font-medium text-emerald-200">Clinician Workspace</span>
          </div>
          <Link href="/" className="text-sm text-emerald-200 hover:text-white">Home</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key ? 'bg-emerald-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
        {formSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 text-sm">{formSuccess}</div>}
        {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{formError}</div>}

        {tab === 'patients' && (
          loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900">Patients ({filteredPatients.length})</h2>
                </div>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, ID, county, or phone..."
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {filteredPatients.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400 text-sm">No patients found</div>
                ) : filteredPatients.map((p) => (
                  <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.patient_id} &middot; {p.county} &middot; {p.phone}</div>
                    </div>
                    <button onClick={() => setSelectedPatient(p)}
                      className="text-emerald-600 text-sm font-medium hover:text-emerald-700">View Record</button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {tab === 'screenings' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Screenings ({screenings.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {screenings.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">No screenings recorded yet</div>
              ) : screenings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50).map(s => (
                <div key={s.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-gray-900">{s.screening_type}</span>
                      {patientMap[s.profile_id] && (
                        <span className="text-xs text-emerald-600 ml-2">{patientMap[s.profile_id].name}</span>
                      )}
                      <span className="text-xs text-gray-500 ml-2">{s.screening_date || new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.result === 'Normal' ? 'bg-green-100 text-green-700' :
                        s.result === 'Abnormal' || s.result === 'Positive' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{s.result}</span>
                      {s.risk_level && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.risk_level === 'low' ? 'bg-blue-100 text-blue-700' :
                          s.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                          s.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>{s.risk_level}</span>
                      )}
                    </div>
                  </div>
                  {s.notes && <p className="text-xs text-gray-500 mt-1">{s.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'new-screening' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Record New Screening</h2>
              <form onSubmit={handleNewScreening} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <PatientSearch patients={patients} value={screeningPatient} onChange={setScreeningPatient} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Screening Type</label>
                    <select value={screeningType} onChange={(e) => setScreeningType(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      {SCREENING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                    <select value={screeningResult} onChange={(e) => setScreeningResult(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      <option value="">Select result...</option>
                      {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                  <div className="flex gap-2">
                    {RISK_LEVELS.map(r => (
                      <button key={r} type="button" onClick={() => setScreeningRisk(r)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          screeningRisk === r
                            ? r === 'low' ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : r === 'medium' ? 'bg-amber-100 border-amber-300 text-amber-700'
                            : r === 'high' ? 'bg-orange-100 border-orange-300 text-orange-700'
                            : 'bg-red-100 border-red-300 text-red-700'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
                  <textarea value={screeningNotes} onChange={(e) => setScreeningNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3}
                    placeholder="Findings, observations, follow-up instructions..." />
                </div>
                <button type="submit" disabled={submitting || !screeningPatient}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors">
                  {submitting ? 'Saving...' : 'Record Screening'}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Upcoming Appointments</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {appointments.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400 text-sm">No appointments</div>
                ) : appointments.map(a => (
                  <div key={a.id} className="px-6 py-4">
                    <div className="font-medium text-sm text-gray-900">{a.title}</div>
                    <div className="text-xs text-gray-500">{a.date} at {a.time}</div>
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.status === 'completed' ? 'bg-green-100 text-green-700' :
                      a.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Book Appointment</h2>
              <form onSubmit={handleNewAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <PatientSearch patients={patients} value={apptPatient} onChange={setApptPatient} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <input type="text" value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} required
                    placeholder="e.g., Follow-up screening, HPV vaccination..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={apptNotes} onChange={(e) => setApptNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2}
                    placeholder="Additional instructions..." />
                </div>
                <button type="submit" disabled={submitting || !apptPatient}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors">
                  {submitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedPatient.name}</h3>
                <p className="text-sm text-gray-500">{selectedPatient.patient_id} &middot; {selectedPatient.county}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-gray-900">{selectedPatient.phone || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900">{selectedPatient.email || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sub-County</span><span className="text-gray-900">{selectedPatient.sub_county || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Ward</span><span className="text-gray-900">{selectedPatient.ward || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Registered</span><span className="text-gray-900">{new Date(selectedPatient.created_at).toLocaleDateString()}</span></div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Screening History</h4>
              {patientScreenings.length === 0 ? (
                <p className="text-xs text-gray-400">No screenings recorded</p>
              ) : (
                <div className="space-y-2">
                  {patientScreenings.map(s => (
                    <div key={s.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{s.screening_type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.result === 'Normal' ? 'bg-green-100 text-green-700' :
                          s.result === 'Abnormal' || s.result === 'Positive' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{s.result}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{s.screening_date || new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setSelectedPatient(null)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium mt-4">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
