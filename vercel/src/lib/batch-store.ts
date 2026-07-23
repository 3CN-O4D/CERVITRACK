const batches: Record<string, any> = {};

function generateBatchCode(): string {
  const date = new Date();
  const prefix = `BT-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const seq = String(Object.values(batches).filter((b: any) => b.batch_code?.startsWith(prefix)).length + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
}

export function createBatch(data: { lab_tech_id: string; lab_tech_name: string; facility_id?: string }) {
  const batch_code = generateBatchCode();
  const batch = {
    id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    batch_code,
    lab_tech_id: data.lab_tech_id,
    lab_tech_name: data.lab_tech_name,
    status: 'receiving',
    sample_count: 0,
    processed_count: 0,
    facility_id: data.facility_id || '',
    notes: '',
    items: [] as any[],
    submitted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  batches[batch.id] = batch;
  return batch;
}

export function getBatch(id: string) {
  return batches[id] || null;
}

export function getBatchByCode(code: string) {
  return Object.values(batches).find((b: any) => b.batch_code === code) || null;
}

export function listBatches(query: { lab_tech_id?: string; status?: string; page?: number; limit?: number }) {
  const { lab_tech_id, status, page = 1, limit = 20 } = query;
  let list = Object.values(batches) as any[];
  if (lab_tech_id) list = list.filter((b) => b.lab_tech_id === lab_tech_id);
  if (status) list = list.filter((b) => b.status === status);
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const total = list.length;
  const start = (page - 1) * limit;
  return { data: list.slice(start, start + limit), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function addSampleToBatch(batchId: string, data: {
  kit_barcode: string;
  kit_id?: string;
  patient_id?: string;
  patient_name?: string;
}) {
  const batch = batches[batchId];
  if (!batch) return { error: 'Batch not found', status: 404 };
  if (batch.status !== 'receiving') return { error: 'Batch is no longer accepting samples', status: 400 };

  const existing = batch.items.find((item: any) => item.kit_barcode === data.kit_barcode);
  if (existing) return { error: 'Sample already in this batch', status: 400 };

  if (batch.items.length >= 100) return { error: 'Batch is full (max 100 samples)', status: 400 };

  const item = {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    batch_id: batchId,
    kit_barcode: data.kit_barcode,
    kit_id: data.kit_id || null,
    patient_id: data.patient_id || null,
    patient_name: data.patient_name || '',
    status: 'received',
    result: '',
    result_notes: '',
    processed_at: null,
    created_at: new Date().toISOString(),
  };

  batch.items.push(item);
  batch.sample_count = batch.items.length;
  batch.updated_at = new Date().toISOString();
  return { batch, item };
}

export function removeSampleFromBatch(batchId: string, itemId: string) {
  const batch = batches[batchId];
  if (!batch) return { error: 'Batch not found', status: 404 };
  if (batch.status !== 'receiving') return { error: 'Batch is no longer accepting changes', status: 400 };

  batch.items = batch.items.filter((item: any) => item.id !== itemId);
  batch.sample_count = batch.items.length;
  batch.updated_at = new Date().toISOString();
  return { batch };
}

export function startTesting(batchId: string) {
  const batch = batches[batchId];
  if (!batch) return { error: 'Batch not found', status: 404 };
  if (batch.status !== 'receiving') return { error: 'Batch is already in testing or submitted', status: 400 };
  if (batch.items.length === 0) return { error: 'Batch has no samples', status: 400 };

  batch.status = 'testing';
  batch.updated_at = new Date().toISOString();
  return { batch };
}

export function recordItemResult(batchId: string, itemId: string, data: {
  result: string;
  result_notes?: string;
}) {
  const batch = batches[batchId];
  if (!batch) return { error: 'Batch not found', status: 404 };
  if (batch.status !== 'testing') return { error: 'Batch is not in testing phase', status: 400 };

  const item = batch.items.find((i: any) => i.id === itemId);
  if (!item) return { error: 'Item not found in batch', status: 404 };

  item.result = data.result;
  item.result_notes = data.result_notes || '';
  item.status = 'tested';
  item.processed_at = new Date().toISOString();

  batch.processed_count = batch.items.filter((i: any) => i.status === 'tested').length;
  batch.updated_at = new Date().toISOString();
  return { batch, item };
}

export function submitBatch(batchId: string) {
  const batch = batches[batchId];
  if (!batch) return { error: 'Batch not found', status: 404 };
  if (batch.status !== 'testing') return { error: 'Batch must be in testing phase to submit', status: 400 };
  if (batch.processed_count < batch.sample_count) return { error: `Only ${batch.processed_count}/${batch.sample_count} samples tested`, status: 400 };

  batch.status = 'submitted';
  batch.submitted_at = new Date().toISOString();
  batch.updated_at = new Date().toISOString();
  return { batch };
}

export function getBatchStats(lab_tech_id?: string) {
  let list = Object.values(batches) as any[];
  if (lab_tech_id) list = list.filter((b) => b.lab_tech_id === lab_tech_id);
  const byStatus: Record<string, number> = {};
  let totalSamples = 0;
  let totalProcessed = 0;
  for (const b of list) {
    byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    totalSamples += b.sample_count || 0;
    totalProcessed += b.processed_count || 0;
  }
  return {
    total: list.length,
    byStatus,
    receiving: byStatus['receiving'] || 0,
    testing: byStatus['testing'] || 0,
    submitted: byStatus['submitted'] || 0,
    totalSamples,
    totalProcessed,
  };
}
