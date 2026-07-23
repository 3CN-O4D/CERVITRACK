import { NextRequest, NextResponse } from 'next/server';
import { recordItemResult } from '@/lib/batch-store';

export async function PATCH(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const body = await req.json();
  const { result, result_notes } = body;

  if (!result) {
    return NextResponse.json({ message: 'result required' }, { status: 400 });
  }

  const batchResult = recordItemResult(params.id, params.itemId, { result, result_notes });
  if (batchResult.error) return NextResponse.json({ message: batchResult.error }, { status: batchResult.status });
  return NextResponse.json(batchResult.batch);
}
