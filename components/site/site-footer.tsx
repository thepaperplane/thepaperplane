import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { Container, Label, Rule } from '@/components/ui';
import { CtaLink, PlaneGlyph } from '@/components/fx';
import { FOOTER_NAV, SITE } from '@/lib/site';
import { getSettings, whatsappHref } from '@/lib/settings';

/**
 * Colophon.
 *
 * Masthead and index, then the brand line set large as a sign-off. No address
 * block and no PostalAddress schema — the practice is remote-first, and
 * `areaServed` in the organisation JSON-LD is the correct markup for that.
 * Contact channels come from the console's settings, so a changed number is
 * one edit, not a deploy.
 */
export async function SiteFooter() {
  const year = new Date().getFullYear();
  const { contact, social } = await getSettings();
  const socials = (
    [
      ['LinkedIn', social.linkedin],
      ['Instagram', social.instagram],
      ['X', social.x],
      ['YouTube', social.youtube],
    ] as const
  ).filter(([, href]) => /^https:\/\//.test(href));

  return (
    <footer className="glass glass-thin rounded-none border-t border-transparent">
      <Container className="py-[var(--space-section-sm)]">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)] lg:gap-24">
          {/* Masthead */}
          <div>
            <Logo showTagline />

            <p className="text-ink-2 mt-8 max-w-[34ch] text-[length:var(--text-small)] leading-relaxed">
              Websites, software and the filings underneath them, from one accountable team.
            </p>

            <div className="mt-8">
              <CtaLink href="/contact" size="sm">
                Start a project
              </CtaLink>
            </div>

            <dl className="mt-10 space-y-4">
              <div>
                <dt className="label mb-1.5">Direct</dt>
                <dd className="flex flex-col gap-0">
                  <a
                    href={`tel:${contact.phoneIntl}`}
                    className="link-underline text-ink block w-fit py-2.5 text-[length:var(--text-small)]"
                  >
                    {contact.phone}
                  </a>
                  <a
                    href={`mailto:${contact.email}`}
                    className="link-underline text-ink block w-fit py-2.5 text-[length:var(--text-small)]"
                  >
                    {contact.email}
                  </a>
                  <a
                    href={whatsappHref(contact.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-ink block w-fit py-2.5 text-[length:var(--text-small)]"
                  >
                    WhatsApp
                  </a>
                </dd>
              </div>
              <div>
                <dt className="label mb-1.5">Hours</dt>
                <dd className="text-ink-2 text-[length:var(--text-small)]">{contact.hours}</dd>
              </div>
              {socials.length ? (
                <div>
                  <dt className="label mb-1.5">Follow</dt>
                  <dd className="flex flex-wrap gap-x-5">
                    {socials.map(([name, href]) => (
                      <a
                        key={name}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer me"
                        className="link-underline text-ink block py-2.5 text-[length:var(--text-small)]"
                      >
                        {name}
                      </a>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {/* Index */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4">
            {FOOTER_NAV.map((group) => (
              <nav key={group.heading} aria-label={group.heading}>
                <Label>{group.heading}</Label>
                {/* Padded rows rather than `.tap`: these are stacked, so an
                    expanded overlay would overlap the link above and below. */}
                <ul className="mt-3 space-y-0">
                  {group.items.map((item) => (
                    <li key={item.href + item.label}>
                      <Link
                        href={item.href}
                        className="text-ink-2 hover:text-ink block py-2.5 text-[length:var(--text-small)] transition-colors duration-300"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* The sign-off. Decorative; the tagline is also in the lockup above. */}
        <div
          aria-hidden="true"
          className="mt-20 flex items-end justify-between gap-6 overflow-hidden select-none"
        >
          <span className="text-ink font-[family-name:var(--font-display)] text-[clamp(2.5rem,1rem+7.5vw,8.5rem)] leading-[0.9] tracking-[-0.04em]">
            {SITE.tagline.split(/,\s*/)[0]},{' '}
            <span className="text-accent italic">{SITE.tagline.split(/,\s*/)[1]}</span>
          </span>
          <PlaneGlyph className="text-accent mb-3 hidden h-8 w-10 shrink-0 sm:block" />
        </div>

        <Rule className="mt-12" />

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-ink-3 text-[length:var(--text-micro)]">
            © {year} {SITE.name}
          </p>
          <p className="text-ink-3 max-w-[68ch] text-[length:var(--text-micro)] leading-relaxed">
            Compliance dates, penalty figures and explanatory material on this site are general
            guidance reflecting the standard statutory position at the time of writing. Due dates
            are periodically extended by the relevant authority. Nothing here is advice on your
            specific circumstances — engage us before acting on it.
          </p>
        </div>
      </Container>
    </footer>
  );
}
