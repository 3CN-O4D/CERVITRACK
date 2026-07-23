'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import Image from 'next/image';

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white"><p className="text-gray-400">Loading...</p></div>}>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'register') {
        if (!name || !email || !password) {
          setError('Name, email, and password are required.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, phone: phone || null, role: 'patient' }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          setError(data.error || 'Registration failed.');
        } else {
          setSuccess('Account created! Signing you in...');
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            setSuccess('Account created! Please sign in.');
            setMode('login');
          } else {
            router.push('/workspace');
          }
        }
      } else {
        if (!email || !password) {
          setError('Email and password are required.');
          setLoading(false);
          return;
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        } else if (data.user) {
          const role = data.user.user_metadata?.role || data.user.app_metadata?.role;

          if (redirect) {
            router.push(redirect);
          } else if (role === 'admin' || role === 'system_admin' || role === 'national_admin' || role === 'county_admin') {
            router.push('/admin');
          } else if (role === 'lab_technician') {
            router.push('/lab');
          } else if (role === 'clinician' || role === 'provider') {
            router.push('/workspace');
          } else {
            setSuccess('Welcome! Please open the CerviTrack mobile app to continue.');
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
      <div className="w-full max-w-md p-8">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <Image src="/logo.jpeg" alt="CerviTrack" width={48} height={32} className="rounded-lg" />
          <span className="text-2xl font-bold text-sky-800">CerviTrack</span>
        </Link>
        <h1 className="text-3xl font-bold text-sky-900 mb-6 text-center">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          <input
            type="tel"
            placeholder="Phone number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-700 text-white py-3 rounded-lg font-semibold hover:bg-sky-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
            className="text-sky-700 font-medium hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link href="/provider/login" className="text-sm text-gray-500 hover:text-sky-700">
            Provider login
          </Link>
        </div>
      </div>
    </div>
  );
}
