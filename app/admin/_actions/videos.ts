'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { requireRole } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';

/**
 * Launch and testimonial videos for the Work page.
 *
 * A video is far bigger than a server action may carry, so the console asks
 * for a one-time signed upload address here and the browser sends the file
 * straight to storage. Only after that succeeds is the video recorded.
 */

const BUCKET = 'work-videos';
const MAX_BYTES = 50 * 1024 * 1024;
const TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};
const uuid = z.string().uuid();

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

export async function createVideoUpload(input: {
  projectId: string;
  type: string;
  size: number;
}): Promise<{ ok: true; path: string; token: string } | { ok: false; message: string }> {
  await requireRole('editor');
  if (!uuid.safeParse(input.projectId).success) return { ok: false, message: 'Unknown project.' };
  const ext = TYPES[input.type];
  if (!ext) return { ok: false, message: 'Use an MP4, WebM or MOV video.' };
  if (!(input.size > 0) || input.size > MAX_BYTES)
    return { ok: false, message: 'The video must be 50 MB or smaller. Compress it and try again.' };
  const path = `${input.projectId}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data)
    return { ok: false, message: 'Could not start the upload. Please try again.' };
  return { ok: true, path, token: data.token };
}

const AttachSchema = z.object({
  projectId: uuid,
  path: z.string().max(200),
  kind: z.enum(['launch', 'testimonial', 'walkthrough']),
  title: z.string().trim().max(120).optional(),
  width: z.number().int().min(0).max(10000).optional(),
  height: z.number().int().min(0).max(10000).optional(),
});

export async function attachProjectVideo(
  input: z.infer<typeof AttachSchema>,
): Promise<{ ok: boolean; message: string }> {
  const profile = await requireRole('editor');
  const parsed = AttachSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Something was missing. Please try again.' };
  const d = parsed.data;
  // Only a file this project's upload created.
  if (!d.path.startsWith(`${d.projectId}/`) || d.path.includes('..'))
    return { ok: false, message: 'That file does not belong to this project.' };
  const supabase = db();
  const { count } = await supabase
    .from('project_videos')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', d.projectId);
  const { data, error } = await supabase
    .from('project_videos')
    .insert({
      project_id: d.projectId,
      kind: d.kind,
      title: d.title || null,
      path: d.path,
      width: d.width || null,
      height: d.height || null,
      position: count ?? 0,
      is_published: true,
    })
    .select('id')
    .single();
  if (error) return { ok: false, message: 'The video uploaded but could not be saved.' };
  await audit(profile.email, 'project.video.add', 'project_videos', data?.id, { kind: d.kind });
  revalidatePath('/work');
  revalidatePath('/admin/portfolio');
  return { ok: true, message: 'Video added. It now plays beside the website preview.' };
}

const UpdateSchema = z.object({
  id: uuid,
  title: z.string().trim().max(120).optional(),
  kind: z.enum(['launch', 'testimonial', 'walkthrough']),
  position: z.coerce.number().int().min(0).max(99).default(0),
});

export async function updateProjectVideo(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const parsed = UpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await db()
    .from('project_videos')
    .update({
      title: parsed.data.title || null,
      kind: parsed.data.kind,
      position: parsed.data.position,
      is_published: formData.get('is_published') === 'on',
    })
    .eq('id', parsed.data.id);
  await audit(profile.email, 'project.video.update', 'project_videos', parsed.data.id);
  revalidatePath('/work');
  revalidatePath('/admin/portfolio');
}

export async function deleteProjectVideo(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = db();
  const { data: v } = await supabase
    .from('project_videos')
    .select('path')
    .eq('id', id.data)
    .maybeSingle();
  if (v) await supabase.storage.from(BUCKET).remove([v.path]);
  await supabase.from('project_videos').delete().eq('id', id.data);
  await audit(profile.email, 'project.video.delete', 'project_videos', id.data);
  revalidatePath('/work');
  revalidatePath('/admin/portfolio');
}
