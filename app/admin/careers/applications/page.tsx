import Link from 'next/link';
import { ArrowLeft, FileText, Inbox } from 'lucide-react';
import { ADMIN_FIELD, EmptyState, PageHeader, Panel, Pill } from '@/components/admin/ui';
import { AutoSubmitSelect, SubmitButton } from '@/components/admin/form-bits';
import { deleteApplication, updateApplication } from '@/app/admin/_actions/site';
import { requireProfile } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import { formatRelative } from '@/lib/utils';
import type { ApplicationStatus, JobApplicationRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Applications' };

const STATUS: { value: ApplicationStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer made' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Not this time' },
];

const TONE: Record<ApplicationStatus, 'accent' | 'neutral' | 'positive' | 'caution' | 'critical'> =
  {
    new: 'accent',
    reviewing: 'neutral',
    shortlisted: 'caution',
    interview: 'caution',
    offer: 'positive',
    hired: 'positive',
    rejected: 'neutral',
  };

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireProfile();
  const { status } = await searchParams;
  const supabase = serviceClient();
  let apps: (JobApplicationRow & { cv?: string | null })[] = [];

  if (supabase) {
    let q = supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (STATUS.some((s) => s.value === status)) q = q.eq('status', status as ApplicationStatus);
    const { data } = await q;
    apps = data ?? [];
    // CVs are private; hand the console a link that expires in ten minutes.
    const paths = apps.map((a) => a.resume_path).filter(Boolean) as string[];
    if (paths.length) {
      const { data: signed } = await supabase.storage.from('resumes').createSignedUrls(paths, 600);
      const byPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
      apps = apps.map((a) => ({
        ...a,
        cv: a.resume_path ? (byPath.get(a.resume_path) ?? null) : null,
      }));
    }
  }

  return (
    <>
      <Link
        href="/admin/careers"
        className="text-ink-3 hover:text-ink mb-5 inline-flex items-center gap-1.5 text-[0.875rem] font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Careers
      </Link>
      <PageHeader
        title="Applications"
        description="Move each applicant along as you review them. CV links are private and expire after ten minutes."
      />

      <nav aria-label="Filter" className="mb-5 flex flex-wrap gap-2">
        {[{ value: '', label: 'All' }, ...STATUS].map((s) => (
          <Link
            key={s.label}
            href={
              s.value
                ? `/admin/careers/applications?status=${s.value}`
                : '/admin/careers/applications'
            }
            className={
              (status ?? '') === s.value
                ? 'bg-ink text-ground rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium'
                : 'text-ink-2 rounded-full px-3.5 py-1.5 text-[0.8125rem] ring-1 ring-[var(--hairline)]'
            }
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {apps.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Inbox}
            title="No applications here"
            description="Applications sent from /careers land in this list."
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          {apps.map((a) => (
            <Panel
              key={a.id}
              title={a.name}
              description={`${a.job_title ?? 'General application'} · ${formatRelative(a.created_at)}`}
              action={
                <Pill tone={TONE[a.status]}>{STATUS.find((s) => s.value === a.status)?.label}</Pill>
              }
            >
              <div className="grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-2 text-[0.875rem]">
                  <p>
                    <a href={`mailto:${a.email}`} className="text-accent font-medium">
                      {a.email}
                    </a>
                    {a.phone ? <span className="text-ink-3"> · {a.phone}</span> : null}
                    {a.city ? <span className="text-ink-3"> · {a.city}</span> : null}
                  </p>
                  {a.experience_years !== null ? (
                    <p className="text-ink-2">{a.experience_years} years’ experience</p>
                  ) : null}
                  <p className="flex flex-wrap gap-x-4 gap-y-1">
                    {a.portfolio_url ? (
                      <a
                        href={a.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-accent font-medium"
                      >
                        Portfolio
                      </a>
                    ) : null}
                    {a.linkedin_url ? (
                      <a
                        href={a.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-accent font-medium"
                      >
                        LinkedIn
                      </a>
                    ) : null}
                    {a.cv ? (
                      <a
                        href={a.cv}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent inline-flex items-center gap-1 font-medium"
                      >
                        <FileText className="h-3.5 w-3.5" /> Open CV
                      </a>
                    ) : (
                      <span className="text-ink-3">No CV</span>
                    )}
                  </p>
                  {a.cover_note ? (
                    <p className="text-ink-2 bg-sunken mt-3 rounded-[var(--radius-md)] p-3.5 leading-relaxed whitespace-pre-wrap">
                      {a.cover_note}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-3">
                  <form action={updateApplication} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <AutoSubmitSelect
                      name="status"
                      defaultValue={a.status}
                      options={STATUS}
                      label={`Status for ${a.name}`}
                    />
                  </form>
                  <form action={updateApplication} className="space-y-2">
                    <input type="hidden" name="id" value={a.id} />
                    <label
                      htmlFor={`notes-${a.id}`}
                      className="text-ink block text-[0.8125rem] font-medium"
                    >
                      Private notes
                    </label>
                    <textarea
                      id={`notes-${a.id}`}
                      name="notes"
                      rows={3}
                      defaultValue={a.notes ?? ''}
                      className={`${ADMIN_FIELD} h-auto py-2.5`}
                    />
                    <div className="flex gap-2">
                      <SubmitButton tone="quiet">Save notes</SubmitButton>
                    </div>
                  </form>
                  <form action={deleteApplication}>
                    <input type="hidden" name="id" value={a.id} />
                    <SubmitButton
                      tone="danger"
                      confirm="Delete this application and its CV permanently?"
                    >
                      Delete permanently
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
