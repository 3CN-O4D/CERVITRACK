import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class SampleKitsService {
  constructor(private prisma: PrismaService) {}

  async registerKit(data: { barcode: string; facilityId: string; registeredBy: string; registeredByName: string; kitType?: string }) {
    const existing = await this.prisma.sampleKit.findUnique({ where: { barcode: data.barcode } });
    if (existing) {
      throw new BadRequestException('Kit already registered');
    }

    const kit = await this.prisma.sampleKit.create({
      data: {
        barcode: data.barcode,
        kitType: data.kitType || 'HPV_DNA_SELF',
        status: 'REGISTERED',
        facilityId: data.facilityId,
        registeredBy: data.registeredBy,
        registeredByName: data.registeredByName,
      },
    });

    await this.addEvent(kit.id, 'REGISTERED', data.registeredBy, data.registeredByName, undefined, data.facilityId, 'Kit registered in system');

    return this.getKitWithEvents(kit.id);
  }

  async pairToPatient(data: { barcode: string; patientId: string; patientName: string; pairedBy: string; pairedByName: string; facilityId?: string }) {
    const kit = await this.prisma.sampleKit.findUnique({ where: { barcode: data.barcode } });
    if (!kit) throw new NotFoundException('Kit not found');
    if (kit.status !== 'REGISTERED') throw new BadRequestException(`Kit is ${kit.status}, cannot pair`);

    await this.prisma.sampleKit.update({
      where: { id: kit.id },
      data: {
        patientId: data.patientId,
        patientName: data.patientName,
        status: 'PAIRED',
      },
    });

    await this.addEvent(kit.id, 'PAIRED', data.pairedBy, data.pairedByName, undefined, data.facilityId, `Paired to patient ${data.patientName}`);

    return this.getKitWithEvents(kit.id);
  }

  async linkKitToPatient(data: { barcode: string; patientId: string; patientName: string; linkedBy: string; linkedByName: string }) {
    const kit = await this.prisma.sampleKit.findUnique({ where: { barcode: data.barcode } });
    if (!kit) throw new NotFoundException('Kit not found');
    if (kit.status !== 'REGISTERED') throw new BadRequestException(`Kit is ${kit.status}, cannot link`);

    await this.prisma.sampleKit.update({
      where: { id: kit.id },
      data: {
        patientId: data.patientId,
        patientName: data.patientName,
        status: 'PAIRED',
      },
    });

    await this.addEvent(kit.id, 'PAIRED', data.linkedBy, data.linkedByName, undefined, undefined, `Self-linked to patient ${data.patientName}`);

    const updated = await this.getKitWithEvents(kit.id);
    return { kit: updated, notification: true };
  }

  async confirmCollection(data: { barcode: string; collectedBy: string; collectedByName: string; collectionMethod: string; facilityId?: string; location?: string; notes?: string }) {
    const kit = await this.prisma.sampleKit.findUnique({ where: { barcode: data.barcode } });
    if (!kit) throw new NotFoundException('Kit not found');
    if (kit.status !== 'PAIRED') throw new BadRequestException(`Kit is ${kit.status}, cannot confirm collection`);

    await this.prisma.sampleKit.update({
      where: { id: kit.id },
      data: {
        status: 'COLLECTED',
        collectionMethod: data.collectionMethod,
        collectedAt: new Date(),
      },
    });

    await this.addEvent(kit.id, 'COLLECTED', data.collectedBy, data.collectedByName, data.location, data.facilityId, `${data.collectionMethod} collection confirmed. ${data.notes || ''}`);

    return this.getKitWithEvents(kit.id);
  }

  async updateTransit(data: { barcode: string; scannedBy: string; scannedByName: string; fromLocation: string; toLocation: string; facilityId?: string; notes?: string }) {
    const kit = await this.prisma.sampleKit.findUnique({ where: { barcode: data.barcode } });
    if (!kit) throw new NotFoundException('Kit not found');

    await this.prisma.sampleKit.update({
      where: { id: kit.id },
      data: {
        status: 'IN_TRANSIT',
        currentLocation: data.toLocation,
      },
    });

    await this.addEvent(kit.id, 'IN_TRANSIT', data.scannedBy, data.scannedByName, `${data.fromLocation} → ${data.toLocation}`, data.facilityId, `Moved: ${data.fromLocation} to ${data.toLocation}. ${data.notes || ''}`);

    return this.getKitWithEvents(kit.id);
  }

  async receiveAtLab(data: { barcode: string; receivedBy: string; receivedByName: string; facilityId?: string; notes?: string }) {
    const kit = await this.prisma.sampleKit.findUnique({ where: { barcode: data.barcode } });
    if (!kit) throw new NotFoundException('Kit not found');
    if (kit.status !== 'IN_TRANSIT' && kit.status !== 'COLLECTED') {
      throw new BadRequestException(`Kit is ${kit.status}, cannot receive at lab`);
    }

    await this.prisma.sampleKit.update({
      where: { id: kit.id },
      data: {
        status: 'IN_LAB',
        receivedAtLab: new Date(),
      },
    });

    await this.addEvent(kit.id, 'IN_LAB', data.receivedBy, data.receivedByName, undefined, data.facilityId, `Received at lab. ${data.notes || ''}`);

    return this.getKitWithEvents(kit.id);
  }

  async enterResults(data: { barcode: string; technicianId: string; technicianName: string; result: string; notes?: string; facilityId?: string }) {
    const kit = await this.prisma.sampleKit.findUnique({ where: { barcode: data.barcode } });
    if (!kit) throw new NotFoundException('Kit not found');
    if (kit.status !== 'IN_LAB') throw new BadRequestException(`Kit is ${kit.status}, cannot enter results`);

    await this.prisma.sampleKit.update({
      where: { id: kit.id },
      data: {
        status: 'PROCESSED',
        result: data.result,
        resultNotes: data.notes,
        processedAt: new Date(),
      },
    });

    await this.addEvent(kit.id, 'PROCESSED', data.technicianId, data.technicianName, undefined, data.facilityId, `Results: ${data.result}. ${data.notes || ''}`);

    return this.getKitWithEvents(kit.id);
  }

  async getKitByBarcode(barcode: string) {
    const kit = await this.prisma.sampleKit.findUnique({ where: { barcode } });
    if (!kit) throw new NotFoundException('Kit not found');
    return this.getKitWithEvents(kit.id);
  }

  async getKitTimeline(kitId: string) {
    return this.prisma.kitEvent.findMany({
      where: { kitId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async listKits(query: { facilityId?: string; status?: string; patientId?: string; page?: number; limit?: number }) {
    const { facilityId, status, patientId, page = 1, limit = 20 } = query;

    const where: any = {};
    if (facilityId) where.facilityId = facilityId;
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    const [data, total] = await Promise.all([
      this.prisma.sampleKit.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.sampleKit.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(facilityId?: string) {
    const where: any = {};
    if (facilityId) where.facilityId = facilityId;

    const [total, byStatus] = await Promise.all([
      this.prisma.sampleKit.count({ where }),
      this.prisma.sampleKit.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) {
      statusMap[s.status] = s._count.status;
    }

    return {
      total,
      byStatus: statusMap,
      registered: statusMap['REGISTERED'] || 0,
      paired: statusMap['PAIRED'] || 0,
      collected: statusMap['COLLECTED'] || 0,
      inTransit: statusMap['IN_TRANSIT'] || 0,
      inLab: statusMap['IN_LAB'] || 0,
      processed: statusMap['PROCESSED'] || 0,
    };
  }

  private async getKitWithEvents(kitId: string) {
    const kit = await this.prisma.sampleKit.findUnique({ where: { id: kitId } });
    if (!kit) throw new NotFoundException('Kit not found');

    const events = await this.prisma.kitEvent.findMany({
      where: { kitId },
      orderBy: { timestamp: 'asc' },
    });

    return { ...kit, events };
  }

  private async addEvent(kitId: string, action: string, scannedBy: string, scannedByName: string, location?: string, facilityId?: string, notes?: string) {
    await this.prisma.kitEvent.create({
      data: { kitId, action, scannedBy, scannedByName, location, facilityId, notes },
    });
  }
}
