'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';
import { safePhotoSrc } from '@/lib/photo';

interface UserProfile {
  name: string | null;
  email: string | null;
  county: string | null;
  photo: string | null;
  risk_index: string | null;
  created_at: string;
}

interface QuickAction {
  label: string;
  href: string;
  icon: string;
  color: string;
  sub: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Appointments', href: '/patient/appointments', icon: '📅', color: '#6C5CE7', sub: 'View schedule' },
  { label: 'Talk to Doctor', href: '/patient/telehealth', icon: '💬', color: '#00C853', sub: 'Online now' },
  { label: 'Lab Results', href: '/patient/results', icon: '🧪', color: '#FFB800', sub: 'View results' },
  { label: 'Kit Tracker', href: '/patient/kits', icon: '📦', color: '#0891B2', sub: 'Scan & track' },
  { label: 'Vaccines', href: '/patient/vaccines', icon: '💉', color: '#FF4D4D', sub: 'Track doses' },
  { label: 'Reminders', href: '/patient/reminders', icon: '🔔', color: '#F59E0B', sub: 'View scheduled' },
  { label: 'Self-Sampling', href: '/patient/self-sampling', icon: '🧬', color: '#8B5CF6', sub: 'Step-by-step' },
  { label: 'Self-Assessment', href: '/patient/screening', icon: '📋', color: '#EC4899', sub: 'Risk check' },
  { label: 'Health Library', href: '/patient/library', icon: '📖', color: '#06B6D4', sub: 'Learn more' },
  { label: 'AI Assistant', href: '/patient/assistant', icon: '🤖', color: '#8B5CF6', sub: 'Ask anything' },
  { label: 'My Results', href: '/patient/results', icon: '🩺', color: '#F97316', sub: 'All results' },
  { label: 'Find Clinician', href: '/patient/clinicians', icon: '🔎', color: '#10B981', sub: 'Search doctors' },
];

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>({ name: null, email: null, county: null, photo: null, risk_index: null, created_at: '' });
  const [screenings, setScreenings] = useState<any[]>([]);
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [riskExpanded, setRiskExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('name, email, county, photo, risk_index, created_at')
        .eq('id', session.user.id)
        .maybeSingle();
      setUser(profile || { name: null, email: null, county: null, photo: null, risk_index: null, created_at: '' });

      try {
        const res = await apiFetch('/api/screenings?profile_id=' + session.user.id);
        if (res.ok) {
          const d = await res.json();
          setScreenings(d.screenings || []);
        }
      } catch { /* defaults */ }

      try {
        const res = await apiFetch('/api/vaccines?user_id=' + session.user.id);
        if (res.ok) {
          const d = await res.json();
          setVaccines(Array.isArray(d) ? d : []);
        }
      } catch { /* defaults */ }

      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('read', false);
        setUnread(count || 0);
      } catch { /* defaults */ }

      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-500">Loading…</div>;

  const firstName = (user.name || 'User').split(' ')[0];
  const totalScreenings = screenings.length;
  const totalVaccines = vaccines.length;
  const hpvPositive = screenings.filter((s) => s.verdict === 'POSITIVE').length;
  const isHighRisk = user.risk_index === 'high';
  const isAssessed = !!user.risk_index;
  const riskFactors = [
    { label: 'Age over 30', met: true },
    { label: 'HIV Positive', met: false },
    { label: 'Previous abnormal screening', met: isHighRisk },
    { label: 'Smoking history', met: false },
    { label: 'Family history', met: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎗️</span>
          <span className="text-xl font-extrabold tracking-tight text-[#1E1A4B]">CerviTrack</span>
        </div>
        <Link href="/patient/notifications" className="relative p-1">
          <span className="text-2xl">🔔</span>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>
      </div>

      <div className="flex items-center gap-4 rounded-3xl border border-primary/10 bg-primary-light p-4">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary">
          {safePhotoSrc(user.photo) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={safePhotoSrc(user.photo) as string} alt={user.name || 'Profile'} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-extrabold text-white">{(user.name || 'U').trim()[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-[#1E1A4B]">Hello, {firstName}</div>
          <div className="text-xs text-gray-500">Welcome back to your health dashboard</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => (isAssessed ? setRiskExpanded(!riskExpanded) : router.push('/patient/screening'))}
        className={`w-full rounded-3xl border bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md ${
          !isAssessed ? 'border-gray-300' : isHighRisk ? 'border-danger/40' : 'border-success/40'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl ${
            !isAssessed ? 'bg-gray-100' : isHighRisk ? 'bg-danger/10' : 'bg-success/10'
          }`}>
            <span className="text-2xl">{!isAssessed ? '❔' : isHighRisk ? '⚠️' : '🛡️'}</span>
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Risk Status</div>
            <div className={`text-2xl font-extrabold ${!isAssessed ? 'text-gray-400' : isHighRisk ? 'text-danger' : 'text-success'}`}>
              {!isAssessed ? 'Not Assessed' : isHighRisk ? 'High Risk' : 'Low Risk'}
            </div>
          </div>
          <span className="text-gray-400">{!isAssessed ? '→' : riskExpanded ? '⌃' : '⌄'}</span>
        </div>

        {isAssessed && riskExpanded && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="mb-2 text-[13px] font-bold text-gray-500">Contributing Factors</div>
            {riskFactors.map((f) => (
              <div key={f.label} className="mb-2 flex items-center gap-2">
                <span className={f.met ? 'text-success' : 'text-danger'}>{f.met ? '✅' : '❌'}</span>
                <span className="flex-1 text-sm font-semibold text-[#1E1A4B]">{f.label}</span>
                <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold ${f.met ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {f.met ? 'YES' : 'NO'}
                </span>
              </div>
            ))}
            <div className="mt-3 flex gap-2 rounded-2xl bg-[#FFF8E1] p-3.5">
              <span>💡</span>
              <span className="text-[13px] font-medium leading-relaxed text-[#1E1A4B]">
                {isHighRisk
                  ? 'Please schedule an appointment with your gynecologist as soon as possible. Early detection is key.'
                  : 'Great job! Continue with regular screenings and maintain a healthy lifestyle.'}
              </span>
            </div>
          </div>
        )}

        {!isAssessed && (
          <div className="mt-3 border-t border-gray-100 pt-3 text-center text-xs font-semibold text-gray-400">
            Tap to take the risk assessment questionnaire
          </div>
        )}
      </button>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-primary/20 bg-white py-4 text-center">
          <div className="text-xl">🧪</div>
          <div className="mt-1.5 text-2xl font-extrabold text-[#1E1A4B]">{totalScreenings}</div>
          <div className="mt-1 text-[10px] font-semibold text-gray-500">Screenings</div>
        </div>
        <div className="rounded-2xl border border-danger/20 bg-white py-4 text-center">
          <div className="text-xl">🦠</div>
          <div className="mt-1.5 text-2xl font-extrabold text-danger">{hpvPositive}</div>
          <div className="mt-1 text-[10px] font-semibold text-gray-500">HPV+ Cases</div>
        </div>
        <div className="rounded-2xl border border-success/20 bg-white py-4 text-center">
          <div className="text-xl">✅</div>
          <div className="mt-1.5 text-2xl font-extrabold text-success">{totalVaccines}</div>
          <div className="mt-1 text-[10px] font-semibold text-gray-500">Vaccines</div>
        </div>
      </div>

      <div>
        <div className="mb-3.5 text-base font-extrabold text-[#1E1A4B]">Quick Actions</div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: action.color + '15' }}>
                {action.icon}
              </div>
              <div className="text-sm font-bold text-[#1E1A4B]">{action.label}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-gray-500">{action.sub}</div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3.5 text-base font-extrabold text-[#1E1A4B]">Your Health Summary</div>
        <div className="space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span>🛡️</span>
            <span className="text-sm font-semibold text-[#1E1A4B]">
              Risk Level:{' '}
              <span className={`font-extrabold ${isHighRisk ? 'text-danger' : 'text-success'}`}>
                {user.risk_index === 'high' ? 'High' : user.risk_index === 'medium' ? 'Medium' : 'Low'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>📅</span>
            <span className="text-sm font-semibold text-gray-500">
              {totalScreenings > 0
                ? `${totalScreenings} screening${totalScreenings > 1 ? 's' : ''} completed`
                : 'No screenings yet — take your first risk assessment'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>💉</span>
            <span className="text-sm font-semibold text-gray-500">
              {totalVaccines > 0 ? `${totalVaccines} vaccine${totalVaccines > 1 ? 's' : ''} recorded` : 'No vaccines recorded yet'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
