'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';

type KitStatus = 'UNREGISTERED' | 'REGISTERED' | 'PAIRED' | 'COLLECTED' | 'IN_TRANSIT' | 'IN_LAB' | 'PROCESSED';

interface Kit {
  id: string;
  barcode: string;
  kitType: string;
  status: KitStatus;
  patientName?: string;
  collectionMethod?: string;
  collectedAt?: string;
  result?: string;
  events: KitEvent[];
}

interface KitEvent {
  id: string;
  action: string;
  scannedBy: string;
  scannedByName: string;
  location?: string;
  notes?: string;
  timestamp: string;
}

const STATUS_FLOW: KitStatus[] = ['UNREGISTERED', 'REGISTERED', 'PAIRED', 'COLLECTED', 'IN_TRANSIT', 'IN_LAB', 'PROCESSED'];

const STATUS_CONFIG: Record<KitStatus, { label: string; color: string; icon: string; description: string }> = {
  UNREGISTERED: { label: 'New Kit', color: 'bg-gray-500', icon: '📦', description: 'Scan barcode to register this kit' },
  REGISTERED: { label: 'Registered', color: 'bg-blue-500', icon: '📋', description: 'Kit is registered. Pair it to your account.' },
  PAIRED: { label: 'Paired to You', color: 'bg-amber-500', icon: '🔗', description: 'Kit is paired. Collect your sample when ready.' },
  COLLECTED: { label: 'Sample Collected', color: 'bg-green-500', icon: '✅', description: 'Sample collected. Waiting for lab processing.' },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-purple-500', icon: '🚚', description: 'Sample is being transported to the lab.' },
  IN_LAB: { label: 'At Lab', color: 'bg-cyan-500', icon: '🔬', description: 'Sample received at lab. Processing.' },
  PROCESSED: { label: 'Results Ready', color: 'bg-emerald-500', icon: '📄', description: 'Results are available.' },
};

