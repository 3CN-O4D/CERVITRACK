'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function TelehealthPage() {
  const router = useRouter();
  const [consults, setConsults] = useState<any[]>([]);
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
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('type', 'appointment');
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

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Telehealth</h1>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Virtual consultations are currently being processed. Check your
              <Link href="/patient/notifications" className="underline">
                notifications
              </Link>
              for updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}