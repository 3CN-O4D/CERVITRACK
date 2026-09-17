'use client';

import { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  submitLabel?: string;
  placeholder?: string;
  label?: string;
  hint?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  uppercase?: boolean;
  inputClassName?: string;
  containerClassName?: string;
  buttonClassName?: string;
  scanButtonClassName?: string;
}

export default function CodeInput({
  value,
  onChange,
  onSubmit,
  submitLabel = 'Submit',
  placeholder = 'Scan or type code…',
  label,
  hint,
  autoFocus = false,
  disabled = false,
  uppercase = true,
  inputClassName = '',
  containerClassName = '',
  buttonClassName = '',
  scanButtonClassName = '',
}: CodeInputProps) {
  const [showScanner, setShowScanner] = useState(false);

  function normalize(raw: string) {
    return uppercase ? raw.toUpperCase() : raw;
  }

  function handleScan(code: string) {
    const clean = code.trim();
    onChange(normalize(clean));
    setShowScanner(false);
    onSubmit?.(clean);
  }

  return (
    <div className={containerClassName}>
      {label && <label className="mb-1 block text-sm font-medium">{label}</label>}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(normalize(e.target.value))}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit?.(value.trim())}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className={inputClassName || 'flex-1 rounded-lg border border-gray-200 px-4 py-3 font-mono focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500'}
        />
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          disabled={disabled}
          title="Scan with camera"
          className={scanButtonClassName || 'rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50'}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </button>
        {onSubmit && (
          <button
            type="button"
            onClick={() => onSubmit?.(value.trim())}
            disabled={disabled || !value.trim()}
            className={buttonClassName || 'rounded-lg bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50'}
          >
            {submitLabel}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}

      {showScanner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowScanner(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Scan Barcode</h3>
              <button onClick={() => setShowScanner(false)} className="text-2xl leading-none text-gray-400 hover:text-gray-600">×</button>
            </div>
            <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            <button
              onClick={() => setShowScanner(false)}
              className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Enter Manually Instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
