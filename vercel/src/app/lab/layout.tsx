'use client';

import AuthGuard from '@/components/AuthGuard';

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['lab_technician']} redirectTo="/login/lab">
      {children}
    </AuthGuard>
  );
}
