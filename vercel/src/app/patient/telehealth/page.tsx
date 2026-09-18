'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'expert';
  timestamp: string;
}

const EXPERT_NAME = 'Dr. Sarah';
const EXPERT_ROLE = 'HPV Specialist';

const EXPERT_RESPONSES = [
  "Thank you for reaching out. HPV is a very common virus, and most infections clear on their own. Would you like to know more about how it spreads?",
  "That's an excellent question! The HPV vaccine is recommended for girls and boys from age 9, with catch-up vaccination available up to age 45 in many countries.",
  'Self-sampling for HPV is a simple, private way to test for high-risk HPV types from the comfort of your home. Would you like me to walk you through the steps?',
  'Regular cervical cancer screening is recommended every 3-5 years for women aged 25-65, depending on the screening method used.',
  "Early-stage cervical cancer often has no symptoms. That's why regular screening is so important. Common warning signs include unusual bleeding or pelvic pain.",
  "The HPV vaccine protects against the most common high-risk HPV types (16 and 18) that cause about 70% of cervical cancers. It's most effective when given before first exposure to HPV.",
  "After an abnormal screening result, follow-up tests may include colposcopy or a biopsy. Don't worry — most abnormal results are not cancer, but they need monitoring.",
  'There are over 100 types of HPV, but only about 14 high-risk types can lead to cancer. Types 6 and 11 cause genital warts but are not linked to cancer.',
  'You can reduce your HPV risk by getting vaccinated, practicing safe sex, avoiding smoking, and attending regular cervical screening appointments.',
  "Results from HPV self-sampling typically take 2-4 weeks. You'll be notified by your healthcare provider once they're ready. Would you like to discuss next steps?",
  "A healthy immune system clears most HPV infections within 1-2 years. Eating well, exercising, and not smoking all support your immune system's ability to fight HPV.",
  'Yes, using condoms reduces but does not eliminate the risk of HPV transmission, as the virus can infect areas not covered by a condom. Vaccination remains the best protection.',
];

const WELCOME_MSG = `Hello! I'm ${EXPERT_NAME}, your ${EXPERT_ROLE}. I'm here to answer any questions you have about HPV, cervical cancer screening, vaccines, or women's health. How can I help you today?`;

const QUICK_CHIPS = ['What is HPV?', 'How to self-sample?', 'Vaccine schedule', 'When to screen?'];

export default function TelehealthPage() {
  const [userId, setUserId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const storeKey = userId ? `cervitrack_telehealth_${userId}` : '';

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || '';
      setUserId(uid);
      if (uid) {
        try {
          const raw = localStorage.getItem(`cervitrack_telehealth_${uid}`);
          const parsed = raw ? JSON.parse(raw) : null;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          } else {
            setMessages([{ id: 'welcome', text: WELCOME_MSG, sender: 'expert', timestamp: new Date().toISOString() }]);
          }
        } catch {
          setMessages([{ id: 'welcome', text: WELCOME_MSG, sender: 'expert', timestamp: new Date().toISOString() }]);
        }
      }
      setLoaded(true);
    }
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const persist = useCallback(
    (next: Message[]) => {
      setMessages(next);
      if (storeKey) {
        try {
          localStorage.setItem(storeKey, JSON.stringify(next));
        } catch { }
      }
    },
    [storeKey]
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !userId) return;
      const userMsg: Message = { id: 'msg-' + Date.now(), text: trimmed, sender: 'user', timestamp: new Date().toISOString() };
      persist([...messages, userMsg]);
      setInput('');
      setTyping(true);

      apiFetch('/api/telehealth/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, sender: 'user', message: trimmed }),
      }).catch(() => {});

      const delay = 1000 + Math.random() * 1500;
      setTimeout(() => {
        const responseText = EXPERT_RESPONSES[Math.floor(Math.random() * EXPERT_RESPONSES.length)];
        const expertMsg: Message = {
          id: 'msg-' + Date.now() + '-e',
          text: responseText,
          sender: 'expert',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => {
          const next = [...prev, expertMsg];
          if (storeKey) {
            try {
              localStorage.setItem(storeKey, JSON.stringify(next));
            } catch { }
          }
          return next;
        });
        setTyping(false);
      }, delay);
    },
    [userId, messages, persist, storeKey]
  );

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!loaded) return <p className="py-16 text-center text-gray-500">Loading…</p>;

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col rounded-3xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 p-4">
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-xl">🩺</div>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success" />
        </div>
        <div className="flex-1">
          <p className="font-extrabold">{EXPERT_NAME}</p>
          <p className="text-xs text-gray-500">{EXPERT_ROLE}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Expert Online
          </p>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
          📹
        </button>
      </div>

      <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex items-end ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender === 'expert' && (
              <span className="mr-2 mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm">
                🩺
              </span>
            )}
            <div
              className={`max-w-[78%] px-3.5 py-2.5 text-[15px] leading-5 ${
                m.sender === 'user'
                  ? 'rounded-[18px] rounded-br-sm bg-primary text-white'
                  : 'rounded-[18px] rounded-bl-sm border border-gray-200 bg-white text-gray-900'
              }`}>
              <p>{m.text}</p>
              <p className={`mt-1 text-right text-[10px] font-medium ${m.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                {formatTime(m.timestamp)}
              </p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-end justify-start">
            <span className="mr-2 mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm">
              🩺
            </span>
            <div className="flex gap-1 rounded-[18px] rounded-bl-sm border border-gray-200 bg-white px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => send(chip)}
            className="shrink-0 rounded-full border border-gray-200 bg-primary-light px-3.5 py-2 text-xs font-semibold text-primary">
            {chip}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2 border-t border-gray-100 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          maxLength={500}
          placeholder="Type your message..."
          className="max-h-24 flex-1 resize-none rounded-3xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50">
          ➤
        </button>
      </div>
    </div>
  );
}