import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const facilityId = params.id;

    const { data: kits } = await supabaseAdmin
      .from('sample_kits')
      .select('status')
      .eq('facility_id', facilityId);

    const { data: batches } = await supabaseAdmin
      .from('sample_batches')
      .select('status, sample_count, processed_count')
      .eq('facility_id', facilityId);

    const kitList = kits || [];
    const batchList = batches || [];

    const kitsByStatus: Record<string, number> = {};
    for (const k of kitList) kitsByStatus[k.status] = (kitsByStatus[k.status] || 0) + 1;

    let totalSamples = 0;
    let totalProcessed = 0;
    for (const b of batchList) {
      totalSamples += b.sample_count || 0;
      totalProcessed += b.processed_count || 0;
    }

    return NextResponse.json({
      totalKits: kitList.length,
      kitsByStatus,
      totalBatches: batchList.length,
      totalSamples,
      totalProcessed,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
