'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const WELCOME_SUGGESTIONS = [
  'What is HPV?',
  'How to prevent cervical cancer?',
  'When should I screen?',
  'HPV vaccine in Kenya',
  'Cervical cancer symptoms',
];

const RESPONSES: { keywords: string[]; response: string; followUps: string[] }[] = [
  {
    keywords: ['what is hpv', "what's hpv", 'hpv meaning'],
    response:
      'HPV (Human Papillomavirus) is a very common virus. Most sexually active people get it at some point. There are over 100 types — some cause genital warts, others can cause cancer.',
    followUps: ['How do you get HPV?', 'Can HPV be cured?', 'What are high-risk HPV types?'],
  },
  {
    keywords: ['cervical cancer screening', 'pap smear', 'get screened', 'when should i screen'],
    response:
      'Cervical screening checks for abnormal cells on the cervix before they become cancer. In Kenya, screening is recommended every 3-5 years for women 25-49.',
    followUps: ['How is a Pap smear done?', 'Does Pap smear hurt?', 'Where to get screened in Kenya?'],
  },
  {
    keywords: ['hpv vaccine', 'vaccination', 'gardasil', 'vaccine in kenya'],
    response:
      'The HPV vaccine protects against the most common cancer-causing HPV types. In Kenya, the vaccine is free for 9-14 year old girls through the national program.',
    followUps: ['Is HPV vaccine safe?', 'HPV vaccine side effects', 'Where to get HPV vaccine in Kenya?'],
  },
  {
    keywords: ['cervical cancer', 'cervical cancer symptoms'],
    response:
      "Cervical cancer starts in the cells lining the cervix. Nearly all cases are caused by persistent high-risk HPV infection. Early cervical cancer has NO symptoms — that's why screening is critical.",
    followUps: ['Cervical cancer treatment', 'Cervical cancer survival rate', 'Cervical cancer in Kenya statistics'],
  },
  {
    keywords: ['how to prevent cervical cancer', 'prevent cervical cancer'],
    response:
      "Cervical cancer is one of the most preventable cancers! 1) Get the HPV vaccine, 2) Get regular screening, 3) Don't smoke, 4) Use condoms, 5) Limit sexual partners.",
    followUps: ['Best diet for cervical health', 'Exercise and cancer prevention', 'How often to screen for prevention?'],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getAssistantResponse(question: string): { response: string; followUps: string[] } {
  const q = question.toLowerCase().trim();
  for (const entry of RESPONSES) {
    if (entry.keywords.some((kw) => q.includes(kw))) {
      return { response: entry.response, followUps: entry.followUps };
    }
  }
  return {
    response:
      "I'm still learning! For specific medical advice, please consult a healthcare provider or use the Telehealth chat.",
    followUps: ['What is HPV?', 'How to prevent?', 'When to screen?', 'Vaccine info', 'HPV symptoms'],
  };
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hello! I'm your CerviTrack health assistant. Ask me anything about HPV, cervical cancer, screening, or prevention. I'll suggest follow-up questions based on what you ask.",
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(WELCOME_SUGGESTIONS);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const ask = useCallback((question: string) => {
    const q = question.trim();
    if (!q || typing) return;
    setInput('');
    setMessages((prev) => [...prev, { id: Date.now() + '-u', text: q, sender: 'user' }]);
    setTyping(true);
    setTimeout(() => {
      const result = getAssistantResponse(q);
      setMessages((prev) => [...prev, { id: Date.now() + '-a', text: result.response, sender: 'ai' }]);
      setSuggestions(shuffle(result.followUps).slice(0, 5));
      setTyping(false);
    }, 600);
  }, [typing]);

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col rounded-3xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-xl">🧠</div>
        <div>
          <p className="font-extrabold">AI Health Assistant</p>
          <p className="text-xs font-semibold text-success">Online</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex items-end ${m.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
            {m.sender === 'ai' && (
              <span className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white">
                AI
              </span>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 text-sm font-medium leading-5 ${
                m.sender === 'ai'
                  ? 'rounded-3xl rounded-bl-sm bg-gray-100 text-gray-900'
                  : 'rounded-3xl rounded-br-sm bg-primary text-white'
              }`}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-end justify-start">
            <span className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white">
              AI
            </span>
            <div className="flex gap-1.5 rounded-3xl rounded-bl-sm bg-gray-100 px-5 py-3.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-gray-100 px-3 py-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="rounded-2xl border border-primary/40 bg-primary-light px-3 py-1.5 text-xs font-bold text-primary">
            {s}
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
              ask(input);
            }
          }}
          rows={1}
          placeholder="Ask about HPV, screening..."
          className="max-h-24 flex-1 resize-none rounded-3xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={() => ask(input)}
          disabled={!input.trim() || typing}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:bg-gray-300">
          ➤
        </button>
      </div>
    </div>
  );
}