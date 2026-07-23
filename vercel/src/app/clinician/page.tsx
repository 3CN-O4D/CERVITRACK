'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  county: string;
  patient_id: string;
  risk_index: string;
  total_screenings: number;
  total_vaccines: number;
}

interface Appointment {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  custom_text: string;
  status: string;
  patient_name?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  contact_name: string;
  last_message: string;
  last_time: string;
  unread: number;
  patient_id?: string;
  patient_name?: string;
}

export default function ClinicianPortal() {
  const router = useRouter();
  const [tab, setTab] = useState<'chat' | 'patients' | 'appointments' | 'schedule'>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [apptFilter, setApptFilter] = useState('pending');
  const [bookModal, setBookModal] = useState<any>(null);
  const [bookForm, setBookForm] = useState({ date: '', time: '', title: '', notes: '', custom_text: '' });
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const providerId = typeof window !== 'undefined' ? localStorage.getItem('provider_id') || 'provider_1' : 'provider_1';

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [convRes, patRes, apptRes, notifRes] = await Promise.all([
        fetch('/api/chats/conversations'),
        fetch('/api/providers/patients'),
        fetch(`/api/appointments?provider_id=${providerId}`),
        fetch(`/api/providers/notifications?provider_id=${providerId}`),
      ]);
      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data.conversations || data || []);
      }
      if (patRes.ok) {
        const data = await patRes.json();
        setPatients(data.patients || data || []);
      }
      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(data.appointments || data || []);
      }
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications || []);
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function fetchMessages(convo: Conversation) {
    setActiveConvo(convo);
    try {
      const res = await fetch(`/api/chats/messages?conversation_id=${convo.id}`);
      if (res.ok) setMessages(await res.json());
    } catch {}
  }

  async function sendMessage() {
    if (!activeConvo || !newMessage.trim()) return;
    try {
      await fetch('/api/chats/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConvo.id,
          sender_id: providerId,
          content: newMessage.trim(),
        }),
      });
      setNewMessage('');
      fetchMessages(activeConvo);
    } catch {}
  }

  async function bookAppointment() {
    if (!bookModal) return;
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: bookModal.user_id || bookModal.patient_id,
          provider_id: providerId,
          ...bookForm,
          status: 'upcoming',
        }),
      });
      if (res.ok) {
        setSuccess('Appointment booked');
        setBookModal(null);
        setBookForm({ date: '', time: '', title: '', notes: '', custom_text: '' });
        fetchAll();
      }
    } catch {}
  }

  async function acceptAppointment(appt: Appointment) {
    try {
      await fetch(`/api/appointments/${appt.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'upcoming' }),
      });
      setSuccess('Appointment accepted');
      fetchAll();
    } catch {}
  }

  const filteredPatients = patients.filter(p =>
    !search || `${p.name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
    p.county?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAppts = appointments.filter(a =>
    apptFilter === 'all' || a.status === apptFilter
  );

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold">CerviTrack</Link>
            <span className="text-blue-400">|</span>
            <span className="text-sm font-medium text-blue-200">Clinician Portal</span>
          </div>
          <div className="flex items-center gap-4 relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative">
              <svg className="w-5 h-5 text-blue-200 hover:text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-8 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-100 font-semibold text-sm text-gray-900">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">No notifications</div>
                ) : notifications.map(n => (
                  <Link key={n.id} href={n.action_url || '#'} onClick={() => setShowNotifs(false)}
                    className="block px-4 py-3 hover:bg-blue-50 border-b border-gray-50 transition-colors">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/" className="text-sm text-blue-200 hover:text-white">Home</Link>
          </div>
        </div>
      </header>

      {success && <div className="max-w-7xl mx-auto px-6 mt-4"><div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{success}</div></div>}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          {([['chat', 'Messages'], ['patients', 'Patients'], ['appointments', 'Appointments'], ['schedule', 'Schedule']] as [typeof tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'chat' && (
          <div className="flex gap-6 h-[calc(100vh-220px)]">
            <div className="w-80 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shrink-0">
              <div className="p-3 border-b border-gray-100">
                <input type="text" placeholder="Search conversations..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {conversations.map(c => (
                  <button key={c.id} onClick={() => fetchMessages(c)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${activeConvo?.id === c.id ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900">{c.contact_name}</span>
                      {c.patient_name && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{c.patient_name}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">{c.last_message}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
              {activeConvo ? (
                <>
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{activeConvo.contact_name}</h3>
                      {activeConvo.patient_name && (
                        <button onClick={() => router.push(`/clinician/patient/${activeConvo.patient_id || activeConvo.user_id}`)}
                          className="text-xs text-blue-600 hover:text-blue-800">
                          View {activeConvo.patient_name}&apos;s Profile &rarr;
                        </button>
                      )}
                    </div>
                    {activeConvo.patient_id && (
                      <Link href={`/clinician/patient/${activeConvo.patient_id}`}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                        Patient Records
                      </Link>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender_id === providerId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${m.sender_id === providerId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                          <p className="text-sm">{m.content}</p>
                          <p className={`text-xs mt-1 ${m.sender_id === providerId ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(m.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100 flex gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                    <button onClick={sendMessage} disabled={!newMessage.trim()}
                      className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Select a conversation
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'patients' && (
          <>
            <div className="relative mb-6">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patients by name, ID, or county..."
                className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Patient ID</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">County</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Risk</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-sm text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{p.patient_id || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.county || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.risk_index === 'high' ? 'bg-red-100 text-red-700' :
                          p.risk_index === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>{p.risk_index || 'low'}</span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link href={`/clinician/patient/${p.id}`}
                          className="text-blue-600 text-sm font-medium hover:text-blue-800">View</Link>
                        <button onClick={() => setBookModal({ ...p, user_id: p.id })}
                          className="text-emerald-600 text-sm font-medium hover:text-emerald-800">Book</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'appointments' && (
          <>
            <div className="flex gap-2 mb-6">
              {['pending', 'upcoming', 'completed', 'all'].map(f => (
                <button key={f} onClick={() => setApptFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${apptFilter === f ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Patient</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Title</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppts.map(a => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{a.patient_name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.date} {a.time}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          a.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                          a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{a.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {a.status === 'pending' && (
                          <button onClick={() => acceptAppointment(a)}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700">
                            Accept
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'schedule' && (
          <div className="text-center py-20 text-gray-400">
            <p className="font-medium">Schedule Management</p>
            <p className="text-sm mt-1">View and manage your upcoming schedules</p>
          </div>
        )}
      </main>

      {bookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Book Appointment</h3>
            <p className="text-sm text-gray-500 mb-4">For {bookModal.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="e.g., Follow-up screening"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={bookForm.date} onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={bookForm.time} onChange={(e) => setBookForm({ ...bookForm, time: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={bookForm.notes} onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2}
                  placeholder="Internal notes..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Message for Patient</label>
                <textarea value={bookForm.custom_text} onChange={(e) => setBookForm({ ...bookForm, custom_text: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3}
                  placeholder="e.g., Please bring your previous lab results. Fast for 8 hours before the appointment." />
                <p className="text-xs text-gray-400 mt-1">This will be shown to the patient as appointment instructions</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setBookModal(null); setBookForm({ date: '', time: '', title: '', notes: '', custom_text: '' }); }}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={bookAppointment}
                className="flex-1 bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800">Book</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
