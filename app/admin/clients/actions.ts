'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { ClientStatus, EntityType, TaskState } from '@/lib/database.types';

export type ClientActionResult = { ok: boolean; message: string; id?: string };

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const ClientSchema = z.object({
  name: z.string().trim().min(2, 'Client name is required.').max(160),
  legal_name: optionalText(200),
  entity_type: z.enum([
    'individual',
    'proprietorship',
    'partnership',
    'llp',
    'private_limited',
    'public_limited',
    'trust',
    'society',
    'other',
  ]),
  status: z.enum(['lead', 'onboarding', 'active', 'dormant', 'closed']),
  email: z.union([z.string().trim().email('Enter a valid email.'), z.literal('')]).optional(),
  phone: optionalText(40),
  website: optionalText(300),
  jurisdiction: optionalText(120),
  // Statutory identifiers are validated by the database too; checking here
  // lets us return a useful message instead of a constraint violation.
  pan: z
    .union([
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must look like ABCDE1234F.'),
      z.literal(''),
    ])
    .optional(),
  gstin: z
    .union([
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/, 'GSTIN must be 15 characters.'),
      z.literal(''),
    ])
    .optional(),
  cin: optionalText(40),
  tan: optionalText(20),
  source: optionalText(80),
  notes: optionalText(4000),
});

function toRow(values: z.infer<typeof ClientSchema>) {
  return {
    name: values.name,
    legal_name: values.legal_name ?? null,
    entity_type: values.entity_type as EntityType,
    status: values.status as ClientStatus,
    email: values.email || null,
    phone: values.phone ?? null,
    website: values.website ?? null,
    jurisdiction: values.jurisdiction ?? null,
    pan: values.pan || null,
    gstin: values.gstin || null,
    cin: values.cin ?? null,
    tan: values.tan ?? null,
    source: values.source ?? null,
    notes: values.notes ?? null,
  };
}

export async function createClient(
  _prev: ClientActionResult | null,
  formData: FormData,
): Promise<ClientActionResult> {
  await requireRole('editor');

  const parsed = ClientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form.' };
  }

  const supabase = serviceClient();
  if (!supabase) return { ok: false, message: 'Supabase service key is not configured.' };

  const { data, error } = await supabase
    .from('clients')
    .insert(toRow(parsed.data))
    .select('id')
    .single();

  if (error) {
    const duplicate = error.code === '23505';
    return {
      ok: false,
      message: duplicate
        ? 'A client with that PAN or GSTIN already exists.'
        : `Could not save: ${error.message}`,
    };
  }

  // Every new client starts with the standard onboarding sequence.
  await supabase.rpc('seed_onboarding', { target_client: data.id });

  revalidatePath('/admin/clients');
  redirect(`/admin/clients/${data.id}`);
}

export async function updateClient(
  _prev: ClientActionResult | null,
  formData: FormData,
): Promise<ClientActionResult> {
  await requireRole('editor');

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, message: 'Missing client id.' };

  const parsed = ClientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form.' };
  }

  const supabase = serviceClient();
  if (!supabase) return { ok: false, message: 'Supabase service key is not configured.' };

  const { error } = await supabase.from('clients').update(toRow(parsed.data)).eq('id', id);
  if (error) return { ok: false, message: `Could not save: ${error.message}` };

  revalidatePath('/admin/clients');
  revalidatePath(`/admin/clients/${id}`);

  return { ok: true, message: 'Changes saved.', id };
}

export async function setTaskState(
  clientId: string,
  taskId: string,
  state: TaskState,
): Promise<void> {
  await requireRole('editor');

  const supabase = serviceClient();
  if (!supabase) return;

  await supabase
    .from('onboarding_tasks')
    .update({
      state,
      completed_at: state === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', taskId);

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function addEngagement(
  clientId: string,
  serviceId: string,
  serviceName: string,
  pillarId: string,
): Promise<void> {
  await requireRole('editor');

  const supabase = serviceClient();
  if (!supabase) return;

  await supabase.from('engagements').insert({
    client_id: clientId,
    service_id: serviceId,
    service_name: serviceName,
    pillar_id: pillarId,
    state: 'proposed',
  });

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function removeEngagement(clientId: string, engagementId: string): Promise<void> {
  await requireRole('editor');

  const supabase = serviceClient();
  if (!supabase) return;

  await supabase.from('engagements').delete().eq('id', engagementId);
  revalidatePath(`/admin/clients/${clientId}`);
}
