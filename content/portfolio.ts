/**
 * Web development portfolio.
 *
 * `status` controls public visibility:
 *   'live'   — reachable, captured, shown on the public work page.
 *   'staged' — recorded here and editable in the admin console, but hidden
 *              from the public page until it is reachable.
 *
 * Verified on 22 September 2026:
 *   vihanadental.in    → 200 OK. Sends `X-Frame-Options: SAMEORIGIN`, so it
 *                        cannot be iframed; previews use captured screenshots.
 *   slmboutique.in     → Shopify storefront behind a password gate
 *                        (302 → /password) and `frame-ancestors 'none'`.
 *   thenilgiriroot.com → 200 OK, apex redirects to www. The site was
 *                        earlier recorded against thenilgiriroot.in, which is
 *                        still NXDOMAIN at the .in registry itself (no
 *                        nameservers delegated) -- that was simply the wrong
 *                        domain, corrected once the right one was given.
 *                        thenilgiriroot.in is not this client's site and
 *                        should not be reused for anything.
 *
 * Once a staged site becomes reachable, flip `status` to 'live' (or do it
 * from the admin console) and the capture job will populate its screenshots.
 */

export type ProjectStatus = 'live' | 'staged';

export type Project = {
  slug: string;
  name: string;
  url: string;
  /** Hostname shown in the mockup chrome. */
  displayUrl: string;
  sector: string;
  year: number;
  summary: string;
  brief: string;
  stack: string[];
  highlights: { label: string; value: string }[];
  status: ProjectStatus;
  /** Reason surfaced in the admin console when staged. */
  statusNote?: string;
  /** Populated by the capture pipeline; null until first capture. */
  shots: {
    desktop: string | null;
    mobile: string | null;
    capturedAt: string | null;
  };
};

export const PROJECTS: Project[] = [
  {
    slug: 'vihana-dental',
    name: 'Vihana Dental Care',
    url: 'https://vihanadental.in',
    displayUrl: 'vihanadental.in',
    sector: 'Healthcare · Dental practice',
    year: 2026,
    summary:
      'A patient-facing site for a multi-chair dental practice — treatment information, practitioner credentials and appointment enquiry, built to be found in local search.',
    brief:
      'The practice needed to be discoverable for treatment-intent searches and to convert that traffic into booked appointments, without a receptionist fielding every question first. We built a fast, content-led site with structured treatment pages and a low-friction enquiry path.',
    stack: ['Responsive web', 'Local SEO', 'Appointment enquiry', 'Performance budget'],
    highlights: [
      { label: 'Treatment pages', value: 'Structured' },
      { label: 'Enquiry path', value: 'Two taps' },
      { label: 'Built for', value: 'Local search' },
    ],
    status: 'live',
    shots: { desktop: null, mobile: null, capturedAt: null },
  },
  {
    slug: 'slm-boutique',
    name: 'SLM Boutique',
    url: 'https://slmboutique.in',
    displayUrl: 'slmboutique.in',
    sector: 'Retail · Fashion commerce',
    year: 2026,
    summary:
      'A commerce storefront for a boutique label — catalogue, collections and checkout, with the back-office kept simple enough for the owner to run unaided.',
    brief:
      'The brief was a storefront the owner could operate without a developer on call: product upload, collection curation and order management handled in-platform, with the visual identity carried through checkout.',
    stack: ['Shopify', 'Custom theme', 'Payments', 'Catalogue design'],
    highlights: [
      { label: 'Platform', value: 'Shopify' },
      { label: 'Theme', value: 'Custom' },
      { label: 'Owner-operated', value: 'End to end' },
    ],
    status: 'staged',
    statusNote:
      'The storefront itself is still behind a Shopify password gate, so the finished site cannot be shown yet. What is pictured is the public coming-soon page currently live at slmboutique.in — shown here until the real storefront opens.',
    // The "Opening soon" splash Shopify shows in front of the password gate
    // — captured directly, since the storefront behind it still cannot be.
    shots: {
      desktop:
        'https://seceoygaesgbjqzurbpr.supabase.co/storage/v1/object/public/previews/slm-boutique/desktop-1790076184525.jpg',
      mobile: null,
      capturedAt: '2026-09-22T11:23:55.435Z',
    },
  },
  {
    slug: 'the-nilgiri-root',
    name: 'The Nilgiri Root',
    url: 'https://thenilgiriroot.com',
    displayUrl: 'thenilgiriroot.com',
    sector: 'Food manufacturing · B2B frozen produce',
    year: 2026,
    summary:
      'A trade site for a frozen french-fries manufacturer sourcing from high-altitude Nilgiri potatoes — built to route distributors, restaurants and QSR buyers into a priced WhatsApp enquiry in two taps.',
    brief:
      'The buyer here is a procurement team or a restaurant owner, not a consumer, so the site leads with what a trade buyer actually checks — growing altitude, starch content, blast-freeze process, FSSAI certification — then gets out of the way. An audience-segmented WhatsApp quote tool pre-fills the enquiry with the cut size selected, and a set of programmatic landing pages catches the “manufacturer near me” searches a distributor actually runs.',
    stack: [
      'B2B trade site',
      'WhatsApp lead capture',
      'Programmatic local SEO',
      'FSSAI compliance content',
    ],
    // No highlight tiles for this one -- the summary and brief already carry
    // the cut sizes, the enquiry path and the audience.
    highlights: [],
    status: 'live',
    // Uploaded directly to the `previews` bucket (no admin-console session
    // available). Desktop via Claude-in-Chrome; mobile needed a genuine
    // mobile-viewport render, which neither GUI browser tried first could
    // produce (one blocked the site's own asset CDN entirely, the other
    // would not resize below its panel) -- local Playwright, run directly
    // against the live URL with a real 390x844 viewport, is what actually
    // worked.
    shots: {
      desktop:
        'https://seceoygaesgbjqzurbpr.supabase.co/storage/v1/object/public/previews/the-nilgiri-root/desktop-1790074398503.jpg',
      mobile:
        'https://seceoygaesgbjqzurbpr.supabase.co/storage/v1/object/public/previews/the-nilgiri-root/mobile-1790076052996.jpg',
      capturedAt: '2026-09-22T11:00:18.783Z',
    },
  },
];

export const LIVE_PROJECTS = PROJECTS.filter((p) => p.status === 'live');
export const STAGED_PROJECTS = PROJECTS.filter((p) => p.status === 'staged');

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
