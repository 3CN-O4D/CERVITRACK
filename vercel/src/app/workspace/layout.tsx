'use client';

import AuthGuard from '@/components/AuthGuard';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['clinician', 'provider', 'admin', 'national_admin', 'system_admin']}>
      {children}
    </AuthGuard>
  );
}
