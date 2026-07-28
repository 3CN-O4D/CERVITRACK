import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const providers = [
      {
        id: 1,
        name: "Dr. Sarah Kimani",
        specialty: "HPV Specialist",
        facility: "Nairobi Women's Hospital",
        county: "Nairobi",
        phone: "+254 712 345 678",
        email: "sarah.kimani@example.com",
        photo: "",
      },
    ];
    return NextResponse.json(providers, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
