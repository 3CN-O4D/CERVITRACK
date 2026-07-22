import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface KitEvent {
  id: string;
  kitId: string;
  action: string;
  scannedBy: string;
  scannedByName: string;
  location?: string;
  facilityId?: string;
  notes?: string;
  timestamp: Date;
}

@Injectable()
export class SampleKitsService {
  constructor(private prisma: PrismaService) {
    this.kitStore = new Map();
    this.eventStore = new Map();
  }

  private kitStore: Map<string, any>;
  private eventStore: Map<string, KitEvent[]>;

  async registerKit(data: { barcode: string; facilityId: string; registeredBy: string; registeredByName: string; kitType?: string }) {
    if (this.kitStore.has(data.barcode)) {
      throw new BadRequestException('Kit already registered');
    }

    const kit = {
      id: `kit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      barcode: data.barcode,
      kitType: data.kitType || 'HPV_DNA_SELF',
      status: 'REGISTERED',
      facilityId: data.facilityId,
      registeredBy: data.registeredBy,
      registeredByName: data.registeredByName,
      patientId: null as string | null,
      patientName: null as string | null,
      screeningId: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.kitStore.set(data.barcode, kit);
    this.addEvent(kit.id, 'REGISTERED', data.registeredBy, data.registeredByName, undefined, data.facilityId, 'Kit registered in system');

    return kit;
  }

  async pairToPatient(data: { barcode: string; patientId: string; patientName: string; pairedBy: string; pairedByName: string; facilityId?: string }) {
    const kit = this.kitStore.get(data.barcode);
    if (!kit) throw new NotFoundException('Kit not found');
    if (kit.status !== 'REGISTERED') throw new BadRequestException(`Kit is ${kit.status}, cannot pair`);

    kit.patientId = data.patientId;
    kit.patientName = data.patientName;
    kit.status = 'PAIRED';
    kit.updatedAt = new Date();

    this.addEvent(kit.id, 'PAIRED', data.pairedBy, data.pairedByName, undefined, data.facilityId, `Paired to patient ${data.patientName}`);

    return kit;
  }

  async confirmCollection(data: { barcode: string; collectedBy: string; collectedByName: string; collectionMethod: string; facilityId?: string; location?: string; notes?: string }) {
    const kit = this.kitStore.get(data.barcode);
    if (!kit) throw new NotFoundException('Kit not found');
    if (kit.status !== 'PAIRED') throw new BadRequestException(`Kit is ${kit.status}, cannot confirm collection`);

    kit.status = 'COLLECTED';
    kit.collectionMethod = data.collectionMethod;
    kit.collectedAt = new Date();
    kit.updatedAt = new Date();

    this.addEvent(kit.id, 'COLLECTED', data.collectedBy, data.collectedByName, data.location, data.facilityId, `${data.collectionMethod} collection confirmed. ${data.notes || ''}`);

    return kit;
  }

  async updateTransit(data: { barcode: string; scannedBy: string; scannedByName: string; fromLocation: string; toLocation: string; facilityId?: string; notes?: string }) {
    const kit = this.kitStore.get(data.barcode);
    if (!kit) throw new NotFoundException('Kit not found');

    kit.status = 'IN_TRANSIT';
    kit.currentLocation = data.toLocation;
    kit.updatedAt = new Date();

    this.addEvent(kit.id, 'IN_TRANSIT', data.scannedBy, data.scannedByName, `${data.fromLocation} → ${data.toLocation}`, data.facilityId, `Moved: ${data.fromLocation} to ${data.toLocation}. ${data.notes || ''}`);

    return kit;
  }

  async receiveAtLab(data: { barcode: string; receivedBy: string; receivedByName: string; facilityId?: string; notes?: string }) {
    const kit = this.kitStore.get(data.barcode);
    if (!kit) throw new NotFoundException('Kit not found');
    if (kit.status !== 'IN_TRANSIT' && kit.status !== 'COLLECTED') {
      throw new BadRequestException(`Kit is ${kit.status}, cannot receive at lab`);
    }

    kit.status = 'IN_LAB';
    kit.receivedAtLab = new Date();
    kit.updatedAt = new Date();

    this.addEvent(kit.id, 'IN_LAB', data.receivedBy, data.receivedByName, undefined, data.facilityId, `Received at lab. ${data.notes || ''}`);

    return kit;
  }

  async enterResults(data: { barcode: string; technicianId: string; technicianName: string; result: string; notes?: string; facilityId?: string }) {
    const kit = this.kitStore.get(data.barcode);
    if (!kit) throw new NotFoundException('Kit not found');
    if (kit.status !== 'IN_LAB') throw new BadRequestException(`Kit is ${kit.status}, cannot enter results`);

    kit.status = 'PROCESSED';
    kit.result = data.result;
    kit.resultNotes = data.notes;
    kit.processedAt = new Date();
    kit.updatedAt = new Date();

    this.addEvent(kit.id, 'PROCESSED', data.technicianId, data.technicianName, undefined, data.facilityId, `Results: ${data.result}. ${data.notes || ''}`);

    return kit;
  }

  async getKitByBarcode(barcode: string) {
    const kit = this.kitStore.get(barcode);
    if (!kit) throw new NotFoundException('Kit not found');
    return {
      ...kit,
      events: this.eventStore.get(kit.id) || [],
    };
  }

  async getKitTimeline(kitId: string) {
    const events = this.eventStore.get(kitId) || [];
    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async listKits(query: { facilityId?: string; status?: string; patientId?: string; page?: number; limit?: number }) {
    const { facilityId, status, patientId, page = 1, limit = 20 } = query;
    let kits = Array.from(this.kitStore.values());

    if (facilityId) kits = kits.filter((k) => k.facilityId === facilityId);
    if (status) kits = kits.filter((k) => k.status === status);
    if (patientId) kits = kits.filter((k) => k.patientId === patientId);

    kits.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = kits.length;
    const start = (page - 1) * limit;
    const paginated = kits.slice(start, start + limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(facilityId?: string) {
    let kits = Array.from(this.kitStore.values());
    if (facilityId) kits = kits.filter((k) => k.facilityId === facilityId);

    const byStatus: Record<string, number> = {};
    for (const kit of kits) {
      byStatus[kit.status] = (byStatus[kit.status] || 0) + 1;
    }

    return {
      total: kits.length,
      byStatus,
      registered: byStatus['REGISTERED'] || 0,
      paired: byStatus['PAIRED'] || 0,
      collected: byStatus['COLLECTED'] || 0,
      inTransit: byStatus['IN_TRANSIT'] || 0,
      inLab: byStatus['IN_LAB'] || 0,
      processed: byStatus['PROCESSED'] || 0,
    };
  }

  private addEvent(kitId: string, action: string, scannedBy: string, scannedByName: string, location?: string, facilityId?: string, notes?: string) {
    if (!this.eventStore.has(kitId)) {
      this.eventStore.set(kitId, []);
    }
    this.eventStore.get(kitId)!.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kitId,
      action,
      scannedBy,
      scannedByName,
      location,
      facilityId,
      notes,
      timestamp: new Date(),
    });
  }
}
