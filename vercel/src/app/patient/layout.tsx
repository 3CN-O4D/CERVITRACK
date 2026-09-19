'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';

interface NavItem {
  label: string;
  href: string;
  disabled?: boolean;
  icon?: string;
}

const MOBILE_TABS: NavItem[] = [
  { label: 'Home', href: '/patient', icon: '🏠' },
  { label: 'Screening', href: '/patient/screening', icon: '📋' },
  { label: 'Vaccines', href: '/patient/vaccines', icon: '💉' },
  { label: 'Appointments', href: '/patient/appointments', icon: '📅' },
  { label: 'Library', href: '/patient/library', icon: '📖' },
];

export default function PatientLayout({
  children,
}: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);

  const ROLE_PORTALS: Record<string, string> = {
    admin: '/admin',
    national_admin: '/admin',
    system_admin: '/admin',
    county_admin: '/county',
    clinician: '/workspace',
    provider: '/workspace',
    lab_technician: '/lab',
    facility_admin: '/admin',
  };

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      const role = profile?.role || '';
      setUserRole(role);
      setSession(session);
      if (role && role !== 'patient') {
        router.push(ROLE_PORTALS[role] || '/auth');
      }
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth?redirect=/patient');
      }
      setSession(session ?? null);
    });
    return () => subscription?.unsubscribe();
  }, [router]);

  if (!session) return null;

  const nav: NavItem[] = [
    { label: 'Dashboard', href: '/patient', disabled: userRole !== 'patient' },
    { label: 'Self-Assessment', href: '/patient/screening', disabled: userRole !== 'patient' },
    { label: 'My Results', href: '/patient/results', disabled: userRole !== 'patient' },
    { label: 'Self-Sampling', href: '/patient/self-sampling', disabled: userRole !== 'patient' },
    { label: 'Sample & Submit', href: '/patient/test', disabled: userRole !== 'patient' },
    { label: 'Kit Tracker', href: '/patient/kits', disabled: userRole !== 'patient' },
    { label: 'Vaccinations', href: '/patient/vaccines', disabled: userRole !== 'patient' },
    { label: 'Appointments', href: '/patient/appointments', disabled: userRole !== 'patient' },
    { label: 'Notifications', href: '/patient/notifications', disabled: userRole !== 'patient' },
    { label: 'Messages', href: '/patient/messages', disabled: userRole !== 'patient' },
    { label: 'Care Team', href: '/patient/consent', disabled: userRole !== 'patient' },
    { label: 'Profile', href: '/patient/profile', disabled: userRole !== 'patient' },
    { label: 'Health', href: '/patient/health', disabled: userRole !== 'patient' },
    { label: 'Library', href: '/patient/library', disabled: userRole !== 'patient' },
    { label: 'Telehealth', href: '/patient/telehealth', disabled: userRole !== 'patient' },
    { label: 'Reminders', href: '/patient/reminders', disabled: userRole !== 'patient' },
    { label: 'Clinicians', href: '/patient/clinicians', disabled: userRole !== 'patient' },
    { label: 'AI Assistant', href: '/patient/assistant', disabled: userRole !== 'patient' },
    { label: 'Feedback', href: '/patient/feedback', disabled: userRole !== 'patient' },
    { label: 'Sign Out', href: '/auth?signout', disabled: false },
  ];

  const active = (href: string) => (href === '/patient' ? pathname === '/patient' : pathname.startsWith(href));
  const moreItems = nav.filter((i) => !MOBILE_TABS.some((t) => t.href === i.href));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow border-y border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/patient"
              className="font-medium text-lg hover:text-primary transition-colors"
            >
              CerviTrack
            </Link>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  text-sm font-medium transition-colors ${item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'hover:text-primary'}
                `}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {nav.find((i) => i.label === 'Sign Out') && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  supabase.auth.signOut();
                  router.push('/auth?redirect=/patient');
                }}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 pb-28 sm:pb-8">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white sm:hidden print:hidden">
        <div className="flex items-stretch justify-around">
          {MOBILE_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${
                active(tab.href) ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <span className={`h-1 w-8 rounded-full ${active(tab.href) ? 'bg-primary' : 'bg-transparent'}`} />
              <span className={`text-lg leading-none ${active(tab.href) ? '' : 'grayscale opacity-70'}`}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${
              moreOpen ? 'text-primary' : 'text-gray-400'
            }`}
          >
            <span className="h-1 w-8 rounded-full bg-transparent" />
            <span className="text-lg leading-none opacity-80">⋯</span>
            <span>More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 sm:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
            <div className="mb-3 font-extrabold text-[#1E1A4B]">More</div>
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`rounded-2xl border border-gray-100 bg-gray-50 px-2 py-3 text-center text-xs font-semibold ${
                    active(item.href) ? 'border-primary/40 text-primary' : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}