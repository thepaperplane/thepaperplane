/**
 * Single source of truth for company identity, navigation, and SEO defaults.
 *
 * NOTE: The Paper Plane operates as a fully remote practice. There is
 * deliberately no street address, map, or locality field anywhere in this
 * object — do not reintroduce one.
 */

export const SITE = {
  name: 'The Paper Plane',
  shortName: 'Paper Plane',
  tagline: 'We handle the Papers, You Handle the Takeoff',
  description:
    'Tax and GST compliance, scrutiny defence, incorporation and audit-ready books — alongside the websites, portals and automation built around them.',
  url: 'https://www.thepaperplane.co.in',
  locale: 'en_IN',
  email: 'contact@thepaperplane.co.in',
  phone: '+91 90255 65526',
  phoneIntl: '+919025565526',
  whatsapp: '919025565526',
  hours: 'Monday – Saturday · 09:00 – 19:00 IST',
  serviceModel: 'Remote-first practice serving clients across India',
  serviceArea: 'India',
  foundedYear: 2023,
} as const;

/** Prefilled WhatsApp deep link. */
export function whatsappLink(message?: string): string {
  const text = message ?? `Hello ${SITE.name}, I would like to discuss your services.`;
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}

/**
 * Build a page's Open Graph block.
 *
 * Next.js REPLACES `openGraph` when a child page defines it — it does not
 * deep-merge — so a page that sets only a title silently loses the root
 * layout's image. Every page routes through this helper instead.
 */
export function pageOg(opts: { title: string; description: string; path: string }) {
  return {
    title: `${opts.title} · ${SITE.name}`,
    description: opts.description,
    url: opts.path,
    siteName: SITE.name,
    locale: SITE.locale,
    type: 'website' as const,
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  };
}

export type NavItem = {
  href: string;
  /** Full name — used in the mobile sheet and footer. */
  label: string;
  /**
   * Compact name for the desktop top bar.
   *
   * "Knowledge Corner" and "Compliance Calendar" wrapped onto two lines from
   * 1024px upward, leaving those items 61px tall against 39px for the rest —
   * a visibly ragged nav. A top bar wants short labels; the full names still
   * appear everywhere there is room for them.
   */
  short?: string;
  description?: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: '/services', label: 'Services', description: 'Six practice pillars, end to end' },
  { href: '/work', label: 'Work', description: 'Digital infrastructure we have shipped' },
  {
    href: '/knowledge',
    label: 'Knowledge Corner',
    short: 'Knowledge',
    description: 'Understand exactly what you are paying for',
  },
  {
    href: '/calendar',
    label: 'Compliance Calendar',
    short: 'Calendar',
    description: 'Every statutory due date',
  },
  { href: '/news', label: 'News', description: 'Daily tax, GST and corporate updates' },
  { href: '/about', label: 'About', description: 'How the practice is built' },
];

export const FOOTER_NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Practice',
    items: [
      { href: '/services', label: 'All services' },
      { href: '/services#tax', label: 'Tax & GST' },
      { href: '/services#scrutiny', label: 'Scrutiny defence' },
      { href: '/services#incorporation', label: 'Incorporation' },
      { href: '/services#books', label: 'Books & payroll' },
    ],
  },
  {
    heading: 'Digital',
    items: [
      { href: '/services#digital', label: 'Web & product' },
      { href: '/work', label: 'Selected work' },
      { href: '/services#design', label: 'Brand & design' },
    ],
  },
  {
    heading: 'Resources',
    items: [
      { href: '/knowledge', label: 'Knowledge Corner' },
      { href: '/calendar', label: 'Compliance calendar' },
      { href: '/news', label: 'News' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/accessibility', label: 'Accessibility' },
      { href: '/security', label: 'Security' },
      { href: '/copyright', label: 'Copyright' },
    ],
  },
];

/**
 * Organization schema. Uses `areaServed` rather than a PostalAddress,
 * which is the correct markup for a practice without a public office.
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    email: SITE.email,
    telephone: SITE.phone,
    slogan: SITE.tagline,
    description: SITE.description,
    logo: `${SITE.url}/favicon.svg`,
    image: `${SITE.url}/og/default.png`,
    areaServed: { '@type': 'Country', name: 'India' },
    availableLanguage: ['en', 'ta'],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE.phone,
      email: SITE.email,
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['en', 'ta'],
    },
  };
}
