import { NextRequest, NextResponse } from 'next/server';
import { getBatch, startTesting } from '@/lib/batch-store';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const batch = await getBatch(params.id);
  if (!batch) return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
  return NextResponse.json(batch);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { action } = body;

  if (action === 'start_testing') {
    const result = await startTesting(params.id);
    if (result.error) return NextResponse.json({ message: result.error }, { status: result.status });
    return NextResponse.json(result.batch);
  }

  return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
}
