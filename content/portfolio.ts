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
      'Storefront is currently behind a Shopify password gate, so it is not publicly reachable and cannot be captured.',
    shots: { desktop: null, mobile: null, capturedAt: null },
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
    highlights: [
      { label: 'Cut sizes', value: '9 / 10 / 11 mm' },
      { label: 'Enquiry path', value: 'WhatsApp, pre-filled' },
      { label: 'Built for', value: 'Distributors & HORECA' },
    ],
    status: 'live',
    // No screenshot yet -- run a capture from the admin console (Portfolio ->
    // this project -> Recapture) to populate the device mockup. Until then
    // the public page shows the honest "preview pending capture" placeholder
    // rather than a broken image.
    shots: { desktop: null, mobile: null, capturedAt: null },
  },
];

export const LIVE_PROJECTS = PROJECTS.filter((p) => p.status === 'live');
export const STAGED_PROJECTS = PROJECTS.filter((p) => p.status === 'staged');

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
