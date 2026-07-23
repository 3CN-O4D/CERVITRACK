import { NextRequest, NextResponse } from 'next/server';
import { getKitStats } from '@/lib/kit-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const result = await getKitStats(searchParams.get('facilityId') || undefined);
  return NextResponse.json(result);
}
