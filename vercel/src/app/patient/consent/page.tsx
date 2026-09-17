'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  county: string;
}

interface Grant {
  id: string;
  patient_id: string;
  staff_id: string;
  staff?: { id: string; name: string; role: string };
  granted_at: string;
}

export default function PatientConsent() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const res = await apiFetch('/api/consent/grants');
      if (res.ok) {
        const d = await res.json();
        setStaff(Array.isArray(d.staff) ? d.staff : []);
        const map: Record<string, boolean> = {};
        for (const g of Array.isArray(d.grants) ? d.grants : []) {
          if (g.status === 'granted') map[g.staff_id] = true;
        }
        setGranted(map);
      }
    } catch { }
  }

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function toggle(staffId: string, grant: boolean) {
    setBusy((p) => ({ ...p, [staffId]: true }));
    setMsg('');
    try {
      if (grant) {
        const res = await apiFetch('/api/consent/grants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff_id: staffId }),
        });
        if (res.ok) {
          setGranted((p) => ({ ...p, [staffId]: true }));
          setMsg('Consent granted. This staff member can now read your consultation messages.');
        } else {
          const e = await res.json();
          setMsg(e.error || 'Failed to grant consent');
        }
      } else {
        const res = await apiFetch('/api/consent/grants/' + staffId, { method: 'DELETE' });
        if (res.ok) {
          setGranted((p) => { const n = { ...p }; delete n[staffId]; return n; });
          setMsg('Consent revoked. This staff member can no longer access your messages.');
        } else {
          const e = await res.json();
          setMsg(e.error || 'Failed to revoke consent');
        }
      }
    } catch {
      setMsg('Request failed');
    }
    setBusy((p) => ({ ...p, [staffId]: false }));
  }

  const roleLabels: Record<string, string> = {
    provider: 'Provider',
    clinician: 'Clinician',
    lab_technician: 'Lab',
    facility_admin: 'Facility Admin',
    county_admin: 'County Admin',
    national_admin: 'National Admin',
    system_admin: 'System Admin',
    admin: 'Admin',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Care Team</h1>
      <p className="text-sm text-gray-600">
        Control which health workers can read your consultation messages. No staff member can access
        your messages until you grant consent here. Revoke consent any time.
      </p>

      {msg && <p className="text-sm text-primary">{msg}</p>}

      {loading ? (
        <div className="h-96 flex items-center justify-center text-gray-500">Loading…</div>
      ) : staff.length === 0 ? (
        <p className="text-gray-500">No health workers are available yet.</p>
      ) : (
        <ul className="space-y-2">
          {staff.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg border p-3 bg-white shadow-sm">
              <div>
                <p className="font-medium">{s.name || 'Unnamed'}</p>
                <p className="text-xs text-gray-500">
                  {roleLabels[s.role] || s.role}
                  {s.county ? ` — ${s.county}` : ''}
                </p>
              </div>
              <button
                onClick={() => toggle(s.id, !granted[s.id])}
                disabled={busy[s.id]}
                className={
                  'rounded px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ' +
                  (granted[s.id]
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-primary text-white hover:bg-primary/90')
                }
              >
                {granted[s.id] ? 'Revoke consent' : 'Grant consent'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}