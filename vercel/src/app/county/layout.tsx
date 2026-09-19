'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import AuthGuard from '@/components/AuthGuard';

export default function CountyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const navItems = [
    {
      href: '/county',
      label: 'County Overview',
      icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z',
    },
  ];

  return (
    <AuthGuard allowedRoles={['county_admin']} redirectTo="/login/county-admin">
      <div className="min-h-screen bg-gray-50 lg:flex">
        <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 print:hidden">
          <Link href="/county" className="text-lg font-bold text-rose-700">Counties Dashboard</Link>
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>

        {open && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 print:hidden" onClick={() => setOpen(false)} />
        )}

        <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-200 print:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static`}>
          <div className="px-6 py-5 border-b border-gray-200">
            <Link href="/county" className="text-lg font-bold text-rose-700">Counties Dashboard</Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active ? 'bg-rose-50 text-rose-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">{children}</main>
      </div>
    </AuthGuard>
  );
}