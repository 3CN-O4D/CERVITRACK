'use client';

import { useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const readerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted || !readerRef.current) return;

        const scanner = new Html5Qrcode('barcode-qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (mounted) {
              onScan(decodedText);
              scanner.stop().catch(() => {});
              onClose();
            }
          },
          () => {},
        );
      } catch (err: any) {
        if (mounted) {
          if (err?.toString?.().includes('NotAllowedError')) {
            setError('Camera permission denied. Please allow camera access in your browser settings.');
          } else if (err?.toString?.().includes('NotFoundError')) {
            setError('No camera found. Please connect a camera or enter the barcode manually.');
          } else {
            setError('Could not start camera. Try entering the barcode manually.');
          }
          setScanning(false);
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="relative">
      {error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <svg className="w-8 h-8 text-amber-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      ) : (
        <>
          <div ref={readerRef} id="barcode-qr-reader" className="w-full rounded-lg overflow-hidden" />
          {scanning && (
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                Point camera at barcode
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
