'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

const avatarColors = ['#6C5CE7', '#00C853', '#FF4D4D', '#FFB800', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function PatientMessages() {
  const router = useRouter();
  const [user, setUser] = useState({ id: '' });
  const [conversations, setConversations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session} } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      setUser({ id: session.user.id });
      let target: string | null = null;
      try {
        target = new URLSearchParams(window.location.search).get('contact');
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

      // Deep link: ?contact=<providerId> opens a conversation with that doctor
      if (target) {
        try {
          const res = await fetch(`/api/chats/conversations/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: session.user.id, provider_id: target }),
          });
          if (res.ok) {
            const conv = await res.json();
            const url = `/patient/messages/${conv.id}`;
            router.replace(url);
          }
        } catch { }
      }
    }
    init();
  }, [router]);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      `${c.name} ${c.specialty || ''} ${c.hospital || ''} ${c.role || ''}`.toLowerCase().includes(q)
    );
  }, [contacts, search]);

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
          onClick={() => { setShowPicker((v) => !v); setSearch(''); }}
          className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          {showPicker ? 'Close' : 'New message'}
        </button>
      </div>

      {showPicker && (
        <div className="rounded-lg border bg-white p-3 shadow-sm space-y-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctors by name, specialty or hospital…"
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white"
            />
          </div>
          {contacts.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-3xl">🩺</p>
              <p className="mt-2 text-sm font-medium text-gray-700">No healthcare providers available yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Once doctors are registered on CerviTrack you can start a private chat with them here.
              </p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No doctors match &quot;{search}&quot;.</p>
          ) : (
            <ul className="space-y-1 max-h-72 overflow-y-auto">
              {filteredContacts.map((c, i) => (
                <li key={c.id}>
                  <button
                    onClick={() => startConversation(c)}
                    className="w-full flex items-center gap-3 rounded px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: avatarColors[i % avatarColors.length] }}
                    >
                      {initials(c.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-sm truncate">{c.name}</span>
                      <span className="block text-xs text-gray-500 truncate">
                        {[c.specialty, c.hospital].filter(Boolean).join(' · ') || c.role || 'Healthcare provider'}
                      </span>
                    </span>
                    <span className="text-xs text-primary font-semibold shrink-0">Message</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center">
          <p className="text-3xl">💬</p>
          <p className="mt-2 text-sm text-gray-500">No conversations yet.</p>
          <button
            onClick={() => setShowPicker(true)}
            className="mt-3 text-sm text-primary font-semibold hover:underline"
          >
            Start a chat with a doctor
          </button>
        </div>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg border p-3 bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push(`/patient/messages/${c.id}`)} >
              <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0">💬</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.contact_name || 'Contact'}</p>
                <p className="text-xs text-gray-500 truncate">{c.last_message || 'No messages yet'}</p>
              </div>
              <span className="text-xs text-primary font-semibold shrink-0">Open</span>
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