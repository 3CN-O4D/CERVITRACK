'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HealthPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link
        href="/patient"
        className="mb-6 block text-primary hover:text-primary/90 text-lg font-medium transition-colors">
        ← Back to Dashboard
      </Link>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Health</h1>

        <div className="space-y-4">
          <p className="text-lg">Welcome to your health dashboard.</p>
          <p className="text-sm">This section provides an overview of your health data.</p>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Quick links:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/patient/kits" className="underline">
                  Kit Tracker
                </Link>
              </li>
              <li>
                <Link href="/patient/results" className="underline">
                  Results
                </Link>
              </li>
              <li>
                <Link href="/patient/appointments" className="underline">
                  Appointments
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}