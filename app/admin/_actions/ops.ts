'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { serviceClient } from '@/lib/supabase';
import { VAULT_TYPES, checkUpload } from '@/lib/uploads';

/**
 * Day-to-day operations: tasks and deadlines, invoices, and the document
 * vault. Every action re-checks console access first; nothing here trusts
 * that the page which rendered the form was itself protected.
 */

const uuid = z.string().uuid();
const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(''))
  .transform((v) => v || null);
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal(''))
  .transform((v) => v || null);

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

function refresh(clientId?: string | null) {
  revalidatePath('/admin');
  revalidatePath('/admin/tasks');
  revalidatePath('/admin/invoices');
  if (clientId) revalidatePath(`/admin/clients/${clientId}`);
}

/* ------------------------------------------------------------------ tasks */

const TaskSchema = z.object({
  title: z.string().trim().min(2, 'Give the task a title.').max(200),
  details: z.string().trim().max(2000).optional(),
  due_on: optionalDate,
  priority: z.coerce.number().int().min(1).max(3).default(2),
  client_id: optionalUuid,
});

export async function createTask(formData: FormData) {
  const profile = await requireRole('editor');
  const parsed = TaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { error, data } = await db()
    .from('tasks')
    .insert({ ...parsed.data, details: parsed.data.details || null })
    .select('id')
    .single();
  if (!error)
    await audit(profile.email, 'task.create', 'tasks', data?.id, { title: parsed.data.title });
  refresh(parsed.data.client_id);
}

export async function setTaskState(formData: FormData) {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  const state = z
    .enum(['pending', 'in_progress', 'blocked', 'done', 'not_applicable'])
    .safeParse(formData.get('state'));
  if (!id.success || !state.success) return;
  const { data } = await db()
    .from('tasks')
    .update({
      state: state.data,
      completed_at: state.data === 'done' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id.data)
    .select('client_id')
    .maybeSingle();
  await audit(profile.email, 'task.state', 'tasks', id.data, { state: state.data });
  refresh(data?.client_id);
}

export async function deleteTask(formData: FormData) {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  const { data } = await db()
    .from('tasks')
    .delete()
    .eq('id', id.data)
    .select('client_id')
    .maybeSingle();
  await audit(profile.email, 'task.delete', 'tasks', id.data);
  refresh(data?.client_id);
}

/* --------------------------------------------------------------- invoices */

const InvoiceSchema = z.object({
  client_id: uuid,
  number: z.string().trim().min(1, 'Invoice number is required.').max(40),
  description: z.string().trim().max(500).optional(),
  issued_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_on: optionalDate,
  amount: z.coerce.number().min(0).max(1e10),
  tax_amount: z.coerce.number().min(0).max(1e10).default(0),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'void']).default('sent'),
});

export async function createInvoice(formData: FormData) {
  const profile = await requireRole('editor');
  const parsed = InvoiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { error, data } = await db()
    .from('invoices')
    .insert({
      ...parsed.data,
      description: parsed.data.description || null,
      paid_on: parsed.data.status === 'paid' ? parsed.data.issued_on : null,
    })
    .select('id')
    .single();
  if (!error) {
    await audit(profile.email, 'invoice.create', 'invoices', data?.id, {
      number: parsed.data.number,
      amount: parsed.data.amount,
    });
  }
  refresh(parsed.data.client_id);
}

export async function setInvoiceStatus(formData: FormData) {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  const status = z
    .enum(['draft', 'sent', 'paid', 'overdue', 'void'])
    .safeParse(formData.get('status'));
  if (!id.success || !status.success) return;
  const { data } = await db()
    .from('invoices')
    .update({
      status: status.data,
      paid_on: status.data === 'paid' ? new Date().toISOString().slice(0, 10) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id.data)
    .select('client_id')
    .maybeSingle();
  await audit(profile.email, 'invoice.status', 'invoices', id.data, { status: status.data });
  refresh(data?.client_id);
}

/* ------------------------------------------------------------- documents */

export async function uploadDocument(formData: FormData) {
  const profile = await requireRole('editor');
  const clientId = uuid.safeParse(formData.get('client_id'));
  if (!clientId.success) return;
  const title = z.string().trim().min(1).max(200).safeParse(formData.get('title'));
  const category = z
    .string()
    .trim()
    .max(60)
    .safeParse(formData.get('category') || 'General');
  const checked = await checkUpload(formData.get('file'), VAULT_TYPES, 25 * 1048576);
  if (!checked.ok) return;

  const supabase = db();
  const path = `${clientId.data}/${crypto.randomUUID()}.${checked.file.ext}`;
  const { error: uploadError } = await supabase.storage
    .from('vault')
    .upload(path, checked.file.bytes, { contentType: checked.file.type, upsert: false });
  if (uploadError) return;

  const file = formData.get('file') as File;
  await supabase.from('client_documents').insert({
    client_id: clientId.data,
    title: title.success ? title.data : file.name.slice(0, 200),
    category: category.success ? category.data || 'General' : 'General',
    file_path: path,
    mime_type: checked.file.type,
    size_bytes: checked.file.size,
    visible_to_client: formData.get('visible_to_client') === 'on',
  });
  await audit(profile.email, 'document.upload', 'client_documents', clientId.data, { path });
  refresh(clientId.data);
}

export async function deleteDocument(formData: FormData) {
  const profile = await requireRole('admin');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = db();
  const { data: doc } = await supabase
    .from('client_documents')
    .select('client_id, file_path')
    .eq('id', id.data)
    .maybeSingle();
  if (!doc) return;
  await supabase.storage.from('vault').remove([doc.file_path]);
  await supabase.from('client_documents').delete().eq('id', id.data);
  await audit(profile.email, 'document.delete', 'client_documents', id.data, {
    path: doc.file_path,
  });
  refresh(doc.client_id);
}

/** Shows or hides one vault document in the client's portal. */
export async function setDocumentVisibility(formData: FormData) {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  const visible = formData.get('visible') === 'true';
  const supabase = db();
  const { data: doc } = await supabase
    .from('client_documents')
    .update({ visible_to_client: visible })
    .eq('id', id.data)
    .select('client_id')
    .maybeSingle();
  await audit(
    profile.email,
    visible ? 'document.share' : 'document.unshare',
    'client_documents',
    id.data,
  );
  if (doc) refresh(doc.client_id);
}
