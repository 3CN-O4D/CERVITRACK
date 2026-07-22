'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Facility {
  id: string;
  name: string;
  code: string;
  county: string;
  subCounty: string;
  ward: string;
  facilityType: string;
  phone: string;
  _count: { patients: number; screenings: number; users: number };
}

interface FacilityStats {
  totalPatients: number;
  totalScreenings: number;
  screeningsByResult: { result: string; count: number }[];
}

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [county, setCounty] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [stats, setStats] = useState<FacilityStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchFacilities(); }, [page, county, typeFilter]);

  async function fetchFacilities() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (county) params.set('county', county);
      if (typeFilter) params.set('type', typeFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/facilities?${params}`);
      if (!res.ok) throw new Error('Failed to fetch facilities');
      const data = await res.json();
      setFacilities(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function viewFacilityStats(id: string) {
    try {
      const f = facilities.find((f) => f.id === id);
      if (f) setSelectedFacility(f);
      const res = await fetch(`/api/facilities/${id}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  }

  const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Uasin Gishu', 'Kilifi', 'Machakos', 'Meru', 'Kakamega'];
  const types = [
    { value: '', label: 'All Types' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'health_center', label: 'Health Center' },
    { value: 'dispensary', label: 'Dispensary' },
    { value: 'clinic', label: 'Clinic' },
  ];
  const typeColors: Record<string, string> = {
    hospital: 'bg-sky-100 text-sky-700',
    health_center: 'bg-emerald-100 text-emerald-700',
    dispensary: 'bg-amber-100 text-amber-700',
    clinic: 'bg-violet-100 text-violet-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-sky-700">CerviTrack</Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-600">Facility Registry</span>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-sky-700">Home</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchFacilities(); } }}
              placeholder="Search facility name or MFL code..."
              className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <select value={county} onChange={(e) => { setCounty(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">All Counties</option>
              {counties.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button onClick={() => { setPage(1); fetchFacilities(); }}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">
              Search
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading facilities...</div>
        ) : facilities.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">No facilities found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilities.map((f) => (
                <div key={f.id} onClick={() => viewFacilityStats(f.id)}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{f.name}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">MFL: {f.code}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[f.facilityType] || 'bg-gray-100 text-gray-700'}`}>
                      {f.facilityType?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>{f.county} County, {f.subCounty}{f.ward ? `, ${f.ward}` : ''}</p>
                    {f.phone && <p>{f.phone}</p>}
                  </div>
                  <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{f._count?.patients || 0}</div>
                      <div className="text-xs text-gray-400">Patients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{f._count?.screenings || 0}</div>
                      <div className="text-xs text-gray-400">Screenings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{f._count?.users || 0}</div>
                      <div className="text-xs text-gray-400">Staff</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Prev</button>
                <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Facility Detail Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedFacility.name}</h3>
                <p className="text-sm text-gray-500">MFL: {selectedFacility.code} &middot; {selectedFacility.county} County</p>
              </div>
              <button onClick={() => { setSelectedFacility(null); setStats(null); }}
                className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-sky-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-sky-700">{stats.totalPatients}</div>
                    <div className="text-xs text-gray-500">Total Patients</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-700">{stats.totalScreenings}</div>
                    <div className="text-xs text-gray-500">Total Screenings</div>
                  </div>
                </div>
                {stats.screeningsByResult.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Screening Results</h4>
                    <div className="space-y-2">
                      {stats.screeningsByResult.map((r) => (
                        <div key={r.result} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{r.result || 'Pending'}</span>
                          <span className="font-medium">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">Loading stats...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
