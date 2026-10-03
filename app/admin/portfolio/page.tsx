import { ExternalLink, MonitorSmartphone } from 'lucide-react';
import { AddProjectForm } from '@/components/admin/add-project-form';
import { ProjectRow } from '@/components/admin/project-row';
import { ADMIN_FIELD, EmptyState, Field, PageHeader, Panel } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import { saveProjectMedia } from '@/app/admin/_actions/site';
import { requireProfile, canEdit } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { ProjectMediaRow, ProjectRow as Project } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
// Re-capturing takes four full-page screenshots, each of which waits for the
// client's site to settle; give the action room to finish.
export const maxDuration = 300;

export const metadata = { title: 'Portfolio' };

export default async function AdminPortfolioPage() {
  const profile = await requireProfile();
  const editable = canEdit(profile.role);

  const supabase = serviceClient();
  let projects: Project[] = [];

  const media = new Map<string, ProjectMediaRow>();
  if (supabase) {
    const [{ data }, { data: m }] = await Promise.all([
      supabase.from('projects').select('*').order('position', { ascending: true }),
      supabase.from('project_media').select('*'),
    ]);
    projects = data ?? [];
    (m ?? []).forEach((row) => media.set(row.project_id, row));
  }

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Paste a client's website address and the system checks it is reachable, captures desktop and mobile previews, and publishes the side-by-side mockup to the public work page — no deploy required."
      />

      {editable ? (
        <Panel
          title="Add a site"
          description="One URL is enough. Everything else is optional."
          className="mb-6"
        >
          <AddProjectForm />
        </Panel>
      ) : null}

      <Panel
        title={`Projects (${projects.length})`}
        description="Drag-free ordering by position. Live projects appear on /work; staged ones stay hidden until captured."
      >
        {projects.length === 0 ? (
          <EmptyState
            icon={MonitorSmartphone}
            title="No projects yet"
            description={
              supabase
                ? 'Add a client site above to generate its preview.'
                : 'Set SUPABASE_SERVICE_ROLE_KEY to load projects.'
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--color-hairline)]">
            {projects.map((project) => {
              const m = media.get(project.id);
              return (
                <li key={project.id} className="list-none">
                  <ul>
                    <ProjectRow project={project} editable={editable} />
                  </ul>
                  {editable ? (
                    <details className="border-t border-dashed border-[var(--hairline)] px-6 py-3">
                      <summary className="text-accent cursor-pointer text-[0.8125rem] font-semibold">
                        Scrollable preview, homepage feature and result line
                        {m?.desktop_full_path
                          ? ' · full page ready'
                          : ' · no full-page capture yet'}
                      </summary>
                      <form action={saveProjectMedia} className="mt-4 grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="project_id" value={project.id} />
                        <Field
                          label="Full-page desktop screenshot"
                          htmlFor={`fd-${project.id}`}
                          hint="A tall image of the whole page. Re-capture creates one automatically; upload here to replace it."
                        >
                          <input
                            id={`fd-${project.id}`}
                            name="desktop_full"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="text-ink-2 text-[0.8125rem]"
                          />
                        </Field>
                        <Field label="Full-page phone screenshot" htmlFor={`fm-${project.id}`}>
                          <input
                            id={`fm-${project.id}`}
                            name="mobile_full"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="text-ink-2 text-[0.8125rem]"
                          />
                        </Field>
                        <div className="md:col-span-2">
                          <Field
                            label="Result, in one line"
                            htmlFor={`fo-${project.id}`}
                            hint="Shown under the preview instead of the summary — e.g. what changed for the client."
                          >
                            <input
                              id={`fo-${project.id}`}
                              name="outcome"
                              defaultValue={m?.outcome ?? ''}
                              maxLength={400}
                              className={ADMIN_FIELD}
                            />
                          </Field>
                        </div>
                        <label className="text-ink flex items-center gap-2.5 text-[0.875rem] font-medium">
                          <input
                            type="checkbox"
                            name="is_featured"
                            defaultChecked={m?.is_featured ?? project.status === 'live'}
                            className="h-4 w-4 accent-[var(--accent)]"
                          />
                          Feature on the homepage
                        </label>
                        <div>
                          <SubmitButton pendingText="Uploading…">Save</SubmitButton>
                        </div>
                      </form>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <p className="text-ink-quaternary mt-5 flex items-start gap-2 text-[0.8125rem] leading-relaxed">
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <span>
          Previews are captured images rather than live iframes. Most client sites send
          frame-blocking headers, so an embedded live view would render an empty box — captures look
          identical, load far faster, and keep working regardless of the client&rsquo;s header
          policy.
        </span>
      </p>
    </>
  );
}
