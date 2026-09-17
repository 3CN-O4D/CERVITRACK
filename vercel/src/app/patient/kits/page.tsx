'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

const VIABILITY_DAYS = 25;
const LAB_PROCESSING_MINUTES = 99;

type KitStatus = 'UNREGISTERED' | 'REGISTERED' | 'PAIRED' | 'COLLECTED' | 'IN_TRANSIT' | 'IN_LAB' | 'PROCESSED';

const STATUS_CONFIG: Record<KitStatus, { label: string; className: string; description: string }> = {
  UNREGISTERED: { label: 'New Kit', className: 'bg-gray-100 text-gray-700', description: 'Scan the kit barcode to register it.' },
  REGISTERED: { label: 'Registered', className: 'bg-blue-100 text-blue-700', description: 'Registered — link it to your account.' },
  PAIRED: { label: 'Paired to You', className: 'bg-amber-100 text-amber-700', description: 'Linked to you. Collect your sample when ready.' },
  COLLECTED: { label: 'Sample Collected', className: 'bg-green-100 text-green-700', description: 'Sample collected. Keep it safe and return it for pickup.' },
  IN_TRANSIT: { label: 'In Transit', className: 'bg-purple-100 text-purple-700', description: 'Sample is on the way to the lab.' },
  IN_LAB: { label: 'At Lab', className: 'bg-cyan-100 text-cyan-700', description: 'Sample received. Processing is underway.' },
  PROCESSED: { label: 'Results Ready', className: 'bg-emerald-100 text-emerald-700', description: 'Results are available in My Results.' },
};

function daysLeft(collectedAt: string | null | undefined) {
  if (!collectedAt) return null;
  const target = new Date(collectedAt).getTime() + VIABILITY_DAYS * 86400000;
  const diff = target - Date.now();
  return { expired: diff <= 0, days: Math.max(0, Math.floor(diff / 86400000)), hours: Math.max(0, Math.floor((diff % 86400000) / 3600000)) };
}

function eta(receivedAtLab: string | null | undefined) {
  if (!receivedAtLab) return null;
  const target = new Date(receivedAtLab).getTime() + LAB_PROCESSING_MINUTES * 60000;
  return new Date(target).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function PatientKits() {
  const [kits, setKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      try {
        const res = await apiFetch('/api/sample-kits?patientId=' + encodeURIComponent(session.user.id) + '&limit=50');
        if (res.ok) {
          const d = await res.json();
          setKits(d.data || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kit Tracker</h1>
        <Link href="/patient/self-sampling" className="rounded bg-primary px-3 py-2 text-sm font-medium text-white">
          Scan / Self-Sampling
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kits.map((k) => {
          const cfg = STATUS_CONFIG[k.status as KitStatus] || STATUS_CONFIG.UNREGISTERED;
          const remaining = (k.status === 'COLLECTED' || k.status === 'IN_TRANSIT' || k.status === 'IN_LAB') ? daysLeft(k.collected_at) : null;
          const etaTime = k.status === 'IN_LAB' ? eta(k.received_at_lab) : null;
          const needsPickup = k.status === 'COLLECTED';
          return (
            <div key={k.id} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{k.barcode || 'Unknown'}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">{cfg.description}</p>
              {k.patient_name && <p className="mt-1 text-xs text-gray-500">Linked to: {k.patient_name}</p>}
              {k.kit_type && <p className="text-xs text-gray-500">Type: {k.kit_type}</p>}
              {k.current_location && <p className="text-xs text-gray-500">Location: {k.current_location}</p>}
              {k.collected_at && <p className="mt-1 text-xs text-gray-500">Collected: {new Date(k.collected_at).toLocaleDateString()}</p>}

              {needsPickup && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                  🔔 Ready for pickup. Return it to your nearest station.
                </div>
              )}

              {remaining && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className={remaining.expired ? 'font-medium text-red-600' : 'font-medium text-gray-600'}>
                      {remaining.expired ? 'Viability window ended' : `Viable for ${remaining.days}d ${remaining.hours}h`}
                    </span>
                    <span className="text-gray-400">{VIABILITY_DAYS}-day limit</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full ${remaining.expired ? 'bg-red-500' : 'bg-primary'}`}
                      style={{ width: `${Math.max(0, Math.min(100, ((VIABILITY_DAYS * 24 - (remaining.days * 24 + remaining.hours)) / (VIABILITY_DAYS * 24)) * 100))}%` }} />
                  </div>
                </div>
              )}

              {(k.status === 'IN_TRANSIT' || k.status === 'IN_LAB') && (
                <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-2.5 text-xs text-cyan-800">
                  {etaTime
                    ? <>Estimated result by <span className="font-semibold">{etaTime}</span> (about 1h 39m after lab receipt).</>
                    : <>Results typically ready about 1h 39m after the lab receives your sample.</>}
                </div>
              )}

              {k.status === 'PROCESSED' && (
                <Link href="/patient/results" className="mt-3 inline-block text-xs font-semibold text-primary">
                  View results →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {!kits.length && (
        <div className="rounded-lg border bg-white p-6 text-center text-gray-500">
          No kits found. Scan a kit to begin.
        </div>
      )}

      <div className="mt-2 flex gap-3">
        <Link href="/patient/self-sampling" className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors">
          Self-Sampling Guide
        </Link>
        <Link href="/patient/results" className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700">
          View My Results
        </Link>
      </div>
    </div>
  );
}
