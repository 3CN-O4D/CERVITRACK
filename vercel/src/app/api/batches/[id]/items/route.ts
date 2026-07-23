import { NextRequest, NextResponse } from 'next/server';
import { addSampleToBatch, removeSampleFromBatch } from '@/lib/batch-store';
import { getKit } from '@/lib/kit-store';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { kit_barcode } = body;

  if (!kit_barcode) {
    return NextResponse.json({ message: 'kit_barcode required' }, { status: 400 });
  }

  const kit = getKit(kit_barcode);
  const result = addSampleToBatch(params.id, {
    kit_barcode,
    kit_id: kit?.id || null,
    patient_id: kit?.patientId || null,
    patient_name: kit?.patientName || '',
  });

  if (result.error) return NextResponse.json({ message: result.error }, { status: result.status });
  return NextResponse.json(result.batch, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId');
  if (!itemId) return NextResponse.json({ message: 'itemId required' }, { status: 400 });

  const result = removeSampleFromBatch(params.id, itemId);
  if (result.error) return NextResponse.json({ message: result.error }, { status: result.status });
  return NextResponse.json(result.batch);
}
