'use client';

import { useState } from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function MonthCalendar({
  value,
  onChange,
  minDate,
}: {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
}) {
  const today = new Date();
  const initial = value ? new Date(value + 'T12:00:00') : today;
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const min = minDate ? new Date(minDate + 'T00:00:00') : today;
  const minTime = startOfDay(min);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function shift(delta: number) {
    setCursor(new Date(year, month + delta, 1));
  }

  return (
    <div className="rounded-2xl border-2 border-gray-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} className="rounded-lg px-2 py-1 text-lg font-bold text-gray-500 hover:bg-gray-100">‹</button>
        <p className="text-sm font-bold">{MONTHS[month]} {year}</p>
        <button type="button" onClick={() => shift(1)} className="rounded-lg px-2 py-1 text-lg font-bold text-gray-500 hover:bg-gray-100">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1 text-[10px] font-bold text-gray-400">{w}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const key = toKey(year, month, day);
          const disabled = startOfDay(new Date(year, month, day)) < minTime;
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                selected
                  ? 'bg-primary text-white'
                  : disabled
                    ? 'text-gray-300'
                    : 'text-gray-700 hover:bg-primary/10'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
