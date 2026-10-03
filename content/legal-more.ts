/**
 * Cookies, accessibility, security and copyright.
 *
 * Split from content/legal.ts only for length. Same rule as that file: every
 * claim is written against what the code actually does and is checkable in the
 * repository, because a policy that has drifted from the software is a written
 * statement that is no longer true.
 *
 * The cookie policy in particular says something unusual — that there are none
 * for visitors — and that is verified: the public app writes no cookie (the
 * only `document.cookie` writes clear the console owner's editor flag), there
 * is no tag manager or third-party analytics package, local storage holds the
 * theme key from components/site/theme.tsx, and session storage holds the
 * tab-scoped keys listed below. If any of that changes, this changes with it.
 */

import type { LegalSection } from '@/content/legal';
import { SITE } from '@/lib/site';

export const COOKIES_UPDATED = '3 October 2026';
export const ACCESSIBILITY_UPDATED = '15 September 2026';
export const SECURITY_UPDATED = '3 October 2026';
export const COPYRIGHT_UPDATED = '15 September 2026';

export const COOKIES: LegalSection[] = [
  {
    id: 'position',
    heading: 'There are none on this site',
    body: [
      'Most cookie policies exist to explain away a long list. This one is short because the list is empty: the public pages of this website set no cookies at all. Not analytics, not advertising, not “functional”, not even a consent cookie remembering that you were asked about cookies.',
      'That is checkable rather than asserted. There is no tag manager, no pixel, no third-party analytics package and no embedded third-party script anywhere in this site, so there is nothing that would need one.',
      'The site does keep an anonymous count of visits — page, referring site, campaign tag, device type and country, as daily totals — and does it without a cookie, without storing an IP address and without any identifier that could recognise you or connect one visit to the next. A browser sending Do Not Track or Global Privacy Control is not counted at all.',
    ],
  },
  {
    id: 'no-banner',
    heading: 'Which is why there is no banner',
    body: [
      'Consent is required before setting anything that is not strictly necessary. Nothing here is set at all, so there is nothing to consent to — and a banner asking you to accept cookies that do not exist would be theatre. Worse than useless, because it teaches people to dismiss the banners that do matter.',
      'If that ever changes — an analytics tool, a video embed, anything that writes to your browser for our benefit rather than yours — a real consent control appears here before it is switched on, not after.',
    ],
  },
  {
    id: 'stored',
    heading: 'What is stored in your browser',
    body: [
      'None of these are cookies. Your theme choice is kept in local storage so the site does not flash the wrong colour at you on the next page; a few short-lived values live in session storage, which your browser clears when the tab closes.',
    ],
    rows: [
      { term: 'Key', detail: 'pp.theme' },
      { term: 'Value', detail: 'Either “light” or “dark”. Nothing else is written.' },
      {
        term: 'Written when',
        detail: 'You use the theme switch in the header. Never automatically.',
      },
      { term: 'Transmitted', detail: 'Never. It stays on your device and is not sent anywhere.' },
      {
        term: 'Removing it',
        detail:
          'Right-click the theme switch to go back to following your system, or clear site data in your browser.',
      },
      {
        term: 'Session storage',
        detail:
          'pp.seen (the opening animation has played), pp.landing (the first page of this visit), pp.utm (campaign tags of the link you arrived by), and pp.announce.* (you dismissed an announcement). Cleared when the tab closes. pp.landing and pp.utm leave your device only inside an enquiry you choose to send.',
      },
    ],
  },
  {
    id: 'admin',
    heading: 'The administrative console',
    body: [
      'The console the practice uses to read enquiries and edit content sits behind a sign-in and does use a session cookie, because keeping somebody signed in is not possible without one, and a second cookie, pp_editor, that tells the public pages to show the practice its editing tools. Both are strictly necessary in the meaning of the rule, are set only after a successful two-factor sign-in, and are never set for a visitor to the public site.',
    ],
  },
  {
    id: 'asking',
    heading: 'Questions',
    body: [
      `If you find anything on this site writing to your browser that is not described above, that is a bug and we would like to hear about it. Write to ${SITE.email}.`,
    ],
  },
];

export const ACCESSIBILITY: LegalSection[] = [
  {
    id: 'target',
    heading: 'The standard we hold to',
    body: [
      'This site targets WCAG 2.2 Level AA — the level most procurement and public-sector requirements reference, and the level we test against rather than aspire to.',
      'This is not a claim of perfection. What follows is what has actually been measured, and then what has not.',
    ],
  },
  {
    id: 'measured',
    heading: 'What has been measured',
    body: [
      'Checked programmatically across every page, in both themes, at phone, tablet and desktop widths:',
    ],
    rows: [
      {
        term: 'Contrast',
        detail:
          'All text meets 4.5:1, or 3:1 where it is large. Measured by compositing the full translucent stack behind the text rather than against a notional white.',
      },
      {
        term: 'Target size',
        detail:
          'Every control is at least 24 by 24 CSS pixels. Links inline in a sentence are exempt under 2.5.8 and are left alone.',
      },
      {
        term: 'Reduced motion',
        detail:
          'Every animation — scroll reveals, diagrams, slideshows, the glass responses — resolves to its finished state under prefers-reduced-motion. Nothing is merely sped up.',
      },
      {
        term: 'Moving content',
        detail:
          'Anything that starts moving on its own carries a visible pause control, and stops for good the first time you interact with it.',
      },
      { term: 'Headings', detail: 'One h1 per page, and no skipped levels.' },
      {
        term: 'Diagrams',
        detail:
          'Every drawing carries a written description of what it shows, not a filename. Decorative marks are hidden from assistive technology.',
      },
      {
        term: 'Keyboard',
        detail:
          'Every control is reachable and operable by keyboard, with a visible focus indicator and a skip link to the main content.',
      },
      {
        term: 'Reflow',
        detail: 'No horizontal scrolling at 320px, and text reflows rather than clipping.',
      },
    ],
  },
  {
    id: 'known',
    heading: 'What we know is imperfect',
    body: [
      'Diagram labels render at roughly 10px on a small phone. They are supporting annotation inside an illustration that also carries a full text description, and they meet contrast — but they are small, and we would rather say so than let you find out.',
      'This site has not been audited by an external specialist, and it has not been tested end to end against every screen reader and browser combination. Automated checking catches a great deal and it does not catch everything.',
    ],
  },
  {
    id: 'feedback',
    heading: 'If something does not work for you',
    body: [
      `Tell us and it gets fixed. Write to ${SITE.email} or call ${SITE.phone}, and say what you were trying to do, what happened, and what you were using — that last part matters more than people expect.`,
      'You will get a reply from a person within two working days, and another when it is actually corrected. If something here is stopping you reaching us at all, the phone is the fastest route.',
    ],
  },
];

