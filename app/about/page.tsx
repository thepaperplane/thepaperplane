import type { Metadata } from 'next';
import { CtaLink } from '@/components/fx';
import { Building2, Code2, Globe, Layers, ShieldCheck, Users } from 'lucide-react';
import { Card, Container, Eyebrow, Section, SectionHeading } from '@/components/ui';
import { PILLARS } from '@/content/services';
import { SITE, pageOg } from '@/lib/site';
import { loadContent, pick } from '@/lib/content';
import { FlightRule } from '@/components/site/flight-rule';

export const metadata: Metadata = {
  title: 'About',
  description:
    'A remote-first practice combining tax architecture, scrutiny defence, incorporation and audit with the software engineering those functions depend on.',
  alternates: { canonical: '/about' },
  openGraph: pageOg({
    title: 'About',
    description:
      'How the practice is built: one team across compliance and engineering, working remotely with clients across India.',
    path: '/about',
  }),
};

const PRINCIPLES = [
  {
    icon: Layers,
    title: 'One team, not a referral chain',
    body: 'Filing, defence, incorporation and the software sit under one roof. Nothing is lost in a handoff between vendors who never speak to each other.',
  },
  {
    icon: ShieldCheck,
    title: 'Built to be defended later',
    body: 'Every filing is produced with the working papers that justify it. A position you cannot evidence in three years is a position you should not have taken.',
  },
  {
    icon: Users,
    title: 'An informed client is a better client',
    body: 'We explain the work rather than mystifying it. Clients who understand what they are buying make faster, better decisions — and are far easier to serve well.',
  },
  {
    icon: Globe,
    title: 'Remote by design',
    body: 'No office overhead, no travel time, no geography limiting who we work with. Documents move through secure portals and the statutory systems are online anyway.',
  },
] as const;

export default async function AboutPage() {
  const copy = await loadContent('about');

  return (
    <>
      {/* Header */}
      <Section className="pt-[calc(4.5rem+var(--space-section-sm))] pb-14">
        <div className="pointer-events-none absolute inset-0 -z-10" />
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="About"
            title={pick(copy, 'about.hero.title')}
            lede={pick(copy, 'about.hero.lede')}
          />
        </Container>
      </Section>

      <Container>
        <FlightRule className="py-2" />
      </Container>

      {/* Story */}
      <Section className="pt-0 pb-16">
        <Container size="content">
          <div className="space-y-5">
            <p className="text-ink-2 text-[1.0625rem] leading-[1.75]">
              Most growing companies carry two unrelated problems at once. Their statutory
              compliance is fragmented across a filing agent, a consultant and a part-time
              accountant, none of whom hold the whole picture. And their operations run on
              spreadsheets and disconnected tools that no one designed, quietly producing the errors
              that surface during an audit two years later.
            </p>
            <p className="text-ink-2 text-[1.0625rem] leading-[1.75]">
              These look like separate problems. They are the same problem. A reconciliation that is
              never automated is a reconciliation that is never done properly. A filing produced
              from data nobody can trace is a filing nobody can defend.
            </p>
            <p className="text-ink-2 text-[1.0625rem] leading-[1.75]">
              So the practice was built to hold both. The people who understand what a scrutiny
              officer will ask for are the same people who specify the system that captures it. That
              is an unusual combination, and it is the entire point.
            </p>
          </div>
        </Container>
      </Section>

      {/* Principles */}
      <Section tone="sunken" className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="How we work" title="Four commitments" />

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="bg-surface p-7">
                <span className="bg-accent-wash ring-accent/15 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] ring-1 ring-inset">
                  <Icon className="text-accent h-5 w-5" strokeWidth={1.9} />
                </span>
                <h3 className="text-ink mt-5 text-[1.0625rem] font-semibold">{title}</h3>
                <p className="text-ink-3 mt-2.5 text-[0.9375rem] leading-relaxed">{body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* How the practice is organised */}
      <Section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Structure"
            title="Six desks, one engagement"
            lede="Whichever door you come in through, the others are already in the room."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <Card key={pillar.id} className="bg-surface p-6">
                <h3 className="text-ink text-[1rem] font-semibold">{pillar.title}</h3>
                <p className="text-ink-3 mt-2 text-[0.875rem] leading-relaxed">{pillar.tagline}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Practice facts — note: no address, by design */}
      <Section tone="sunken" className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <Eyebrow>The practice</Eyebrow>
              <h2 className="text-ink mt-4 text-[length:var(--text-display-2)] leading-[1.1] font-semibold tracking-[-0.03em]">
                Remote-first, and deliberately so
              </h2>
              <p className="text-ink-3 mt-5 text-lg leading-relaxed">
                Every statutory portal we work in is online. Every document we need moves digitally.
                Running without a public office removes overhead that clients would otherwise pay
                for, and removes geography as a constraint on who we can serve.
              </p>
              <p className="text-ink-3 mt-4 text-lg leading-relaxed">
                What replaces a reception desk is responsiveness: a named contact, a stated
                turnaround, and a scheduled call whenever a conversation beats an email thread.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <CtaLink href="/contact" size="lg">
                  Talk to us
                </CtaLink>
                <CtaLink href="/careers" tone="ghost" size="lg">
                  Work with us
                </CtaLink>
              </div>
            </div>

            <Card className="bg-surface p-7 sm:p-9">
              <dl className="divide-y divide-[var(--hairline)]">
                {[
                  { term: 'Practice model', detail: SITE.serviceModel, icon: Globe },
                  { term: 'Clients served', detail: 'Across India', icon: Building2 },
                  { term: 'Working hours', detail: SITE.hours, icon: Users },
                  {
                    term: 'Disciplines',
                    detail: 'Compliance, litigation support and software engineering',
                    icon: Code2,
                  },
                ].map(({ term, detail, icon: Icon }) => (
                  <div key={term} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <Icon className="text-accent mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                    <div>
                      <dt className="text-ink-3 text-[0.75rem] font-medium">{term}</dt>
                      <dd className="text-ink mt-0.5 text-[0.9375rem] font-medium">{detail}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-7 border-t border-[var(--hairline)] pt-6">
                <p className="text-ink-3 text-[0.8125rem] leading-relaxed">
                  Prefer to speak directly? Call{' '}
                  <a
                    href={`tel:${SITE.phoneIntl}`}
                    className="text-accent font-medium hover:underline"
                  >
                    {SITE.phone}
                  </a>{' '}
                  or email{' '}
                  <a
                    href={`mailto:${SITE.email}`}
                    className="text-accent font-medium hover:underline"
                  >
                    {SITE.email}
                  </a>
                  .
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
