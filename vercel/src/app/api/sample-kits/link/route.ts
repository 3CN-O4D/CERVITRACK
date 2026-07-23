import { NextRequest, NextResponse } from 'next/server';
import { getKit, pairKit } from '@/lib/kit-store';

export async function POST(req: NextRequest) {
  try {
    const { barcode, patientId, patientName, linkedBy, linkedByName } = await req.json();

    if (!barcode || !patientId) {
      return NextResponse.json({ message: 'barcode and patientId are required' }, { status: 400 });
    }

    const existing = await getKit(barcode);
    if (!existing) {
      return NextResponse.json({ message: 'Kit not found. Register it first.' }, { status: 404 });
    }
    if (existing.patient_id) {
      return NextResponse.json({ message: `Kit already linked to ${existing.patient_name || 'a patient'}. Unlink first.` }, { status: 409 });
    }
    if (existing.status !== 'REGISTERED') {
      return NextResponse.json({ message: `Kit is ${existing.status}. Only REGISTERED kits can be linked.` }, { status: 400 });
    }

    const result = await pairKit(barcode, {
      patientId,
      patientName: patientName || 'Patient',
      pairedBy: linkedBy || 'system',
      pairedByName: linkedByName || 'System',
    });

    if ('error' in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }

    return NextResponse.json({ kit: result.kit, notification: true });
  } catch {
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
