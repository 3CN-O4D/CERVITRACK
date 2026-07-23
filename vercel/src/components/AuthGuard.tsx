'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export default function AuthGuard({ children, allowedRoles, redirectTo = '/auth' }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push(redirectTo);
          return;
        }

        // Check auth metadata first (fast)
        let role = session.user.user_metadata?.role || session.user.app_metadata?.role || '';

        // If no role in metadata, look up from public.users table
        if (!role) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();
          role = profile?.role || '';
        }

        if (allowedRoles.includes(role) || role === 'system_admin' || role === 'national_admin') {
          setAllowed(true);
        } else {
          router.push(redirectTo);
          return;
        }
      } catch {
        router.push(redirectTo);
        return;
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;
  return <>{children}</>;
}
