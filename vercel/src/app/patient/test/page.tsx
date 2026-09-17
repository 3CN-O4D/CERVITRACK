'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-fetch';

const ANALYSIS_HTML = `
<html><body><canvas id="c"></canvas><script>
function processImage(base64) {
  var img = new Image();
  img.onload = function() {
    var c = document.getElementById('c');
    c.width = img.width;
    c.height = img.height;
    var ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var h = img.height, w = img.width;
    function scanLine(y) {
      var r=0,g=0,b=0,cnt=0;
      for (var x = Math.floor(w*0.15); x < Math.floor(w*0.85); x++) {
        var p = ctx.getImageData(x, y, 1, 1).data;
        r+=p[0]; g+=p[1]; b+=p[2]; cnt++;
      }
      return {r:r/cnt, g:g/cnt, b:b/cnt};
    }
    function bandScore(y, band) {
      var best = 0;
      for (var dy=-band; dy<=band; dy++) {
        if (y+dy<0||y+dy>=h) continue;
        var s = scanLine(y+dy);
        var intensity = s.r - (s.g+s.b)/2;
        if (intensity > best) best = intensity;
      }
      return best;
    }
    var bg = scanLine(Math.floor(h*0.1));
    var threshold = Math.max(18, (bg.r+bg.g+bg.b)/3 * 0.07);
    var ctrl = bandScore(Math.floor(h*0.3), 8) > threshold;
    var test = bandScore(Math.floor(h*0.65), 8) > threshold;
    var res = 'invalid';
    if (ctrl && test) res = 'positive';
    else if (ctrl && !test) res = 'negative';
    window.ReactNativeWebView.postMessage(res);
  };
  img.src = 'data:image/jpeg;base64,' + base64;
}
window.addEventListener('message', function(e) {
  processImage(e.data);
});
</script></body></html>`;

function analyzeStrip(base64: string): Promise<'positive' | 'negative' | 'invalid'> {
  const img = new Image();
  const canvas = document.createElement('canvas');
  const c = canvas.getContext('2d')!;
  return new Promise<'positive' | 'negative' | 'invalid'>(resolve => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      c.drawImage(img, 0, 0);
      const h = img.height, w = img.width;
      function scanLine(y: number) {
        let r=0,g=0,b=0,cnt=0;
        for (let x = Math.floor(w*0.15); x < Math.floor(w*0.85); x++) {
          try {
            const p = c.getImageData(x, y, 1, 1).data;
            r+=p[0]; g+=p[1]; b+=p[2]; cnt++;
          } catch { }
        }
        return {r:cnt?r/cnt:0, g:cnt?g/cnt:0, b:cnt?b/cnt:0};
      }
      function bandScore(y: number, band: number) {
        let best = 0;
        for (let dy=-band; dy<=band; dy++) {
          if (y+dy<0||y+dy>=h) continue;
          const s = scanLine(y+dy);
          const intensity = s.r - (s.g+s.b)/2;
          if (intensity > best) best = intensity;
        }
        return best;
      }
      const bg = scanLine(Math.floor(h*0.1));
      const threshold = Math.max(18, (bg.r+bg.g+bg.b)/3 * 0.07);
      const ctrl = bandScore(Math.floor(h*0.3), 8) > threshold;
      const test = bandScore(Math.floor(h*0.65), 8) > threshold;
      let res: 'positive' | 'negative' | 'invalid' = 'invalid';
      if (ctrl && test) res = 'positive';
      else if (ctrl && !test) res = 'negative';
      resolve(res);
    };
    img.src = 'data:image/jpeg;base64,' + base64;
  });
}

