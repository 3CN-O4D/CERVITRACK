'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase-browser';
import { PortalConfig, getPortalForRole, PortalRole } from '@/lib/portalConfig';

export default function PortalLoginForm({ portal }: { portal: PortalConfig }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [county, setCounty] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [mode]);

  // If already signed in, route to correct portal based on role
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      const role = (profile?.role || (session.user.user_metadata as any)?.role || '') as PortalRole;
      if (portal.allowedRoles.includes(role)) {
        router.push(portal.path);
      } else {
        await supabase.auth.signOut();
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'register') {
      if (!email || !password) { setError('Email and password are required.'); setLoading(false); return; }
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email, password,
            name: name || email.split('@')[0],
            phone: phone || null,
            county: county || null,
            role: portal.allowedRoles[0],
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error || 'Registration failed.');
          setLoading(false);
          return;
        }
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setSuccess('Account created. Please sign in.');
          setMode('login');
          setLoading(false);
          return;
        }
        // Verify role matches the portal
        const { data: { user: u } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from('users').select('role').eq('id', u?.id || '').maybeSingle();
        const role = (profile?.role || '') as PortalRole;
        if (!portal.allowedRoles.includes(role)) {
          await supabase.auth.signOut();
          setError(`This account can only be created for its declared role (${role}). It cannot be reused on this portal.`);
          setLoading(false);
          return;
        }
        setSuccess('Account created. Signing you in…');
        router.push(portal.path);
      } catch (err: any) {
        setError(err?.message || 'Registration failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // LOGIN
    if (!email || !password) { setError('Email and password are required.'); setLoading(false); return; }
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr || !data.user) {
        setError(signInErr?.message || 'Invalid credentials.');
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from('users').select('role').eq('id', data.user.id).maybeSingle();
      const role = (profile?.role || (data.user.user_metadata as any)?.role || '') as PortalRole;
      if (!portal.allowedRoles.includes(role)) {
        await supabase.auth.signOut();
        const target = getPortalForRole(role);
        setError(
          `${portal.forbiddenMessage} If you are a ${target.sublabel}, sign in at /login/${target.id}.`
        );
        setLoading(false);
        return;
      }
      router.push(portal.path);
    } catch (err: any) {
      setError(err?.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  const gradients = `bg-gradient-to-b ${portal.from} ${portal.to}`;

  return (
    <div className={`min-h-screen flex items-center justify-center ${gradients}`}>
      <div className="w-full max-w-md p-8">
        <Link href="/" className="flex items-center justify-center gap-3 mb-6">
          <Image src="/logo.jpeg" alt="CerviTrack" width={42} height={28} className="rounded-lg" />
          <span className={`text-2xl font-bold ${portal.primary}`}>CerviTrack</span>
        </Link>

        <div className={`rounded-2xl p-1 shadow-lg bg-white border-t-4`} style={{ borderTopColor: portal.iconColor }}>
          <div className="p-6">
            <h1 className={`text-2xl font-extrabold ${portal.primary} mb-1`}>{portal.pageTitle}</h1>
            <p className="text-sm text-gray-500 mb-6">{portal.pageHint}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ outlineColor: portal.iconColor }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="County"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                  />
                </>
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors ${portal.primaryDeep}`}
              >
                {loading ? 'Please wait…' : mode === 'login' ? `Sign in to ${portal.label}` : `Create ${portal.label} account`}
              </button>
            </form>

            <p className="text-center mt-5 text-sm text-gray-600">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className={`font-medium hover:underline ${portal.primary}`}
              >
                {mode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>

            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">Other portals</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                {(['admin', 'clinician', 'lab', 'county-admin', 'patient'] as const)
                  .filter((id) => id !== portal.id)
                  .map((id) => (
                    <Link
                      key={id}
                      href={`/login/${id}`}
                      className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      {id === 'county-admin' ? 'County' : id.charAt(0).toUpperCase() + id.slice(1)}
                    </Link>
                  ))}
                <Link href="/" className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">Home</Link>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center mt-4 text-[10px] text-gray-400">
          Each account belongs to exactly one service. You cannot log in here with an account from a different service.
        </p>
      </div>
    </div>
  );
}
