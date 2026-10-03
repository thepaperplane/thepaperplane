import { Container } from '@/components/ui';
import { CtaLink } from '@/components/fx';
import { Editable } from '@/components/editable';
import { HeroScene } from '@/components/home/hero-scene';
import { SITE } from '@/lib/site';

/**
 * The first five seconds.
 *
 * A visitor decides in about that long whether a page is for them, and they
 * read it in a fixed order: the large line, the line under it, the buttons,
 * and whatever is moving. So each of those carries one of the four answers
 * someone arriving cold needs:
 *
 *   what is this business     — the kicker above the headline
 *   who it is, emotionally    — the headline: the brand line itself
 *   what I get, and the value — the lede, in plain words
 *   what problem goes away    — the three proof points under the buttons
 *
 * The headline is the registered tagline from SITE.tagline, so the homepage,
 * the logo lockup, the share card and the footer can never disagree. Its two
 * halves are split at the comma for the word-by-word reveal; the words stay
 * real text, so a screen reader hears one sentence.
 */
export async function Hero() {
  const [first, second] = SITE.tagline.split(/,\s*/);
  // The comma stays on the last word of the first half, as it is written.
  const firstWords = (second ? `${first},` : (first ?? SITE.tagline)).split(' ');
  const secondWords = (second ?? '').split(' ').filter(Boolean);

  return (
    <section className="hero pt-[calc(4.5rem+clamp(2rem,1rem+4vw,5.5rem))] pb-[clamp(3rem,2rem+4vw,6rem)]">
      <Container>
        <div className="grid items-center gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="relative z-10">
            {/* What this business is, before anything else. */}
            <p className="reveal text-ink-2 inline-flex items-center gap-3 text-[length:var(--text-small)] font-medium">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="bg-positive absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 motion-reduce:hidden" />
                <span className="bg-positive relative inline-flex h-2.5 w-2.5 rounded-full" />
              </span>
              <Editable k="home.hero.kicker">
                Websites, software and tax compliance for growing Indian businesses
              </Editable>
            </p>

            <h1 className="hero-title reveal mt-6" data-reveal="words">
              <span className="hw-line">
                {firstWords.map((word, i) => (
                  <span key={word + i}>
                    <span className="hw" style={{ ['--wi' as string]: i }}>
                      {word}
                    </span>
                    {i < firstWords.length - 1 ? ' ' : null}
                  </span>
                ))}
              </span>
              {secondWords.length ? (
                <span className="hw-line">
                  {secondWords.map((word, i) => (
                    <span key={word + i}>
                      <span
                        className="hw hw-accent"
                        style={{ ['--wi' as string]: firstWords.length + i }}
                      >
                        {word}
                      </span>
                      {i < secondWords.length - 1 ? ' ' : null}
                    </span>
                  ))}
                </span>
              ) : null}
            </h1>

            <Editable
              k="home.hero.lede"
              as="p"
              multiline
              className="reveal text-ink-2 mt-7 block max-w-[44ch] text-[length:var(--text-lede)] leading-[1.55]"
            >
              We build the website and software your business runs on, and keep the GST, tax and
              company filings underneath it on time. One accountable team instead of an agency, an
              accountant and a lawyer.
            </Editable>

            <div className="reveal mt-9 flex flex-wrap items-center gap-3" data-reveal-delay="120">
              <CtaLink href="/contact" size="lg">
                <Editable k="home.hero.ctaPrimary">Start your project</Editable>
              </CtaLink>
              <CtaLink href="/work" tone="ghost" size="lg">
                <Editable k="home.hero.ctaSecondary">See our work</Editable>
              </CtaLink>
            </div>

            <ul
              className="reveal mt-9 flex flex-wrap gap-x-6 gap-y-3"
              data-reveal="stagger"
              aria-label="What you can count on"
            >
              <li className="proof-chip">
                <Editable k="home.hero.proof1">Fee and scope fixed in writing</Editable>
              </li>
              <li className="proof-chip">
                <Editable k="home.hero.proof2">A reply within one working day</Editable>
              </li>
              <li className="proof-chip">
                <Editable k="home.hero.proof3">Remote-first, across India</Editable>
              </li>
            </ul>
          </div>

          <div className="relative -mx-4 sm:mx-0 lg:-mr-8">
            <HeroScene />
          </div>
        </div>
      </Container>
    </section>
  );
}
