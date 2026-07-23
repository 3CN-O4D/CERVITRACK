'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyAuthPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login/patient');
  }, []);
  return null;
}
