import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser, unauthorized, forbidden } from '@/lib/api-auth';

const PUBLIC_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/sample-kits',
  '/api/batches',
  '/api/providers/login',
  '/api/seed',
  '/api/i18n',
  '/api/library',
  '/api/facilities',
  '/api/sampling/guide',
];

const ADMIN_ROLES = ['admin', 'national_admin', 'system_admin', 'county_admin'];

function isPublic(path: string) {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (isPublic(path)) return NextResponse.next();

  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  if (path === '/api/admin' || path.startsWith('/api/admin/')) {
    if (!ADMIN_ROLES.includes(user.role)) return forbidden();
  }

  return NextResponse.next();
}

export const config = { matcher: ['/api/:path*'] };