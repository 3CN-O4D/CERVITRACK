'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialty: string;
  hospital: string;
  license_number: string;
  approval_status: string;
  specialization: string;
  county: string;
  sub_county: string;
  bio: string;
  photo: string;
  years_experience: number;
  created_at: string;
}

const SPECIALTIES = [
  { value: 'oncologist', label: 'Oncologist' },
  { value: 'gynecologist', label: 'Gynecologist' },
  { value: 'nurse_practitioner', label: 'Nurse Practitioner' },
  { value: 'public_health_officer', label: 'Public Health Officer' },
  { value: 'pathologist', label: 'Pathologist' },
  { value: 'general_practitioner', label: 'General Practitioner' },
  { value: 'other', label: 'Other' },
];

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Nyeri', 'Meru',
  'Machakos', 'Garissa', 'Kakamega', 'Busia', 'Trans-Nzoia', 'Kiambu', 'Embu',
];

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [approving, setApproving] = useState<Provider | null>(null);
  const [approveForm, setApproveForm] = useState({
    specialization: 'general_practitioner',
    hospital: '',
    county: '',
    bio: '',
    years_experience: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchProviders(); }, [filter]);

  async function fetchProviders() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/providers?status=${filter}`);
      if (res.ok) setProviders(await res.json());
    } catch { setError('Failed to load providers'); }
    finally { setLoading(false); }
  }

  async function handleApprove() {
    if (!approving) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/providers/${approving.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', ...approveForm }),
      });
      if (res.ok) {
        setSuccess(`${approving.name} approved`);
        setApproving(null);
        fetchProviders();
      } else {
        const err = await res.json();
        setError(err.message || 'Failed');
      }
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  }

  async function handleReject(id: string) {
    if (!confirm('Reject this provider?')) return;
    try {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      if (res.ok) {
        setSuccess('Provider rejected');
        fetchProviders();
      }
    } catch { setError('Failed'); }
  }

  const filtered = providers.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.hospital?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-sky-700">CerviTrack</Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-600">Manage Clinicians</span>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-sky-700">Admin Dashboard</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm">{success}</div>}

        <div className="flex gap-2 mb-4">
          {['pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-sky-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or hospital..."
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-sky-500" />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="font-medium">No providers found</p>
            <p className="text-sm mt-1">{filter === 'pending' ? 'No pending approvals' : `No ${filter} providers`}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Hospital</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Specialty</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-sm text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.hospital || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.specialty || p.specialization || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        p.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.approval_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {p.approval_status !== 'approved' && (
                        <button onClick={() => { setApproving(p); setApproveForm({ specialization: p.specialization || 'general_practitioner', hospital: p.hospital || '', county: p.county || '', bio: p.bio || '', years_experience: p.years_experience || 0 }); }}
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700">
                          Approve
                        </button>
                      )}
                      {p.approval_status !== 'rejected' && (
                        <button onClick={() => handleReject(p.id)}
                          className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700">
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {approving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Approve Clinician</h3>
            <p className="text-sm text-gray-500 mb-4">{approving.name} — {approving.email}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select value={approveForm.specialization} onChange={(e) => setApproveForm({ ...approveForm, specialization: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {SPECIALTIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facility / Hospital</label>
                <input type="text" value={approveForm.hospital} onChange={(e) => setApproveForm({ ...approveForm, hospital: e.target.value })}
                  placeholder="e.g., Moi Teaching and Referral Hospital"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                <select value={approveForm.county} onChange={(e) => setApproveForm({ ...approveForm, county: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select county...</option>
                  {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio (optional)</label>
                <textarea value={approveForm.bio} onChange={(e) => setApproveForm({ ...approveForm, bio: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2}
                  placeholder="Brief professional bio..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input type="number" value={approveForm.years_experience} onChange={(e) => setApproveForm({ ...approveForm, years_experience: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setApproving(null)}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleApprove} disabled={submitting}
                className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Approving...' : 'Approve & Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
