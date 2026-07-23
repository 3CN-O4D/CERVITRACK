'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  county: string;
  patient_id: string;
  birth_date: string;
  risk_index: string;
  total_screenings: number;
  total_vaccines: number;
  last_screening_date: string;
}

interface Screening {
  id: string;
  verdict: string;
  risk_tier: string;
  created_at: string;
  hpv_result: string;
  cytology_result: string;
}

interface Vaccine {
  id: string;
  name: string;
  date: string;
  status: string;
  hospital: string;
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  notes: string;
  custom_text: string;
  facility_name: string;
}

export default function ClinicianPatientProfile({ params }: { params: { id: string } }) {
  const { id } = params;
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<'overview' | 'screenings' | 'vaccines' | 'appointments'>('overview');
  const [loading, setLoading] = useState(true);
  const [notifyModal, setNotifyModal] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '', type: 'info' });
  const [bookModal, setBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({ date: '', time: '', title: '', notes: '', custom_text: '' });
  const [success, setSuccess] = useState('');

  const providerId = typeof window !== 'undefined' ? localStorage.getItem('provider_id') || 'provider_1' : 'provider_1';

  useEffect(() => { fetchPatient(); }, [id]);

  async function fetchPatient() {
    setLoading(true);
    try {
      const [patRes, scrRes, vacRes, apptRes] = await Promise.all([
        fetch(`/api/providers/patient/${id}`),
        fetch(`/api/screening/history?user_id=${id}`),
        fetch(`/api/vaccines?user_id=${id}`),
        fetch(`/api/appointments?user_id=${id}`),
      ]);
      if (patRes.ok) setPatient(await patRes.json());
      if (scrRes.ok) {
        const data = await scrRes.json();
        setScreenings(data.screenings || data || []);
      }
      if (vacRes.ok) {
        const data = await vacRes.json();
        setVaccines(data.vaccines || data || []);
      }
      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(data.appointments || data || []);
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function sendNotification() {
    try {
      await fetch('/api/providers/notification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id, ...notifyForm }),
      });
      setSuccess('Notification sent');
      setNotifyModal(false);
      setNotifyForm({ title: '', message: '', type: 'info' });
    } catch {}
  }

  async function bookAppointment() {
    try {
      await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id, provider_id: providerId, ...bookForm, status: 'upcoming' }),
      });
      setSuccess('Appointment booked');
      setBookModal(false);
      setBookForm({ date: '', time: '', title: '', notes: '', custom_text: '' });
      fetchPatient();
    } catch {}
  }

  if (loading) return <div className="min-h-screen bg-blue-50 flex items-center justify-center text-gray-400">Loading...</div>;
  if (!patient) return <div className="min-h-screen bg-blue-50 flex items-center justify-center text-gray-400">Patient not found</div>;

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link href="/clinician" className="text-lg font-bold">CerviTrack</Link>
          <span className="text-blue-400">|</span>
          <span className="text-sm font-medium text-blue-200">Patient Profile</span>
        </div>
      </header>

      {success && <div className="max-w-7xl mx-auto px-6 mt-4"><div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{success}</div></div>}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-500 text-sm">ID: {patient.patient_id || '—'} · {patient.county || ''}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setNotifyModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Send Notification</button>
              <button onClick={() => setBookModal(true)}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium">Book Appointment</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="text-sm"><span className="text-gray-500">Phone</span><p className="font-medium">{patient.phone || '—'}</p></div>
            <div className="text-sm"><span className="text-gray-500">DOB</span><p className="font-medium">{patient.birth_date || '—'}</p></div>
            <div className="text-sm"><span className="text-gray-500">Risk</span>
              <p className={`font-medium ${patient.risk_index === 'high' ? 'text-red-600' : patient.risk_index === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {(patient.risk_index || 'low').toUpperCase()}
              </p>
            </div>
            <div className="text-sm"><span className="text-gray-500">Screenings</span><p className="font-medium">{patient.total_screenings || 0}</p></div>
            <div className="text-sm"><span className="text-gray-500">Vaccines</span><p className="font-medium">{patient.total_vaccines || 0}</p></div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {([['overview', 'Overview'], ['screenings', 'Screenings'], ['vaccines', 'Vaccines'], ['appointments', 'Appointments']] as [typeof tab, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === k ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Latest Screening</h3>
              {screenings.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-700">Verdict: <span className="font-medium">{screenings[0].verdict || '—'}</span></p>
                  <p className="text-sm text-gray-700">Risk: <span className="font-medium">{screenings[0].risk_tier || '—'}</span></p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(screenings[0].created_at).toLocaleDateString()}</p>
                </div>
              ) : <p className="text-sm text-gray-400">No screenings yet</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Vaccination Status</h3>
              {vaccines.length > 0 ? (
                <div className="space-y-2">
                  {vaccines.slice(0, 3).map(v => (
                    <div key={v.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{v.name}</span>
                      <span className={`font-medium ${v.status === 'done' ? 'text-emerald-600' : 'text-amber-600'}`}>{v.status}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">No vaccines recorded</p>}
            </div>
          </div>
        )}

        {tab === 'screenings' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Verdict</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Risk Tier</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">HPV</th>
                </tr>
              </thead>
              <tbody>
                {screenings.map(s => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="px-6 py-4 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium">{s.verdict || '—'}</td>
                    <td className="px-6 py-4 text-sm">{s.risk_tier || '—'}</td>
                    <td className="px-6 py-4 text-sm">{s.hpv_result || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'vaccines' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Vaccine</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Facility</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map(v => (
                  <tr key={v.id} className="border-b border-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{v.name}</td>
                    <td className="px-6 py-4 text-sm">{v.date || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{v.hospital || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{a.title}</td>
                    <td className="px-6 py-4 text-sm">{a.date} {a.time}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">{a.custom_text || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {notifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Send Notification</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={notifyForm.title} onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={notifyForm.message} onChange={(e) => setNotifyForm({ ...notifyForm, message: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={notifyForm.type} onChange={(e) => setNotifyForm({ ...notifyForm, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="info">Info</option>
                  <option value="reminder">Reminder</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setNotifyModal(false)} className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={sendNotification} className="flex-1 bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700">Send</button>
            </div>
          </div>
        </div>
      )}

      {bookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Book Appointment</h3>
            <p className="text-sm text-gray-500 mb-4">For {patient.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="e.g., Follow-up screening" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={bookForm.date} onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={bookForm.time} onChange={(e) => setBookForm({ ...bookForm, time: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Message for Patient</label>
                <textarea value={bookForm.custom_text} onChange={(e) => setBookForm({ ...bookForm, custom_text: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3}
                  placeholder="e.g., Please bring your previous lab results. Fast for 8 hours before." />
                <p className="text-xs text-gray-400 mt-1">Shown to the patient as appointment instructions</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setBookModal(false)} className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={bookAppointment} className="flex-1 bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800">Book</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
