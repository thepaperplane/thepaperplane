'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { SETTINGS_TAG } from '@/lib/settings';
import { serviceClient } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import { anthropic, modelFor, shapeFor } from '@/lib/ai/claude';
import type { Tier } from '@/lib/ai/claude';
import { getSettings } from '@/lib/settings';
import { stableSystem, TOOLS } from '@/lib/assistant/prompt';

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
  tier: z.enum(['economy', 'balanced', 'best']).default('economy'),
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
    tier: parsed.data.tier,
  };
  await db()
    .from('site_settings')
    .upsert({ key: 'assistant', value, updated_at: new Date().toISOString() } as never);
  await audit(profile.email, 'assistant.settings', 'site_settings', 'assistant', {
    enabled: value.enabled,
    tier: value.tier,
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

export type AssistantTest = { ok: boolean; message: string } | null;

/** Sends one tiny real request, shaped like a visitor's, and says plainly what happened. */
export async function testAssistant(_prev: AssistantTest, _form: FormData): Promise<AssistantTest> {
  await requireRole('admin');
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      message: 'ANTHROPIC_API_KEY is missing in Vercel (Production). Add it and redeploy.',
    };
  }
  const settings = await getSettings();
  const model = modelFor(settings.assistant.tier as Tier);
  try {
    const res = await anthropic().beta.messages.create({
      model,
      max_tokens: 40,
      ...shapeFor(model, 'low'),
      system: [stableSystem()],
      tools: TOOLS,
      messages: [{ role: 'user', content: 'Say hello in five words.' }],
    });
    const text = res.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    return { ok: true, message: `Working. ${model} replied: “${text || '(empty)'}”` };
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      const m = e.message || '';
      let hint = '';
      if (e.status === 401)
        hint =
          ' → The API key is wrong or revoked. Create a new key at console.anthropic.com and replace ANTHROPIC_API_KEY in Vercel, then redeploy.';
      else if (/credit balance|billing/i.test(m))
        hint =
          ' → No credit on the Anthropic account. Add a small amount under Plans & Billing in console.anthropic.com.';
      else if (e.status === 404) hint = ' → The model name is not available to this key.';
      else if (e.status === 403) hint = ' → This key is not allowed to use that model.';
      return { ok: false, message: `Anthropic said ${e.status}: ${m}${hint}` };
    }
    return {
      ok: false,
      message: `Could not reach Anthropic: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
