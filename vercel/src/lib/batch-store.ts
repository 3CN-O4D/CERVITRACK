import { supabaseAdmin } from './supabase-admin';

function generateBatchCode(): string {
  const date = new Date();
  const prefix = `BT-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return prefix;
}

async function nextSeq(prefix: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('sample_batches')
    .select('batch_code')
    .like('batch_code', `${prefix}-%`)
    .order('batch_code', { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return '001';
  const last = data[0].batch_code;
  const parts = last.split('-');
  const seq = parseInt(parts[parts.length - 1], 10) + 1;
  return String(seq).padStart(3, '0');
}

export async function createBatch(data: { lab_tech_id: string; lab_tech_name: string; facility_id?: string }) {
  const prefix = generateBatchCode();
  const seq = await nextSeq(prefix);
  const batch_code = `${prefix}-${seq}`;

  const { data: batch, error } = await supabaseAdmin
    .from('sample_batches')
    .insert({
      batch_code,
      lab_tech_id: data.lab_tech_id,
      lab_tech_name: data.lab_tech_name,
      facility_id: data.facility_id || '',
      status: 'receiving',
      sample_count: 0,
      processed_count: 0,
      notes: '',
    })
    .select()
    .single();

  if (error) throw error;
  return { ...batch, items: [] };
}

export async function getBatch(id: string) {
  const { data: batch, error } = await supabaseAdmin
    .from('sample_batches')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !batch) return null;

  const { data: items } = await supabaseAdmin
    .from('sample_batch_items')
    .select('*')
    .eq('batch_id', id)
    .order('created_at', { ascending: true });

  return { ...batch, items: items || [] };
}

export async function getBatchByCode(code: string) {
  const { data: batch, error } = await supabaseAdmin
    .from('sample_batches')
    .select('*')
    .eq('batch_code', code)
    .single();
  if (error || !batch) return null;
  return batch;
}

export async function listBatches(query: { lab_tech_id?: string; status?: string; page?: number; limit?: number }) {
  const { lab_tech_id, status, page = 1, limit = 20 } = query;
  let q = supabaseAdmin.from('sample_batches').select('*', { count: 'exact' });
  if (lab_tech_id) q = q.eq('lab_tech_id', lab_tech_id);
  if (status) q = q.eq('status', status);
  q = q.order('created_at', { ascending: false });

  const start = (page - 1) * limit;
  q = q.range(start, start + limit - 1);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) };
}

export async function addSampleToBatch(batchId: string, data: {
  kit_barcode: string;
  kit_id?: string;
  patient_id?: string;
  patient_name?: string;
}) {
  const batch = await getBatch(batchId);
  if (!batch) return { error: 'Batch not found', status: 404 };
  if (batch.status !== 'receiving') return { error: 'Batch is no longer accepting samples', status: 400 };

  const existing = (batch.items || []).find((item: any) => item.kit_barcode === data.kit_barcode);
  if (existing) return { error: 'Sample already in this batch', status: 400 };

  if ((batch.items || []).length >= 100) return { error: 'Batch is full (max 100 samples)', status: 400 };

  const { error: insertErr } = await supabaseAdmin
    .from('sample_batch_items')
    .insert({
      batch_id: batchId,
      kit_barcode: data.kit_barcode,
      kit_id: data.kit_id || null,
      patient_id: data.patient_id || null,
      patient_name: data.patient_name || '',
      status: 'received',
      result: '',
      result_notes: '',
    });

  if (insertErr) throw insertErr;

  const newCount = (batch.items || []).length + 1;
  await supabaseAdmin
    .from('sample_batches')
    .update({ sample_count: newCount, updated_at: new Date().toISOString() })
    .eq('id', batchId);

  return { batch: await getBatch(batchId) };
}

export async function removeSampleFromBatch(batchId: string, itemId: string) {
  const batch = await getBatch(batchId);
  if (!batch) return { error: 'Batch not found', status: 404 };
  if (batch.status !== 'receiving') return { error: 'Batch is no longer accepting changes', status: 400 };

  await supabaseAdmin.from('sample_batch_items').delete().eq('id', itemId);
  const newCount = Math.max(0, (batch.items || []).length - 1);
  await supabaseAdmin
    .from('sample_batches')
    .update({ sample_count: newCount, updated_at: new Date().toISOString() })
    .eq('id', batchId);

  return { batch: await getBatch(batchId) };
}

export async function startTesting(batchId: string) {
  const batch = await getBatch(batchId);
  if (!batch) return { error: 'Batch not found', status: 404 };
  if (batch.status !== 'receiving') return { error: 'Batch is already in testing or submitted', status: 400 };
  if ((batch.items || []).length === 0) return { error: 'Batch has no samples', status: 400 };

  await supabaseAdmin
    .from('sample_batches')
    .update({ status: 'testing', updated_at: new Date().toISOString() })
    .eq('id', batchId);

  return { batch: await getBatch(batchId) };
}

export async function recordItemResult(batchId: string, itemId: string, data: {
  result: string;
  result_notes?: string;
}) {
  const batch = await getBatch(batchId);
  if (!batch) return { error: 'Batch not found', status: 404 };
  if (batch.status !== 'testing') return { error: 'Batch is not in testing phase', status: 400 };

  await supabaseAdmin
    .from('sample_batch_items')
    .update({
      result: data.result,
      result_notes: data.result_notes || '',
      status: 'tested',
      processed_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  const { count } = await supabaseAdmin
    .from('sample_batch_items')
    .select('*', { count: 'exact', head: true })
    .eq('batch_id', batchId)
    .eq('status', 'tested');

  await supabaseAdmin
    .from('sample_batches')
    .update({ processed_count: count || 0, updated_at: new Date().toISOString() })
    .eq('id', batchId);

  return { batch: await getBatch(batchId) };
}

export async function submitBatch(batchId: string) {
  const batch = await getBatch(batchId);
  if (!batch) return { error: 'Batch not found', status: 404 };
  if (batch.status !== 'testing') return { error: 'Batch must be in testing phase to submit', status: 400 };
  if (batch.processed_count < batch.sample_count) return { error: `Only ${batch.processed_count}/${batch.sample_count} samples tested`, status: 400 };

  await supabaseAdmin
    .from('sample_batches')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId);

  return { batch: await getBatch(batchId) };
}

export async function getBatchStats(lab_tech_id?: string) {
  let q = supabaseAdmin.from('sample_batches').select('status, sample_count, processed_count');
  if (lab_tech_id) q = q.eq('lab_tech_id', lab_tech_id);
  const { data } = await q;

  const list = data || [];
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