export default function KitPage() {
  const [kit, setKit] = useState<Kit | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [action, setAction] = useState<'register' | 'pair' | 'collect' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myKits, setMyKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(false);

  const handleScan = useCallback(async () => {
    const barcode = manualBarcode.trim();
    if (!barcode) return;

    setLoading(true);
    setError('');
    setKit(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/sample-kits/scan/${barcode}`, {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });

      if (res.ok) {
        const kitData = await res.json();
        setKit(kitData);
      } else if (res.status === 404) {
        setKit(null);
        setAction('register');
      } else {
        setError('Failed to scan barcode');
      }
    } catch {
      setError('Network error — scanning offline');
    } finally {
      setLoading(false);
    }
  }, [manualBarcode]);

  const handleAction = async (type: 'register' | 'pair' | 'collect', extra?: Record<string, string>) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const body: Record<string, string> = {
        action: type,
        barcode: manualBarcode.trim(),
        ...extra,
      };

      if (type === 'register') {
        body.facilityId = 'home';
        body.registeredBy = 'self';
        body.registeredByName = 'Patient (Self-Registration)';
      } else if (type === 'pair') {
        body.patientId = session?.user?.id || 'unknown';
        body.patientName = session?.user?.user_metadata?.full_name || 'Patient';
        body.pairedBy = 'self';
        body.pairedByName = 'Patient (Self-Pairing)';
      } else if (type === 'collect') {
        body.collectedBy = 'self';
        body.collectedByName = 'Patient (Self-Collection)';
        body.collectionMethod = extra?.method || 'HPV_SELF';
        body.location = 'home';
      }

      const endpoint = '/api/sample-kits';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const updatedKit = await res.json();
        setKit(updatedKit);
        setAction(null);
        setSuccess(`Kit ${type === 'register' ? 'registered' : type === 'pair' ? 'paired' : 'collection confirmed'} successfully`);
      } else {
        const err = await res.json();
        setError(err.message || 'Action failed');
      }
    } catch {
      setError('Network error — action will sync when online');
    } finally {
      setLoading(false);
    }
  };

  const loadMyKits = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sample-kits?limit=50', {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyKits(data.data || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const currentStep = kit ? STATUS_FLOW.indexOf(kit.status as KitStatus) : -1;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sky-400 text-sm hover:underline">← Back</Link>
          <h1 className="text-lg font-bold">📦 Sample Kit Tracker</h1>
          <button onClick={loadMyKits} className="text-gray-400 text-sm hover:text-white">My Kits</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Scanner */}
        <section className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Scan Kit Barcode</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter or scan barcode..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
            <button
              onClick={handleScan}
              disabled={!manualBarcode.trim() || loading}
              className="bg-sky-600 hover:bg-sky-500 disabled:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? '...' : 'Scan'}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">Point your camera or enter barcode manually</p>
        </section>

        {error && <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">{error}</div>}
        {success && <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 text-green-200">{success}</div>}

        {/* Kit Status Card */}
        {kit && (
          <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {/* Status Badge */}
            <div className={`${STATUS_CONFIG[kit.status as KitStatus]?.color || 'bg-gray-600'} px-6 py-4`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{STATUS_CONFIG[kit.status as KitStatus]?.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{STATUS_CONFIG[kit.status as KitStatus]?.label}</h3>
                  <p className="text-white/80 text-sm">{STATUS_CONFIG[kit.status as KitStatus]?.description}</p>
                </div>
              </div>
            </div>

            {/* Kit Info */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">Barcode:</span> <span className="font-mono text-white">{kit.barcode}</span></div>
                <div><span className="text-gray-400">Type:</span> <span className="text-white">{kit.kitType}</span></div>
                {kit.patientName && <div><span className="text-gray-400">Patient:</span> <span className="text-white">{kit.patientName}</span></div>}
                {kit.result && <div><span className="text-gray-400">Result:</span> <span className="text-green-400 font-bold">{kit.result}</span></div>}
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  {STATUS_FLOW.map((s, i) => (
                    <div key={s} className={`flex flex-col items-center ${i <= currentStep ? 'text-sky-400' : 'text-gray-600'}`}>
                      <div className={`w-3 h-3 rounded-full mb-1 ${i <= currentStep ? 'bg-sky-400' : 'bg-gray-700'}`} />
                      <span className="hidden sm:inline">{STATUS_CONFIG[s].label.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / (STATUS_FLOW.length - 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                {kit.status === 'UNREGISTERED' && !action && (
                  <button
                    onClick={() => handleAction('register')}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-medium transition-colors"
                  >
                    📋 Register This Kit
                  </button>
                )}

                {kit.status === 'REGISTERED' && !action && (
                  <button
                    onClick={() => handleAction('pair')}
                    disabled={loading}
                    className="w-full bg-amber-600 hover:bg-amber-500 py-3 rounded-lg font-medium transition-colors"
                  >
                    🔗 Pair to My Account
                  </button>
                )}

                {kit.status === 'PAIRED' && !action && (
                  <button
                    onClick={() => setAction('collect')}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-lg font-medium transition-colors"
                  >
                    ✅ I Collected My Sample
                  </button>
                )}

                {kit.status === 'COLLECTED' && (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
                    <p className="text-green-300 font-medium">Sample collected and waiting for lab</p>
                    <p className="text-gray-400 text-sm mt-1">Track progress below or scan again at any point</p>
                  </div>
                )}

                {kit.status === 'PROCESSED' && (
                  <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 text-center">
                    <p className="text-emerald-300 font-bold text-lg">Results Available!</p>
                    <Link href="/provider" className="text-sky-400 hover:underline mt-2 inline-block">View in Provider Portal →</Link>
                  </div>
                )}
              </div>

              {/* Collection Method Selection */}
              {action === 'collect' && (
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-300 font-medium">How did you collect the sample?</p>
                  {[
                    { id: 'HPV_SELF', label: 'Self-Collection (Vaginal Swab)', desc: 'You collected the sample yourself at home' },
                    { id: 'HPV_CLINICIAN', label: 'Clinician-Collected', desc: 'A healthcare provider collected the sample' },
                    { id: 'VIA', label: 'VIA (Visual Inspection)', desc: 'Visual inspection with acetic acid' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleAction('collect', { method: method.id })}
                      disabled={loading}
                      className="w-full text-left bg-gray-900 hover:bg-gray-700 border border-gray-600 rounded-lg p-3 transition-colors"
                    >
                      <div className="font-medium text-white">{method.label}</div>
                      <div className="text-xs text-gray-400">{method.desc}</div>
                    </button>
                  ))}
                  <button onClick={() => setAction(null)} className="w-full text-gray-400 hover:text-white text-sm py-2">Cancel</button>
                </div>
              )}
            </div>

            {/* Timeline */}
            {kit.events && kit.events.length > 0 && (
              <div className="border-t border-gray-800 p-6">
                <h4 className="text-sm font-medium text-gray-400 mb-4">Kit History</h4>
                <div className="space-y-3">
                  {kit.events.map((evt) => (
                    <div key={evt.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0" />
                      <div>
                        <div className="text-sm text-white font-medium">{evt.action}</div>
                        <div className="text-xs text-gray-500">
                          {evt.scannedByName} · {new Date(evt.timestamp).toLocaleString()}
                        </div>
                        {evt.notes && <div className="text-xs text-gray-400 mt-1">{evt.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* My Kits List */}
        {myKits.length > 0 && (
          <section className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">My Kits ({myKits.length})</h2>
            <div className="space-y-2">
              {myKits.map((k) => (
                <button
                  key={k.id}
                  onClick={() => { setKit(k); setManualBarcode(k.barcode); }}
                  className="w-full text-left bg-gray-800 hover:bg-gray-700 rounded-lg p-4 flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="font-mono text-sm text-white">{k.barcode}</div>
                    <div className="text-xs text-gray-400">{k.kitType}</div>
                  </div>
                  <div className={`${STATUS_CONFIG[k.status as KitStatus]?.color || 'bg-gray-600'} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                    {STATUS_CONFIG[k.status as KitStatus]?.label}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">How Kit Tracking Works</h2>
          <div className="space-y-4">
            {[
              { step: 1, icon: '📦', title: 'Scan & Register', desc: 'When you receive a kit, scan the barcode to register it in the system.' },
              { step: 2, icon: '🔗', title: 'Pair to You', desc: 'Link the kit to your patient account so we know it\'s yours.' },
              { step: 3, icon: '🩸', title: 'Collect Sample', desc: 'Follow the instructions to collect your sample, then scan again to confirm.' },
              { step: 4, icon: '🚚', title: 'Track Transport', desc: 'The sample is collected and transported to the lab — you can track every step.' },
              { step: 5, icon: '🔬', title: 'Lab Processing', desc: 'The lab receives and processes your sample. Results are entered by scanning the same barcode.' },
              { step: 6, icon: '📄', title: 'View Results', desc: 'Results appear in your app and provider portal within hours.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-sky-900/50 border border-sky-700 flex items-center justify-center text-lg shrink-0">{icon}</div>
                <div>
                  <h4 className="font-medium text-white">{title}</h4>
                  <p className="text-sm text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