export const SECURITY: LegalSection[] = [
  {
    id: 'scope',
    heading: 'What this covers',
    body: [
      'How information you send this practice is protected in transit and at rest, who can reach it, and what happens if something goes wrong.',
    ],
  },
  {
    id: 'transit',
    heading: 'In transit',
    body: [
      'The whole site is served over HTTPS and any plain-text request is redirected to it. Enquiries and subscriptions travel over that same encrypted connection.',
    ],
  },
  {
    id: 'rest',
    heading: 'At rest',
    body: [
      'Enquiries, subscriptions and job applications live in a Postgres database hosted by Supabase in the Mumbai region, encrypted at rest, with row-level security so a request cannot read rows it has no business reading. CVs and client documents are held in private storage that is never publicly reachable and is opened only through links that expire within minutes.',
      'Administrative access is restricted to a single practice account, behind a password and a second factor from an authenticator app. The database itself refuses any other account, and refuses that account too until the second factor has been entered. The service key capable of bypassing row-level security is held server-side only and never reaches a browser.',
    ],
  },
  {
    id: 'minimisation',
    heading: 'What is deliberately not collected',
    body: [
      'The strongest control available is not holding the data at all. This site sets no tracking cookies, builds no profiles and buys in no enriched data about anyone who visits; its visit count is anonymous daily totals with no IP address or identifier in them. There is no advertising identifier to leak and no behavioural record to hand over.',
      'The enquiry form asks for the minimum that allows a reply. It does not ask for financial account details, identification numbers or documents, and you should not send those through it — where an engagement needs them, they are collected through a channel meant for the purpose.',
    ],
  },
  {
    id: 'processors',
    heading: 'Who else is involved',
    body: [
      'Three providers, each for one narrow purpose and none permitted to use your data for their own: Supabase for the database, Vercel for hosting, Resend for sending email. Their security posture forms part of ours, and any of them can be replaced if that stops being true.',
    ],
  },
  {
    id: 'incident',
    heading: 'If something goes wrong',
    body: [
      'If personal data held by this practice is exposed, the people affected are told directly and promptly — what was exposed, what it means for them, and what is being done about it. Reporting to the Data Protection Board follows the timelines in the Digital Personal Data Protection Act, 2023.',
      'No hedging about sophisticated attackers, and no waiting to see whether anyone notices.',
    ],
  },
  {
    id: 'report',
    heading: 'Reporting a vulnerability',
    body: [
      `If you find a security problem in this site, write to ${SITE.email} with enough detail to reproduce it. You will get an acknowledgement within two working days.`,
      'Report privately first and give us a fair chance to fix it. Do not access, change or delete anyone else’s data while demonstrating a problem, and do not run tests that degrade the service for other people. Good-faith research reported this way is welcome and will not be answered with legal threats.',
    ],
  },
];

export const COPYRIGHT: LegalSection[] = [
  {
    id: 'ours',
    heading: 'This site’s own material',
    body: [
      'The writing, diagrams, layout, identity and code of this website belong to The Paper Plane. Read it, quote it with attribution, send it to a colleague. Do not republish it wholesale as your own.',
    ],
  },
  {
    id: 'news',
    heading: 'The news page',
    body: [
      'The news page gathers headlines from third-party publications and links to them. Only the headline, the publication and the link appear here; the article itself stays where it was published and is not reproduced. Those pieces belong to their publishers and carry no endorsement from us.',
      'This is the part of the site most likely to touch somebody else’s rights, which is why the route below exists.',
    ],
  },
  {
    id: 'clients',
    heading: 'Client work shown here',
    body: [
      'Projects in the portfolio appear with the client’s permission. The screenshots are captures of live sites at a point in time; those sites belong to the clients and go on changing independently of this one.',
    ],
  },
  {
    id: 'takedown',
    heading: 'Asking for something to be removed',
    body: [
      `If material here infringes your copyright, write to ${SITE.email} with: what the material is and where on this site it appears; what it infringes, with a link to the original; your name and how to reach you; and a statement that you hold the rights or are authorised to act for whoever does.`,
      'Anything credible comes down while it is being looked at, not after. You will get a reply from a person, and if we believe the use was legitimate we will say why rather than ignore you.',
    ],
  },
];
