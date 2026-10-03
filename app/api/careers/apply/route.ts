import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { apiError, apiOk, clientIp, rateLimit, sameOrigin } from '@/lib/api';
import { sendApplicationNotification } from '@/lib/email';
import { serviceClient } from '@/lib/supabase';
import { RESUME_TYPES, checkUpload } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A job application, with an optional CV.
 *
 * The CV goes to a private bucket under a random name; it is never served
 * publicly and the console reads it through a short-lived signed URL. The
 * file's first bytes must match the type it claims, the size is capped, and
 * the endpoint is rate limited per address with a honeypot for bots.
 */

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => !v || /^https?:\/\/[^\s]+\.[^\s]+/.test(v), 'Links must start with https://')
  .optional();

const Schema = z.object({
  jobId: z.string().uuid().optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(320),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  portfolio: optionalUrl,
  linkedin: optionalUrl,
  experience: z
    .string()
    .trim()
    .max(5)
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 60),
      'Years of experience should be a number.',
    )
    .optional(),
  note: z.string().trim().max(3000).optional(),
  consent: z.literal('on', {
    errorMap: () => ({ message: 'Please confirm you have read the privacy notice.' }),
  }),
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError('Cross-origin request refused.', 403);

  const limit = rateLimit(`apply:${clientIp(request)}`, { limit: 3, windowMs: 600_000 });
  if (!limit.ok) return apiError('Too many applications from here. Please try again later.', 429);

  const form = await request.formData().catch(() => null);
  if (!form) return apiError('Invalid submission.');

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === 'string' ? v : undefined;
  };
  const parsed = Schema.safeParse({
    jobId: str('jobId'),
    name: str('name'),
    email: str('email'),
    phone: str('phone'),
    city: str('city'),
    portfolio: str('portfolio'),
    linkedin: str('linkedin'),
    experience: str('experience'),
    note: str('note'),
    consent: str('consent'),
    website: str('website'),
  });
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Please check the form.');
  const d = parsed.data;

  const thanks = { message: 'Thank you. Your application is with us, and a person will read it.' };
  if (d.website) return apiOk(thanks);

  const supabase = serviceClient();
  if (!supabase) {
    return apiError(
      'Applications cannot be received right now. Please email contact@thepaperplane.co.in instead.',
      503,
    );
  }

  let jobTitle = 'General application';
  let jobId: string | null = null;
  if (d.jobId) {
    const { data: job } = await supabase
      .from('jobs')
      .select('id, title, is_open')
      .eq('id', d.jobId)
      .maybeSingle();
    if (job?.is_open) {
      jobTitle = job.title;
      jobId = job.id;
    }
  }

  let resumePath: string | null = null;
  const file = form.get('resume');
  if (file instanceof File && file.size > 0) {
    const checked = await checkUpload(file, RESUME_TYPES, 5 * 1048576);
    if (!checked.ok) return apiError(checked.error);
    resumePath = `${new Date().getFullYear()}/${crypto.randomUUID()}.${checked.file.ext}`;
    const { error } = await supabase.storage
      .from('resumes')
      .upload(resumePath, checked.file.bytes, { contentType: checked.file.type, upsert: false });
    if (error) return apiError('We could not store your CV. Please try again.', 500);
  }

  const { error } = await supabase.from('job_applications').insert({
    job_id: jobId,
    job_title: jobTitle,
    name: d.name,
    email: d.email,
    phone: d.phone || null,
    city: d.city || null,
    portfolio_url: d.portfolio || null,
    linkedin_url: d.linkedin || null,
    experience_years: d.experience ? Number(d.experience) : null,
    cover_note: d.note || null,
    resume_path: resumePath,
    status: 'new',
    user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
  });
  if (error) {
    console.error('[careers] insert failed', error);
    return apiError('We could not record your application. Please email us instead.', 500);
  }

  revalidateTag('applications');
  await sendApplicationNotification({
    name: d.name,
    email: d.email,
    phone: d.phone,
    role: jobTitle,
    portfolio: d.portfolio,
    note: d.note,
    hasResume: Boolean(resumePath),
  }).catch(() => undefined);

  return apiOk(thanks);
}
