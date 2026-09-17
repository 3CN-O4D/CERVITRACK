'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function CliniciansPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      try {
        const { data } = await supabase
          .from('providers')
          .select('id, name, specialty, hospital')
          .order('name', { ascending: true });
        setProviders(data || []);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const filtered = providers.filter(
    (p) =>
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      (p.specialty && p.specialty.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link
        href="/patient"
        className="mb-6 block text-primary hover:text-primary/90 text-lg font-medium transition-colors">
        ← Back to Dashboard
      </Link>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Find a Clinician</h1>

        <div className="mb-4 rounded-xl border border-gray-200 p-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clinicians…"
            className="w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading ? (
          <p className="text-gray-500">Loading clinicians…</p>
        ) : providers.length === 0 ? (
          <p className="text-gray-500">
            No clinicians found. Contact your health facility directly.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <div>
                  <p className="font-medium">{p.name || 'Unnamed'}</p>
                  <p className="text-xs text-gray-500">
                    {p.specialty || '—'} — {p.hospital || '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link
            href="/patient/self-sampling"
            className="inline-block text-primary hover:text-primary/90 text-sm font-medium">
            Request a clinician appointment
          </Link>
        </div>
      </div>
    </div>
  );
}