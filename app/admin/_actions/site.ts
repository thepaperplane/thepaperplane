'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { JOBS_TAG, TESTIMONIALS_TAG } from '@/lib/public-data';
import { SETTINGS_TAG } from '@/lib/settings';
import { COPY_TAG } from '@/lib/copy';
import { serviceClient } from '@/lib/supabase';
import { IMAGE_TYPES, checkUpload } from '@/lib/uploads';
import { slugify } from '@/lib/utils';
import type { JobApplicationRow } from '@/lib/database.types';

/**
 * What the public site shows: testimonials, careers, settings, and the extra
 * portfolio fields. Each save invalidates exactly the cache the public pages
 * read, so changes appear on the next visit without a deploy.
 */

const uuid = z.string().uuid();
const text = (max: number) => z.string().trim().max(max);
const lines = (value: FormDataEntryValue | null) =>
  String(value ?? '')
    .split('\n')
    .map((l) => l.replace(/^[\s•\-*]+/, '').trim())
    .filter(Boolean)
    .slice(0, 20);

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

async function uploadImage(
  file: FormDataEntryValue | null,
  folder: string,
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const checked = await checkUpload(file, IMAGE_TYPES, 10 * 1048576);
  if (!checked.ok) return null;
  const supabase = db();
  const path = `${folder}/${crypto.randomUUID()}.${checked.file.ext}`;
  const { error } = await supabase.storage
    .from('site-media')
    .upload(path, checked.file.bytes, { contentType: checked.file.type });
  if (error) return null;
  return supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl;
}

/* ------------------------------------------------------------ testimonials */

const TestimonialSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  quote: text(1200).min(10, 'The quote is too short.'),
  author_name: text(120).min(2),
  author_role: text(120).optional(),
  company: text(160).optional(),
  project_slug: text(80).optional(),
  video_url: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === '' || /^https:\/\/[^\s]+$/.test(v), 'Use a full https:// link.')
    .optional(),
  rating: z.coerce.number().int().min(0).max(5).optional(),
  position: z.coerce.number().int().min(0).max(999).default(0),
  is_published: z.string().optional(),
});

export async function saveTestimonial(formData: FormData) {
  const profile = await requireRole('editor');
  const parsed = TestimonialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const avatar = await uploadImage(formData.get('avatar'), 'testimonials');
  const row = {
    quote: d.quote,
    author_name: d.author_name,
    author_role: d.author_role || null,
    company: d.company || null,
    project_slug: d.project_slug || null,
    video_url: d.video_url || null,
    rating: d.rating ? d.rating : null,
    position: d.position,
    is_published: d.is_published === 'on',
    updated_at: new Date().toISOString(),
    ...(avatar ? { avatar_url: avatar } : {}),
  };
  const supabase = db();
  if (d.id) await supabase.from('testimonials').update(row).eq('id', d.id);
  else await supabase.from('testimonials').insert(row);
  await audit(
    profile.email,
    d.id ? 'testimonial.update' : 'testimonial.create',
    'testimonials',
    d.id || null,
    {
      author: d.author_name,
    },
  );
  revalidateTag(TESTIMONIALS_TAG);
  revalidatePath('/');
  revalidatePath('/work');
  revalidatePath('/admin/testimonials');
}

export async function deleteTestimonial(formData: FormData) {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  await db().from('testimonials').delete().eq('id', id.data);
  await audit(profile.email, 'testimonial.delete', 'testimonials', id.data);
  revalidateTag(TESTIMONIALS_TAG);
  revalidatePath('/');
  revalidatePath('/admin/testimonials');
}

/* ----------------------------------------------------------------- careers */

const JobSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  title: text(140).min(2),
  team: text(80).optional(),
  location: text(120).min(2).default('Remote, India'),
  employment_type: text(40).min(2).default('Full-time'),
  experience: text(80).optional(),
  summary: text(600).optional(),
  description: text(5000).optional(),
  closes_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
  position: z.coerce.number().int().min(0).max(999).default(0),
  is_open: z.string().optional(),
});

export async function saveJob(formData: FormData) {
  const profile = await requireRole('editor');
  const parsed = JobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const row = {
    title: d.title,
    team: d.team || null,
    location: d.location,
    employment_type: d.employment_type,
    experience: d.experience || null,
    summary: d.summary || null,
    description: d.description || null,
    responsibilities: lines(formData.get('responsibilities')),
    requirements: lines(formData.get('requirements')),
    closes_on: d.closes_on || null,
    position: d.position,
    is_open: d.is_open === 'on',
    updated_at: new Date().toISOString(),
  };
  const supabase = db();
  if (d.id) {
    await supabase.from('jobs').update(row).eq('id', d.id);
  } else {
    const base = slugify(d.title) || 'role';
    await supabase
      .from('jobs')
      .insert({ ...row, slug: `${base}-${crypto.randomUUID().slice(0, 6)}` });
  }
  await audit(profile.email, d.id ? 'job.update' : 'job.create', 'jobs', d.id || null, {
    title: d.title,
  });
  revalidateTag(JOBS_TAG);
  revalidatePath('/careers');
  revalidatePath('/');
  revalidatePath('/admin/careers');
}

export async function deleteJob(formData: FormData) {
  const profile = await requireRole('admin');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  await db().from('jobs').delete().eq('id', id.data);
  await audit(profile.email, 'job.delete', 'jobs', id.data);
  revalidateTag(JOBS_TAG);
  revalidatePath('/careers');
  revalidatePath('/admin/careers');
}

