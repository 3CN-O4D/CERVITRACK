'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

export default function PatientMessages() {
  const router = useRouter();
  const [user, setUser] = useState({ id: '' });
  const [conversations, setConversations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session} } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      setUser({ id: session.user.id });
      try {
        const [convRes, contactRes] = await Promise.all([
          apiFetch('/api/chats/conversations?user_id=' + session.user.id),
          apiFetch('/api/chats/contacts'),
        ]);
        if (convRes.ok) {
          const d = await convRes.json();
          setConversations(Array.isArray(d) ? d : []);
        }
        if (contactRes.ok) {
          const d = await contactRes.json();
          setContacts(Array.isArray(d) ? d : []);
        }
      } catch { }
      setLoading(false);
    }
    init();
  }, [router]);

  async function startConversation(contact: any) {
    try {
      const res = await apiFetch('/api/chats/conversations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, contact_id: contact.id }),
      });
      if (res.ok) {
        const conv = await res.json();
        router.push(`/patient/messages/${conv.id}`);
      }
    } catch { }
  }

  if (loading) return <div className="h-96 flex items-center justify-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          {showPicker ? 'Close' : 'New message'}
        </button>
      </div>

      {showPicker && (
        <div className="rounded-lg border bg-white p-3 shadow-sm">
          {contacts.length === 0 ? (
            <p className="text-sm text-gray-500">No contacts available.</p>
          ) : (
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {contacts.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => startConversation(c)}
                    className="w-full text-left rounded px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      {[c.specialty, c.hospital].filter(Boolean).join(' · ') || c.role}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {conversations.length === 0 ? (
        <p className="text-gray-500">No conversations yet.</p>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg border p-3 bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push(`/patient/messages/${c.id}`)} >
              <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{c.contact_name || 'Contact'}</p>
                <p className="text-xs text-gray-500">{c.last_message || 'No messages yet'}</p>
              </div>
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0-12v11"/></svg>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Link href="/patient/kits" className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors">
          Back to Kit Tracker
        </Link>
      </div>
    </div>
  );
}