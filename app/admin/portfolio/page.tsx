import { ExternalLink, MonitorSmartphone } from 'lucide-react';
import { AddProjectForm } from '@/components/admin/add-project-form';
import { ProjectRow } from '@/components/admin/project-row';
import { ADMIN_FIELD, EmptyState, Field, PageHeader, Panel } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import { saveProjectMedia } from '@/app/admin/_actions/site';
import { deleteProjectVideo, updateProjectVideo } from '@/app/admin/_actions/videos';
import { VideoUploader } from '@/components/admin/video-uploader';
import { inspectFraming } from '@/lib/embed';
import { requireProfile, canEdit } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { ProjectMediaRow, ProjectRow as Project, ProjectVideoRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
// Re-capturing takes four full-page screenshots, each of which waits for the
// client's site to settle; give the action room to finish.
export const maxDuration = 300;

export const metadata = { title: 'Portfolio' };

function FramingNote({
  status,
  url,
}: {
  status?: Awaited<ReturnType<typeof inspectFraming>>;
  url: string;
}) {
  if (!status) return null;
  return (
    <div className="border-t border-dashed border-[var(--hairline)] px-6 py-3 text-[0.8125rem]">
      {status.allowed ? (
        <p className="text-positive font-medium">
          Live view works: visitors can browse this site inside the frame on the Work page.
        </p>
      ) : (
        <details>
          <summary className="text-ink-2 cursor-pointer font-medium">
            <span className="text-caution">Live view is blocked</span> — {status.reason} Visitors
            see the preview image instead. How to enable it
          </summary>
          <div className="text-ink-3 mt-3 grid gap-2 leading-relaxed">
            <p>
              The site decides whether it may be shown inside another page. For a site you host (for
              example on Vercel), add this header and remove any{' '}
              <code className="ref">X-Frame-Options</code>:
            </p>
            <pre className="bg-sunken text-ink overflow-x-auto rounded-lg p-3 text-[0.75rem]">{`Content-Security-Policy: frame-ancestors 'self' https://www.thepaperplane.co.in https://thepaperplane.co.in`}</pre>
            <p>
              Hosted storefronts such as Shopify do not allow this to be changed; for those, upload
              a launch film or walkthrough above and keep the preview image. Address checked: {url}
            </p>
          </div>
        </details>
      )}
    </div>
  );
}

export default async function AdminPortfolioPage() {
  const profile = await requireProfile();
  const editable = canEdit(profile.role);

  const supabase = serviceClient();
  let projects: Project[] = [];

  const media = new Map<string, ProjectMediaRow>();
  const videos = new Map<string, ProjectVideoRow[]>();
  const framing = new Map<string, Awaited<ReturnType<typeof inspectFraming>>>();
  if (supabase) {
    const [{ data }, { data: m }, { data: v }] = await Promise.all([
      supabase.from('projects').select('*').order('position', { ascending: true }),
      supabase.from('project_media').select('*'),
      supabase.from('project_videos').select('*').order('position', { ascending: true }),
    ]);
    projects = data ?? [];
    (m ?? []).forEach((row) => media.set(row.project_id, row));
    (v ?? []).forEach((row) =>
      videos.set(row.project_id, [...(videos.get(row.project_id) ?? []), row]),
    );
    const checks = await Promise.all(projects.map((p) => inspectFraming(p.url)));
    projects.forEach((p, i) => framing.set(p.id, checks[i]!));
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
                  {editable ? (
                    <details className="border-t border-dashed border-[var(--hairline)] px-6 py-3">
                      <summary className="text-accent cursor-pointer text-[0.8125rem] font-semibold">
                        Videos beside the preview
                        {(videos.get(project.id) ?? []).length
                          ? ` · ${(videos.get(project.id) ?? []).length} uploaded`
                          : ' · none — nothing is shown on the site'}
                      </summary>
                      <div className="mt-4 grid gap-5">
                        <p className="text-ink-3 text-[0.8125rem] leading-relaxed">
                          Launch films and client testimonials play beside the website preview,
                          muted at first with a sound button. Projects without a video simply show
                          no player. Only upload a testimonial the client has agreed to publish.
                        </p>
                        {(videos.get(project.id) ?? []).map((vid) => (
                          <div key={vid.id} className="bg-sunken rounded-[var(--radius-md)] p-4">
                            <form
                              action={updateProjectVideo}
                              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_4.5rem_auto] sm:items-end"
                            >
                              <input type="hidden" name="id" value={vid.id} />
                              <Field label="Title" htmlFor={`vtt-${vid.id}`}>
                                <input
                                  id={`vtt-${vid.id}`}
                                  name="title"
                                  defaultValue={vid.title ?? ''}
                                  className={ADMIN_FIELD}
                                />
                              </Field>
                              <Field label="Type" htmlFor={`vtk-${vid.id}`}>
                                <select
                                  id={`vtk-${vid.id}`}
                                  name="kind"
                                  defaultValue={vid.kind}
                                  className={ADMIN_FIELD}
                                >
                                  <option value="launch">Launch film</option>
                                  <option value="testimonial">Testimonial</option>
                                  <option value="walkthrough">Walkthrough</option>
                                </select>
                              </Field>
                              <Field label="Shape" htmlFor={`vtr-${vid.id}`}>
                                <select
                                  id={`vtr-${vid.id}`}
                                  name="orientation"
                                  defaultValue={vid.orientation}
                                  className={ADMIN_FIELD}
                                >
                                  <option value="landscape">Landscape</option>
                                  <option value="portrait">Portrait</option>
                                </select>
                              </Field>
                              <Field label="Order" htmlFor={`vto-${vid.id}`}>
                                <input
                                  id={`vto-${vid.id}`}
                                  name="position"
                                  type="number"
                                  min={0}
                                  max={99}
                                  defaultValue={vid.position}
                                  className={ADMIN_FIELD}
                                />
                              </Field>
                              <div className="flex items-center gap-3">
                                <label className="text-ink-2 flex items-center gap-2 text-[0.8125rem]">
                                  <input
                                    type="checkbox"
                                    name="is_published"
                                    defaultChecked={vid.is_published}
                                    className="h-4 w-4 accent-[var(--accent)]"
                                  />
                                  Show
                                </label>
                                <SubmitButton tone="quiet" pendingText="…">
                                  Save
                                </SubmitButton>
                              </div>
                            </form>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <video
                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/work-videos/${vid.path}#t=0.1`}
                                controls
                                preload="metadata"
                                className="max-h-40 rounded-lg bg-black"
                              />
                              <form action={deleteProjectVideo}>
                                <input type="hidden" name="id" value={vid.id} />
                                <SubmitButton
                                  tone="danger"
                                  confirm="Delete this video permanently?"
                                  pendingText="Deleting…"
                                >
                                  Delete
                                </SubmitButton>
                              </form>
                            </div>
                          </div>
                        ))}
                        <VideoUploader projectId={project.id} />
                      </div>
                    </details>
                  ) : null}
                  <FramingNote status={framing.get(project.id)} url={project.url} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <p className="text-ink-quaternary mt-5 flex items-start gap-2 text-[0.8125rem] leading-relaxed">
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <span>
          Where a client&rsquo;s site allows being shown inside another page, the Work page opens it
          live, fully browsable, at true desktop width. Where it does not, the page shows a captured
          preview instead — each project above says which applies and how to change it.
        </span>
      </p>
    </>
  );
}
