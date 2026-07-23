'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  county: string;
  date_of_birth: string;
  screenings: Array<{
    id: string;
    verdict: string;
    risk_tier: string;
    risk_index: number;
    created_at: string;
  }>;
  vaccines: Array<{
    id: string;
    dose: string;
    date: string;
    status: string;
  }>;
  appointments: Array<{
    id: string;
    title: string;
    date: string;
    status: string;
  }>;
  lab_results: Array<{
    id: string;
    result: string;
    notes: string;
    created_at: string;
  }>;
}

type Tab = 'screenings' | 'vaccines' | 'appointments' | 'lab-results';
type SortKey = 'date' | 'verdict' | 'risk_tier' | 'status';

export default function ProviderPatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [tab, setTab] = useState<Tab>('screenings');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterText, setFilterText] = useState('');

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleAction, setScheduleAction] = useState('');
  const [actionResult, setActionResult] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('provider');
    if (!stored) { router.push('/provider/login'); return; }
    fetchPatient();
  }, [router, patientId]);

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/providers/patient/${patientId}`);
      if (!res.ok) throw new Error('Failed to load patient');
      const json = await res.json();
      setPatient(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;
    try {
      await fetch('/api/providers/notification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: patientId, title: notifTitle, message: notifMessage }),
      });
      setActionResult('Notification sent');
      setNotifTitle('');
      setNotifMessage('');
      setTimeout(() => setActionResult(''), 3000);
    } catch {
      setActionResult('Failed to send notification');
    }
  }, [patientId, notifTitle, notifMessage]);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent) return;
    try {
      await fetch('/api/providers/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: patientId, content: msgContent }),
      });
      setActionResult('Message sent');
      setMsgContent('');
      setTimeout(() => setActionResult(''), 3000);
    } catch {
      setActionResult('Failed to send message');
    }
  }, [patientId, msgContent]);

  const scheduleActionHandler = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate || !scheduleAction) return;
    try {
      await fetch(`/api/providers/patient/${patientId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: scheduleDate, action: scheduleAction }),
      });
      setActionResult('Action scheduled');
      setScheduleDate('');
      setScheduleAction('');
      setTimeout(() => setActionResult(''), 3000);
    } catch {
      setActionResult('Failed to schedule action');
    }
  }, [patientId, scheduleDate, scheduleAction]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => handleSort(col)}>
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const sortArr = <T extends Record<string, any>>(arr: T[], key: string) => {
    if (!arr) return [];
    let list = filterText ? arr.filter((item: any) => Object.values(item).some(v => String(v).toLowerCase().includes(filterText.toLowerCase()))) : arr;
    return [...list].sort((a: any, b: any) => {
      let av = a[key] ?? '', bv = b[key] ?? '';
      if (key === 'date' || key === 'created_at') { av = new Date(av).getTime() || 0; bv = new Date(bv).getTime() || 0; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-screen text-gray-500">Loading patient…</div>;
  }

  if (error || !patient) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error || 'Patient not found'}</div>
        <Link href="/provider/patients" className="text-sky-700 text-sm mt-4 inline-block hover:underline">← Back to patients</Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'screenings', label: 'Screenings' },
    { key: 'vaccines', label: 'Vaccines' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'lab-results', label: 'Lab Results' },
  ];

  return (
    <div className="p-8">
      <Link href="/provider/patients" className="text-sky-700 text-sm mb-4 inline-block hover:underline">← Back to patients</Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-500">Email:</span>
            <span className="ml-2 text-gray-900">{patient.email}</span>
          </div>
          <div>
            <span className="text-gray-500">Phone:</span>
            <span className="ml-2 text-gray-900">{patient.phone || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">County:</span>
            <span className="ml-2 text-gray-900">{patient.county || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">DOB:</span>
            <span className="ml-2 text-gray-900">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      </div>

      {actionResult && (
        <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${
          actionResult.startsWith('Failed') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {actionResult}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-sky-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        {tab === 'screenings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Verdict <SortIcon col="verdict" /></th>
                  <th className="px-6 py-3 font-medium">Risk Tier <SortIcon col="risk_tier" /></th>
                  <th className="px-6 py-3 font-medium">Risk Index</th>
                  <th className="px-6 py-3 font-medium">Date <SortIcon col="date" /></th>
                </tr>
              </thead>
              <tbody>
                {!patient.screenings?.length ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-gray-400">No screenings</td></tr>
                ) : sortArr(patient.screenings, sortKey === 'date' ? 'created_at' : sortKey).map((s) => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.verdict === 'positive' ? 'bg-red-50 text-red-700' :
                        s.verdict === 'negative' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{s.verdict}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.risk_tier === 'high' ? 'bg-red-50 text-red-700' :
                        s.risk_tier === 'medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>{s.risk_tier}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{s.risk_index}</td>
                    <td className="px-6 py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'vaccines' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Dose</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {patient.vaccines?.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-6 text-center text-gray-400">No vaccines</td></tr>
                ) : patient.vaccines?.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{v.dose}</td>
                    <td className="px-6 py-3 text-gray-600">{v.date ? new Date(v.date).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        v.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        v.status === 'scheduled' ? 'bg-sky-50 text-sky-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{v.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {patient.appointments?.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-6 text-center text-gray-400">No appointments</td></tr>
                ) : patient.appointments?.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{a.title}</td>
                    <td className="px-6 py-3 text-gray-600">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        a.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        a.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                        'bg-sky-50 text-sky-700'
                      }`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'lab-results' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Result</th>
                  <th className="px-6 py-3 font-medium">Notes</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {patient.lab_results?.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-6 text-center text-gray-400">No lab results</td></tr>
                ) : patient.lab_results?.map((l) => (
                  <tr key={l.id} className="border-b border-gray-50">
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        l.result?.toLowerCase().includes('positive') ? 'bg-red-50 text-red-700' :
                        l.result?.toLowerCase().includes('negative') ? 'bg-emerald-50 text-emerald-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{l.result}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{l.notes || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">{new Date(l.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Send Notification</h3>
          <form onSubmit={sendNotification} className="space-y-3">
            <input
              type="text"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="Title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <textarea
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Message"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
            <button type="submit" className="bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-800 w-full">
              Send Notification
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Send Message</h3>
          <form onSubmit={sendMessage} className="space-y-3">
            <textarea
              value={msgContent}
              onChange={(e) => setMsgContent(e.target.value)}
              placeholder="Type your message…"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
            <button type="submit" className="bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-800 w-full">
              Send Message
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Schedule Action</h3>
          <form onSubmit={scheduleActionHandler} className="space-y-3">
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              value={scheduleAction}
              onChange={(e) => setScheduleAction(e.target.value)}
              placeholder="Action description"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 w-full">
              Schedule
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
