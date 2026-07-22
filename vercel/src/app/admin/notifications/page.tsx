'use client';

import { useState } from 'react';

export default function AdminNotificationsPage() {
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState({ type: '' as 'success' | 'error' | '', text: '' });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title || !message) {
      setResult({ type: 'error', text: 'All fields are required' });
      return;
    }
    setSending(true);
    setResult({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/notification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, title, message, type }),
      });
      if (!res.ok) throw new Error('Failed to send notification');
      setResult({ type: 'success', text: 'Notification sent successfully' });
      setUserId('');
      setTitle('');
      setMessage('');
    } catch (err: unknown) {
      setResult({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send notification' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Send Notification</h1>

      <div className="max-w-lg">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {result.text && (
            <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${
              result.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {result.text}
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user UUID"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Notification message"
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="info">Info</option>
                <option value="reminder">Reminder</option>
                <option value="alert">Alert</option>
                <option value="appointment">Appointment</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="bg-sky-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-800 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Notification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
