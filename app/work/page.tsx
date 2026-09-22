import type { Metadata } from 'next';
import { ArrowRight, ExternalLink } from 'lucide-react';
import {
  Badge,
  ButtonLink,
  Card,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
} from '@/components/ui';
import { DeviceMockup } from '@/components/work/device-mockup';
import { PROJECTS as STATIC_PROJECTS, type Project } from '@/content/portfolio';
import { pageOg } from '@/lib/site';
import { serviceClient, isSupabaseConfigured } from '@/lib/supabase';
import { loadContent, pick } from '@/lib/content';
import { FlightRule } from '@/components/site/flight-rule';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Selected web development work — client sites and platforms built by The Paper Plane, shown on desktop and mobile.',
  alternates: { canonical: '/work' },
  openGraph: pageOg({
    title: 'Work',
    description: 'Client websites and platforms built in-house, shown on desktop and mobile.',
    path: '/work',
  }),
};

export const revalidate = 3600;

const PUBLIC_STORAGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/previews/`;

/**
 * Projects come from the database when it is provisioned, so the admin
 * console is the source of truth. The static file is the fallback that keeps
 * the page working before any data exists.
 */
async function loadProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) return STATIC_PROJECTS;

  const supabase = serviceClient();
  if (!supabase) return STATIC_PROJECTS;

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['live', 'staged'])
    .order('position', { ascending: true });

  if (error || !data?.length) {
    if (error) console.error('[work] query failed', error);
    return STATIC_PROJECTS;
  }

  return data.map((row) => ({
    slug: row.slug,
    name: row.name,
    url: row.url,
    displayUrl: row.display_url,
    sector: row.sector ?? '',
    year: row.year ?? new Date().getFullYear(),
    summary: row.summary ?? '',
    brief: row.brief ?? '',
    stack: row.stack,
    highlights: Array.isArray(row.highlights)
      ? (row.highlights as { label: string; value: string }[])
      : [],
    status: row.status === 'live' ? 'live' : 'staged',
    statusNote: row.status_note ?? undefined,
    shots: {
      desktop: row.desktop_shot_path ? `${PUBLIC_STORAGE}${row.desktop_shot_path}` : null,
      mobile: row.mobile_shot_path ? `${PUBLIC_STORAGE}${row.mobile_shot_path}` : null,
      capturedAt: row.captured_at,
    },
  }));
}

export default async function WorkPage() {
  const [projects, copy] = await Promise.all([loadProjects(), loadContent('work')]);
  const live = projects.filter((p) => p.status === 'live');
  const staged = projects.filter((p) => p.status === 'staged');

  return (
    <>
      {/* Header */}
      <Section className="pt-[calc(4.5rem+var(--space-section-sm))] pb-14">
        <div className="pointer-events-none absolute inset-0 -z-10" />
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Selected work"
            title={pick(copy, 'work.hero.title')}
            lede={pick(copy, 'work.hero.lede')}
          />
        </Container>
      </Section>

      <Container>
        <FlightRule className="py-2" />
      </Container>

      {/* Live projects */}
      <Section className="pt-0 pb-8">
        <Container>
          <div className="space-y-6">
            {live.map((project) => (
              <Card key={project.slug} className="bg-surface overflow-hidden">
                <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
                  {/* Copy */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Eyebrow>{project.sector}</Eyebrow>
                      <span className="text-ink-3 text-[0.8125rem]">· {project.year}</span>
                    </div>

                    <h2 className="text-ink mt-3 text-[length:var(--text-title-2)] leading-tight font-semibold tracking-[-0.025em]">
                      {project.name}
                    </h2>

                    <p className="text-ink-3 mt-4 text-[1.0625rem] leading-relaxed">
                      {project.summary}
                    </p>

                    <p className="text-ink-2 mt-4 text-[0.9375rem] leading-relaxed">
                      {project.brief}
                    </p>

                    {project.highlights.length > 0 ? (
                      <dl className="mt-6 grid grid-cols-3 gap-3">
                        {project.highlights.map((highlight) => (
                          <div
                            key={highlight.label}
                            className="bg-sunken rounded-[var(--radius-md)] p-3.5"
                          >
                            <dt className="text-ink-3 text-[0.6875rem] font-medium">
                              {highlight.label}
                            </dt>
                            <dd className="text-ink mt-1 text-[0.875rem] font-semibold">
                              {highlight.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}

                    <ul className="mt-5 flex flex-wrap gap-2">
                      {project.stack.map((tech) => (
                        <li key={tech}>
                          <Badge tone="neutral">{tech}</Badge>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-ink mt-7 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold transition-colors"
                    >
                      Visit {project.displayUrl}
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </a>
                  </div>

                  {/* Preview */}
                  <div className="bg-sunken rounded-[var(--radius-lg)] p-6 sm:p-8">
                    <DeviceMockup
                      name={project.name}
                      displayUrl={project.displayUrl}
                      desktopSrc={project.shots.desktop}
                      mobileSrc={project.shots.mobile}
                      state={project.shots.desktop ? 'ready' : 'pending'}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* In progress */}
      {staged.length > 0 ? (
        <Section tone="sunken" className="py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="In progress"
              title="Launching soon"
              lede="Built and ready. These go live on the portfolio the moment each site is publicly reachable."
            />

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {staged.map((project) => (
                <Card key={project.slug} className="bg-surface flex flex-col p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Eyebrow>{project.sector}</Eyebrow>
                      <h3 className="text-ink mt-2 text-[1.1875rem] font-semibold tracking-[-0.015em]">
                        {project.name}
                      </h3>
                    </div>
                    <Badge tone="caution" className="shrink-0">
                      Launching soon
                    </Badge>
                  </div>

                  <p className="text-ink-3 mt-3 text-[0.9375rem] leading-relaxed">
                    {project.summary}
                  </p>

                  <div className="mt-6">
                    <DeviceMockup
                      name={project.name}
                      displayUrl={project.displayUrl}
                      desktopSrc={project.shots.desktop}
                      mobileSrc={project.shots.mobile}
                      // A staged project can still be genuinely unreachable
                      // (nothing to show) or reachable only at a placeholder
                      // -- e.g. a Shopify "opening soon" splash rather than
                      // the finished storefront. When a capture exists it is
                      // shown either way; the caption below says what it is.
                      state={project.shots.desktop ? 'ready' : 'unreachable'}
                      note={project.statusNote}
                    />
                  </div>
                  {project.shots.desktop && project.statusNote ? (
                    <p className="text-ink-3 mt-3 text-[0.8125rem] leading-relaxed">
                      {project.statusNote}
                    </p>
                  ) : null}

                  <ul className="mt-6 flex flex-wrap gap-2">
                    {project.stack.map((tech) => (
                      <li key={tech}>
                        <Badge tone="neutral">{tech}</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* CTA */}
      <Section className="py-20">
        <Container>
          <Card className="bg-surface p-9 text-center sm:p-12">
            <Eyebrow>Build with us</Eyebrow>
            <h2 className="text-ink mx-auto mt-4 max-w-2xl text-[length:var(--text-title-1)] leading-tight font-semibold tracking-[-0.028em]">
              A site that understands your compliance, because we do
            </h2>
            <p className="text-ink-3 mx-auto mt-4 max-w-xl text-[1.0625rem] leading-relaxed">
              Invoicing that produces GST-valid documents, portals that capture what an audit will
              ask for later — specified by the people who file the returns.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/contact" size="lg">
                Start a project
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </ButtonLink>
              <ButtonLink href="/services#digital" tone="outline" size="lg">
                What we build
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
