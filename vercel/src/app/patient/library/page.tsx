'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function LibraryPage() {
  const router = useRouter();
  const [kits, setKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      try {
        const { count: total } = await supabase
          .from('sample_kits')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', session.user.id);
        setKits((await supabase
          .from('sample_kits')
          .select('*')
          .eq('patient_id', session.user.id)
          .order('created_at', { ascending: false })).data || []);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link
        href="/patient"
        className="mb-6 block text-primary hover:text-primary/90 text-lg font-medium transition-colors">
        ← Back to Dashboard
      </Link>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Kit Library</h1>

        {loading ? (
          <p className="text-gray-500">Loading kits…</p>
        ) : kits.length === 0 ? (
          <p className="text-gray-500">No kits found. Scan a kit to begin.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {kits.slice(0, 6).map((k) => (
              <div
                key={k.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{k.barcode?.slice(0, 8)}…</span>
                  <div>
                    <p className="font-medium">{k.status || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">Type: {k.kit_type || '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link
            href="/patient/self-sampling"
            className="inline-block text-primary hover:text-primary/90 text-sm font-medium">
            + Register a new kit
          </Link>
        </div>
      </div>
    </div>
  );
}