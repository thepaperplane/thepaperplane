import { Container, TextLink } from '@/components/ui';
import { SITE } from '@/lib/site';

/**
 * Masthead.
 *
 * Deliberately not the stock hero: no eyebrow pill, no centred stack, no
 * gradient headline, no pair of buttons sitting under a paragraph. The
 * headline occupies nine of twelve columns and the supporting text is offset
 * beneath it to the right, so the eye travels diagonally rather than down a
 * centre line. A standing rule and a metadata row close it, the way a
 * masthead closes above the fold of a broadsheet.
 *
 * The headline is the brand tagline, so it is set as one line in one ink. The
 * `.em-serif` treatment used for second halves elsewhere on the site also
 * recolours to the accent, and recolouring half of a registered brand line
 * breaks the parallel — "We handle… / You Handle…" — that the line is built
 * on. The italic alone carries the turn.
 */
export function Masthead({
  title,
  titleAccent,
  lede,
}: {
  title: string;
  titleAccent: string;
  lede: string;
}) {
  return (
    <header className="pt-[calc(4.5rem+var(--space-section))] pb-[var(--space-section)]">
      <Container>
        <div className="grid grid-cols-12">
          <h1
            className="tagline-gradient reveal col-span-12 text-[length:var(--text-display-1)] leading-[0.95] lg:col-span-11"
            data-reveal="mask"
          >
            <span className="line-mask">
              <span>{title}</span>
            </span>
            <span className="line-mask">
              <span className="italic" style={{ ['--line-d' as string]: '110ms' }}>
                {titleAccent}
              </span>
            </span>
          </h1>
        </div>

        {/* Lede offset right — the asymmetry is the point. */}
        <div className="mt-14 grid grid-cols-12 gap-y-10">
          <div
            className="reveal col-span-12 sm:col-span-8 sm:col-start-5 lg:col-span-6 lg:col-start-7"
            data-reveal-delay="120"
          >
            <p className="text-ink-2 text-[length:var(--text-lede)] leading-[1.5]">{lede}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              <TextLink href="/contact">Start a conversation</TextLink>
              <TextLink href="/services" className="text-ink-3">
                See what we do
              </TextLink>
            </div>
          </div>
        </div>
      </Container>

      {/* Standing rule + metadata strip */}
      <Container className="mt-[var(--space-section)]">
        <div className="reveal rule" data-reveal="rule" />
        <dl className="grid grid-cols-2 gap-y-6 pt-6 sm:grid-cols-4">
          {[
            ['Founded', String(SITE.foundedYear)],
            ['Practice', 'Remote-first, across India'],
            ['Advisory', 'Tax · GST · Books · Litigation support'],
            ['Engineering', 'Web · Product · Identity · Automation'],
          ].map(([term, detail], i) => (
            <div key={term} className="reveal pr-6" data-reveal-delay={String(160 + i * 70)}>
              <dt className="label">{term}</dt>
              <dd className="text-ink-2 mt-2 text-[length:var(--text-caption)] leading-snug">
                {detail}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </header>
  );
}
