const kits: Record<string, any> = {};

function addEvent(kit: any, action: string, scannedBy: string, scannedByName: string, location?: string, facilityId?: string, notes?: string) {
  if (!kit.events) kit.events = [];
  kit.events.push({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    kitId: kit.id, action, scannedBy, scannedByName, location, facilityId, notes,
    timestamp: new Date().toISOString(),
  });
}

export function getKit(barcode: string) {
  return kits[barcode] || null;
}

export function listKits(query: { facilityId?: string; status?: string; patientId?: string; page?: number; limit?: number }) {
  const { facilityId, status, patientId, page = 1, limit = 20 } = query;
  let list = Object.values(kits);
  if (facilityId) list = list.filter((k) => k.facilityId === facilityId);
  if (status) list = list.filter((k) => k.status === status);
  if (patientId) list = list.filter((k) => k.patientId === patientId);
  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const total = list.length;
  const start = (page - 1) * limit;
  return { data: list.slice(start, start + limit), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function getKitStats(facilityId?: string) {
  let list = Object.values(kits);
  if (facilityId) list = list.filter((k) => k.facilityId === facilityId);
  const byStatus: Record<string, number> = {};
  for (const k of list) byStatus[k.status] = (byStatus[k.status] || 0) + 1;
  return {
    total: list.length, byStatus,
    registered: byStatus['REGISTERED'] || 0, paired: byStatus['PAIRED'] || 0,
    collected: byStatus['COLLECTED'] || 0, inTransit: byStatus['IN_TRANSIT'] || 0,
    inLab: byStatus['IN_LAB'] || 0, processed: byStatus['PROCESSED'] || 0,
  };
}

export function registerKit(barcode: string, data: { facilityId?: string; registeredBy?: string; registeredByName?: string; kitType?: string }) {
  if (kits[barcode]) return { error: 'Kit already registered', status: 400 };
  const kit = {
    id: `kit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    barcode, kitType: data.kitType || 'HPV_DNA_SELF', status: 'REGISTERED',
    facilityId: data.facilityId || 'home', registeredBy: data.registeredBy || 'system',
    registeredByName: data.registeredByName || 'System', patientId: null, patientName: null,
    events: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  addEvent(kit, 'REGISTERED', kit.registeredBy, kit.registeredByName, undefined, kit.facilityId, 'Kit registered');
  kits[barcode] = kit;
  return { kit };
}

export function pairKit(barcode: string, data: { patientId: string; patientName: string; pairedBy: string; pairedByName: string; facilityId?: string }) {
  const kit = kits[barcode];
  if (!kit) return { error: 'Kit not found', status: 404 };
  if (kit.status !== 'REGISTERED') return { error: `Kit is ${kit.status}`, status: 400 };
  kit.patientId = data.patientId;
  kit.patientName = data.patientName;
  kit.status = 'PAIRED';
  kit.updatedAt = new Date().toISOString();
  addEvent(kit, 'PAIRED', data.pairedBy, data.pairedByName, undefined, data.facilityId, `Paired to ${data.patientName}`);
  return { kit };
}

export function collectKit(barcode: string, data: { collectedBy: string; collectedByName: string; collectionMethod: string; facilityId?: string; location?: string; notes?: string }) {
  const kit = kits[barcode];
  if (!kit) return { error: 'Kit not found', status: 404 };
  if (kit.status !== 'PAIRED') return { error: `Kit is ${kit.status}`, status: 400 };
  kit.status = 'COLLECTED';
  kit.collectionMethod = data.collectionMethod;
  kit.collectedAt = new Date().toISOString();
  kit.updatedAt = new Date().toISOString();
  addEvent(kit, 'COLLECTED', data.collectedBy, data.collectedByName, data.location, data.facilityId, `${data.collectionMethod} confirmed. ${data.notes || ''}`);
  return { kit };
}

export function transitKit(barcode: string, data: { scannedBy: string; scannedByName: string; fromLocation: string; toLocation: string; facilityId?: string; notes?: string }) {
  const kit = kits[barcode];
  if (!kit) return { error: 'Kit not found', status: 404 };
  kit.status = 'IN_TRANSIT';
  kit.currentLocation = data.toLocation;
  kit.updatedAt = new Date().toISOString();
  addEvent(kit, 'IN_TRANSIT', data.scannedBy, data.scannedByName, `${data.fromLocation} -> ${data.toLocation}`, data.facilityId, `${data.notes || ''}`);
  return { kit };
}

export function receiveKit(barcode: string, data: { receivedBy: string; receivedByName: string; facilityId?: string; notes?: string }) {
  const kit = kits[barcode];
  if (!kit) return { error: 'Kit not found', status: 404 };
  kit.status = 'IN_LAB';
  kit.receivedAtLab = new Date().toISOString();
  kit.updatedAt = new Date().toISOString();
  addEvent(kit, 'IN_LAB', data.receivedBy, data.receivedByName, undefined, data.facilityId, `Received at lab. ${data.notes || ''}`);
  return { kit };
}

export function enterResults(barcode: string, data: { technicianId: string; technicianName: string; result: string; notes?: string; facilityId?: string }) {
  const kit = kits[barcode];
  if (!kit) return { error: 'Kit not found', status: 404 };
  if (kit.status !== 'IN_LAB') return { error: `Kit is ${kit.status}`, status: 400 };
  kit.status = 'PROCESSED';
  kit.result = data.result;
  kit.resultNotes = data.notes;
  kit.processedAt = new Date().toISOString();
  kit.updatedAt = new Date().toISOString();
  addEvent(kit, 'PROCESSED', data.technicianId, data.technicianName, undefined, data.facilityId, `Results: ${data.result}. ${data.notes || ''}`);
  return { kit };
}
