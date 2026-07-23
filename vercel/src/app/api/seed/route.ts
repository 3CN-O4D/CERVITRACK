import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const TEST_USERS = [
  { email: 'patient1@cervitrack.app', password: 'password123', name: 'Grace Wanjiku', phone: '+254712000001', role: 'patient' },
  { email: 'patient2@cervitrack.app', password: 'password123', name: 'Faith Achieng', phone: '+254722000002', role: 'patient' },
  { email: 'patient3@cervitrack.app', password: 'password123', name: 'Mary Njeri', phone: '+254733000003', role: 'patient' },
  { email: 'patient4@cervitrack.app', password: 'password123', name: 'Esther Muthoni', phone: '+254744000004', role: 'patient' },
  { email: 'patient5@cervitrack.app', password: 'password123', name: 'Rose Adhiambo', phone: '+254755000005', role: 'patient' },
  { email: 'patient6@cervitrack.app', password: 'password123', name: 'Jane Wairimu', phone: '+254766000006', role: 'patient' },
  { email: 'patient7@cervitrack.app', password: 'password123', name: 'Agnes Nyambura', phone: '+254777000007', role: 'patient' },
  { email: 'patient8@cervitrack.app', password: 'password123', name: 'Lucy Akinyi', phone: '+254788000008', role: 'patient' },
  { email: 'patient9@cervitrack.app', password: 'password123', name: 'Diana Chebet', phone: '+254799000009', role: 'patient' },
  { email: 'patient10@cervitrack.app', password: 'password123', name: 'Alice Mwikali', phone: '+254700000010', role: 'patient' },
  { email: 'nurse1@cervitrack.app', password: 'password123', name: 'Nurse Sarah Kimani', phone: '+254711000011', role: 'clinician' },
  { email: 'nurse2@cervitrack.app', password: 'password123', name: 'Nurse Rose Omondi', phone: '+254722000022', role: 'clinician' },
  { email: 'lab1@cervitrack.app', password: 'password123', name: 'Lab Tech John Kipchoge', phone: '+254733000033', role: 'lab_technician' },
  { email: 'lab2@cervitrack.app', password: 'password123', name: 'Lab Tech Mary Nyokabi', phone: '+254744000044', role: 'lab_technician' },
  { email: 'admin1@cervitrack.app', password: 'password123', name: 'System Admin', phone: '+254755000055', role: 'facility_admin' },
  { email: 'admin2@cervitrack.app', password: 'password123', name: 'County Admin Nairobi', phone: '+254766000066', role: 'county_admin' },
  { email: 'clinician1@cervitrack.app', password: 'password123', name: 'Dr. Amina Wanjiku', phone: '+254711000011', role: 'clinician' },
  { email: 'clinician2@cervitrack.app', password: 'password123', name: 'Dr. James Ochieng', phone: '+254722000022', role: 'clinician' },
  { email: 'clinician3@cervitrack.app', password: 'password123', name: 'Dr. Faith Akinyi', phone: '+254733000033', role: 'clinician' },
  { email: 'clinician4@cervitrack.app', password: 'password123', name: 'Dr. Peter Mwangi', phone: '+254744000044', role: 'clinician' },
];

export async function POST() {
  const results: { email: string; status: string; message?: string }[] = [];

  for (const user of TEST_USERS) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });

      if (error) {
        if (error.message?.includes('already exists')) {
          results.push({ email: user.email, status: 'exists' });
        } else {
          results.push({ email: user.email, status: 'error', message: error.message });
        }
      } else {
        results.push({ email: user.email, status: 'created', message: data.user?.id });
      }
    } catch (err: unknown) {
      results.push({ email: user.email, status: 'error', message: err instanceof Error ? err.message : 'unknown' });
    }
  }

  const created = results.filter(r => r.status === 'created').length;
  const existed = results.filter(r => r.status === 'exists').length;
  const errors = results.filter(r => r.status === 'error');

  return NextResponse.json({
    summary: `${created} created, ${existed} already existed, ${errors.length} errors`,
    created,
    existed,
    errors,
    results,
  });
}
