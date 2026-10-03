'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { SETTINGS_TAG } from '@/lib/settings';
import { serviceClient } from '@/lib/supabase';

/**
 * The site assistant, from the owner's side: whether it runs, what it says
 * first, standing notes, extra answers it may use, and its transcripts.
 */

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

const SettingsSchema = z.object({
  greeting: z.string().trim().min(10).max(400),
  notes: z.string().trim().max(2000).optional(),
  dailyCap: z.coerce.number().int().min(10).max(5000),
});

export async function saveAssistantSettings(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const parsed = SettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const value = {
    enabled: formData.get('enabled') === 'on',
    greeting: parsed.data.greeting,
    notes: parsed.data.notes ?? '',
    dailyCap: parsed.data.dailyCap,
  };
  await db()
    .from('site_settings')
    .upsert({ key: 'assistant', value, updated_at: new Date().toISOString() } as never);
  await audit(profile.email, 'assistant.settings', 'site_settings', 'assistant', {
    enabled: value.enabled,
  });
  revalidateTag(SETTINGS_TAG);
  revalidatePath('/', 'layout');
  revalidatePath('/admin/assistant');
}

const KnowledgeSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(5).max(2000),
});

export async function saveKnowledge(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const parsed = KnowledgeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const row = {
    title: parsed.data.title,
    body: parsed.data.body,
    is_active: formData.get('is_active') === 'on',
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.id) {
    await db().from('assistant_knowledge').update(row).eq('id', parsed.data.id);
  } else {
    await db().from('assistant_knowledge').insert(row);
  }
  await audit(
    profile.email,
    'assistant.knowledge.save',
    'assistant_knowledge',
    parsed.data.id || null,
  );
  revalidatePath('/admin/assistant');
}

export async function deleteKnowledge(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  await db().from('assistant_knowledge').delete().eq('id', id.data);
  await audit(profile.email, 'assistant.knowledge.delete', 'assistant_knowledge', id.data);
  revalidatePath('/admin/assistant');
}

export async function flagConversation(formData: FormData): Promise<void> {
  await requireRole('admin');
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const flagged = formData.get('flagged') === 'true';
  await db().from('assistant_conversations').update({ flagged }).eq('id', id.data);
  revalidatePath(`/admin/assistant/${id.data}`);
  revalidatePath('/admin/assistant');
}

export async function deleteConversation(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  await db().from('assistant_messages').delete().eq('conversation_id', id.data);
  await db().from('assistant_conversations').delete().eq('id', id.data);
  await audit(profile.email, 'assistant.conversation.delete', 'assistant_conversations', id.data);
  revalidatePath('/admin/assistant');
}
