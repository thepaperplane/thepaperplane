import Link from 'next/link';
import {
  Calendar,
  FileCheck2,
  Handshake,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Container, Label, Section } from '@/components/ui';
import { ArrowIcon, CtaLink, Marquee, PlaneGlyph, ScrubWords, Tilt } from '@/components/fx';
import { Editable, copyText } from '@/components/editable';
import { PRACTICE_SCENES } from '@/components/practice/scenes';
import {
  AftercareScene,
  GroundworkScene,
  ReadScene,
  ReviewScene,
  ScopeScene,
} from '@/components/home/process-scenes';
import { BrowserFrame } from '@/components/work/browser-frame';
import { PRACTICE } from '@/content/practice';
import { COMPLIANCE_EVENTS } from '@/content/calendar';
import type { PortfolioProject } from '@/lib/portfolio';
import type { SiteSettings } from '@/lib/settings';
import { whatsappHref } from '@/lib/settings';
import type { TestimonialRow } from '@/lib/database.types';
import { ordinal } from '@/lib/utils';

/* --------------------------------------------------------------------------
   Shared heading: eyebrow, title, optional lede. Every string editable.
   -------------------------------------------------------------------------- */

async function SectionHead({
  id,
  eyebrow,
  title,
  lede,
  align = 'left',
  layout = 'split',
  action,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lede?: string;
  align?: 'left' | 'center';
  /** `split` puts the lede beside the title on wide screens; `stack` keeps it below. */
  layout?: 'split' | 'stack';
  action?: React.ReactNode;
}) {
  const centred = align === 'center';
  const split = layout === 'split' && !centred;
  return (
    <div
      className={
        centred
          ? 'mx-auto max-w-3xl text-center'
          : split
            ? 'grid items-end gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]'
            : 'max-w-3xl'
      }
    >
      <div>
        <div
          className={
            centred ? 'mb-5 flex items-center justify-center gap-3' : 'mb-5 flex items-center gap-3'
          }
        >
          <span className="bg-accent h-px w-6 shrink-0" />
          <Editable k={`home.${id}.eyebrow`} className="label">
            {eyebrow}
          </Editable>
        </div>
        <h2
          className="reveal text-[length:var(--text-display-2)] leading-[1.02]"
          data-reveal="mask"
        >
          <span className="line-mask">
            <Editable k={`home.${id}.title`}>{title}</Editable>
          </span>
        </h2>
      </div>
      {lede || action ? (
        <div className={split ? 'lg:pb-2' : ''}>
          {lede ? (
            <Editable
              k={`home.${id}.lede`}
              as="p"
              multiline
              className={
                'text-ink-2 reveal block text-[length:var(--text-lede)] leading-[1.55]' +
                (centred
                  ? ' mx-auto mt-6 max-w-[52ch]'
                  : split
                    ? ' max-w-[44ch]'
                    : ' mt-6 max-w-[52ch]')
              }
            >
              {lede}
            </Editable>
          ) : null}
          {action ? <div className="reveal mt-7">{action}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
   1. The services band
   -------------------------------------------------------------------------- */

export function ServiceBand() {
  return (
    <section aria-label="What we do" className="border-y py-6 sm:py-8">
      <Marquee
        items={[
          'Websites',
          'Web apps & portals',
          'Brand identity',
          'Automation',
          'GST compliance',
          'Income tax',
          'Scrutiny defence',
          'Incorporation',
          'Books & payroll',
        ]}
      />
      <Marquee
        className="mt-3"
        outline
        reverse
        items={[
          'One accountable team',
          'Scope in writing',
          'No handoffs',
          'Built to be found',
          'Filed on time',
          'Audit-ready books',
        ]}
      />
    </section>
  );
}

/* --------------------------------------------------------------------------
   2. The problem — named before the solution, because nobody reads a fix for
      a problem they have not recognised as theirs.
   -------------------------------------------------------------------------- */

const PAINS = [
  {
    id: 'web',
    pain: 'Your website looks fine, but the phone never rings.',
    fix: 'We build sites that are found on Google and turn the people who land on them into enquiries.',
  },
  {
    id: 'tax',
    pain: 'GST notices and filing deadlines keep piling up.',
    fix: 'We reconcile before we file, keep every date on a calendar, and answer notices on your behalf.',
  },
  {
    id: 'vendors',
    pain: 'Your agency, accountant and lawyer never talk to each other.',
    fix: 'One team does the build and the books, so nothing falls through the gap between them.',
  },
];

export async function Problems() {
  return (
    <Section rhythm="default">
      <Container>
        <SectionHead
          id="problems"
          eyebrow="Sound familiar?"
          title="Running a business should not mean managing five vendors."
          lede="Most of the businesses we work with came to us with one of these. Usually two."
        />

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {PAINS.map((p, i) => (
            <li key={p.id} className="reveal" data-reveal-delay={String(i * 110)}>
              <Tilt className="bento h-full p-7 sm:p-8" max={5}>
                <div className="flex items-center justify-between">
                  <span className="text-critical text-[length:var(--text-micro)] font-semibold tracking-[0.12em] uppercase">
                    Before
                  </span>
                  <span className="numeral text-[length:var(--text-caption)]">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-[length:var(--text-title-3)] leading-snug">
                  <span className="pain-strike">
                    <Editable k={`home.problems.${p.id}.pain`}>{p.pain}</Editable>
                  </span>
                </h3>
                <div className="my-6 flex items-center gap-3" aria-hidden="true">
                  <span className="bg-hairline h-px flex-1" />
                  <PlaneGlyph className="text-accent h-3 w-4 rotate-90" />
                  <span className="bg-hairline h-px flex-1" />
                </div>
                <span className="text-positive text-[length:var(--text-micro)] font-semibold tracking-[0.12em] uppercase">
                  With us
                </span>
                <Editable
                  k={`home.problems.${p.id}.fix`}
                  as="p"
                  multiline
                  className="text-ink mt-3 block text-[length:var(--text-body)] leading-relaxed"
                >
                  {p.fix}
                </Editable>
              </Tilt>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   3. What you get — the two halves, engineering first because that is what
      most visitors arrive wanting, advisory beside it at identical weight.
   -------------------------------------------------------------------------- */

export async function Offer() {
  const sides = [...PRACTICE].reverse();
  return (
    <Section rhythm="default" tone="sunken" className="border-y">
      <Container>
        <SectionHead
          id="offer"
          eyebrow="What you get"
          title="Two disciplines. One team that answers for both."
          lede="Everything a growing business needs built or filed, from the people who understand how the two depend on each other."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {sides.map((side, i) => {
            const Scene = PRACTICE_SCENES[side.id];
            return (
              <div key={side.id} className="reveal" data-reveal-delay={String(i * 140)}>
                <Tilt className="bento flex h-full flex-col p-7 sm:p-10" max={4}>
                  <div className="flex items-baseline justify-between gap-4">
                    <Label>{side.name}</Label>
                    <span className="numeral text-[length:var(--text-title-3)]">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-[length:var(--text-title-1)] leading-[1.02]">
                    <Editable k={`home.offer.${side.id}.heading`}>{side.heading}</Editable>
                  </h3>
                  <Editable
                    k={`home.offer.${side.id}.statement`}
                    as="p"
                    className="text-ink-2 mt-3 block text-[length:var(--text-lede)] leading-[1.45]"
                  >
                    {side.statement}
                  </Editable>

                  <div className="mt-8">
                    <Scene />
                  </div>

                  <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {side.capabilities.map((cap, j) => (
                      <li key={cap.title} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="bg-accent-wash text-accent mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
                        >
                          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                            <path
                              d="M4.5 8.3l2.2 2.2 4.8-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span>
                          <Editable
                            k={`home.offer.${side.id}.cap${j + 1}.title`}
                            className="text-ink block text-[length:var(--text-small)] font-semibold"
                          >
                            {cap.title}
                          </Editable>
                          <Editable
                            k={`home.offer.${side.id}.cap${j + 1}.detail`}
                            className="text-ink-3 mt-1 block text-[length:var(--text-caption)] leading-relaxed"
                          >
                            {cap.detail}
                          </Editable>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-9">
                    <Link
                      href={side.href}
                      className="link-underline tap text-accent inline-flex items-center gap-2 text-[length:var(--text-small)] font-semibold"
                    >
                      Explore {side.name.toLowerCase()}
                      <ArrowIcon className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Tilt>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   4. What changes — the value, as things the client will actually notice.
   -------------------------------------------------------------------------- */

const OUTCOMES = [
  {
    id: 'contact',
    icon: Handshake,
    title: 'One point of contact',
    body: 'One team for the build and the books. You explain your business once, not three times.',
  },
  {
    id: 'fee',
    icon: FileCheck2,
    title: 'The fee before the work',
    body: 'What is included, what is not, the timeline and the cost, agreed in writing before anything starts.',
  },
  {
    id: 'calendar',
    icon: Calendar,
    title: 'Every deadline, a year ahead',
    body: 'A twelve-month compliance calendar for your business, issued when you join. No penalty surprises.',
  },
  {
    id: 'ready',
    icon: ShieldCheck,
    title: 'Ready when a notice arrives',
    body: 'Working papers are kept and indexed, so a reply is assembled from the file, not rebuilt from memory.',
  },
];

export async function Outcomes() {
  return (
    <Section rhythm="default">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead
              layout="stack"
              id="outcomes"
              eyebrow="Why clients stay"
              title="What changes the week you join."
              lede="Not adjectives. Four things you will notice, because they are how every engagement here is run."
            />
            <div className="reveal mt-9">
              <CtaLink href="/contact">Talk to us about your business</CtaLink>
            </div>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2">
            {OUTCOMES.map((o, i) => {
              const Icon = o.icon;
              return (
                <li key={o.id} className="reveal" data-reveal-delay={String(i * 90)}>
                  <Tilt className="bento h-full p-7" max={6}>
                    <span className="bg-accent text-accent-ink grid h-12 w-12 place-items-center rounded-2xl shadow-[0_10px_24px_-10px_var(--accent)]">
                      <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 text-[length:var(--text-title-3)]">
                      <Editable k={`home.outcomes.${o.id}.title`}>{o.title}</Editable>
                    </h3>
                    <Editable
                      k={`home.outcomes.${o.id}.body`}
                      as="p"
                      multiline
                      className="text-ink-2 mt-3 block text-[length:var(--text-small)] leading-relaxed"
                    >
                      {o.body}
                    </Editable>
                  </Tilt>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   5. The work — scrollable, so the proof is experienced rather than claimed.
   -------------------------------------------------------------------------- */

export async function FeaturedWork({ projects }: { projects: PortfolioProject[] }) {
  const featured = projects.filter((p) => p.status === 'live' && p.featured).slice(0, 2);
  if (!featured.length) return null;

  return (
    <Section rhythm="default" className="border-t">
      <Container>
        <SectionHead
          id="work"
          eyebrow="Selected work"
          title="Websites we have launched. Scroll through them."
          lede="Each window holds the real page. Scroll inside it the way the client’s own customers do."
          action={
            <CtaLink href="/work" tone="ghost">
              See all work
            </CtaLink>
          }
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          {featured.map((project, i) => (
            <article key={project.slug} className="reveal" data-reveal-delay={String(i * 140)}>
              <BrowserFrame
                name={project.name}
                displayUrl={project.displayUrl}
                url={project.url}
                desktop={{ src: project.shots.desktop, full: project.full.desktop }}
                mobile={{ src: project.shots.mobile, full: project.full.mobile }}
                height="clamp(16rem, 34vw, 26rem)"
                live={project.frameable}
              />
              <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="label">{project.sector}</span>
                  <h3 className="mt-2 text-[length:var(--text-title-2)]">{project.name}</h3>
                  <p className="text-ink-2 mt-2 max-w-[48ch] text-[length:var(--text-small)] leading-relaxed">
                    {project.outcome ?? project.summary}
                  </p>
                </div>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline tap text-accent inline-flex shrink-0 items-center gap-1.5 text-[length:var(--text-small)] font-semibold"
                >
                  Visit live site
                  <ArrowIcon className="h-3.5 w-3.5 -rotate-45" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   6. The held thought, read at the speed it is scrolled.
   -------------------------------------------------------------------------- */

export async function Statement() {
  const text = await copyText(
    'home.statement.text',
    'Most firms hand you off to a filing agent, a lawyer and an agency who never speak to each other. The handoff is where things quietly fail. Here, there is no handoff.',
  );
  return (
    <Section rhythm="lg" tone="inverse">
      <Container>
        <div className="grid grid-cols-12">
          <blockquote className="col-span-12 lg:col-span-10 lg:col-start-2">
            <p
              className="font-[family-name:var(--font-display)] text-[length:var(--text-display-2)] leading-[1.1]"
              data-edit="home.statement.text"
              data-edit-multiline
            >
              <ScrubWords text={text} />
            </p>
          </blockquote>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   7. The process — scrolled through, not clicked through.
   -------------------------------------------------------------------------- */

const STAGES = [
  {
    id: 'read',
    label: 'First read',
    title: 'Someone reads the actual document',
    body: 'The notice, the contract, the brief: read in full before anyone quotes a fee. Most of the outcome is decided by which clause you are actually answering.',
    note: 'No charge, and no obligation after it.',
    Diagram: ReadScene,
  },
  {
    id: 'scope',
    label: 'Scope',
    title: 'Scope and fee agreed in writing',
    body: 'What is included, what is explicitly not, the cost, and what we need from you by when. If it turns out larger, you hear it then, not in an invoice.',
    Diagram: ScopeScene,
  },
  {
    id: 'groundwork',
    label: 'Groundwork',
    title: 'The invisible majority of the work',
    body: 'Reconciliation, ledger repair, evidence, the discovery pass on a build. The part nobody sees, and the part that decides whether the result holds up.',
    Diagram: GroundworkScene,
  },
  {
    id: 'review',
    label: 'Review',
    title: 'Nothing leaves on one pair of eyes',
    body: 'Preparation and review are separate passes by separate people, working from the underlying records rather than the draft.',
    Diagram: ReviewScene,
  },
  {
    id: 'aftercare',
    label: 'Takeoff & aftercare',
    title: 'Launched, filed, and still looked after',
    body: 'The site goes live, the return goes in, and the file stays open. Questions on work already delivered are answered as part of the engagement.',
    Diagram: AftercareScene,
  },
];

export async function Process() {
  return (
    <Section rhythm="default">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead
              layout="stack"
              id="process"
              eyebrow="How it works"
              title="From first message to takeoff, in five steps."
              lede="The same order every time, whether it is a scrutiny notice or a new website. You always know which step you are on."
            />
          </div>

          <ol
            className="relative"
            style={{ viewTimeline: '--process block' } as React.CSSProperties}
          >
            <span className="process-rail" aria-hidden="true">
              <i />
            </span>
            {STAGES.map(({ id, label, title, body, note, Diagram }, i) => (
              <li key={id} className="reveal relative pb-14 pl-14 last:pb-0">
                <span
                  className="process-node absolute top-0 left-0 grid h-[2.3rem] w-[2.3rem] place-items-center rounded-full text-[length:var(--text-caption)] font-semibold tabular-nums"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="label">{label}</span>
                <h3 className="mt-2 text-[length:var(--text-title-2)]">
                  <Editable k={`home.process.${id}.title`}>{title}</Editable>
                </h3>
                <Editable
                  k={`home.process.${id}.body`}
                  as="p"
                  multiline
                  className="text-ink-2 mt-3 block max-w-[54ch] text-[length:var(--text-small)] leading-relaxed"
                >
                  {body}
                </Editable>
                {note ? (
                  <p className="text-accent mt-3 text-[length:var(--text-caption)] font-medium">
                    {note}
                  </p>
                ) : null}
                <div className="bento mt-6 max-w-[36rem] p-2">
                  <Diagram />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   8. Testimonials — only real ones, from the console. With none published,
      the section is not rendered at all rather than padded with filler.
   -------------------------------------------------------------------------- */

export async function Testimonials({ items }: { items: TestimonialRow[] }) {
  if (!items.length) return null;
  return (
    <Section rhythm="lg" tone="sunken" className="border-y">
      <Container>
        <SectionHead
          id="testimonials"
          eyebrow="In their words"
          title="What clients say once it has taken off."
          align="center"
        />
        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <li key={t.id} className="reveal" data-reveal-delay={String((i % 3) * 100)}>
              <Tilt as="figure" className="bento flex h-full flex-col p-7 sm:p-8" max={5}>
                {t.rating ? (
                  <span className="text-caution flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, s) => (
                      <svg
                        key={s}
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        fill={s < t.rating! ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="1.2"
                        aria-hidden="true"
                      >
                        <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z" />
                      </svg>
                    ))}
                  </span>
                ) : null}
                <blockquote className="text-ink mt-5 flex-1 font-[family-name:var(--font-display)] text-[length:var(--text-title-3)] leading-snug">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-3">
                  {t.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- uploaded avatar
                    <img
                      src={t.avatar_url}
                      alt=""
                      width={44}
                      height={44}
                      loading="lazy"
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="bg-accent text-accent-ink grid h-11 w-11 place-items-center rounded-full text-[0.875rem] font-semibold"
                    >
                      {t.author_name
                        .split(' ')
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                  )}
                  <span>
                    <span className="text-ink block text-[length:var(--text-small)] font-semibold">
                      {t.author_name}
                    </span>
                    <span className="text-ink-3 block text-[length:var(--text-caption)]">
                      {[t.author_role, t.company].filter(Boolean).join(', ')}
                    </span>
                  </span>
                </figcaption>
              </Tilt>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   9. The recurring month — a breath, and a reason to come back.
   -------------------------------------------------------------------------- */

export function MonthStrip() {
  const monthly = COMPLIANCE_EVENTS.filter((e) => e.cadence === 'monthly');
  return (
    <Section rhythm="sm" className="border-y">
      <Container>
        <div className="flex flex-wrap items-baseline justify-between gap-6">
          <Label>Every month, without exception</Label>
          <Link
            href="/calendar"
            className="link-underline tap text-accent text-[length:var(--text-small)] font-medium"
          >
            Full compliance calendar
          </Link>
        </div>
        <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {monthly.map((event, i) => (
            <li key={event.id} className="reveal border-t pt-5" data-reveal-delay={String(i * 80)}>
              <span className="numeral block text-[length:var(--text-title-1)] leading-none">
                {ordinal(event.day)}
              </span>
              <h3 className="text-ink mt-4 font-[family-name:var(--font-sans)] text-[length:var(--text-small)] font-medium">
                {event.title}
              </h3>
              <span className="ref text-ink-3 mt-2 block">{event.statute}</span>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   10. Careers
   -------------------------------------------------------------------------- */

export async function CareersTeaser({ openRoles }: { openRoles: number }) {
  return (
    <Section rhythm="default">
      <Container>
        <Tilt className="bento overflow-hidden p-8 sm:p-12" max={3}>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-accent h-px w-6" />
                <span className="label">Work with us</span>
                {openRoles > 0 ? (
                  <span className="text-positive rounded-full bg-[rgb(12_106_52/0.1)] px-2.5 py-1 text-[length:var(--text-micro)] font-semibold">
                    {openRoles} open {openRoles === 1 ? 'role' : 'roles'}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-5 text-[length:var(--text-title-1)] leading-[1.05]">
                <Editable k="home.careers.title">
                  Help businesses take off. Build a career that does too.
                </Editable>
              </h2>
              <Editable
                k="home.careers.lede"
                as="p"
                multiline
                className="text-ink-2 mt-4 block max-w-[56ch] text-[length:var(--text-body)] leading-relaxed"
              >
                We are building a small, remote-first team that speaks both finance and code:
                developers, designers and tax associates who like getting things exactly right.
              </Editable>
            </div>
            <CtaLink href="/careers" size="lg">
              {openRoles > 0 ? 'See open roles' : 'Introduce yourself'}
            </CtaLink>
          </div>
        </Tilt>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   11. Close — every way to start, at the moment the decision is made.
   -------------------------------------------------------------------------- */

export async function Closing({ settings }: { settings: SiteSettings }) {
  const c = settings.contact;
  const channels = [
    { href: `tel:${c.phoneIntl}`, label: c.phone, icon: Phone, external: false },
    { href: whatsappHref(c.whatsapp), label: 'WhatsApp', icon: MessageCircle, external: true },
    { href: `mailto:${c.email}`, label: c.email, icon: Mail, external: false },
  ];
  return (
    <Section rhythm="lg">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0f2747] bg-[linear-gradient(135deg,#1c3252,#0f2747_55%,#14527a)] px-7 py-14 text-white sm:px-14 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 -right-32 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(53_165_213/0.45),transparent)]"
          />
          <PlaneGlyph className="absolute top-12 right-12 hidden h-10 w-12 text-[rgb(255_255_255/0.2)] sm:block" />
          <div className="relative max-w-3xl">
            <span className="text-[length:var(--text-micro)] font-semibold tracking-[0.14em] text-[rgb(255_255_255/0.78)] uppercase">
              Ready when you are
            </span>
            <h2 className="mt-5 text-[length:var(--text-display-2)] leading-[1.02] text-white">
              <Editable k="home.cta.heading">Ready for takeoff?</Editable>
            </h2>
            <Editable
              k="home.cta.lede"
              as="p"
              multiline
              className="mt-6 block max-w-[52ch] text-[length:var(--text-lede)] leading-[1.55] text-[rgb(255_255_255/0.86)]"
            >
              Tell us what you are building, filing or defending. You will get a straight answer on
              scope, timeline and fee before anything is signed.
            </Editable>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <CtaLink href="/contact" size="lg" tone="light">
                Start your project
              </CtaLink>
              <CtaLink href={whatsappHref(c.whatsapp)} external tone="glass" size="lg">
                Message on WhatsApp
              </CtaLink>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {channels.map(({ href, label, icon: Icon, external }) => (
                <li key={href}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="tap inline-flex items-center gap-2 text-[length:var(--text-small)] text-[rgb(255_255_255/0.86)] transition-colors hover:text-white"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
