'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  county: string;
  sub_county: string;
  ward: string;
  patient_id: string;
}

interface PatientSearchProps {
  patients: Patient[];
  value: string;
  onChange: (patientId: string) => void;
  placeholder?: string;
}

export default function PatientSearch({ patients, value, onChange, placeholder = 'Search patient by name, ID, or phone...' }: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = patients.find(p => p.id === value);

  const filtered = useMemo(() => {
    if (!query) return patients.slice(0, 20);
    const q = query.toLowerCase();
    return patients.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.patient_id?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [patients, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight >= 0 && filtered[highlight]) {
        select(filtered[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function select(patient: Patient) {
    onChange(patient.id);
    setQuery('');
    setOpen(false);
    setHighlight(-1);
  }

  function clearSelection() {
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      {selected && !open ? (
        <div className="flex items-center justify-between w-full border border-emerald-300 bg-emerald-50 rounded-lg px-3 py-2 text-sm">
          <div>
            <span className="font-medium text-emerald-800">{selected.name}</span>
            <span className="text-emerald-600 ml-2">{selected.patient_id}</span>
            {selected.phone && <span className="text-emerald-500 ml-2">{selected.phone}</span>}
          </div>
          <button type="button" onClick={clearSelection} className="text-emerald-600 hover:text-emerald-800 ml-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      )}

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">No patients found</div>
          ) : (
            filtered.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => select(p)}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                  highlight === i ? 'bg-emerald-50' : 'hover:bg-gray-50'
                } ${p.id === value ? 'bg-emerald-50' : ''}`}
              >
                <div>
                  <div className="font-medium text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.patient_id} {p.phone && `· ${p.phone}`} {p.county && `· ${p.county}`}</div>
                </div>
                {p.id === value && (
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
