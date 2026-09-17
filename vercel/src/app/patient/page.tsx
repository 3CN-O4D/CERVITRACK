'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

interface UserProfile {
  name: string | null;
  email: string | null;
  county: string | null;
  sub_county: string | null;
  ward: string | null;
  photo: string | null;
  created_at: string;
}

interface DashboardCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>({ name: null, email: null, county: null, sub_county: null, ward: null, photo: null, created_at: '' });
  const [screenings, setScreenings] = useState<number>(0);
  const [vaccines, setVaccines] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('name, email, county, sub_county, ward, photo, created_at')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setUser(profile || { name: null, email: null, county: null, sub_county: null, ward: null, photo: null, created_at: '' });

      const { count: sCount, error: sErr } = await supabase
        .from('screenings')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', session.user.id);

      if (sErr) throw sErr;
      setScreenings(sCount || 0);

      const { count: vCount, error: vErr } = await supabase
        .from('vaccines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      if (vErr) throw vErr;
      setVaccines(vCount || 0);

      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-500">Loading…</div>;

  const cards: DashboardCard[] = [
    { title: 'Screenings', value: screenings, subtitle: 'Risk assessments completed' },
    { title: 'Vaccines', value: vaccines, subtitle: 'Vaccination records' },
    { title: 'Last Assessment', value: user.created_at ? new Date(user.created_at).toLocaleDateString() : '—', subtitle: user.name ? `Welcome, ${user.name}` : '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary">
          {user.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photo} alt={user.name || 'Profile'} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-extrabold text-white">{(user.name || 'U').trim()[0]?.toUpperCase()}</span>
          )}
        </div>
        <div>
          <div className="text-lg font-bold">Hello, {(user.name || 'there').split(' ')[0]}</div>
          <div className="text-sm text-gray-500">Welcome back to your health dashboard</div>
        </div>
      </div>

      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl font-medium">{c.title}</div>
            <div className="mt-1 text-4xl font-bold">{c.value}</div>
            {c.subtitle && <div className="mt-1 text-sm text-gray-500">{c.subtitle}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        {[
          { label: 'Self-Assessment', href: '/patient/screening', Icon: '📋' },
          { label: 'My Results', href: '/patient/results', Icon: '📊' },
          { label: 'Self-Test', href: '/patient/test', Icon: '🧪' },
          { label: 'Self-Sampling', href: '/patient/self-sampling', Icon: '🧬' },
          { label: 'Kit Tracker', href: '/patient/kits', Icon: '📦' },
        ].map((it) => (
          <Link
            key={it.label}
            href={it.href}
            className="flex items-center gap-2 rounded-lg border p-3 bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">{it.Icon}</span>
            <span className="font-medium">{it.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}