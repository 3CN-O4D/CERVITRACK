import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create system admin
  const hashedPassword = await bcrypt.hash('Admin@Cervitrack2024', 12);

  await prisma.user.upsert({
    where: { email: 'admin@cervitrack.go.ke' },
    update: {},
    create: {
      email: 'admin@cervitrack.go.ke',
      password: hashedPassword,
      role: 'system_admin',
      firstName: 'System',
      lastName: 'Administrator',
      county: 'Nairobi',
    },
  });

  // Create sample facility
  const facility = await prisma.facility.upsert({
    where: { code: 'KNH-001' },
    update: {},
    create: {
      name: 'Kenyatta National Hospital',
      code: 'KNH-001',
      county: 'Nairobi',
      subCounty: 'Nairobi Central',
      ward: 'Hospital Road',
      facilityType: 'hospital',
      phone: '+254 20 2726300',
      latitude: -1.299,
      longitude: 36.817,
    },
  });

  // Create sample clinician
  const clinicianPassword = await bcrypt.hash('Clinician@2024', 12);
  await prisma.user.upsert({
    where: { email: 'clinician@cervitrack.go.ke' },
    update: {},
    create: {
      email: 'clinician@cervitrack.go.ke',
      password: clinicianPassword,
      role: 'clinician',
      firstName: 'Dr. Sarah',
      lastName: 'Kimani',
      phone: '+254712345678',
      facilityId: facility.id,
      county: 'Nairobi',
    },
  });

  // Create sample lab technician
  const labPassword = await bcrypt.hash('LabTech@2024', 12);
  await prisma.user.upsert({
    where: { email: 'lab@cervitrack.go.ke' },
    update: {},
    create: {
      email: 'lab@cervitrack.go.ke',
      password: labPassword,
      role: 'lab_technician',
      firstName: 'Paul',
      lastName: 'Mwangi',
      phone: '+254723456789',
      facilityId: facility.id,
      county: 'Nairobi',
    },
  });

  // Create sample patients
  const patients = [
    {
      nationalIdOrPassport: '3847261',
      firstName: 'Wanjiku',
      lastName: 'Muthoni',
      dateOfBirth: new Date('1990-05-15'),
      phone: '+254734567890',
      gender: 'FEMALE',
      county: 'Nairobi',
      subCounty: 'Westlands',
      facilityId: facility.id,
    },
    {
      nationalIdOrPassport: '3847262',
      firstName: 'Amina',
      lastName: 'Hassan',
      dateOfBirth: new Date('1985-08-22'),
      phone: '+254745678901',
      gender: 'FEMALE',
      county: 'Mombasa',
      subCounty: 'Mvita',
      facilityId: facility.id,
    },
    {
      nationalIdOrPassport: '3847263',
      firstName: 'Grace',
      lastName: 'Odhiambo',
      dateOfBirth: new Date('1995-03-10'),
      phone: '+254756789012',
      gender: 'FEMALE',
      county: 'Kisumu',
      subCounty: 'Kisumu Central',
      facilityId: facility.id,
    },
  ];

  for (const p of patients) {
    await prisma.patient.upsert({
      where: { nationalIdOrPassport: p.nationalIdOrPassport },
      update: {},
      create: p,
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
