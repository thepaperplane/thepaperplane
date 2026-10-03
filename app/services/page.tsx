import type { Metadata } from 'next';
import { Container, Heading, Label, Numeral, Ref, Section, TextLink } from '@/components/ui';
import { PRACTICE_SCENES } from '@/components/practice/scenes';
import { ServiceDiagram } from '@/components/services/service-diagram';
import { ServiceIndex } from '@/components/services/service-index';
import { PRACTICE, pillarsFor } from '@/content/practice';
import { SERVICE_FLOWS } from '@/content/service-flows';
import { pageOg } from '@/lib/site';
import { breadcrumbJsonLd, jsonLdScript, serviceCatalogJsonLd } from '@/lib/schema';
import { FlightRule } from '@/components/site/flight-rule';
import { CtaLink } from '@/components/fx';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Tax and GST compliance, scrutiny defence and appeals, incorporation and audit-ready books — with the web, product, identity and automation work built alongside.',
  alternates: { canonical: '/services' },
  openGraph: pageOg({
    title: 'Services',
    description:
      'Two halves of one practice: financial and legal advisory, and digital and technology engineering.',
    path: '/services',
  }),
};

/**
 * Services, set as an index rather than a grid of cards.
 *
 * The page is organised by the two halves of the practice, and both are
 * rendered by the same loop from the same data — so neither can end up
 * looking like the junior partner. Within each half, pillars are numbered
 * sections and individual services are rows separated by rules.
 */
export default function ServicesPage() {
  const schema = jsonLdScript(
    serviceCatalogJsonLd(),
    breadcrumbJsonLd([{ name: 'Services', path: '/services' }]),
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />
      <Section rhythm="sm" className="pt-[calc(4.5rem+var(--space-section-sm))]">
        <Container>
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-10">
              <Heading
                as="h1"
                size="large"
                eyebrow="Services"
                title={
                  <>
                    Everything the practice does,{' '}
                    <span className="em-serif">and nothing it does not.</span>
                  </>
                }
                lede="Six disciplines normally bought from five vendors. Buying them from one practice is the entire proposition — the handoffs between vendors are where compliance usually fails."
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* The list first. The argument for it can wait until after. */}
      <ServiceIndex />

      <Container>
        <FlightRule className="py-6" />
      </Container>

      {PRACTICE.map((side, sideIndex) => {
        const Scene = PRACTICE_SCENES[side.id];
        return (
          <Section
            key={side.id}
            id={side.id}
            rhythm="lg"
            tone={sideIndex % 2 === 1 ? 'sunken' : 'ground'}
            className="scroll-mt-24 border-t"
          >
            <Container>
              {/* Half header — asymmetric, numeral in the margin */}
              <div className="grid gap-10 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12 lg:gap-20">
                <div className="md:sticky md:top-28 md:self-start">
                  <Numeral
                    value={sideIndex + 1}
                    className="block text-[length:var(--text-display-2)] leading-none"
                  />
                  <Label className="mt-6 block">{side.name}</Label>
                  <h2 className="mt-3 text-[length:var(--text-title-1)]">{side.heading}</h2>
                  <p className="text-ink-2 mt-6 max-w-[38ch] text-[length:var(--text-small)] leading-[1.75]">
                    {side.body}
                  </p>
                  {/* The half's own argument, drawn. Identical treatment on
                    both sides so neither reads as the junior partner. */}
                  <div className="reveal mt-10">
                    <Scene />
                  </div>

                  <div className="mt-8">
                    <TextLink href="/contact">Discuss this work</TextLink>
                  </div>
                </div>

                {/* Pillars and their services, as a numbered index */}
                <div>
                  {pillarsFor(side).map((pillar, pillarIndex) => (
                    <div key={pillar.id} id={pillar.id} className="scroll-mt-24 pb-16 last:pb-0">
                      <div className="reveal flex items-baseline gap-4 border-t pt-6">
                        <Numeral
                          value={`${sideIndex + 1}.${pillarIndex + 1}`}
                          className="shrink-0 text-[length:var(--text-caption)]"
                        />
                        <div>
                          <h3 className="text-[length:var(--text-title-2)]">{pillar.title}</h3>
                          <p className="text-ink-3 mt-2 text-[length:var(--text-caption)]">
                            {pillar.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        {pillar.services.map((service) => {
                          const flow = SERVICE_FLOWS[service.id];
                          return (
                            <article
                              key={service.id}
                              id={service.id}
                              className="reveal svc-card scroll-mt-24"
                            >
                              <ServiceDiagram id={service.id} />
                              <div className="px-1 pt-5 pb-1 sm:px-2">
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="text-ink font-[family-name:var(--font-sans)] text-[length:var(--text-body-lg)] leading-snug font-semibold tracking-[-0.01em]">
                                    {service.title}
                                  </h4>
                                  {service.badge ? (
                                    <span className="svc-badge shrink-0">{service.badge}</span>
                                  ) : null}
                                </div>
                                <p className="text-ink-3 mt-1 text-[length:var(--text-caption)]">
                                  {service.subtitle}
                                </p>
                                <p className="text-ink-2 mt-3 text-[length:var(--text-small)] leading-relaxed">
                                  {service.description}
                                </p>
                                {flow ? (
                                  <ol className="svc-flow mt-5" aria-label="How it works">
                                    <li>
                                      <span className="svc-flow-k">You share</span>
                                      <span>{flow.give}</span>
                                    </li>
                                    <li>
                                      <span className="svc-flow-k">We handle</span>
                                      <span>{flow.work}</span>
                                    </li>
                                    <li className="svc-flow-get">
                                      <span className="svc-flow-k">You receive</span>
                                      <span>{flow.get}</span>
                                    </li>
                                  </ol>
                                ) : null}
                                <details className="svc-more mt-4">
                                  <summary>What is included</summary>
                                  <ul className="mt-2 space-y-1.5 pb-1">
                                    {service.features.map((feature) => (
                                      <li
                                        key={feature}
                                        className="text-ink-2 flex gap-3 text-[length:var(--text-caption)]"
                                      >
                                        <span
                                          aria-hidden="true"
                                          className="bg-accent mt-[0.55em] h-px w-3 shrink-0"
                                        />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </details>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Container>
          </Section>
        );
      })}

      {/* Close */}
      <Section rhythm="lg" className="border-t">
        <Container>
          <div className="grid grid-cols-12">
            <div className="reveal col-span-12 lg:col-span-8">
              <h2 className="text-[length:var(--text-display-2)] leading-[1]">
                Most engagements start with one problem{' '}
                <span className="em-serif">and uncover three more.</span>
              </h2>
              <p className="text-ink-2 mt-8 max-w-[46ch] text-[length:var(--text-lede)] leading-[1.5]">
                Send the notice, the deadline or the brief. You will get a straight account of what
                it actually involves before you commit to anything.
              </p>
              <div className="mt-12 flex flex-wrap items-center gap-3">
                <CtaLink href="/contact" size="lg">
                  Start a conversation
                </CtaLink>
                <CtaLink href="/knowledge" tone="ghost" size="lg">
                  Understand the work first
                </CtaLink>
              </div>
              <p className="text-ink-3 mt-10 text-[length:var(--text-caption)]">
                Statutory references throughout this site are set in <Ref>IBM Plex Mono</Ref> —{' '}
                <Ref>s.148</Ref>, <Ref>GSTR-3B</Ref>, <Ref>GSTR-2B</Ref> — so they read as
                citations, not marketing.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
