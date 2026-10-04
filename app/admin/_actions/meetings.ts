'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { SETTINGS_TAG } from '@/lib/settings';
import { serviceClient } from '@/lib/supabase';
import { cancelEvent, disconnectGoogle } from '@/lib/integrations/google';

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const Schema = z.object({
  start: time,
  end: time,
  slotMinutes: z.coerce.number().int().min(15).max(120),
  bufferMinutes: z.coerce.number().int().min(0).max(60),
  leadHours: z.coerce.number().int().min(0).max(72),
  horizonDays: z.coerce.number().int().min(1).max(60),
  title: z.string().trim().min(3).max(120),
});

export async function saveScheduling(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const days = formData
    .getAll('days')
    .map(Number)
    .filter((d) => d >= 0 && d <= 6);
  const value = { enabled: formData.get('enabled') === 'on', days, ...parsed.data };
  await db()
    .from('site_settings')
    .upsert({ key: 'scheduling', value, updated_at: new Date().toISOString() } as never);
  await audit(profile.email, 'scheduling.save', 'site_settings', 'scheduling');
  revalidateTag(SETTINGS_TAG);
  revalidatePath('/admin/meetings');
}

export async function setMeetingStatus(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const id = z.string().uuid().safeParse(formData.get('id'));
  const status = z.enum(['cancelled', 'done', 'no_show']).safeParse(formData.get('status'));
  if (!id.success || !status.success) return;
  const { data: m } = await db()
    .from('meetings')
    .select('google_event_id, status')
    .eq('id', id.data)
    .maybeSingle();
  if (status.data === 'cancelled' && m?.google_event_id && m.status === 'booked') {
    await cancelEvent(m.google_event_id).catch(() => undefined);
  }
  await db().from('meetings').update({ status: status.data }).eq('id', id.data);
  await audit(profile.email, `meeting.${status.data}`, 'meetings', id.data);
  revalidatePath('/admin/meetings');
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const profile = await requireRole('admin');
  await disconnectGoogle();
  await audit(profile.email, 'integrations.google.disconnect', 'integrations', 'google');
  revalidatePath('/admin/meetings');
}
