import { NextRequest, NextResponse } from 'next/server';
import { getKit, registerKit } from '@/lib/kit-store';

export async function GET(_req: NextRequest, { params }: { params: { barcode: string } }) {
  const barcode = decodeURIComponent(params.barcode);
  const kit = await getKit(barcode);
  if (!kit) return NextResponse.json({ message: 'Kit not found' }, { status: 404 });
  return NextResponse.json(kit);
}

export async function POST(req: NextRequest, { params }: { params: { barcode: string } }) {
  const barcode = decodeURIComponent(params.barcode);
  const body = await req.json();
  const existing = await getKit(barcode);
  if (existing) return NextResponse.json(existing);
  const result = await registerKit(barcode, body);
  if (result.error) return NextResponse.json({ message: result.error }, { status: result.status });
  return NextResponse.json(result.kit);
}
