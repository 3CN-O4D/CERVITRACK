'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface KitRequest {
  id: number;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_county: string;
  user_sub_county: string;
  user_ward: string;
  status: string;
  notes: string;
  admin_notes: string;
  contacted_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#D97706', bg: '#FEF3C7' },
  contacted: { label: 'Contacted', color: '#2563EB', bg: '#DBEAFE' },
  arranged: { label: 'Arranged', color: '#7C3AED', bg: '#EDE9FE' },
  delivered: { label: 'Delivered', color: '#059669', bg: '#D1FAE5' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' },
};

export default function KitRequestsPage() {
  const [requests, setRequests] = useState<KitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<KitRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('kit_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (e) {
      console.error('Failed to load kit requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string, notes?: string) => {
    setUpdating(true);
    try {
      const updates: any = { status };
      if (notes !== undefined) updates.admin_notes = notes;
      if (status === 'contacted') updates.contacted_at = new Date().toISOString();
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();

      const { error } = await supabaseAdmin
        .from('kit_requests')
        .update(updates)
        .eq('id', id);
      if (error) throw error;

      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
      if (selectedRequest?.id === id) {
        setSelectedRequest((prev) => prev ? { ...prev, ...updates } : null);
      }
    } catch (e) {
      console.error('Failed to update:', e);
    } finally {
      setUpdating(false);
    }
  };

  const sendNotification = async (userId: string, title: string, message: string) => {
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        title,
        message,
        type: 'info',
      });
    } catch (e) {
      console.error('Failed to send notification:', e);
    }
  };

  const filtered = filterStatus === 'all' ? requests : requests.filter((r) => r.status === filterStatus);
  const counts = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kit Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage self-sampling kit requests from patients</p>
        </div>
        <button onClick={loadRequests} className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${filterStatus === key ? 'border-sky-500 shadow-md' : 'border-transparent'}`}
            style={{ backgroundColor: cfg.bg }}
          >
            <div className="text-2xl font-bold" style={{ color: cfg.color }}>{counts[key] || 0}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: cfg.color }}>{cfg.label}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requested</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No kit requests found</td></tr>
            ) : filtered.map((req) => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              return (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 text-sm">{req.user_name || 'Unknown'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600">{req.user_phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600">
                      {[req.user_ward, req.user_sub_county, req.user_county].filter(Boolean).join(', ') || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500">
                      {new Date(req.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedRequest(req); setAdminNotes(req.admin_notes || ''); }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200"
                      >
                        View
                      </button>
                      {req.user_phone && (
                        <a
                          href={`tel:${req.user_phone}`}
                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                        >
                          Call
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Kit Request Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Patient</span>
                <span className="text-sm font-semibold text-gray-900">{selectedRequest.user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-semibold text-gray-900">{selectedRequest.user_phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Location</span>
                <span className="text-sm font-semibold text-gray-900">
                  {[selectedRequest.user_ward, selectedRequest.user_sub_county, selectedRequest.user_county].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Requested</span>
                <span className="text-sm font-semibold text-gray-900">
                  {new Date(selectedRequest.created_at).toLocaleString('en-KE')}
                </span>
              </div>
              {selectedRequest.contacted_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Contacted</span>
                  <span className="text-sm text-gray-700">{new Date(selectedRequest.contacted_at).toLocaleString('en-KE')}</span>
                </div>
              )}
              {selectedRequest.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Delivered</span>
                  <span className="text-sm text-gray-700">{new Date(selectedRequest.delivered_at).toLocaleString('en-KE')}</span>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                rows={3}
                placeholder="Add notes about this request..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'contacted', adminNotes)}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Mark Contacted
                  </button>
                  <button
                    onClick={() => { updateStatus(selectedRequest.id, 'contacted', adminNotes); sendNotification(selectedRequest.user_id, 'Kit Request Update', 'We have received your kit request and will contact you shortly.'); }}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Contact & Notify
                  </button>
                </>
              )}
              {selectedRequest.status === 'contacted' && (
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'arranged', adminNotes)}
                  disabled={updating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  Mark Arranged
                </button>
              )}
              {selectedRequest.status === 'arranged' && (
                <button
                  onClick={() => { updateStatus(selectedRequest.id, 'delivered', adminNotes); sendNotification(selectedRequest.user_id, 'Kit Delivered', 'Your self-sampling kit has been delivered. You can now collect your sample.'); }}
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  Mark Delivered & Notify
                </button>
              )}
              {selectedRequest.status !== 'cancelled' && selectedRequest.status !== 'delivered' && (
                <button
                  onClick={() => { updateStatus(selectedRequest.id, 'cancelled', adminNotes); sendNotification(selectedRequest.user_id, 'Kit Request Cancelled', 'Your kit request has been cancelled. Please contact us if you have questions.'); }}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  Cancel Request
                </button>
              )}
              <button
                onClick={() => { updateStatus(selectedRequest.id, selectedRequest.status, adminNotes); }}
                disabled={updating}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
