'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';

interface NavItem {
  label: string;
  href: string;
  disabled?: boolean;
}

export default function PatientLayout({
  children,
}: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState('');

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
    { label: 'Self-Test', href: '/patient/test', disabled: userRole !== 'patient' },
    { label: 'Kit Tracker', href: '/patient/kits', disabled: userRole !== 'patient' },
    { label: 'Vaccinations', href: '/patient/vaccines', disabled: userRole !== 'patient' },
    { label: 'Appointments', href: '/patient/appointments', disabled: userRole !== 'patient' },
    { label: 'Notifications', href: '/patient/notifications', disabled: userRole !== 'patient' },
    { label: 'Messages', href: '/patient/messages', disabled: userRole !== 'patient' },
    { label: 'Care Team', href: '/patient/consent', disabled: userRole !== 'patient' },
    { label: 'Profile', href: '/patient/profile', disabled: userRole !== 'patient' },
    { label: 'Sign Out', href: '/auth?signout', disabled: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow border-y border-gray-200">
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

      <main className="max-w-7xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
}