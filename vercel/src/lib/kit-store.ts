import { supabaseAdmin } from './supabase-admin';

export async function getKit(barcode: string) {
  const { data: kit, error } = await supabaseAdmin
    .from('sample_kits')
    .select('*')
    .eq('barcode', barcode)
    .single();
  if (error || !kit) return null;

  const { data: events } = await supabaseAdmin
    .from('sample_kit_events')
    .select('*')
    .eq('kit_id', kit.id)
    .order('created_at', { ascending: true });

  const mappedEvents = (events || []).map((e: any) => ({
    id: e.id,
    action: e.event_type,
    scannedBy: e.performed_by || '',
    scannedByName: e.performed_by_name || '',
    location: e.event_data?.location || '',
    facilityId: e.event_data?.facilityId || '',
    notes: e.event_data?.notes || '',
    timestamp: e.created_at,
  }));

  return {
    ...kit,
    kitType: kit.kit_type,
    facilityId: kit.facility_id,
    registeredBy: kit.registered_by,
    registeredByName: kit.registered_by_name,
    patientId: kit.patient_id,
    patientName: kit.patient_name,
    collectionMethod: kit.collection_method,
    collectedAt: kit.collected_at,
    currentLocation: kit.current_location,
    receivedAtLab: kit.received_at_lab,
    resultNotes: kit.result_notes,
    processedAt: kit.processed_at,
    createdAt: kit.created_at,
    updatedAt: kit.updated_at,
    events: mappedEvents,
  };
}

export async function listKits(query: { facilityId?: string; status?: string; patientId?: string; page?: number; limit?: number }) {
  const { facilityId, status, patientId, page = 1, limit = 20 } = query;
  let q = supabaseAdmin.from('sample_kits').select('*', { count: 'exact' });
  if (facilityId) q = q.eq('facility_id', facilityId);
  if (status) q = q.eq('status', status);
  if (patientId) q = q.eq('patient_id', patientId);
  q = q.order('created_at', { ascending: false });

  const start = (page - 1) * limit;
  q = q.range(start, start + limit - 1);

  const { data, count } = await q;
  const mapped = (data || []).map((k: any) => ({
    ...k,
    kitType: k.kit_type,
    facilityId: k.facility_id,
    patientId: k.patient_id,
    patientName: k.patient_name,
    createdAt: k.created_at,
    updatedAt: k.updated_at,
    events: [],
  }));
  return { data: mapped, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) };
}

export async function getKitStats(facilityId?: string) {
  let q = supabaseAdmin.from('sample_kits').select('status');
  if (facilityId) q = q.eq('facility_id', facilityId);
  const { data } = await q;

  // Also get kit_requests count
  const { count: requestedCount } = await supabaseAdmin
    .from('kit_requests')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'contacted', 'arranged']);

  const list = data || [];
  const byStatus: Record<string, number> = {};
  for (const k of list) byStatus[k.status] = (byStatus[k.status] || 0) + 1;

  const total = list.length;
  const registered = byStatus['REGISTERED'] || 0;
  const paired = byStatus['PAIRED'] || 0;
  const collected = byStatus['COLLECTED'] || 0;
  const inTransit = byStatus['IN_TRANSIT'] || 0;
  const inLab = byStatus['IN_LAB'] || 0;
  const processed = byStatus['PROCESSED'] || 0;
  const unregistered = byStatus['UNREGISTERED'] || 0;

  // Available = registered but not yet paired/given out
  const available = registered;
  // Given out = paired + collected + in_transit + in_lab + processed
  const givenOut = paired + collected + inTransit + inLab + processed;
  // In pipeline = collected + in_transit + in_lab (samples being processed)
  const inPipeline = collected + inTransit + inLab;
  // Pending requests
  const requested = requestedCount || 0;

  return {
    total, byStatus,
    registered, paired, collected, inTransit, inLab, processed, unregistered,
    available, givenOut, inPipeline, requested,
  };
}

async function addEvent(kitId: number, action: string, scannedBy: string, scannedByName: string, location?: string, facilityId?: string, notes?: string) {
  await supabaseAdmin.from('sample_kit_events').insert({
    kit_id: kitId,
    event_type: action,
    event_data: { location, facilityId, notes },
    performed_by: scannedBy || null,
    performed_by_name: scannedByName || '',
  });
}

export async function registerKit(barcode: string, data: { facilityId?: string; registeredBy?: string; registeredByName?: string; kitType?: string }) {
  const existing = await getKit(barcode);
  if (existing) return { error: 'Kit already registered', status: 400 };

  const { data: kit, error } = await supabaseAdmin
    .from('sample_kits')
    .insert({
      barcode,
      kit_type: data.kitType || 'HPV_DNA_SELF',
      status: 'REGISTERED',
      facility_id: data.facilityId || 'home',
      registered_by: data.registeredBy || 'system',
      registered_by_name: data.registeredByName || 'System',
    })
    .select()
    .single();

  if (error) throw error;
  await addEvent(kit.id, 'REGISTERED', data.registeredBy || 'system', data.registeredByName || 'System', undefined, data.facilityId, 'Kit registered');
  return { kit: await getKit(barcode) };
}

export async function pairKit(barcode: string, data: { patientId: string; patientName: string; pairedBy: string; pairedByName: string; facilityId?: string }) {
  const kit = await getKit(barcode);
  if (!kit) return { error: 'Kit not found', status: 404 };
  if (kit.status !== 'REGISTERED') return { error: `Kit is ${kit.status}`, status: 400 };

  await supabaseAdmin
    .from('sample_kits')
    .update({ patient_id: data.patientId, patient_name: data.patientName, status: 'PAIRED', updated_at: new Date().toISOString() })
    .eq('id', kit.id);

  await addEvent(kit.id, 'PAIRED', data.pairedBy, data.pairedByName, undefined, data.facilityId, `Paired to ${data.patientName}`);
  return { kit: await getKit(barcode) };
}

