import { NextRequest, NextResponse } from 'next/server';
import { createBatch, listBatches, getBatchStats } from '@/lib/batch-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lab_tech_id = searchParams.get('lab_tech_id') || undefined;
  const status = searchParams.get('status') || undefined;
  const stats = searchParams.get('stats') === '1';

  if (stats) {
    return NextResponse.json(await getBatchStats(lab_tech_id));
  }

  const result = await listBatches({
    lab_tech_id,
    status,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lab_tech_id, lab_tech_name, facility_id } = body;

  if (!lab_tech_id || !lab_tech_name) {
    return NextResponse.json({ message: 'lab_tech_id and lab_tech_name required' }, { status: 400 });
  }

  const batch = await createBatch({ lab_tech_id, lab_tech_name, facility_id });
  return NextResponse.json(batch, { status: 201 });
}
