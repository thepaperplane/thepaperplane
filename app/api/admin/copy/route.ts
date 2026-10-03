import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireConsoleApi } from '@/lib/auth';
import { apiError, apiOk, readJson, sameOrigin } from '@/lib/api';
import { audit } from '@/lib/audit';
import { COPY_KEY, COPY_TAG, labelFor, splitKey } from '@/lib/copy';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Save or reset one piece of editable copy — the visual editor's only way to
 * write. Re-authorises the console owner on every call, validates the key
 * against a strict pattern and bounds the value, then invalidates exactly the
 * cache the public pages read copy from.
 */

const Body = z.object({
  key: z.string().regex(COPY_KEY, 'That is not an editable field.'),
  value: z.string().max(5000, 'That is too long for one field.').optional(),
});

async function publish() {
  revalidateTag(COPY_TAG);
  revalidatePath('/', 'layout');
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError('Cross-origin request refused.', 403);
  const gate = await requireConsoleApi();
  if (!gate.ok) return gate.response;

  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid request.');
  const value = parsed.data.value?.trim();
  if (!value) return apiError('Text cannot be empty.');

  const supabase = serviceClient();
  if (!supabase) return apiError('The database is not configured.', 503);

  const { page, slot } = splitKey(parsed.data.key);
  const { error } = await supabase.from('content_blocks').upsert(
    {
      page,
      slot,
      label: labelFor(parsed.data.key),
      kind: 'text',
      value: value as never,
      is_published: true,
      updated_by: gate.profile.id,
    },
    { onConflict: 'page,slot' },
  );
  if (error) return apiError('Could not save that change.', 500);

  await audit(gate.email, 'copy.save', 'content', parsed.data.key, { length: value.length });
  await publish();
  return apiOk({ ok: true, value });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return apiError('Cross-origin request refused.', 403);
  const gate = await requireConsoleApi();
  if (!gate.ok) return gate.response;

  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid request.');

  const supabase = serviceClient();
  if (!supabase) return apiError('The database is not configured.', 503);

  const { page, slot } = splitKey(parsed.data.key);
  const { error } = await supabase
    .from('content_blocks')
    .delete()
    .eq('page', page)
    .eq('slot', slot);
  if (error) return apiError('Could not reset that field.', 500);

  await audit(gate.email, 'copy.reset', 'content', parsed.data.key);
  await publish();
  return apiOk({ ok: true });
}
