'use client';

import { apiFetch } from '@/lib/api-fetch';
import { useState, useEffect, useRef, useMemo } from 'react';

interface Conversation {
  id: string;
  contact_name?: string;
  users?: { name?: string };
  last_message: string;
  last_message_at: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  status?: string;
  sender_type?: string;
  is_own?: boolean;
}

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

export default function AdminChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [convSearch, setConvSearch] = useState('');

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (selectedId) fetchMessages(selectedId); }, [selectedId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await apiFetch('/api/admin/chats/conversations');
      if (!res.ok) throw new Error('Failed to load conversations');
      const json = await res.json();
      setConversations(json.conversations || json || []);
    } catch { setConversations([]); }
    finally { setLoadingConvs(false); }
  };

  const fetchMessages = async (convId: string) => {
    setLoadingMsgs(true);
    setEditing(null);
    setNewMessage('');
    try {
      const res = await apiFetch(`/api/admin/chats/messages?conversation_id=${convId}`);
      if (!res.ok) throw new Error('Failed to load messages');
      const json = await res.json();
      setMessages(json.messages || json || []);
    } catch { setMessages([]); }
    finally { setLoadingMsgs(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    const text = newMessage.trim();
    if (!text) return;
    setSending(true);
    try {
      if (editing) {
        const res = await apiFetch('/api/admin/chats/messages/' + editing, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        });
        if (res.ok) fetchMessages(selectedId);
      } else {
        await apiFetch('/api/admin/chats/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: selectedId, content: text }),
        });
        setNewMessage('');
        fetchMessages(selectedId);
      }
    } catch { /* silently fail */ }
    finally { setSending(false); }
  };

  const handleDelete = async (id: string, everyone: boolean) => {
    if (!selectedId) return;
    if (everyone && !window.confirm('Delete this message for everyone? This cannot be undone.')) return;
    try {
      await apiFetch('/api/admin/chats/messages/' + id, { method: 'DELETE' });
      fetchMessages(selectedId);
    } catch { /* silently fail */ }
  };

  const filteredConvs = useMemo(() => {
    if (!convSearch) return conversations;
    const q = convSearch.toLowerCase();
    return conversations.filter(c =>
      (c.contact_name || c.users?.name || '')!.toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q));
  }, [conversations, convSearch]);

  const selectedConv = conversations.find(c => c.id === selectedId);
  const selectedName = selectedConv?.contact_name || selectedConv?.users?.name || 'Chat';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chats</h1>

      <div className="bg-white rounded-xl border border-gray-200 flex" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input type="text" value={convSearch} onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Search contacts…"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-sky-500" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {loadingConvs ? (
              <div className="p-4 text-sm text-gray-400">Loading…</div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">{convSearch ? 'No matching contacts' : 'No conversations'}</div>
            ) : filteredConvs.map((c) => (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedId === c.id ? 'bg-sky-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-gray-900">{c.contact_name || c.users?.name || 'Chat'}</span>
                  {c.unread > 0 && <span className="bg-sky-600 text-white text-xs rounded-full px-1.5 py-0.5">{c.unread}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{c.last_message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(c.last_message_at).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to view messages
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="font-medium text-sm text-gray-900">{selectedName}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingMsgs ? (
                  <div className="text-sm text-gray-400">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-400">No messages yet</div>
                ) : messages.map((m, i) => {
                  const prev = i > 0 ? messages[i - 1] : null;
                  const showDay = !prev || !sameDay(new Date(prev.created_at).getTime(), new Date(m.created_at).getTime());
                  const deleted = !!m.deleted_at;
                  return (
                    <div key={m.id}>
                      {showDay && (
                        <div className="flex justify-center py-1.5">
                          <span className="rounded-full bg-gray-200 text-gray-600 text-[10px] font-semibold px-3 py-1">
                            {dayLabel(new Date(m.created_at).getTime())}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${m.is_own ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                          m.is_own ? 'bg-sky-700 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}>
                          {!m.is_own && <p className="text-xs font-medium text-sky-600 mb-0.5">{m.sender_name || 'Patient'}</p>}
                          <p>{deleted
                            ? <em className="text-xs opacity-70">{m.is_own ? 'You deleted this message' : 'Message deleted'}</em>
                            : m.content}</p>
                          <p className={`text-xs mt-1 ${m.is_own ? 'text-sky-200' : 'text-gray-400'}`}>
                            {timeLabel(m.created_at)}
                            {!!m.edited_at && <span className="italic ml-1">edited</span>}
                            {m.is_own && (m.status === 'read' || m.status === 'delivered' ? <span className="ml-1">✓✓</span> : <span className="ml-1">✓</span>)}
                          </p>
                          {m.is_own && !deleted && editing !== m.id && (
                            <div className="mt-1 space-x-2 text-xs opacity-80">
                              <button onClick={() => { setEditing(m.id); setNewMessage(m.content); }}>Edit</button>
                              <button className="text-red-200" onClick={() => handleDelete(m.id, true)}>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-gray-200 flex gap-3">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={editing ? 'Edit message…' : 'Type a message…'}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <button type="submit" disabled={sending || !newMessage.trim()}
                  className="bg-sky-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-800 disabled:opacity-50">
                  {editing ? 'Save' : 'Send'}
                </button>
                {editing && (
                  <button type="button" onClick={() => { setEditing(null); setNewMessage(''); }}
                    className="bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-300">
                    Cancel
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}