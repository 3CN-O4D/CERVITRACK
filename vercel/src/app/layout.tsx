import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CerviTrack — Cervical Health for Kenyan Women',
  description: 'Track screenings, vaccines, appointments, and get AI-powered cervical health guidance.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
