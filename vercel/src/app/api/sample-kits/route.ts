import { NextRequest, NextResponse } from 'next/server';
import { listKits, registerKit, pairKit, collectKit, transitKit, receiveKit, enterResults } from '@/lib/kit-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const result = listKits({
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
      result = registerKit(barcode, body);
      break;
    case 'pair':
      result = pairKit(barcode, body);
      break;
    case 'collect':
      result = collectKit(barcode, body);
      break;
    case 'transit':
      result = transitKit(barcode, body);
      break;
    case 'receive':
      result = receiveKit(barcode, body);
      break;
    case 'results':
      result = enterResults(barcode, body);
      break;
    default:
      return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
  }

  if (result.error) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }
  return NextResponse.json(result.kit);
}
