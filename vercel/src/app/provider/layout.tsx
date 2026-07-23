'use client';

import AuthGuard from '@/components/AuthGuard';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['clinician', 'provider']} redirectTo="/login/clinician">
      {children}
    </AuthGuard>
  );
}
