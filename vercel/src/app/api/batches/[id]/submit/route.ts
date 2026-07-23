import { NextRequest, NextResponse } from 'next/server';
import { submitBatch } from '@/lib/batch-store';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await submitBatch(params.id);
  if (result.error) return NextResponse.json({ message: result.error }, { status: result.status });
  return NextResponse.json(result.batch);
}
