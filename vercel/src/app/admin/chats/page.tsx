'use client';

import { useState, useEffect, useRef } from 'react';

interface Conversation {
  id: string;
  contact_name: string;
  last_message: string;
  last_message_at: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  is_own: boolean;
}

export default function AdminChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedId) fetchMessages(selectedId);
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/chats/conversations');
      if (!res.ok) throw new Error('Failed to load conversations');
      const json = await res.json();
      setConversations(json.conversations || json || []);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/admin/chats/messages?conversation_id=${convId}`);
      if (!res.ok) throw new Error('Failed to load messages');
      const json = await res.json();
      setMessages(json.messages || json || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    setSending(true);
    try {
      await fetch('/api/admin/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedId, content: newMessage.trim() }),
      });
      setNewMessage('');
      fetchMessages(selectedId);
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chats</h1>

      <div className="bg-white rounded-xl border border-gray-200 flex" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="w-80 border-r border-gray-200 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 text-sm text-gray-400">Loading…</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">No conversations</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedId === c.id ? 'bg-sky-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-gray-900">{c.contact_name}</span>
                  {c.unread > 0 && (
                    <span className="bg-sky-600 text-white text-xs rounded-full px-1.5 py-0.5">{c.unread}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{c.last_message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(c.last_message_at).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to view messages
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="text-sm text-gray-400">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-400">No messages yet</div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.is_own ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                        m.is_own
                          ? 'bg-sky-700 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}>
                        {!m.is_own && <p className="text-xs font-medium text-sky-600 mb-0.5">{m.sender_name}</p>}
                        <p>{m.content}</p>
                        <p className={`text-xs mt-1 ${m.is_own ? 'text-sky-200' : 'text-gray-400'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-gray-200 flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-sky-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-800 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
