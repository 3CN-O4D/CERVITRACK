'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AssistantPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link
        href="/patient"
        className="mb-6 block text-primary hover:text-primary/90 text-lg font-medium transition-colors">
        ← Back to Dashboard
      </Link>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>

        <p className="text-lg">
          Ask questions about your health, kits, appointments, or results. The
          assistant can help you navigate the app and understand your data.
        </p>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-bold mb-4">Sample questions:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>What does my kit status mean?</li>
            <li>When are my results available?</li>
            <li>How do I schedule an appointment?</li>
            <li>What screenings are due?</li>
          </ul>
        </div>

        <div className="mt-8">
          <Link
            href="/patient/kits"
            className="inline-block text-primary hover:text-primary/90 text-sm font-medium">
            Visit Kit Tracker
          </Link>
          <span className="mx-2">•</span>
          <Link
            href="/patient/results"
            className="inline-block text-primary hover:text-primary/90 text-sm font-medium">
            View Results
          </Link>
        </div>
      </div>
    </div>
  );
}