import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class FacilitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { county?: string; type?: string; search?: string; page?: number; limit?: number }) {
    const { county, type, search, page = 1, limit = 20 } = query;
    const where: any = {};

    if (county) where.county = county;
    if (type) where.facilityType = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [facilities, total] = await Promise.all([
      this.prisma.facility.findMany({
        where,
        include: { _count: { select: { patients: true, screenings: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.facility.count({ where }),
    ]);

    return { data: facilities, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        _count: { select: { patients: true, screenings: true, users: true } },
        users: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    if (!facility) throw new NotFoundException('Facility not found');
    return facility;
  }

  async create(data: any) {
    return this.prisma.facility.create({ data });
  }

  async update(id: string, data: any) {
    const facility = await this.prisma.facility.findUnique({ where: { id } });
    if (!facility) throw new NotFoundException('Facility not found');
    return this.prisma.facility.update({ where: { id }, data });
  }

  async getStats(id: string) {
    const [totalPatients, totalScreenings, screeningsByResult, recentScreenings] = await Promise.all([
      this.prisma.patient.count({ where: { facilityId: id } }),
      this.prisma.screening.count({ where: { facilityId: id } }),
      this.prisma.screening.groupBy({
        by: ['result'],
        where: { facilityId: id },
        _count: true,
      }),
      this.prisma.screening.findMany({
        where: { facilityId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { patient: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    return {
      totalPatients,
      totalScreenings,
      screeningsByResult: screeningsByResult.map((s) => ({
        result: s.result,
        count: s._count,
      })),
      recentScreenings,
    };
  }
}
