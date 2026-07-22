import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { county?: string; facilityId?: string; search?: string; page?: number; limit?: number }) {
    const { county, facilityId, search, page = 1, limit = 20 } = query;
    const where: any = {};

    if (county) where.county = county;
    if (facilityId) where.facilityId = facilityId;
    if (search) {
      where.OR = [
        { nationalIdOrPassport: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: {
          facility: { select: { name: true } },
          screenings: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data: patients, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        facility: true,
        screenings: { orderBy: { createdAt: 'desc' } },
        diagnoses: { orderBy: { createdAt: 'desc' } },
        treatments: { orderBy: { createdAt: 'desc' } },
        referrals: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async create(dto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        nationalIdOrPassport: dto.nationalIdOrPassport || `PAT-${Date.now()}`,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        facilityId: dto.facilityId,
        county: dto.county,
        subCounty: dto.subCounty,
        ward: dto.ward,
      },
    });
  }

  async update(id: string, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');

    const updateData: any = {};
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.nationalIdOrPassport) updateData.nationalIdOrPassport = dto.nationalIdOrPassport;
    if (dto.county) updateData.county = dto.county;
    if (dto.subCounty) updateData.subCounty = dto.subCounty;
    if (dto.ward) updateData.ward = dto.ward;

    return this.prisma.patient.update({
      where: { id },
      data: updateData,
    });
  }

  async getSummary(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        screenings: { orderBy: { createdAt: 'desc' }, take: 1 },
        diagnoses: { orderBy: { createdAt: 'desc' }, take: 1 },
        treatments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    return {
      patient: { id, name: `${patient.firstName} ${patient.lastName}` },
      lastScreening: patient.screenings[0] || null,
      diagnosis: patient.diagnoses[0] || null,
      treatment: patient.treatments[0] || null,
      nextAction: this.getNextAction(patient),
    };
  }

  private getNextAction(patient: any): string {
    if (patient.treatments.length > 0) {
      const lastTreatment = patient.treatments[0];
      if (lastTreatment.followUpDate && new Date(lastTreatment.followUpDate) <= new Date()) {
        return 'Follow-up visit due';
      }
    }
    if (patient.screenings.length > 0) {
      const lastScreening = patient.screenings[0];
      const monthsSince = (Date.now() - new Date(lastScreening.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsSince > 12) return 'Annual screening due';
      if (lastScreening.result === 'POSITIVE' && !patient.diagnoses.length) return 'Diagnostic evaluation needed';
    }
    return 'Routine screening';
  }
}
