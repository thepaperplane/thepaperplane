'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { runDailyAutomations } from '@/lib/automations';
import { SETTINGS_TAG } from '@/lib/settings';
import { serviceClient } from '@/lib/supabase';

/** Autopilot, from the owner's side: which jobs run, and a manual run. */

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

// Meta template names are lower-case letters, digits and underscores.
const template = z
  .string()
  .trim()
  .max(512)
  .regex(/^[a-z0-9_]*$/, 'Template names use lower-case letters, digits and underscores.');

const Schema = z.object({
  reminderTemplate: template,
  invoiceTemplate: template,
  otpTemplate: template,
  templateLanguage: z
    .string()
    .trim()
    .regex(/^[a-z]{2,3}(_[A-Z]{2})?$/)
    .default('en'),
});

export async function saveAutomations(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const on = (k: string) => formData.get(k) === 'on';
  const value = {
    meetingReminders: on('meetingReminders'),
    invoiceReminders: on('invoiceReminders'),
    enquiryAcknowledgement: on('enquiryAcknowledgement'),
    deadlineNudges: on('deadlineNudges'),
    dailyDigest: on('dailyDigest'),
    quoteFollowUps: on('quoteFollowUps'),
    ...parsed.data,
  };
  await db()
    .from('site_settings')
    .upsert({ key: 'automations', value, updated_at: new Date().toISOString() } as never);
  await audit(profile.email, 'automations.save', 'site_settings', 'automations', value);
  revalidateTag(SETTINGS_TAG);
  revalidatePath('/admin/automations');
}

export async function runAutopilotNow(): Promise<void> {
  const profile = await requireRole('admin');
  const out = await runDailyAutomations({ manual: true });
  await audit(profile.email, 'automations.run', 'automation_log', null, { out });
  revalidatePath('/admin/automations');
}
