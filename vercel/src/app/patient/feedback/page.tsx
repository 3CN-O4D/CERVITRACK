'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link
        href="/patient"
        className="mb-6 block text-primary hover:text-primary/90 text-lg font-medium transition-colors">
        ← Back to Dashboard
      </Link>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Feedback</h1>

        <p className="text-lg">
          Help us improve CerviTrack. Share your experience, report issues, or
          suggest features.
        </p>

        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <p className="text-gray-500 text-sm">
            This feature is coming soon. In the meantime, you can:
          </p>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              Check the <Link href="/patient/kits" className="underline">
                Kit Tracker
              </Link> for updates on your sample.
            </li>
            <li>
              Visit the <Link href="/patient/results" className="underline">
                Results
              </Link> page for the latest status.
            </li>
            <li>
              Email support at <a href="mailto:support@cervitrack.app">
                support@cervitrack.app
              </a>.
            </li>
          </ul>
        </div>

        <div className="mt-8">
          <Link
            href="/patient/results"
            className="inline-block text-primary hover:text-primary/90 text-sm font-medium">
            View Results
          </Link>
          <span className="mx-2">•</span>
          <Link
            href="/patient/kits"
            className="inline-block text-primary hover:text-primary/90 text-sm font-medium">
            Kit Tracker
          </Link>
        </div>
      </div>
    </div>
  );
}