export async function updateApplication(formData: FormData) {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  const status = z
    .enum(['new', 'reviewing', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'])
    .optional()
    .safeParse(formData.get('status') ?? undefined);
  const notes = formData.get('notes');
  const rating = formData.get('rating');
  const patch: Partial<JobApplicationRow> = { updated_at: new Date().toISOString() };
  if (status.success && status.data) patch.status = status.data;
  if (typeof notes === 'string') patch.notes = notes.trim().slice(0, 4000) || null;
  if (typeof rating === 'string' && rating !== '') {
    const r = Number(rating);
    if (Number.isInteger(r) && r >= 1 && r <= 5) patch.rating = r;
  }
  await db().from('job_applications').update(patch).eq('id', id.data);
  await audit(profile.email, 'application.update', 'job_applications', id.data, {
    status: patch.status ?? null,
  });
  revalidatePath('/admin/careers/applications');
  revalidatePath('/admin');
}

export async function deleteApplication(formData: FormData) {
  const profile = await requireRole('admin');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = db();
  const { data } = await supabase
    .from('job_applications')
    .select('resume_path')
    .eq('id', id.data)
    .maybeSingle();
  if (data?.resume_path) await supabase.storage.from('resumes').remove([data.resume_path]);
  await supabase.from('job_applications').delete().eq('id', id.data);
  await audit(profile.email, 'application.delete', 'job_applications', id.data);
  revalidatePath('/admin/careers/applications');
}

/* ---------------------------------------------------------------- settings */

const httpsOrEmpty = text(300).refine(
  (v) => !v || /^https:\/\//.test(v),
  'Links must start with https://',
);

const SettingsSchema = z.object({
  phone: text(40).min(5),
  phoneIntl: text(20).regex(/^\+?\d{8,15}$/, 'International number, digits only.'),
  email: z.string().trim().email().max(200),
  whatsapp: text(20).regex(/^\d{8,15}$/, 'WhatsApp number, digits only with country code.'),
  hours: text(120),
  announcement_text: text(220).optional(),
  announcement_href: text(300)
    .refine(
      (v) => !v || v.startsWith('/') || /^https:\/\//.test(v),
      'Use a path like /contact or an https:// link.',
    )
    .optional(),
  announcement_cta: text(40).optional(),
  announcement_enabled: z.string().optional(),
  linkedin: httpsOrEmpty.optional(),
  instagram: httpsOrEmpty.optional(),
  x: httpsOrEmpty.optional(),
  youtube: httpsOrEmpty.optional(),
});

export type SettingsResult = { ok: boolean; message: string };

export async function saveSettings(
  _prev: SettingsResult | null,
  formData: FormData,
): Promise<SettingsResult> {
  const profile = await requireRole('admin');
  const parsed = SettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form.' };
  const d = parsed.data;
  const rows = [
    {
      key: 'contact',
      value: {
        phone: d.phone,
        phoneIntl: d.phoneIntl,
        email: d.email,
        whatsapp: d.whatsapp,
        hours: d.hours,
      },
    },
    {
      key: 'announcement',
      value: {
        enabled: d.announcement_enabled === 'on' && Boolean(d.announcement_text),
        text: d.announcement_text ?? '',
        href: d.announcement_href || '/contact',
        cta: d.announcement_cta || 'Find out more',
      },
    },
    {
      key: 'social',
      value: {
        linkedin: d.linkedin ?? '',
        instagram: d.instagram ?? '',
        x: d.x ?? '',
        youtube: d.youtube ?? '',
      },
    },
  ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));
  const { error } = await db()
    .from('site_settings')
    .upsert(rows as never);
  if (error) return { ok: false, message: 'Could not save settings.' };
  await audit(profile.email, 'settings.save', 'site_settings', null);
  revalidateTag(SETTINGS_TAG);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Saved. The website shows the new details now.' };
}

/* --------------------------------------------------------------- portfolio */

export async function saveProjectMedia(formData: FormData) {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('project_id'));
  if (!id.success) return;
  const supabase = db();
  const { data: existing } = await supabase
    .from('project_media')
    .select('*')
    .eq('project_id', id.data)
    .maybeSingle();

  const toPath = (url: string | null) =>
    url ? `site-media/${url.split('/storage/v1/object/public/site-media/')[1] ?? ''}` : null;
  const desktop = toPath(await uploadImage(formData.get('desktop_full'), 'captures'));
  const mobile = toPath(await uploadImage(formData.get('mobile_full'), 'captures'));
  const outcome = String(formData.get('outcome') ?? '')
    .trim()
    .slice(0, 400);

  await supabase.from('project_media').upsert({
    project_id: id.data,
    desktop_full_path: desktop ?? existing?.desktop_full_path ?? null,
    mobile_full_path: mobile ?? existing?.mobile_full_path ?? null,
    is_featured: formData.get('is_featured') === 'on',
    outcome: outcome || null,
    updated_at: new Date().toISOString(),
  });
  await audit(profile.email, 'project.media', 'project_media', id.data);
  revalidatePath('/work');
  revalidatePath('/');
  revalidatePath('/admin/portfolio');
}

/* -------------------------------------------------------------- copy reset */

export async function resetCopy(formData: FormData) {
  const profile = await requireRole('editor');
  const page = z
    .string()
    .regex(/^[a-z][a-z0-9-]{0,30}$/)
    .safeParse(formData.get('page'));
  const slot = z
    .string()
    .regex(/^[a-zA-Z0-9.-]{1,160}$/)
    .safeParse(formData.get('slot'));
  if (!page.success || !slot.success) return;
  await db().from('content_blocks').delete().eq('page', page.data).eq('slot', slot.data);
  await audit(profile.email, 'copy.reset', 'content', `${page.data}.${slot.data}`);
  revalidateTag(COPY_TAG);
  revalidatePath('/', 'layout');
}
