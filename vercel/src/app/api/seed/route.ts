import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const TEST_USERS = [
  { email: 'patient1@cervitrack.app', password: 'password123', name: 'Grace Wanjiku', phone: '+254712000001', role: 'patient', county: 'Nairobi', sub_county: 'Westlands', ward: 'Parklands', patient_id: 'PT-2026-0001' },
  { email: 'patient2@cervitrack.app', password: 'password123', name: 'Faith Achieng', phone: '+254722000002', role: 'patient', county: 'Kisumu', sub_county: 'Kisumu Central', ward: 'Kondele', patient_id: 'PT-2026-0002' },
  { email: 'patient3@cervitrack.app', password: 'password123', name: 'Mary Njeri', phone: '+254733000003', role: 'patient', county: 'Nakuru', sub_county: 'Nakuru Town', ward: 'CBD', patient_id: 'PT-2026-0003' },
  { email: 'patient4@cervitrack.app', password: 'password123', name: 'Esther Muthoni', phone: '+254744000004', role: 'patient', county: 'Nyeri', sub_county: 'Nyeri Central', ward: 'Ruringu', patient_id: 'PT-2026-0004' },
  { email: 'patient5@cervitrack.app', password: 'password123', name: 'Rose Adhiambo', phone: '+254755000005', role: 'patient', county: 'Mombasa', sub_county: 'Mvita', ward: 'Old Town', patient_id: 'PT-2026-0005' },
  { email: 'patient6@cervitrack.app', password: 'password123', name: 'Jane Wairimu', phone: '+254766000006', role: 'patient', county: 'Kiambu', sub_county: 'Thika', ward: 'Town', patient_id: 'PT-2026-0006' },
  { email: 'patient7@cervitrack.app', password: 'password123', name: 'Agnes Nyambura', phone: '+254777000007', role: 'patient', county: 'Meru', sub_county: 'Meru Town', ward: 'CBD', patient_id: 'PT-2026-0007' },
  { email: 'patient8@cervitrack.app', password: 'password123', name: 'Lucy Akinyi', phone: '+254788000008', role: 'patient', county: 'Kakamega', sub_county: 'Kakamega Town', ward: 'CBD', patient_id: 'PT-2026-0008' },
  { email: 'patient9@cervitrack.app', password: 'password123', name: 'Diana Chebet', phone: '+254799000009', role: 'patient', county: 'Uasin Gishu', sub_county: 'Eldoret', ward: 'CBD', patient_id: 'PT-2026-0009' },
  { email: 'patient10@cervitrack.app', password: 'password123', name: 'Alice Mwikali', phone: '+254710000010', role: 'patient', county: 'Machakos', sub_county: 'Machakos Town', ward: 'CBD', patient_id: 'PT-2026-0010' },
  { email: 'nurse1@cervitrack.app', password: 'password123', name: 'Nurse Sarah Kimani', phone: '+254711000012', role: 'clinician', county: 'Nakuru', sub_county: 'Nakuru Town', ward: 'CBD', patient_id: null },
  { email: 'nurse2@cervitrack.app', password: 'password123', name: 'Nurse Rose Omondi', phone: '+254722000023', role: 'clinician', county: 'Mombasa', sub_county: 'Mvita', ward: 'Old Town', patient_id: null },
  { email: 'lab1@cervitrack.app', password: 'password123', name: 'Lab Tech John Kipchoge', phone: '+254733000034', role: 'lab_technician', county: 'Nairobi', sub_county: 'Westlands', ward: 'Parklands', patient_id: null },
  { email: 'lab2@cervitrack.app', password: 'password123', name: 'Lab Tech Mary Nyokabi', phone: '+254744000045', role: 'lab_technician', county: 'Uasin Gishu', sub_county: 'Eldoret', ward: 'CBD', patient_id: null },
  { email: 'admin1@cervitrack.app', password: 'password123', name: 'System Admin', phone: '+254755000056', role: 'facility_admin', county: 'Nairobi', sub_county: 'Westlands', ward: 'Parklands', patient_id: null },
  { email: 'admin2@cervitrack.app', password: 'password123', name: 'County Admin Nairobi', phone: '+254766000067', role: 'county_admin', county: 'Nairobi', sub_county: 'Westlands', ward: 'Parklands', patient_id: null },
  { email: 'clinician1@cervitrack.app', password: 'password123', name: 'Dr. Amina Wanjiku', phone: '+254711000013', role: 'clinician', county: 'Nairobi', sub_county: 'Westlands', ward: 'Parklands', patient_id: null },
  { email: 'clinician2@cervitrack.app', password: 'password123', name: 'Dr. James Ochieng', phone: '+254722000024', role: 'clinician', county: 'Uasin Gishu', sub_county: 'Eldoret', ward: 'CBD', patient_id: null },
  { email: 'clinician3@cervitrack.app', password: 'password123', name: 'Dr. Faith Akinyi', phone: '+254733000035', role: 'clinician', county: 'Kisumu', sub_county: 'Kisumu Central', ward: 'Kondele', patient_id: null },
  { email: 'clinician4@cervitrack.app', password: 'password123', name: 'Dr. Peter Mwangi', phone: '+254744000046', role: 'clinician', county: 'Nakuru', sub_county: 'Nakuru Town', ward: 'CBD', patient_id: null },
];

export async function POST() {
  const results: { email: string; status: string; message?: string }[] = [];

  // Step 1: Delete all existing auth users (except service role)
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  let deleted = 0;
  if (existingUsers?.users) {
    for (const u of existingUsers.users) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
      if (!error) deleted++;
    }
  }

  // Step 2: Clear the public users table
  await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Step 3: Create all users
  for (const user of TEST_USERS) {
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        phone: user.phone,
        user_metadata: { name: user.name, role: user.role },
      });

      if (authError) {
        results.push({ email: user.email, status: 'error', message: authError.message });
        continue;
      }

      const userId = authData.user.id;

      const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        county: user.county,
        sub_county: user.sub_county,
        ward: user.ward,
        patient_id: user.patient_id,
        password: 'password123',
        consent_terms: true,
        consent_medical: true,
        consent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        results.push({ email: user.email, status: 'auth_ok_profile_error', message: profileError.message });
      } else {
        results.push({ email: user.email, status: 'created', message: userId });
      }
    } catch (err: unknown) {
      results.push({ email: user.email, status: 'error', message: err instanceof Error ? err.message : 'unknown' });
    }
  }

  const created = results.filter(r => r.status === 'created').length;
  const errors = results.filter(r => r.status.includes('error'));

  return NextResponse.json({
    summary: `Deleted ${deleted} old users. Created ${created}/20. ${errors.length} errors.`,
    deleted,
    created,
    errors,
    results,
  });
}
