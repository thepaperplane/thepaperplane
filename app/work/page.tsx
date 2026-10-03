import type { Metadata } from 'next';
import { Badge, Container, Eyebrow, Section, SectionHeading } from '@/components/ui';
import { CtaLink } from '@/components/fx';
import { BrowserFrame } from '@/components/work/browser-frame';
import { pageOg } from '@/lib/site';
import { loadPortfolio } from '@/lib/portfolio';
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

export default async function WorkPage() {
  const [projects, copy] = await Promise.all([loadPortfolio(), loadContent('work')]);
  const live = projects.filter((p) => p.status === 'live');
  const staged = projects.filter((p) => p.status === 'staged');

  return (
    <>
      {/* Header */}
      <Section className="pt-[calc(4.5rem+var(--space-section-sm))] pb-12">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Selected work"
            title={pick(copy, 'work.hero.title')}
            lede={pick(copy, 'work.hero.lede')}
          />
          <p className="reveal text-ink-3 mt-8 inline-flex items-center gap-2.5 text-[length:var(--text-small)]">
            <span className="bframe-hint-mouse text-accent" aria-hidden="true" />
            Every window below is the real page. Scroll inside it to explore the site.
          </p>
        </Container>
      </Section>

      <Container>
        <FlightRule className="py-2" />
      </Container>

      {/* Live projects — one per row, the browser large, alternating sides */}
      <Section className="pt-6 pb-8">
        <Container>
          <div className="space-y-24 lg:space-y-32">
            {live.map((project, i) => (
              <article
                key={project.slug}
                className="grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14"
              >
                <div className={i % 2 === 1 ? 'reveal lg:order-2' : 'reveal'}>
                  <BrowserFrame
                    name={project.name}
                    displayUrl={project.displayUrl}
                    url={project.url}
                    desktop={{ src: project.shots.desktop, full: project.full.desktop }}
                    mobile={{ src: project.shots.mobile, full: project.full.mobile }}
                    priority={i === 0}
                    live={project.frameable}
                  />
                </div>

                <div
                  className={i % 2 === 1 ? 'reveal lg:order-1' : 'reveal'}
                  data-reveal-delay="120"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Eyebrow>{project.sector}</Eyebrow>
                    <span className="text-ink-3 text-[0.8125rem]">· {project.year}</span>
                  </div>

                  <h2 className="text-ink mt-3 text-[length:var(--text-title-1)] leading-[1.05]">
                    {project.name}
                  </h2>

                  <p className="text-ink-2 mt-5 text-[length:var(--text-body-lg)] leading-relaxed">
                    {project.outcome ?? project.summary}
                  </p>

                  <p className="text-ink-3 mt-4 text-[0.9375rem] leading-relaxed">
                    {project.brief}
                  </p>

                  {project.highlights.length > 0 ? (
                    <dl className="mt-7 grid grid-cols-3 gap-3">
                      {project.highlights.map((highlight) => (
                        <div
                          key={highlight.label}
                          className="bento rounded-[var(--radius-lg)] p-3.5"
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

                  <ul className="mt-6 flex flex-wrap gap-2">
                    {project.stack.map((tech) => (
                      <li key={tech}>
                        <Badge tone="neutral">{tech}</Badge>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <CtaLink href={project.url} external tone="ghost" size="sm">
                      Visit {project.displayUrl}
                    </CtaLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* In progress */}
      {staged.length > 0 ? (
        <Section tone="sunken" className="mt-16 border-y py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="In progress"
              title="Launching soon"
              lede="Built and ready. These go live on the portfolio the moment each site is publicly reachable."
            />

            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {staged.map((project) => (
                <article key={project.slug} className="reveal">
                  <BrowserFrame
                    name={project.name}
                    displayUrl={project.displayUrl}
                    url={project.url}
                    desktop={{ src: project.shots.desktop, full: project.full.desktop }}
                    mobile={{ src: project.shots.mobile, full: project.full.mobile }}
                    height="clamp(14rem, 30vw, 22rem)"
                  />
                  <div className="mt-5 flex items-start justify-between gap-3">
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
                  {project.statusNote ? (
                    <p className="text-ink-3 mt-3 text-[0.8125rem] leading-relaxed">
                      {project.statusNote}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* CTA */}
      <Section className="py-20">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0f2747] bg-[linear-gradient(135deg,#1c3252,#0f2747_55%,#14527a)] px-7 py-14 text-center text-white sm:px-14 sm:py-16">
            <span className="text-[length:var(--text-micro)] font-semibold tracking-[0.14em] text-[rgb(255_255_255/0.78)] uppercase">
              Build with us
            </span>
            <h2 className="mx-auto mt-4 max-w-2xl text-[length:var(--text-title-1)] leading-tight text-white">
              A site that understands your compliance, because we do
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-[rgb(255_255_255/0.86)]">
              Invoicing that produces GST-valid documents, portals that capture what an audit will
              ask for later, specified by the people who file the returns.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CtaLink href="/contact" size="lg" tone="light">
                Start a project
              </CtaLink>
              <CtaLink href="/services#digital" tone="glass" size="lg">
                What we build
              </CtaLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
