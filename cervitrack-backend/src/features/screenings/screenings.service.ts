import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateScreeningDto, SyncBatchDto } from './dto';

@Injectable()
export class ScreeningsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { facilityId?: string; patientId?: string; result?: string; page?: number; limit?: number }) {
    const { facilityId, patientId, result, page = 1, limit = 20 } = query;
    const where: any = {};

    if (facilityId) where.facilityId = facilityId;
    if (patientId) where.patientId = patientId;
    if (result) where.result = result;

    const [screenings, total] = await Promise.all([
      this.prisma.screening.findMany({
        where,
        include: {
          patient: true,
          facility: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.screening.count({ where }),
    ]);

    return { data: screenings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const screening = await this.prisma.screening.findUnique({
      where: { id },
      include: {
        patient: true,
        facility: true,
      },
    });
    if (!screening) throw new NotFoundException('Screening not found');
    return screening;
  }

  async create(dto: CreateScreeningDto) {
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    return this.prisma.screening.create({
      data: {
        patientId: dto.patientId,
        facilityId: dto.facilityId,
        providerId: dto.providerId,
        type: dto.type,
        status: dto.status || 'PENDING',
        findings: dto.findings,
        result: dto.result,
        riskLevel: dto.riskLevel,
        syncedFromOffline: false,
      },
      include: { patient: true },
    });
  }

  async syncBatch(dto: SyncBatchDto) {
    const batchId = dto.batchId || `batch_${Date.now()}`;
    const results: { id: string; status: 'synced' | 'conflict' | 'error'; message?: string }[] = [];

    // Create sync batch record
    const syncBatch = await this.prisma.syncBatch.create({
      data: {
        batchId,
        recordCount: dto.items.length,
        status: 'PROCESSING',
      },
    });

    for (const item of dto.items) {
      try {
        const existing = await this.prisma.screening.findFirst({
          where: {
            patientId: item.patientId,
            type: item.type,
            createdAt: new Date(item.screeningDate),
          },
        });

        if (existing) {
          results.push({
            id: item.offlineId,
            status: 'conflict',
            message: 'Duplicate screening detected on server',
          });
        } else {
          const created = await this.prisma.screening.create({
            data: {
              patientId: item.patientId,
              facilityId: item.facilityId,
              providerId: item.providerId,
              type: item.type,
              findings: item.findings,
              result: item.result,
              status: 'COMPLETED',
              syncedFromOffline: true,
              batchId,
            },
          });
          results.push({ id: created.id, status: 'synced' });
        }
      } catch (error: any) {
        results.push({
          id: item.offlineId,
          status: 'error',
          message: error.message || 'Unknown error',
        });
      }
    }

    const synced = results.filter((r) => r.status === 'synced').length;
    const conflicts = results.filter((r) => r.status === 'conflict').length;
    const errors = results.filter((r) => r.status === 'error').length;

    await this.prisma.syncBatch.update({
      where: { id: syncBatch.id },
      data: {
        successCount: synced,
        failureCount: conflicts + errors,
        status: errors === 0 ? 'COMPLETED' : conflicts > 0 ? 'PARTIAL' : 'FAILED',
        errors: JSON.stringify(results.filter((r) => r.status !== 'synced')),
        completedAt: new Date(),
      },
    });

    return {
      batchId,
      synced,
      conflicts,
      errors,
      details: results,
    };
  }
}
