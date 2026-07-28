import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/auth-store';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone, role, county, sub_county, ward } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required.' }, { status: 400 });
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
    }

    const user = createUser({ email, password, name, phone, role, county, sub_county, ward });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        patient_id: user.patient_id,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
