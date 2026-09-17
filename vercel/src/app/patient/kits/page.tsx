'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

export default function PatientKits() {
  const [user, setUser] = useState({ id: '' });
  const [kits, setKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session} } = await supabase.auth.getSession();
      if (!session) return;
      setUser({ id: session.user.id });
      try {
        const res = await apiFetch('/api/sample-kits?patientId=' + user.id + '&limit=50');
        if (res.ok) {
          const d = await res.json();
          const items: any[] = (d.data || []).map((k: any) => ({
            id: k.id, barcode: k.barcode, status: k.status, patientName: k.patient_name,
            kitType: k.kit_type, createdAt: k.created_at, updatedAt: k.updated_at,
            currentLocation: k.current_location, result: k.result || '-',
          }));
          setKits(items);
        }
      } catch { }
      setLoading(false);
    }
    init();
  }, [user.id]);

  if (loading) return <div className="h-96 flex items-center justify-center text-gray-500">Loading</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kit Tracker</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kits.map((k) => (
          <div key={k.id} className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{k.barcode || 'Unknown'}</p>
                <p className="text-xs text-gray-500">Barcode</p>
              </div>
            </div>
            <p className="mt-1 text-sm">Status: {k.status || 'Unknown'}</p>
            {k.patientName && <p className="text-xs text-gray-500 mt-1">Linked to: {k.patientName}</p>}
            {k.kitType && <p className="text-xs text-gray-500">Type: {k.kitType}</p>}
            <p className="mt-1 text-xs text-gray-500">Collected: {k.collectedAt || 'Not yet'}</p>
            <p className="mt-1 text-xs text-gray-500">Last updated: {k.updatedAt ? new Date(k.updatedAt).toLocaleDateString() : 'Unknown'}</p>
          </div>
        ))}
      </div>

      {!kits.length && <p className="text-gray-500">No kits found.</p>}

      <div className="mt-6 flex gap-3">
        <Link href="/patient/test" className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors">
          Take a Self-Test
        </Link>
        <Link href="/patient/results" className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700">
          View My Results
        </Link>
      </div>
    </div>
  );
}