export async function collectKit(barcode: string, data: { collectedBy: string; collectedByName: string; collectionMethod: string; facilityId?: string; location?: string; notes?: string }) {
  const kit = await getKit(barcode);
  if (!kit) return { error: 'Kit not found', status: 404 };
  if (kit.status !== 'PAIRED') return { error: `Kit is ${kit.status}`, status: 400 };

  await supabaseAdmin
    .from('sample_kits')
    .update({
      status: 'COLLECTED',
      collection_method: data.collectionMethod,
      collected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', kit.id);

  await addEvent(kit.id, 'COLLECTED', data.collectedBy, data.collectedByName, data.location, data.facilityId, `${data.collectionMethod} confirmed. ${data.notes || ''}`);
  return { kit: await getKit(barcode) };
}

export async function transitKit(barcode: string, data: { scannedBy: string; scannedByName: string; fromLocation: string; toLocation: string; facilityId?: string; notes?: string }) {
  const kit = await getKit(barcode);
  if (!kit) return { error: 'Kit not found', status: 404 };

  await supabaseAdmin
    .from('sample_kits')
    .update({ status: 'IN_TRANSIT', current_location: data.toLocation, updated_at: new Date().toISOString() })
    .eq('id', kit.id);

  await addEvent(kit.id, 'IN_TRANSIT', data.scannedBy, data.scannedByName, `${data.fromLocation} -> ${data.toLocation}`, data.facilityId, data.notes || '');
  return { kit: await getKit(barcode) };
}

export async function receiveKit(barcode: string, data: { receivedBy: string; receivedByName: string; facilityId?: string; notes?: string }) {
  const kit = await getKit(barcode);
  if (!kit) return { error: 'Kit not found', status: 404 };

  await supabaseAdmin
    .from('sample_kits')
    .update({ status: 'IN_LAB', received_at_lab: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', kit.id);

  await addEvent(kit.id, 'IN_LAB', data.receivedBy, data.receivedByName, undefined, data.facilityId, `Received at lab. ${data.notes || ''}`);
  return { kit: await getKit(barcode) };
}

export async function enterResults(barcode: string, data: { technicianId: string; technicianName: string; result: string; notes?: string; facilityId?: string }) {
  const kit = await getKit(barcode);
  if (!kit) return { error: 'Kit not found', status: 404 };
  if (kit.status !== 'IN_LAB') return { error: `Kit is ${kit.status}`, status: 400 };

  await supabaseAdmin
    .from('sample_kits')
    .update({
      status: 'PROCESSED',
      result: data.result,
      result_notes: data.notes || '',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', kit.id);

  await addEvent(kit.id, 'PROCESSED', data.technicianId, data.technicianName, undefined, data.facilityId, `Results: ${data.result}. ${data.notes || ''}`);
  return { kit: await getKit(barcode) };
}

export async function bulkRegisterKits(barcodes: string[], data: { facilityId?: string; registeredBy?: string; registeredByName?: string; kitType?: string }) {
  const results = { registered: 0, skipped: 0, errors: 0, details: [] as any[] };

  for (const barcode of barcodes) {
    try {
      const existing = await getKit(barcode);
      if (existing) {
        results.skipped++;
        results.details.push({ barcode, status: 'skipped', reason: 'Already registered' });
        continue;
      }

      const { data: kit, error } = await supabaseAdmin
        .from('sample_kits')
        .insert({
          barcode,
          kit_type: data.kitType || 'HPV_DNA_SELF',
          status: 'REGISTERED',
          facility_id: data.facilityId || 'home',
          registered_by: data.registeredBy || 'system',
          registered_by_name: data.registeredByName || 'System',
        })
        .select()
        .single();

      if (error) {
        results.errors++;
        results.details.push({ barcode, status: 'error', reason: error.message });
        continue;
      }

      await addEvent(kit.id, 'REGISTERED', data.registeredBy || 'system', data.registeredByName || 'System', undefined, data.facilityId, 'Kit registered (bulk)');
      results.registered++;
      results.details.push({ barcode, status: 'registered' });
    } catch (e: any) {
      results.errors++;
      results.details.push({ barcode, status: 'error', reason: e.message });
    }
  }

  return results;
}

export async function getKitLedger(query: { status?: string; facilityId?: string; search?: string; page?: number; limit?: number }) {
  const { status, facilityId, search, page = 1, limit = 50 } = query;
  let q = supabaseAdmin.from('sample_kits').select('*', { count: 'exact' });
  if (status) q = q.eq('status', status);
  if (facilityId) q = q.eq('facility_id', facilityId);
  if (search) q = q.or(`barcode.ilike.%${search}%,patient_name.ilike.%${search}%`);
  q = q.order('created_at', { ascending: false });

  const start = (page - 1) * limit;
  q = q.range(start, start + limit - 1);

  const { data, count } = await q;
  const mapped = (data || []).map((k: any) => ({
    id: k.id,
    barcode: k.barcode,
    kitType: k.kit_type,
    status: k.status,
    facilityId: k.facility_id,
    patientName: k.patient_name || '—',
    collectionMethod: k.collection_method,
    result: k.result || '—',
    currentLocation: k.current_location,
    createdAt: k.created_at,
    updatedAt: k.updated_at,
  }));

  return { data: mapped, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) };
}
