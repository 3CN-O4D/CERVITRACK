'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

export default function PatientConversation() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [sessionUserId, setSessionUserId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contactName, setContactName] = useState('Consultation');

  useEffect(() => {
    if (!conversationId) return;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      setSessionUserId(session.user.id);
      try {
        await apiFetch('/api/chats/conversations/' + conversationId + '/read', { method: 'PUT' });
      } catch { }
      try {
        const res = await apiFetch('/api/chats/messages?conversation_id=' + conversationId);
        if (res.ok) {
          const d = await res.json();
          setMessages(Array.isArray(d) ? d : []);
        }
      } catch { }
      setLoading(false);
    }
    init();
  }, [conversationId, router]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await apiFetch('/api/chats/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: sessionUserId,
          sender_type: 'patient',
          content: text,
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setDraft('');
      }
    } catch { }
    setSending(false);
  }

  if (loading) return <div className="h-96 flex items-center justify-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{contactName}</h1>

      <div className="rounded-lg border bg-white shadow-sm p-4 max-h-96 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === sessionUserId || m.sender_type === 'patient';
            return (
              <div key={m.id} className={mine ? 'text-right' : 'text-left'}>
                <span
                  className={
                    'inline-block max-w-[75%] rounded-lg px-3 py-2 text-sm text-left ' +
                    (mine ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800')
                  }
                >
                  {m.content}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">
                  {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </div>

      <div>
        <Link href="/patient/messages" className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 transition-colors">
          Back to Messages
        </Link>
      </div>
    </div>
  );
}