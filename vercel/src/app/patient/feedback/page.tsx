'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

const CATEGORIES = [
  { icon: '🩹', label: 'Test Kit Issue', color: '#EF4444' },
  { icon: '🩺', label: 'Doctor Complaint', color: '#F59E0B' },
  { icon: '🛡️', label: 'Service Feedback', color: '#3B82F6' },
  { icon: '🔒', label: 'Data Privacy', color: '#8B5CF6' },
  { icon: '👍', label: 'Positive Feedback', color: '#10B981' },
  { icon: '🏥', label: 'Hospital Feedback', color: '#06B6D4' },
  { icon: '👥', label: 'Team / Project', color: '#EC4899' },
  { icon: '💬', label: 'General', color: '#6B7280' },
];

export default function FeedbackPage() {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  async function handleSubmit() {
    if (!category || !message.trim()) {
      setToast('Please select a category and write your feedback.');
      return;
    }
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await apiFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session?.user.id || '',
          category,
          message: message.trim(),
          contact: contact.trim(),
        }),
      });
      setToast('Your feedback has been received. We value your input!');
      setCategory('');
      setMessage('');
      setContact('');
    } catch {
      setToast("Your feedback will be uploaded when you're online.");
    } finally {
      setSending(false);
      setTimeout(() => setToast(''), 4000);
    }
  }

  const disabled = !category || !message.trim() || sending;

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-20">
      <div className="flex items-center gap-3">
        <span className="text-2xl">💬</span>
        <h1 className="text-2xl font-extrabold">Feedback</h1>
      </div>
      <p className="text-sm font-medium text-gray-500">
        Help us improve CerviTrack. Your feedback is confidential.
      </p>

      {toast && (
        <div className="rounded-2xl border border-primary/20 bg-primary-light p-3 text-sm font-semibold text-primary">
          {toast}
        </div>
      )}

      <p className="pt-2 text-xs font-bold">Category</p>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = category === c.label;
          return (
            <button
              key={c.label}
              onClick={() => setCategory(c.label)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                borderColor: active ? c.color : '#E5E7EB',
                backgroundColor: active ? c.color + '15' : 'transparent',
                color: active ? c.color : '#6B7280',
              }}>
              <span>{c.icon}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      <p className="pt-2 text-xs font-bold">Your Feedback</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        placeholder="Tell us about your experience..."
        className="w-full rounded-2xl border border-gray-200 bg-white p-3.5 text-sm focus:border-primary focus:outline-none"
      />

      <p className="pt-2 text-xs font-bold">Contact (optional)</p>
      <input
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Phone or email if you'd like a response"
        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm focus:border-primary focus:outline-none"
      />

      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
        {sending ? 'Sending...' : '✈️ Submit Feedback'}
      </button>
    </div>
  );
}