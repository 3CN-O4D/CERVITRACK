'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RemindersPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link href="/patient" className="mb-6 block text-primary">
        ← Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold">Reminders</h1>
      <p>This section is under construction.</p>
    </div>
  );
}