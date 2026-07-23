import { NextRequest, NextResponse } from 'next/server';
import { bulkRegisterKits } from '@/lib/kit-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { barcodes, facilityId, registeredBy, registeredByName, kitType } = body;

    if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
      return NextResponse.json({ message: 'barcodes array is required' }, { status: 400 });
    }

    const result = await bulkRegisterKits(barcodes, {
      facilityId,
      registeredBy,
      registeredByName,
      kitType,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to register kits' }, { status: 500 });
  }
}
