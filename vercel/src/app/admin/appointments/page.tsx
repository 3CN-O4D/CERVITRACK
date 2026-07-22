'use client';

import { useState, useEffect } from 'react';

interface Appointment {
  id: string;
  patient_name: string;
  patient_email: string;
  title: string;
  facility: string;
  date: string;
  status: string;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  upcoming: 'bg-sky-50 text-sky-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/admin/appointments');
      if (!res.ok) throw new Error('Failed to load appointments');
      const json = await res.json();
      setAppointments(json.appointments || json || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Patient</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Title / Facility</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No appointments</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{a.patient_name}</td>
                    <td className="px-6 py-3 text-gray-600">{a.patient_email}</td>
                    <td className="px-6 py-3 text-gray-600">
                      <div>{a.title}</div>
                      {a.facility && <div className="text-xs text-gray-400">{a.facility}</div>}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[a.status] || 'bg-gray-50 text-gray-700'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
