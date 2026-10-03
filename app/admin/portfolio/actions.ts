'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { captureProject, deriveProjectDefaults, type CaptureResult } from '@/lib/capture';
import { requireRole } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { ProjectStatus } from '@/lib/database.types';

/** Record the full-length captures beside the project, for the scrolling frame. */
async function saveFullCaptures(slug: string, result: CaptureResult) {
  if (!result.desktopFullPath && !result.mobileFullPath) return;
  const supabase = serviceClient();
  if (!supabase) return;
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!project) return;
  const { data: existing } = await supabase
    .from('project_media')
    .select('*')
    .eq('project_id', project.id)
    .maybeSingle();
  await supabase.from('project_media').upsert({
    project_id: project.id,
    desktop_full_path: result.desktopFullPath ?? existing?.desktop_full_path ?? null,
    mobile_full_path: result.mobileFullPath ?? existing?.mobile_full_path ?? null,
    is_featured: existing?.is_featured ?? true,
    outcome: existing?.outcome ?? null,
    updated_at: new Date().toISOString(),
  });
}

export type ActionResult = {
  ok: boolean;
  message: string;
  detail?: string;
  slug?: string;
};

const UrlSchema = z.object({
  url: z.string().trim().min(3, 'Paste a website address.').max(500),
  name: z.string().trim().max(160).optional(),
  sector: z.string().trim().max(160).optional(),
  summary: z.string().trim().max(1000).optional(),
});

/**
 * The "paste a URL" module.
 *
 * One input creates the project, checks reachability, captures desktop and
 * mobile previews, uploads them, and revalidates the public work page — so
 * the side-by-side laptop/phone component appears without a deploy.
 */
export async function addProjectFromUrl(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole('editor');

  const parsed = UrlSchema.safeParse({
    url: formData.get('url'),
    name: formData.get('name') || undefined,
    sector: formData.get('sector') || undefined,
    summary: formData.get('summary') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form.' };
  }

  const defaults = deriveProjectDefaults(parsed.data.url);
  if (!defaults) {
    return { ok: false, message: 'That does not look like a valid website address.' };
  }

  const supabase = serviceClient();
  if (!supabase) {
    return { ok: false, message: 'Supabase service key is not configured.' };
  }

  // Refuse duplicates rather than silently overwriting an existing entry.
  const { data: existing } = await supabase
    .from('projects')
    .select('id, name')
    .eq('slug', defaults.slug)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      message: `“${existing.name}” is already in the portfolio.`,
      detail: 'Open it below to re-capture or edit it instead.',
    };
  }

  const { data: last } = await supabase
    .from('projects')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: insertError } = await supabase.from('projects').insert({
    slug: defaults.slug,
    name: parsed.data.name?.trim() || defaults.name,
    url: defaults.url,
    display_url: defaults.displayUrl,
    sector: parsed.data.sector?.trim() || null,
    summary: parsed.data.summary?.trim() || null,
    year: new Date().getFullYear(),
    status: 'draft',
    capture_status: 'capturing',
    position: (last?.position ?? 0) + 1,
  });

  if (insertError) {
    console.error('[portfolio] insert failed', insertError);
    return { ok: false, message: 'Could not save the project.', detail: insertError.message };
  }

  const result = await captureProject(defaults.slug, defaults.url);

  await supabase
    .from('projects')
    .update({
      capture_status: result.status,
      desktop_shot_path: result.desktopPath ?? null,
      mobile_shot_path: result.mobilePath ?? null,
      captured_at: result.status === 'ready' ? new Date().toISOString() : null,
      capture_error: result.error ?? null,
      last_http_status: result.httpStatus,
      last_checked_at: new Date().toISOString(),
      // Only publish automatically when we actually have previews to show.
      status: result.status === 'ready' ? 'live' : 'staged',
      status_note: result.status === 'unreachable' ? result.error : null,
    })
    .eq('slug', defaults.slug);

  if (result.status === 'ready') await saveFullCaptures(defaults.slug, result);

  revalidatePath('/admin/portfolio');
  revalidatePath('/work');
  revalidatePath('/');

  if (result.status === 'ready') {
    return {
      ok: true,
      slug: defaults.slug,
      message: `${defaults.name} is live on the work page.`,
      detail: 'Desktop and mobile previews captured and published.',
    };
  }

  if (result.status === 'unreachable') {
    return {
      ok: true,
      slug: defaults.slug,
      message: `${defaults.name} was added, but the site is not reachable.`,
      detail: result.error,
    };
  }

  return {
    ok: true,
    slug: defaults.slug,
    message: `${defaults.name} was added and is staged.`,
    detail: result.error ?? 'Capture did not complete — retry from the list below.',
  };
}

/** Re-run capture for an existing project. */
export async function recaptureProject(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole('editor');

  const slug = String(formData.get('slug') ?? '');
  if (!slug) return { ok: false, message: 'Missing project.' };

  const supabase = serviceClient();
  if (!supabase) return { ok: false, message: 'Supabase service key is not configured.' };

  const { data: project } = await supabase
    .from('projects')
    .select('slug, url, name, status')
    .eq('slug', slug)
    .maybeSingle();

  if (!project) return { ok: false, message: 'Project not found.' };

  await supabase.from('projects').update({ capture_status: 'capturing' }).eq('slug', slug);

  const result = await captureProject(project.slug, project.url);

  const ready = result.status === 'ready';
  await supabase
    .from('projects')
    .update({
      capture_status: result.status,
      // A failed re-capture must not wipe the captures that already work.
      ...(ready
        ? {
            desktop_shot_path: result.desktopPath ?? null,
            mobile_shot_path: result.mobilePath ?? null,
            captured_at: new Date().toISOString(),
          }
        : {}),
      capture_error: result.error ?? null,
      last_http_status: result.httpStatus,
      last_checked_at: new Date().toISOString(),
      status: ready ? 'live' : project.status,
      status_note: result.status === 'unreachable' ? result.error : null,
    })
    .eq('slug', slug);

  if (ready) await saveFullCaptures(slug, result);

  revalidatePath('/admin/portfolio');
  revalidatePath('/work');
  revalidatePath('/');

  return result.status === 'ready'
    ? { ok: true, message: `${project.name} re-captured and published.` }
    : { ok: false, message: `Could not capture ${project.name}.`, detail: result.error };
}

/** Publish / unpublish without touching captures. */
export async function setProjectStatus(slug: string, status: ProjectStatus): Promise<ActionResult> {
  await requireRole('editor');

  const supabase = serviceClient();
  if (!supabase) return { ok: false, message: 'Supabase service key is not configured.' };

  const { error } = await supabase.from('projects').update({ status }).eq('slug', slug);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/portfolio');
  revalidatePath('/work');

  return { ok: true, message: `Status set to ${status}.` };
}

export async function deleteProject(slug: string): Promise<ActionResult> {
  await requireRole('admin');

  const supabase = serviceClient();
  if (!supabase) return { ok: false, message: 'Supabase service key is not configured.' };

  // Remove captures first so storage does not accumulate orphans.
  const { data: files } = await supabase.storage.from('previews').list(slug);
  if (files?.length) {
    await supabase.storage.from('previews').remove(files.map((f) => `${slug}/${f.name}`));
  }

  const { error } = await supabase.from('projects').delete().eq('slug', slug);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/portfolio');
  revalidatePath('/work');

  return { ok: true, message: 'Project removed.' };
}
