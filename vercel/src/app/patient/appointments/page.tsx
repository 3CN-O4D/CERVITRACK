'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

export default function PatientAppointments() {
  const [user, setUser] = useState({ id: '' });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session} } = await supabase.auth.getSession();
      if (!session) return;
      setUser({ id: session.user.id });
      try {
        const res = await apiFetch('/api/appointments?user_id=' + user.id);
        if (res.ok) {
          const d = await res.json();
          const items: any[] = (Array.isArray(d) ? d : []).map((a: any) => ({
            id: a.id, title: a.title || 'Appointment', facility: a.facility_name || '',
            date: a.date || '', time: a.time || '', status: a.status || 'upcoming', notes: a.notes || '',
          }));
          setAppointments(items);
        }
      } catch { }
      setLoading(false);
    }
    init();
  }, [user.id]);

  if (loading) return <div className="h-96 flex items-center justify-center text-gray-500">Loading</div>;

  const statusStyles: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Appointments</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {appointments.map((a) => (
          <div key={a.id} className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-gray-500">{a.facility}</p>
              </div>
            </div>
            <p className="mt-1">{a.date} at {a.time || 'Unscheduled'}</p>
            <span className={`inline-block mt-2 text-sm font-medium px-2 py-0.5 rounded ${statusStyles[a.status] || 'bg-gray-100 text-gray-700'}`}>
              {a.status}
            </span>
            {a.notes && <p className="text-xs text-gray-500 mt-1">Notes: {a.notes}</p>}
          </div>
        ))}
      </div>

      {!appointments.length && <p className="text-gray-500">No appointments found.</p>}

      <div className="mt-6">
        <Link href="/patient/kits" className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors">
          Back to Kit Tracker
        </Link>
      </div>
    </div>
  );
}