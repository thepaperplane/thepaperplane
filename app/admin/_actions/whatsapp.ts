'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { serviceClient } from '@/lib/supabase';
import {
  normaliseWaId,
  sendTemplate,
  sendText,
  WINDOW_MS,
  whatsappConfigured,
} from '@/lib/integrations/whatsapp';

/** Sending from the console's WhatsApp inbox. */

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

async function record(
  waId: string,
  body: string,
  kind: string,
  result: { id?: string; error?: string },
  actor: string,
) {
  const now = new Date().toISOString();
  await db()
    .from('wa_messages')
    .insert({
      wa_message_id: result.id ?? null,
      wa_id: waId,
      direction: 'out',
      kind,
      body: body.slice(0, 4000),
      status: result.error ? 'failed' : 'sent',
      error: result.error ?? null,
      sent_by: actor,
      created_at: now,
    });
  await db()
    .from('wa_contacts')
    .upsert({ wa_id: waId, last_message_at: now }, { onConflict: 'wa_id' });
}

const TextSchema = z.object({
  wa_id: z.string().regex(/^\d{8,15}$/),
  body: z.string().trim().min(1).max(4000),
});

export async function sendWhatsAppText(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  if (!whatsappConfigured()) return;
  const parsed = TextSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { wa_id, body } = parsed.data;

  // Meta refuses free text outside the 24-hour customer-service window.
  const { data: contact } = await db()
    .from('wa_contacts')
    .select('last_inbound_at')
    .eq('wa_id', wa_id)
    .maybeSingle();
  const open =
    contact?.last_inbound_at &&
    Date.now() - new Date(contact.last_inbound_at).getTime() < WINDOW_MS;
  if (!open) {
    await record(
      wa_id,
      body,
      'text',
      { error: 'Outside the 24-hour window — send a template.' },
      profile.email,
    );
  } else {
    try {
      const id = await sendText(wa_id, body);
      await record(wa_id, body, 'text', { id }, profile.email);
    } catch (e) {
      await record(
        wa_id,
        body,
        'text',
        { error: e instanceof Error ? e.message : 'Failed' },
        profile.email,
      );
    }
  }
  revalidatePath('/admin/whatsapp');
}

const TemplateSchema = z.object({
  wa_id: z.string().trim().min(8).max(20),
  template: z.string().regex(/^[\w-]{1,512}\|[\w-]{2,10}$/),
  params: z.string().max(2000).optional(),
});

export async function sendWhatsAppTemplate(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  if (!whatsappConfigured()) return;
  const parsed = TemplateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const waId = normaliseWaId(parsed.data.wa_id);
  if (!waId) return;
  const [name, language] = parsed.data.template.split('|') as [string, string];
  const params = (parsed.data.params ?? '')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 10);
  const label = `Template: ${name}${params.length ? ` (${params.join(', ')})` : ''}`;
  try {
    const id = await sendTemplate(waId, name, language, params);
    await record(waId, label, 'template', { id }, profile.email);
    await audit(profile.email, 'whatsapp.template', 'wa_contacts', waId, { template: name });
  } catch (e) {
    await record(
      waId,
      label,
      'template',
      { error: e instanceof Error ? e.message : 'Failed' },
      profile.email,
    );
  }
  revalidatePath('/admin/whatsapp');
  redirect(`/admin/whatsapp?c=${waId}`);
}

export async function renameWhatsAppContact(formData: FormData): Promise<void> {
  await requireRole('editor');
  const waId = String(formData.get('wa_id') ?? '');
  const name = String(formData.get('name') ?? '')
    .trim()
    .slice(0, 120);
  if (!/^\d{8,15}$/.test(waId)) return;
  await db()
    .from('wa_contacts')
    .update({ name: name || null })
    .eq('wa_id', waId);
  revalidatePath('/admin/whatsapp');
}
