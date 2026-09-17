'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(today) - startOfDay(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function sameDay(a: number, b: number) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

function timeLabel(ts: string) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function PatientConversation() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [sessionUserId, setSessionUserId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
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

  async function confirmEdit() {
    if (!editing || !draft.trim()) return;
    const id = editing;
    setEditing(null);
    setSending(true);
    try {
      const res = await apiFetch('/api/chats/messages/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
        setDraft('');
      }
    } catch { }
    setSending(false);
  }

  async function deleteMessage(m: any, forEveryone: boolean) {
    if (forEveryone) {
      const ok = window.confirm('Delete this message for everyone? This cannot be undone.');
      if (!ok) return;
      try {
        const res = await apiFetch('/api/chats/messages/' + m.id, { method: 'DELETE' });
        if (res.ok) {
          const updated = await res.json();
          setMessages((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
        }
      } catch { }
      return;
    }
    try {
      const res = await apiFetch('/api/chats/messages/' + m.id + '/hide', { method: 'POST' });
      if (res.ok) {
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
      }
    } catch { }
  }

  if (loading) return <div className="h-96 flex items-center justify-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{contactName}</h1>

      <div className="rounded-lg border bg-white shadow-sm p-4 max-h-96 overflow-y-auto space-y-1">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No messages yet. Say hello.</p>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === sessionUserId || m.sender_type === 'patient';
            const prev = i > 0 ? messages[i - 1] : null;
            const showDay = !prev || !sameDay(new Date(prev.created_at).getTime(), new Date(m.created_at).getTime());
            const deleted = !!m.deleted_at;
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="flex justify-center py-2">
                    <span className="rounded-full bg-primary text-white text-[10px] font-semibold px-3 py-1">
                      {dayLabel(new Date(m.created_at).getTime())}
                    </span>
                  </div>
                )}
                <div className={mine ? 'text-right' : 'text-left'}>
                  <span
                    className={
                      'inline-block max-w-[75%] rounded-lg px-3 py-2 text-sm text-left ' +
                      (mine ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800')
                    }
                  >
                    {deleted ? (
                      <em className="text-xs opacity-70">{mine ? 'You deleted this message' : 'Message deleted'}</em>
                    ) : (
                      m.content
                    )}
                  </span>
                  {mine && !deleted && !editing && (
                    <div className="mt-0.5 space-x-3 text-[10px] text-gray-400">
                      <button onClick={() => { setEditing(m.id); setDraft(m.content); }}>Edit</button>
                      <button onClick={() => deleteMessage(m, false)}>Delete for me</button>
                      <button className="text-red-400" onClick={() => deleteMessage(m, true)}>Delete for everyone</button>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {timeLabel(m.created_at)}
                    {!!m.edited_at && <span className="italic ml-1">edited</span>}
                    {mine && (m.status === 'read'
                      ? <span className="ml-1">✓✓</span>
                      : m.status === 'delivered'
                        ? <span className="ml-1">✓✓</span>
                        : <span className="ml-1">✓</span>)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editing) confirmEdit();
              else send();
            }
          }}
          placeholder={editing ? 'Edit message…' : 'Type a message…'}
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button
          onClick={editing ? confirmEdit : send}
          disabled={sending || !draft.trim()}
          className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {editing ? 'Save' : 'Send'}
        </button>
        {editing && (
          <button
            onClick={() => { setEditing(null); setDraft(''); }}
            className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <div>
        <Link href="/patient/messages" className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 transition-colors">
          Back to Messages
        </Link>
      </div>
    </div>
  );
}