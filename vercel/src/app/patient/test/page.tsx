'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';
import CodeInput from '@/components/CodeInput';

type Stage = 'scan' | 'work' | 'submitted';

const TIMELINE = [
  { status: 'COLLECTED', label: 'Sample collected' },
  { status: 'IN_TRANSIT', label: 'Submitted / in transit' },
  { status: 'IN_LAB', label: 'Received in laboratory' },
  { status: 'PROCESSED', label: 'Results ready' },
];

const STATUS_ORDER: Record<string, number> = {
  REGISTERED: -2,
  PAIRED: -1,
  WITH_PATIENT: 0,
  COLLECTED: 0,
  IN_TRANSIT: 1,
  IN_LAB: 2,
  PROCESSED: 3,
};

export default function SampleAndSubmit() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('scan');
  const [barcode, setBarcode] = useState('');
  const [kit, setKit] = useState<any>(null);
  const [profile, setProfile] = useState({ id: '', name: '' });
  const [contactPhone, setContactPhone] = useState('');
  const [pickupChoice, setPickupChoice] = useState<'self' | 'dispatch' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      const { data } = await supabase
        .from('users')
        .select('name, phone')
        .eq('id', session.user.id)
        .maybeSingle();
      setProfile({ id: session.user.id, name: data?.name || 'Patient' });
      setContactPhone(data?.phone || '');
    }
    init();
  }, [router]);

  const findKit = useCallback(async (codeArg?: string) => {
    const code = (codeArg ?? barcode).trim();
    if (!code) return;
    setBarcode(code);
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/sample-kits/scan/${encodeURIComponent(code)}`);
      if (res.ok) {
        const found = await res.json();
        setKit(found);
        setStage(found.status === 'IN_TRANSIT' || found.status === 'IN_LAB' || found.status === 'PROCESSED' ? 'submitted' : 'work');
      } else if (res.status === 404) {
        setKit(null);
        setError('This barcode is not registered yet. Open the Self-Sampling guide to register and link it.');
        setStage('work');
      } else {
        setError('Could not look up this kit. Please try again.');
      }
    } catch {
      setError('Network error — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [barcode]);

  async function linkKit() {
    if (!kit) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/sample-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pair',
          barcode: kit.barcode,
          patientId: profile.id,
          patientName: profile.name,
          pairedBy: 'self',
          pairedByName: profile.name,
        }),
      });
      if (res.ok) {
        const paired = await res.json();
        setKit(paired);
      } else {
        const e = await res.json();
        setError(e.message || 'Failed to link kit');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function submitSample() {
    if (!kit) return;
    setLoading(true);
    setError('');
    try {
      const toLocation = pickupChoice === 'dispatch'
        ? 'Awaiting dispatch to pickup station'
        : 'Drop-off at pickup station';
      const res = await apiFetch('/api/sample-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transit',
          barcode: kit.barcode,
          scannedBy: profile.id,
          scannedByName: profile.name,
          fromLocation: 'home',
          toLocation,
          notes: contactPhone ? `Patient contact: ${contactPhone}` : 'Submitted by patient',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setKit(updated);
        setStage('submitted');
      } else {
        const e = await res.json();
        setError(e.message || 'Failed to submit sample');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  const statusIdx = kit ? (STATUS_ORDER[kit.status] ?? -1) : -1;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Sample &amp; Submit</h1>
        <p className="mt-1 text-sm text-gray-600">
          Scan your sampling kit, then submit the sealed sample for laboratory testing. Results are released by the lab.
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {stage === 'scan' && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Scan your kit</h2>
          <p className="mt-1 mb-4 text-sm text-gray-600">Use the camera or type the barcode printed on the kit.</p>
          <CodeInput
            value={barcode}
            onChange={setBarcode}
            onSubmit={(code) => { if (code) findKit(code); }}
            submitLabel="Look Up Kit"
            label="Kit barcode"
            placeholder="Scan or type kit barcode"
            inputClassName="flex-1 rounded-xl border p-3 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
            buttonClassName="rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          />
        </section>
      )}

      {stage === 'work' && (
        <section className="space-y-4">
          {kit && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Kit status</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{kit.status}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Barcode <span className="font-mono">{kit.barcode}</span></p>
            </div>
          )}

          {kit?.status === 'REGISTERED' && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold">Link this kit to you</h3>
              <p className="mt-1 text-sm text-gray-600">Confirm this kit belongs to you before collecting your sample.</p>
              <button onClick={linkKit} disabled={loading}
                className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50">
                {loading ? 'Linking…' : 'Link Kit to My Account'}
              </button>
            </div>
          )}

          {kit?.status === 'PAIRED' && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold">Collect your sample first</h3>
              <p className="mt-1 text-sm text-gray-600">Follow the guided self-sampling steps, then come back here to submit.</p>
              <Link href="/patient/self-sampling"
                className="mt-4 block w-full rounded-xl bg-primary px-4 py-3 text-center font-semibold text-white">
                Open Self-Sampling Guide →
              </Link>
            </div>
          )}

          {['WITH_PATIENT', 'COLLECTED'].includes(kit?.status) && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold">Submit your sample</h3>
              <p className="mt-1 text-sm text-gray-600">
                Hand the sealed kit in at a pickup station or arrange dispatch. Once the lab scans it, you can track it here.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button onClick={() => setPickupChoice('self')}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${pickupChoice === 'self' ? 'border-primary bg-primary text-white' : 'border-gray-200'}`}>
                  I&apos;ll drop it off
                </button>
                <button onClick={() => setPickupChoice('dispatch')}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${pickupChoice === 'dispatch' ? 'border-primary bg-primary text-white' : 'border-gray-200'}`}>
                  Arrange dispatch
                </button>
              </div>

              <label className="mt-4 block text-sm font-medium">Contact phone for pickup follow-up</label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+254..."
                className="mt-1 w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <button onClick={submitSample} disabled={loading || !pickupChoice}
                className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50">
                {loading ? 'Submitting…' : 'Submit Sample'}
              </button>
              {!pickupChoice && <p className="mt-2 text-xs text-gray-500">Choose a pickup option to continue.</p>}
            </div>
          )}

          <Link href="/patient/self-sampling" className="block w-full rounded-xl bg-gray-100 px-4 py-3 text-center text-sm font-semibold text-gray-700">
            Need help? Open the self-sampling guide
          </Link>
        </section>
      )}

      {stage === 'submitted' && kit && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-2xl text-white">✓</div>
            <h2 className="text-lg font-bold text-green-800">
              {kit.status === 'PROCESSED' ? 'Results ready' : kit.status === 'IN_LAB' ? 'Received in laboratory' : 'Sample submitted'}
            </h2>
            <p className="mt-1 text-sm text-green-700">
              {kit.status === 'IN_LAB'
                ? 'The laboratory has your sample and is running the molecular test.'
                : kit.status === 'PROCESSED'
                  ? 'Your results have been released. Open My Results to view them.'
                  : 'Your sample is on its way to the laboratory. You can track it any time.'}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold">Progress</h3>
            <ol className="mt-4 space-y-3">
              {TIMELINE.map((t, i) => {
                const done = statusIdx >= STATUS_ORDER[t.status];
                return (
                  <li key={t.status} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {done ? '✓' : i + 1}
                    </span>
                    <span className={`text-sm ${done ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{t.label}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-sm text-gray-600">Barcode <span className="font-mono">{kit.barcode}</span></p>
            {kit.current_location && <p className="text-sm text-gray-500">Location: {kit.current_location}</p>}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setKit(null); setBarcode(''); setStage('scan'); setError(''); }}
              className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              Submit another
            </button>
            <Link href="/patient/kits" className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white">
              Track My Kit
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
