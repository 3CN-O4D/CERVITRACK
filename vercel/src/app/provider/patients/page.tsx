'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Patient {
  id: string;
  name: string;
  email: string;
  patient_id: string;
  county: string;
}

export default function ProviderPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('provider');
    if (!stored) { router.push('/provider/login'); return; }
    fetchPatients();
  }, [router]);

  const fetchPatients = async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/providers/patients?search=${encodeURIComponent(q)}` : '/api/providers/patients';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPatients(json.patients || json || []);
      }
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(search);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Patients</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or ID…"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          className="bg-sky-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-800"
        >
          Search
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Patient ID</th>
                <th className="px-6 py-3 font-medium">County</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No patients found</td></tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-3 text-gray-600">{p.email}</td>
                    <td className="px-6 py-3 text-gray-600 font-mono text-xs">{p.patient_id || p.id}</td>
                    <td className="px-6 py-3 text-gray-600">{p.county || '—'}</td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/provider/patient/${p.id}`}
                        className="text-sky-700 text-sm font-medium hover:underline"
                      >
                        View
                      </Link>
                    </td>
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
