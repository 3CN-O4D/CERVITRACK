import { NextRequest, NextResponse } from 'next/server';
import { addSampleToBatch, getBatchByCode } from '@/lib/batch-store';
import { getKit, receiveKit } from '@/lib/kit-store';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { batch_code, kit_barcode } = body;

  if (!batch_code || !kit_barcode) {
    return NextResponse.json({ message: 'batch_code and kit_barcode required' }, { status: 400 });
  }

  const batch = await getBatchByCode(batch_code);
  if (!batch) return NextResponse.json({ message: 'Batch not found' }, { status: 404 });

  const kit = await getKit(kit_barcode);
  if (!kit) return NextResponse.json({ message: 'Kit not found. Register it first.' }, { status: 404 });

  if (kit.status !== 'IN_TRANSIT' && kit.status !== 'COLLECTED') {
    return NextResponse.json({ message: `Kit is ${kit.status}. Must be IN_TRANSIT or COLLECTED.` }, { status: 400 });
  }

  await receiveKit(kit_barcode, {
    receivedBy: batch.lab_tech_id,
    receivedByName: batch.lab_tech_name,
    facilityId: batch.facility_id,
    notes: `Received into batch ${batch_code}`,
  });

  const result = await addSampleToBatch(batch.id, {
    kit_barcode,
    kit_id: kit.id,
    patient_id: kit.patient_id,
    patient_name: kit.patient_name,
  });

  if (result.error) return NextResponse.json({ message: result.error }, { status: result.status });
  return NextResponse.json({ batch: result.batch, kit, patient_name: kit.patient_name });
}
