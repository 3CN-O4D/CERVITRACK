'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Provider {
  id: string;
  name: string;
  email: string;
  facility: string;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('provider');
    if (!stored) {
      router.push('/provider/login');
      return;
    }
    const p = JSON.parse(stored);
    setProvider(p);
    fetchPatientCount();
  }, [router]);

  const fetchPatientCount = async () => {
    try {
      const res = await fetch('/api/providers/patients');
      if (res.ok) {
        const json = await res.json();
        setPatientCount((json.patients || json || []).length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!provider) return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome, {provider.name}
      </h1>
      <p className="text-gray-500 text-sm mb-8">{provider.facility || 'CerviTrack Provider Portal'}</p>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <p className="text-sm text-gray-500">Total Patients</p>
            <p className="text-3xl font-bold text-sky-700 mt-1">{patientCount}</p>
          </div>

          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/provider/patients"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Lookup Patient</h3>
              <p className="text-xs text-gray-500 mt-1">Search and view patient records</p>
            </Link>

            <Link
              href="/provider/schedule"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">View Schedule</h3>
              <p className="text-xs text-gray-500 mt-1">Manage appointments &amp; actions</p>
            </Link>

            <Link
              href="/provider/patients"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Send Notification</h3>
              <p className="text-xs text-gray-500 mt-1">Notify patients of important updates</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
