'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';
import BarcodeScanner from '@/components/BarcodeScanner';

const VIABILITY_DAYS = 25;
const VIDEO_URL = 'https://www.youtube.com/embed/njsHSnDGcDk?autoplay=0&modestbranding=1&rel=0';

type Stage = 'order' | 'scan' | 'register' | 'link' | 'learn' | 'checklist' | 'confirm' | 'complete';

interface Step {
  number: number;
  title: string;
  instruction: string;
  doList: string[];
  dontList: string[];
  why: string;
  expected: string;
  normal: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Wash Your Hands',
    instruction: 'Wash your hands thoroughly with soap and warm water for at least 20 seconds, then dry them with a clean towel.',
    doList: ['Wash before and after handling the kit', 'Dry hands with a clean, single-use towel'],
    dontList: ['Do not use hand sanitiser in place of washing', 'Do not touch the swab tip after washing'],
    why: 'Clean hands stop germs and dirt contaminating the sample, which could cause an inconclusive result.',
    expected: 'It takes about 20 seconds — roughly the time to sing "Happy Birthday" twice.',
    normal: 'Slightly soapy or wet hands are fine; just make sure they are dry before touching the kit.',
  },
  {
    number: 2,
    title: 'Open the Kit',
    instruction: 'Open the kit carefully without touching the swab tip. Remove the collection tube and swab and place them on a clean, dry surface.',
    doList: ['Place all components on a clean, dry surface', 'Hold the swab by the handle end only'],
    dontList: ['Do not touch the swab tip or the inside of the tube', 'Do not let the swab rest on any surface'],
    why: 'The swab tip and tube interior must stay sterile — touching them introduces contamination.',
    expected: 'You should see a swab, a collection tube with cap, a label, and a biohazard bag.',
    normal: 'A faint plastic smell when opening is harmless.',
  },
  {
    number: 3,
    title: 'Insert the Swab',
    instruction: 'Stand with feet apart and knees slightly bent. Gently insert the swab into the vagina about 2-3 inches (5-7 cm), angling slightly toward your lower back.',
    doList: ['Relax your muscles and breathe deeply', 'Angle the swab gently toward your lower back'],
    dontList: ['Do not force the swab', 'Do not insert into the urethra or rectum'],
    why: 'Correct depth and angle allow the swab to reach the cells where HPV is detected.',
    expected: 'Mild pressure or a tickling sensation is normal.',
    normal: 'Light spotting is uncommon but not dangerous; it should stop on its own.',
  },
  {
    number: 4,
    title: 'Rotate the Swab',
    instruction: 'Rotate the swab gently in a circular motion for 15-30 seconds, ensuring it contacts the vaginal walls.',
    doList: ['Count to 20 slowly while rotating', 'Keep the motion gentle and steady'],
    dontList: ['Do not scrub hard or move the swab in and out repeatedly'],
    why: 'Rotating collects enough cells for an accurate test.',
    expected: 'You may feel slight friction as the swab turns.',
    normal: 'No pain is expected; stop if you feel sharp pain and contact your clinician.',
  },
  {
    number: 5,
    title: 'Place in the Collection Tube',
    instruction: 'Withdraw the swab without touching anything else. Place the swab tip-first into the tube, then snap or cut the handle at the marked line so the tube can be sealed.',
    doList: ['Hold the tube steady on a flat surface', 'Make sure the swab tip is fully inside the tube'],
    dontList: ['Do not touch the swab tip on the tube rim', 'Do not spill the transport liquid'],
    why: 'The tube protects and preserves the sample until it reaches the lab.',
    expected: 'The swab should sit fully inside with the break line at the tube opening.',
    normal: 'A small amount of liquid on the tube threads is fine; wipe with the provided tissue.',
  },
  {
    number: 6,
    title: 'Seal and Label',
    instruction: 'Tightly close the cap, write your patient code on the label, attach the label to the tube, then place the tube in the biohazard bag and seal it.',
    doList: ['Double-check your patient code is correct and legible', 'Seal the biohazard bag fully'],
    dontList: ['Do not write over the patient code', 'Do not leave the bag open or overfilled'],
    why: 'Correct labelling links the sample to you; sealing protects handlers and the sample.',
    expected: 'After sealing, the tube should not leak when held upside down.',
    normal: 'Minor condensation inside the bag is normal.',
  },
];

