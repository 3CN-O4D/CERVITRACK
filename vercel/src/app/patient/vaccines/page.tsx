'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

export default function PatientVaccines() {
  const [user, setUser] = useState({ id: '' });
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session} } = await supabase.auth.getSession();
      if (!session) return;
      setUser({ id: session.user.id });
      try {
        const res = await apiFetch('/api/vaccines?user_id=' + user.id);
        if (res.ok) {
          const d = await res.json();
          const items: any[] = (Array.isArray(d) ? d : []).map((v: any) => ({
            id: v.id, name: v.name, hospital: v.hospital || '', date: v.date || '',
            status: v.status || 'scheduled', createdAt: v.created_at,
          }));
          setVaccines(items);
        }
      } catch { }
      setLoading(false);
    }
    init();
  }, [user.id]);

  if (loading) return <div className="h-96 flex items-center justify-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vaccinations</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {vaccines.map((v) => (
          <div key={v.id} className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <div>
                <p className="font-medium">{v.name}</p>
                <p className="text-xs text-gray-500">{v.hospital}</p>
              </div>
            </div>
            <p className="mt-1 text-sm">Status: {v.status}</p>
            <p className="text-xs text-gray-500 mt-1">Date: {v.date}</p>
            {v.createdAt && <p className="text-xs text-gray-500">Recorded: {new Date(v.createdAt).toLocaleDateString()}</p>}
          </div>
        ))}
      </div>

      {!vaccines.length && <p className="text-gray-500">No vaccination records found.</p>}

      <div className="mt-6">
        <Link href="/patient/kits" className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors">
          Back to Kit Tracker
        </Link>
      </div>
    </div>
  );
}