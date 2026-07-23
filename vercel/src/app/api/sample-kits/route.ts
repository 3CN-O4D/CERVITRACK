import { NextRequest, NextResponse } from 'next/server';
import { listKits, registerKit, pairKit, collectKit, transitKit, receiveKit, enterResults } from '@/lib/kit-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const result = await listKits({
    facilityId: searchParams.get('facilityId') || undefined,
    status: searchParams.get('status') || undefined,
    patientId: searchParams.get('patientId') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, barcode } = body;

  let result;
  switch (action) {
    case 'register':
      result = await registerKit(barcode, body);
      break;
    case 'pair':
      result = await pairKit(barcode, body);
      break;
    case 'collect':
      result = await collectKit(barcode, body);
      break;
    case 'transit':
      result = await transitKit(barcode, body);
      break;
    case 'receive':
      result = await receiveKit(barcode, body);
      break;
    case 'results':
      result = await enterResults(barcode, body);
      break;
    default:
      return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
  }

  if (result.error) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }
  return NextResponse.json(result.kit);
}
