import Link from 'next/link';
import { Briefcase, Users } from 'lucide-react';
import { ADMIN_FIELD, EmptyState, Field, PageHeader, Panel, Pill } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import { deleteJob, saveJob } from '@/app/admin/_actions/site';
import { requireProfile } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { JobRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Careers' };

function JobForm({ job }: { job?: JobRow }) {
  const id = job?.id ?? 'new';
  return (
    <form action={saveJob} className="grid gap-4 px-6 py-5 md:grid-cols-2">
      {job ? <input type="hidden" name="id" value={job.id} /> : null}
      <Field label="Role title" htmlFor={`jt-${id}`} required>
        <input
          id={`jt-${id}`}
          name="title"
          required
          defaultValue={job?.title}
          className={ADMIN_FIELD}
          placeholder="Front-end developer"
        />
      </Field>
      <Field label="Team" htmlFor={`jm-${id}`}>
        <input
          id={`jm-${id}`}
          name="team"
          defaultValue={job?.team ?? ''}
          className={ADMIN_FIELD}
          placeholder="Engineering"
        />
      </Field>
      <Field label="Location" htmlFor={`jl-${id}`}>
        <input
          id={`jl-${id}`}
          name="location"
          defaultValue={job?.location ?? 'Remote, India'}
          className={ADMIN_FIELD}
        />
      </Field>
      <Field label="Type" htmlFor={`jy-${id}`}>
        <select
          id={`jy-${id}`}
          name="employment_type"
          defaultValue={job?.employment_type ?? 'Full-time'}
          className={ADMIN_FIELD}
        >
          {['Full-time', 'Part-time', 'Contract', 'Internship'].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Experience" htmlFor={`je-${id}`}>
        <input
          id={`je-${id}`}
          name="experience"
          defaultValue={job?.experience ?? ''}
          className={ADMIN_FIELD}
          placeholder="2–4 years"
        />
      </Field>
      <Field label="Applications close" htmlFor={`jc-${id}`}>
        <input
          id={`jc-${id}`}
          name="closes_on"
          type="date"
          defaultValue={job?.closes_on ?? ''}
          className={ADMIN_FIELD}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="One-line summary" htmlFor={`js-${id}`}>
          <input
            id={`js-${id}`}
            name="summary"
            defaultValue={job?.summary ?? ''}
            className={ADMIN_FIELD}
          />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="About the role" htmlFor={`jd-${id}`}>
          <textarea
            id={`jd-${id}`}
            name="description"
            rows={4}
            defaultValue={job?.description ?? ''}
            className={`${ADMIN_FIELD} h-auto py-3`}
          />
        </Field>
      </div>
      <Field label="What they will do" htmlFor={`jr-${id}`} hint="One per line.">
        <textarea
          id={`jr-${id}`}
          name="responsibilities"
          rows={5}
          defaultValue={job?.responsibilities.join('\n')}
          className={`${ADMIN_FIELD} h-auto py-3`}
        />
      </Field>
      <Field label="What they bring" htmlFor={`jq-${id}`} hint="One per line.">
        <textarea
          id={`jq-${id}`}
          name="requirements"
          rows={5}
          defaultValue={job?.requirements.join('\n')}
          className={`${ADMIN_FIELD} h-auto py-3`}
        />
      </Field>
      <Field label="Order" htmlFor={`jp-${id}`}>
        <input
          id={`jp-${id}`}
          name="position"
          type="number"
          min="0"
          defaultValue={job?.position ?? 0}
          className={ADMIN_FIELD}
        />
      </Field>
      <label className="text-ink flex items-center gap-2.5 self-end pb-3 text-[0.875rem] font-medium">
        <input
          type="checkbox"
          name="is_open"
          defaultChecked={job?.is_open ?? true}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Accepting applications (shows on /careers)
      </label>
      <div className="md:col-span-2">
        <SubmitButton>{job ? 'Save role' : 'Publish role'}</SubmitButton>
      </div>
    </form>
  );
}

export default async function CareersAdminPage() {
  await requireProfile();
  const supabase = serviceClient();
  let jobs: JobRow[] = [];
  const counts = new Map<string, number>();
  let newApps = 0;
  if (supabase) {
    const [{ data }, { data: apps }] = await Promise.all([
      supabase.from('jobs').select('*').order('position').order('created_at', { ascending: false }),
      supabase.from('job_applications').select('job_id, status'),
    ]);
    jobs = data ?? [];
    for (const a of apps ?? []) {
      if (a.job_id) counts.set(a.job_id, (counts.get(a.job_id) ?? 0) + 1);
      if (a.status === 'new') newApps++;
    }
  }

  return (
    <>
      <PageHeader
        title="Careers"
        description="Open roles appear on /careers and in Google’s job listings. Applications and CVs stay private to this console."
        action={
          <Link
            href="/admin/careers/applications"
            className="bg-ink text-ground inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.875rem] font-semibold"
          >
            <Users className="h-4 w-4" /> Applications{newApps ? ` · ${newApps} new` : ''}
          </Link>
        }
      />
      <Panel title="Post a role" className="mb-6">
        <JobForm />
      </Panel>
      {jobs.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Briefcase}
            title="No roles posted"
            description="The careers page invites general applications until you post one."
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Panel
              key={job.id}
              title={job.title}
              description={`${job.location} · ${job.employment_type} · ${counts.get(job.id) ?? 0} applications`}
              action={
                <Pill tone={job.is_open ? 'positive' : 'neutral'}>
                  {job.is_open ? 'Open' : 'Closed'}
                </Pill>
              }
            >
              <details>
                <summary className="text-accent cursor-pointer px-6 py-3 text-[0.875rem] font-semibold">
                  Edit role
                </summary>
                <JobForm job={job} />
                <form action={deleteJob} className="px-6 pb-5">
                  <input type="hidden" name="id" value={job.id} />
                  <SubmitButton
                    tone="danger"
                    confirm="Delete this role? Its applications are kept."
                  >
                    Delete role
                  </SubmitButton>
                </form>
              </details>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
