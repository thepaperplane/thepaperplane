import { revalidatePath, revalidateTag } from 'next/cache';
import { requireConsoleApi } from '@/lib/auth';
import { apiError, apiOk, sameOrigin } from '@/lib/api';
import { audit } from '@/lib/audit';
import { COPY_KEY, COPY_TAG, labelFor, splitKey } from '@/lib/copy';
import { serviceClient } from '@/lib/supabase';
import { IMAGE_TYPES, checkUpload } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Replace an editable image. Uploads to the public site-media bucket under a
 * random name and records the URL against the key. `key` is optional: without
 * one this is a plain upload that returns a URL, used by the console's forms
 * (testimonial photos, portfolio captures).
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError('Cross-origin request refused.', 403);
  const gate = await requireConsoleApi();
  if (!gate.ok) return gate.response;

  const form = await request.formData().catch(() => null);
  if (!form) return apiError('Expected a file upload.');

  const key = String(form.get('key') ?? '');
  if (key && !COPY_KEY.test(key)) return apiError('That is not an editable image.');

  const checked = await checkUpload(form.get('file'), IMAGE_TYPES, 10 * 1048576);
  if (!checked.ok) return apiError(checked.error);

  const supabase = serviceClient();
  if (!supabase) return apiError('Storage is not configured.', 503);

  const folder = (String(form.get('folder') ?? 'site') || 'site')
    .replace(/[^a-z0-9-]/gi, '')
    .slice(0, 30);
  const path = `${folder}/${crypto.randomUUID()}.${checked.file.ext}`;
  const { error: uploadError } = await supabase.storage
    .from('site-media')
    .upload(path, checked.file.bytes, { contentType: checked.file.type, upsert: false });
  if (uploadError) return apiError('Upload failed.', 500);

  const url = supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl;

  if (key) {
    const { page, slot } = splitKey(key);
    const { error } = await supabase.from('content_blocks').upsert(
      {
        page,
        slot,
        label: labelFor(key),
        kind: 'image',
        value: { url } as never,
        is_published: true,
        updated_by: gate.profile.id,
      },
      { onConflict: 'page,slot' },
    );
    if (error) return apiError('Uploaded, but could not attach it to the page.', 500);
    revalidateTag(COPY_TAG);
    revalidatePath('/', 'layout');
  }

  await audit(gate.email, 'media.upload', 'site-media', path, { key: key || null });
  return apiOk({ url, path });
}