const CHECKLIST_ITEMS = [
  { key: 'hands', label: 'I washed and dried my hands before and after sampling' },
  { key: 'sterile', label: 'I did not touch the swab tip or the inside of the tube' },
  { key: 'swab_tube', label: 'The swab was placed correctly in the collection tube' },
  { key: 'cap_sealed', label: 'The tube cap is sealed tightly — no leaks' },
  { key: 'no_spillage', label: 'There was no spillage during the process' },
  { key: 'labeled', label: 'The tube is labelled with my patient code' },
  { key: 'hazard_bag', label: 'The tube is inside the biohazard bag' },
  { key: 'bag_sealed', label: 'The biohazard bag is sealed properly' },
  { key: 'waste', label: 'I disposed of packaging safely and washed my hands again' },
];

interface Facility {
  id: number;
  name: string;
  county: string;
  sub_county: string;
  location: string;
  phone: string;
  hours: string;
  facility_type: string;
}

interface Profile {
  name: string;
  phone: string;
  county: string;
  sub_county: string;
}

function countdown(target: number) {
  const diff = target - Date.now();
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };
  return {
    expired: false,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
  };
}

export default function PatientSelfSampling() {
  const [stage, setStage] = useState<Stage>('order');
  const [profile, setProfile] = useState<Profile>({ name: '', phone: '', county: '', sub_county: '' });
  const [barcode, setBarcode] = useState('');
  const [kit, setKit] = useState<any>(null);
  const [contactPhone, setContactPhone] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [pickupChoice, setPickupChoice] = useState<'self' | 'dispatch' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [collectedAt, setCollectedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('users')
        .select('name, phone, county, sub_county')
        .eq('id', session.user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          name: data.name || '',
          phone: data.phone || '',
          county: data.county || '',
          sub_county: data.sub_county || '',
        });
        setContactPhone(data.phone || '');
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (stage !== 'complete') return;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'complete' || facilities.length) return;
    (async () => {
      try {
        const res = await apiFetch('/api/facilities');
        if (res.ok) setFacilities((await res.json()) || []);
      } catch { /* ignore */ }
    })();
  }, [stage, facilities.length]);

  const nearest = useMemo(() => {
    if (!facilities.length) return [];
    const scored = [...facilities].map((f) => {
      let score = 0;
      if (profile.county && f.county === profile.county) score += 2;
      if (profile.sub_county && f.sub_county === profile.sub_county) score += 3;
      return { f, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 3).map((s) => s.f);
  }, [facilities, profile]);

  const allChecked = CHECKLIST_ITEMS.every((i) => checklist[i.key]);
  const checkedCount = CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length;

  const viabilityTarget = collectedAt ? collectedAt + VIABILITY_DAYS * 86400000 : null;
  const remaining = viabilityTarget ? countdown(viabilityTarget) : null;

  async function findKit(codeArg?: string) {
    const code = (codeArg ?? barcode).trim();
    if (!code) return;
    setBarcode(code);
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch(`/api/sample-kits/scan/${encodeURIComponent(code)}`);
      if (res.ok) {
        const found = await res.json();
        setKit(found);
        if (found.status === 'REGISTERED') setStage('link');
        else if (found.status === 'PAIRED') { setStage('learn'); }
        else { setStage('complete'); setCollectedAt(found.collected_at ? new Date(found.collected_at).getTime() : null); }
      } else if (res.status === 404) {
        setKit(null);
        setStage('register');
      } else {
        setError('Failed to scan barcode. Please try again.');
      }
    } catch {
      setError('Network error — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function registerKit() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/sample-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          barcode: barcode.trim(),
          facilityId: 'home',
          registeredBy: 'self',
          registeredByName: profile.name || 'Patient (Self-Registration)',
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setKit(created);
        setStage('link');
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to register kit');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function linkKit() {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Please sign in again'); setLoading(false); return; }
      const res = await apiFetch('/api/sample-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pair',
          barcode: barcode.trim(),
          patientId: session.user.id,
          patientName: profile.name || 'Patient',
          pairedBy: 'self',
          pairedByName: profile.name || 'Patient (Self)',
        }),
      });
      if (res.ok) {
        const paired = await res.json();
        setKit(paired);
        setStage('learn');
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to link kit');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmCollection() {
    if (!barcode.trim()) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const scanRes = await apiFetch(`/api/sample-kits/scan/${encodeURIComponent(barcode.trim())}`);
      if (!scanRes.ok) {
        setError(scanRes.status === 404
          ? 'Kit not found. Please register and link it to your account first.'
          : 'Could not verify kit ownership. Please try again.');
        setLoading(false);
        return;
      }
      const current = await scanRes.json();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || current.status !== 'PAIRED') {
        setError(`Kit is ${current.status}. It must be linked to your account before confirming collection.`);
        setLoading(false);
        return;
      }
      const res = await apiFetch('/api/sample-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'collect',
          barcode: barcode.trim(),
          collectedBy: 'self',
          collectedByName: profile.name || 'Patient (Self-Collection)',
          collectionMethod: 'HPV_SELF',
          location: 'home',
          notes: `Self-collected after completing checklist. Contact: ${contactPhone || 'not provided'}`,
        }),
      });
      if (res.ok) {
        const collected = await res.json();
        setKit(collected);
        setCollectedAt(collected.collected_at ? new Date(collected.collected_at).getTime() : Date.now());
        setStage('complete');
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to confirm collection');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  const stageIndex = ['order', 'scan', 'link', 'learn', 'checklist', 'confirm', 'complete'].indexOf(stage);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        {['Order', 'Scan', 'Link', 'Learn', 'Confirm', 'Re-scan', 'Done'].map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className={`h-2.5 w-full rounded-full ${i <= stageIndex ? 'bg-primary' : 'bg-gray-200'}`} />
            <span className={`text-[10px] font-medium ${i <= stageIndex ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
          </div>
        ))}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

      {stage === 'order' && (
        <section className="rounded-2xl border bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">🧪</div>
          <h1 className="text-2xl font-bold">HPV Self-Sampling</h1>
          <p className="mt-2 text-sm text-gray-600">
            Collect your own sample in the privacy of your home. Request a free self-sampling kit or scan a kit you already have.
          </p>
          <div className="mt-6 space-y-3">
            <Link href="/patient/test" className="block w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white">
              Request a Self-Sampling Kit
            </Link>
            <button onClick={() => setStage('scan')} className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-primary">
              I already have a kit — scan barcode
            </button>
          </div>
        </section>
      )}

      {stage === 'scan' && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Step 1: Scan Your Kit</h2>
          <p className="mt-1 text-sm text-gray-600">Enter the barcode printed on your kit to check it and link it to your account.</p>
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && findKit()}
            placeholder="Enter kit barcode..."
            className="mt-4 w-full rounded-xl border p-3 text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={() => findKit()} disabled={!barcode.trim() || loading}
            className="mt-3 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? 'Checking…' : 'Find Kit'}
          </button>
          <button onClick={() => setShowScanner((v) => !v)}
            className="mt-2 w-full rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary">
            {showScanner ? 'Close Camera' : '📷 Scan with Camera'}
          </button>
          {showScanner && (
            <div className="mt-3 overflow-hidden rounded-xl border">
              <BarcodeScanner onScan={(code) => { setShowScanner(false); findKit(code); }} onClose={() => setShowScanner(false)} />
            </div>
          )}
        </section>
      )}

      {stage === 'register' && (
        <section className="rounded-2xl border bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">📦</div>
          <h2 className="text-lg font-bold">Kit Not Found</h2>
          <p className="mt-1 text-sm text-gray-600">Barcode {barcode} isn&apos;t registered yet. Register it to begin.</p>
          <button onClick={registerKit} disabled={loading}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? 'Registering…' : 'Register This Kit'}
          </button>
        </section>
      )}

      {stage === 'link' && (
        <section className="rounded-2xl border bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl">🔗</div>
          <h2 className="text-lg font-bold">Link Kit to Your Account</h2>
          <p className="mt-1 text-sm text-gray-600">
            Re-scanning confirms this kit belongs to you. Barcode: <span className="font-mono">{barcode}</span>
          </p>
          <button onClick={linkKit} disabled={loading}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? 'Linking…' : 'Link Kit to My Account'}
          </button>
        </section>
      )}

      {stage === 'learn' && (
        <section className="space-y-5">
          <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
            <h2 className="text-lg font-bold">Step 2: Learn the Procedure</h2>
            <p className="mt-1 text-sm text-gray-600">Watch the guide and read each step before you collect your sample.</p>
            <div className="mt-4 overflow-hidden rounded-xl">
              <iframe src={VIDEO_URL} title="Self-sampling guide" className="h-56 w-full border-0" allowFullScreen allow="autoplay; encrypted-media" />
            </div>
          </div>

          {STEPS.map((s) => (
            <div key={s.number} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{s.number}</span>
                <h3 className="font-bold">{s.title}</h3>
              </div>
              <p className="mt-3 text-sm text-gray-700">{s.instruction}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-green-700">Do</div>
                  <ul className="mt-2 space-y-1 text-sm text-green-900">
                    {s.doList.map((d) => <li key={d}>• {d}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-red-700">Don&apos;t</div>
                  <ul className="mt-2 space-y-1 text-sm text-red-900">
                    {s.dontList.map((d) => <li key={d}>• {d}</li>)}
                  </ul>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-semibold text-gray-800">Why: </span><span className="text-gray-600">{s.why}</span></p>
                <p><span className="font-semibold text-gray-800">What to expect: </span><span className="text-gray-600">{s.expected}</span></p>
                <p><span className="font-semibold text-gray-800">What&apos;s normal: </span><span className="text-gray-600">{s.normal}</span></p>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-bold">FAQs</h3>
            {FAQS.map((f, i) => (
              <button key={f.q} onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="mt-3 block w-full text-left">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{f.q}</span>
                  <span className="text-gray-400">{faqOpen === i ? '−' : '+'}</span>
                </div>
                {faqOpen === i && <p className="mt-2 text-sm text-gray-600">{f.a}</p>}
              </button>
            ))}
          </div>

          <button onClick={() => setStage('checklist')}
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white">
            I&apos;ve Read the Instructions — Next
          </button>
        </section>
      )}

      {stage === 'checklist' && (
        <section className="space-y-5">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Step 3: Confirm Procedures</h2>
            <p className="mt-1 text-sm text-gray-600">Tick every item to confirm you followed the sampling, hygiene and waste-handling procedures.</p>
            <div className="mt-4 space-y-2">
              {CHECKLIST_ITEMS.map((item) => (
                <button key={item.key} onClick={() => setChecklist((c) => ({ ...c, [item.key]: !c[item.key] }))}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${checklist[item.key] ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${checklist[item.key] ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                    {checklist[item.key] ? '✓' : ''}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <div className="text-xs font-semibold text-gray-500">{checkedCount} of {CHECKLIST_ITEMS.length} confirmed</div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-green-500" style={{ width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%` }} />
              </div>
            </div>
          </div>
          <button onClick={() => setStage('confirm')} disabled={!allChecked}
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:bg-gray-300">
            {allChecked ? 'All Confirmed — Re-scan Sample' : 'Complete All Checks to Continue'}
          </button>
        </section>
      )}

      {stage === 'confirm' && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Step 4: Re-scan to Confirm Ownership</h2>
          <p className="mt-1 text-sm text-gray-600">Re-scan the barcode on your sealed biohazard bag to reaffirm this sample is yours and mark it ready for pickup.</p>
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value.toUpperCase())}
            placeholder="Enter kit barcode..."
            className="mt-4 w-full rounded-xl border p-3 text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <label className="mt-3 block text-sm font-medium">Phone number for pickup follow-up</label>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+254..."
            className="mt-1 w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={confirmCollection} disabled={!barcode.trim() || loading}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? 'Confirming…' : 'Confirm Sample Taken'}
          </button>
          <button onClick={() => setShowScanner((v) => !v)}
            className="mt-2 w-full rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary">
            {showScanner ? 'Close Camera' : '📷 Re-scan with Camera'}
          </button>
          {showScanner && (
            <div className="mt-3 overflow-hidden rounded-xl border">
              <BarcodeScanner onScan={(code) => { setShowScanner(false); setBarcode(code.toUpperCase()); }} onClose={() => setShowScanner(false)} />
            </div>
          )}
        </section>
      )}

      {stage === 'complete' && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-2xl text-white">✓</div>
            <h2 className="text-lg font-bold text-green-800">Sample Collected!</h2>
            <p className="mt-1 text-sm text-green-700">Your kit is linked to your account and marked ready for pickup.</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold">Your Details</h3>
            <div className="mt-3 space-y-1 text-sm text-gray-700">
              <p><span className="text-gray-500">Barcode:</span> <span className="font-mono">{barcode}</span></p>
              <p><span className="text-gray-500">Name:</span> {profile.name || '—'}</p>
              <p><span className="text-gray-500">Contact:</span> {contactPhone || profile.phone || '—'}</p>
              <p><span className="text-gray-500">Location:</span> {[profile.sub_county, profile.county].filter(Boolean).join(', ') || '—'}</p>
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              🔔 Sample ready for pickup. Please return it to your nearest pickup station or arrange dispatch.
            </div>
          </div>

          {remaining && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold">Specimen Viability</h3>
              <p className="mt-1 text-sm text-gray-600">Your sample stays viable for {VIABILITY_DAYS} days from collection. Return it before the counter ends.</p>
              {remaining.expired ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-700">
                  The {VIABILITY_DAYS}-day window has ended. Contact your pickup station for guidance.
                </div>
              ) : (
                <>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-4xl font-extrabold text-primary">{remaining.days}</span>
                    <span className="pb-1 text-sm text-gray-500">days</span>
                    <span className="text-2xl font-bold">{remaining.hours}</span>
                    <span className="pb-1 text-sm text-gray-500">hrs</span>
                    <span className="text-2xl font-bold">{remaining.minutes}</span>
                    <span className="pb-1 text-sm text-gray-500">min</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full bg-primary"
                      style={{ width: `${Math.max(0, Math.min(100, (remaining.days / VIABILITY_DAYS) * 100))}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Reminders are active: you will be alerted at 5 days and again at 24 hours before the window closes.
                  </p>
                </>
              )}
            </div>
          )}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold">Set Up Pickup</h3>
            <p className="mt-1 text-sm text-gray-600">Choose to drop off at a facility or have the sample dispatched to the closest station.</p>

            {nearest.length > 0 && (
              <div className="mt-3 space-y-2">
                {nearest.map((f) => (
                  <button key={f.id} onClick={() => setSelectedFacility(f)}
                    className={`w-full rounded-xl border p-3 text-left ${selectedFacility?.id === f.id ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                    <div className="text-sm font-semibold">{f.name}</div>
                    <div className="text-xs text-gray-500">{[f.sub_county, f.county].filter(Boolean).join(', ')}</div>
                    {f.hours && <div className="text-xs text-gray-400">{f.hours}</div>}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button onClick={() => setPickupChoice('self')}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${pickupChoice === 'self' ? 'border-primary bg-primary text-white' : 'border-gray-200'}`}>
                I&apos;ll return it myself
              </button>
              <button onClick={() => setPickupChoice('dispatch')}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${pickupChoice === 'dispatch' ? 'border-primary bg-primary text-white' : 'border-gray-200'}`}>
                Arrange dispatch to station
              </button>
            </div>

            {pickupChoice && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                {pickupChoice === 'self' ? (
                  <p>
                    Take the sealed biohazard bag to{' '}
                    <span className="font-semibold">{selectedFacility?.name || 'your nearest health facility'}</span>
                    {selectedFacility?.phone && <> · <a className="text-primary underline" href={`tel:${selectedFacility.phone}`}>{selectedFacility.phone}</a></>}.
                  </p>
                ) : (
                  <p>
                    Dispatch noted for{' '}
                    <span className="font-semibold">{selectedFacility?.name || 'the closest station'}</span>.
                    {selectedFacility?.phone
                      ? <> Call <a className="text-primary underline" href={`tel:${selectedFacility.phone}`}>{selectedFacility.phone}</a> to confirm pickup time.</>
                      : ' Your facility will contact you on the number provided.'}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link href="/patient/kits" className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-center text-sm font-semibold text-gray-700">
              Track My Kit
            </Link>
            <Link href="/patient/results" className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white">
              My Results
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

const FAQS = [
  { q: 'How long does the test take?', a: 'The entire self-sampling process takes about 5-10 minutes from opening the kit to sealing the tube.' },
  { q: 'Is self-sampling painful?', a: 'No, self-sampling is generally painless. You may feel mild pressure but it should not cause pain.' },
  { q: 'When will I get my results?', a: 'Results are typically available within 2-4 weeks. Your healthcare provider will contact you.' },
  { q: 'Can I do self-sampling during my period?', a: 'It is best to avoid self-sampling during menstruation. Wait until at least 3-5 days after your period has ended.' },
  { q: 'How accurate is self-sampling?', a: 'HPV self-sampling is highly accurate, with 96-99% sensitivity for detecting high-risk HPV.' },
];