export default function PatientTest() {
  const router = useRouter();
  const [user, setUser] = useState({ id: '' });
  const [barcode, setBarcode] = useState('');
  const [kit, setKit] = useState<any>(null);
  const [step, setStep] = useState<'enter-barcode' | 'kit-status' | 'camera' | 'processing' | 'result' | 'result-saved' | 'linked'>('enter-barcode');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<'positive' | 'negative' | 'invalid'>('invalid');
  const [formResult, setFormResult] = useState<'pending' | 'success' | 'error'>('pending');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function init() {
      const { data: { session} } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      setUser({ id: session.user.id });
    }
    init();
  }, [router]);

  const fetchKit = useCallback(async (bc: string) => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/sample-kits/scan/' + bc);
      if (res.ok) {
        const d = await res.json();
        setKit(d);
        // Determine step based on kit status
        if (!d) {
          setStep('kit-status');
          setMsg('Kit not found');
        } else if (d.status === 'REGISTERED') {
          setStep('linked');
          setMsg('Kit registered but not linked to your account. Link it first.');
        } else if (
          d.status === 'PAIRED' || d.status === 'COLLECTED' ||
          d.status === 'IN_TRANSIT' || d.status === 'IN_LAB' || d.status === 'PROCESSED'
        ) {
          setStep('camera');
          setMsg('Ready to take test');
        } else {
          setStep('kit-status');
          setMsg('Unknown kit status: ' + d.status);
        }
      } else {
        const e = await res.json();
        setKit(null);
        setStep('kit-status');
        setMsg(e.message || 'Failed to fetch kit');
      }
    } catch (e) {
      setKit(null);
      setStep('kit-status');
      setMsg('Error fetching kit');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcode.trim();
    if (!code) return;
    setBarcode(code);
    await fetchKit(code);
  };

  const takeTest = useCallback(async (imageBase64: string) => {
    setFormResult('pending');
    setMsg('Analyzing…');
    try {
      const result = await analyzeStrip(imageBase64);
      setAnalysisResult(result);
      // Save test result
      const { data: { session} = {} } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const res = await apiFetch('/api/test-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session.user.id, result, date: new Date().toISOString() }),
      });
      if (res.ok) {
        const d = await res.json();
        setFormResult('success');
        setMsg(`Test result saved: ${d.result || '—'}`);
        setTimeout(() => void router.push('/patient/results'), 2000);
      } else {
        const e = await res.json();
        setFormResult('error');
        setMsg(e.error || 'Failed to save result');
      }
    } catch (e: any) {
      setFormResult('error');
      setMsg(e.message || 'Analysis failed');
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split('base64,').pop() || '';
      await takeTest(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Self-Test</h1>

      {step === 'enter-barcode' && (
        <form onSubmit={handleBarcode} className="mb-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium">Kit barcode</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter or scan kit barcode"
              required
            />
            <button
              type="submit"
              className="w-full rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Look Up Kit
            </button>
          </div>
        </form>
      )}

      {step === 'kit-status' && (
        <div className="p-4 bg-white rounded border shadow-sm">
          <p className="text-lg font-medium mb-2">{msg}</p>
          {kit && (
            <div>
              <p className="text-sm text-gray-500">Barcode: {kit.barcode}</p>
              <p className="text-sm text-gray-500">Status: {kit.status || '—'}</p>
              {kit.patientName && <p className="text-sm text-gray-500">Linked to: {kit.patientName}</p>}
              <button
                onClick={() => setStep('enter-barcode')}
                className="mt-2 rounded bg-gray-200 px-3 py-1 text-sm text-gray-700"
              >
                Enter Different Barcode
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'linked' && (
        <div className="p-4 bg-white rounded border shadow-sm">
          <p className="text-lg font-medium mb-2">{msg}</p>
          <button
            onClick={async () => {
              try {
                const res = await apiFetch('/api/sample-kits/link', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ barcode, patientId: user.id, patientName: 'Patient' }),
                });
                if (res.ok) {
                  setMsg('Kit linked. You can now take the test.');
                  setStep('camera');
                } else {
                  const e = await res.json();
                  setMsg(e.message || 'Failed to link kit');
                  setStep('kit-status');
                }
              } catch {
                setMsg('Failed to link kit');
                setStep('kit-status');
              }
            }}
            className="rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors">
            Link Kit to My Account
          </button>
          <button
            onClick={() => setStep('enter-barcode')}
            className="mt-2 rounded bg-gray-200 px-3 py-1 text-sm text-gray-700">
            Enter Different Barcode
          </button>
        </div>
      )}

      {step === 'camera' && (
        <div className="p-4 bg-white rounded border shadow-sm">
          <p className="text-lg font-medium mb-4">{msg}</p>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (rEvent) => {
                  const base64 = rEvent.target?.result?.toString().split('base64,').pop() || '';
                  await takeTest(base64);
                };
                reader.readAsDataURL(file);
              }}
              className="w-full rounded border p-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
            >
              <p className="text-sm text-gray-500 mt-1">Upload strip photo</p>
            </input>
          </div>
          {analysisResult !== 'invalid' && (
            <div className="mt-4 p-3 rounded" style={{ background: analysisResult === 'positive' ? '#fee2e2' : analysisResult === 'negative' ? '#d1fae5' : '#e2e8f0' }}>
              <p className="font-medium">{analysisResult === 'positive' ? 'Positive' : analysisResult === 'negative' ? 'Negative' : 'Invalid'}</p>
              <p className="text-xs text-gray-500">Analysis performed using same algorithm as mobile app</p>
              <button
                onClick={() => {
                  // result already saved in takeTest; just reset
                  setAnalysisResult('invalid');
                  setStep('result-saved');
                }}
                className="mt-2 rounded bg-green-600 px-3 py-1 text-white text-sm hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          )}
          {analysisResult === 'invalid' && (
            <p className="mt-2 text-sm text-gray-500">Tap image to analyze</p>
          )}
        </div>
      )}

      {step === 'result-saved' && (
        <div className="p-4 bg-green-100 rounded border border-green-200">
          <p className="font-medium">Test result saved</p>
          <p className="text-sm text-green-700 mt-1">Your result has been recorded and synced to your profile.</p>
          <button
            onClick={() => void router.push('/patient/results')}
            className="mt-3 rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            View Results
          </button>
        </div>
      )}
    </div>
  );
}