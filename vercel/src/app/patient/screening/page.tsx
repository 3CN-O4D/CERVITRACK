'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

interface Field {
  key: string;
  label: string;
  type: 'number' | 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
}

const QUESTIONS: Field[] = [
  { key: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 34' },
  { key: 'parity', label: 'Number of pregnancies', type: 'number', placeholder: 'e.g. 2' },
  { key: 'vaccination', label: 'HPV vaccination status', type: 'select', options: ['yes', 'no', 'unsure'] },
  { key: 'previous_screening', label: 'Previous screening type', type: 'text', placeholder: 'e.g. VIA' },
  { key: 'hiv_status', label: 'HIV status', type: 'select', options: ['positive', 'negative', 'unknown'] },
  { key: 'smoking', label: 'Smoking status', type: 'select', options: ['yes', 'no'] },
  { key: 'symptoms', label: 'Current symptoms', type: 'textarea', placeholder: 'e.g. abnormal bleeding' },
  { key: 'family_history', label: 'Family history of cervical cancer', type: 'textarea', placeholder: 'e.g. mother had CIN' },
  { key: 'score', label: 'Risk score (optional)', type: 'number', placeholder: '0-100' },
];

export default function PatientScreening() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'pending' | 'success' | 'error'>('pending');
  const [msg, setMsg] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult('pending');
    setMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setResult('error');
        setMsg('You must be signed in to submit an assessment.');
        return;
      }

      const payload: Record<string, string | number | null> = {};
      for (const q of QUESTIONS) {
        const v = form[q.key] ?? '';
        payload[q.key] = q.type === 'number' ? (v === '' ? null : Number(v)) : (v === '' ? null : v);
      }

      const res = await apiFetch('/api/screening/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const e = await res.json();
        setResult('error');
        setMsg(e.error || 'Submission failed');
        return;
      }

      const d = await res.json();
      setResult('success');
      setMsg(`Your screening result: ${d.verdict || 'Pending'} (Risk: ${d.risk_tier || '-'})`);
      setTimeout(() => router.push('/patient/results'), 2000);
    } catch {
      setResult('error');
      setMsg('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filledCount = QUESTIONS.filter((q) => (form[q.key] ?? '') !== '').length;

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Self-Assessment</h1>
      <p className="text-sm text-gray-500">
        Answer a few questions to assess your cervical cancer risk. Results are saved to your
        profile.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {QUESTIONS.map((q) => {
          const isSelect = q.type === 'select';
          const isTextarea = q.type === 'textarea';
          return (
            <div key={q.key} className="space-y-1">
              <label className="block text-sm font-medium">{q.label}</label>
              {isSelect ? (
                <select
                  name={q.key}
                  value={form[q.key] ?? ''}
                  onChange={handleChange}
                  className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">- Select -</option>
                  {(q.options || []).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : isTextarea ? (
                <textarea
                  name={q.key}
                  rows={2}
                  value={form[q.key] ?? ''}
                  onChange={handleChange}
                  className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={q.placeholder}
                ></textarea>
              ) : (
                <input
                  type={q.type}
                  name={q.key}
                  value={form[q.key] ?? ''}
                  onChange={handleChange}
                  className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={q.placeholder}
                />
              )}
            </div>
          );
        })}

        <button
          type="submit"
          disabled={submitting || filledCount === 0}
          className="w-full rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </form>

      {result !== 'pending' && (
        <div
          className={`mt-4 p-3 rounded ${
            result === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {msg}
        </div>
      )}

      <Link href="/patient/kits" className="inline-block mt-2 text-sm text-primary hover:text-primary/90">
        Back to Kit Tracker
      </Link>
    </div>
  );
}