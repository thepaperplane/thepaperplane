/**
 * Privacy and terms content.
 *
 * Written against what the code actually does, not from a template. Every
 * claim here is checkable in the repository:
 *
 *   - the enquiry fields are the Zod schema in app/api/contact/route.ts
 *   - the subscription fields are the schema in app/api/calendar/subscribe/route.ts
 *   - "no analytics" is verifiable by the absence of any tag manager, pixel or
 *     analytics package anywhere in the project
 *   - the only browser storage is the theme key written by components/site/theme.tsx
 *
 * If any of those change, this file changes with them. A privacy policy that
 * has drifted from the software is worse than none, because it is a written
 * statement that is no longer true.
 *
 * These are plain-English site policies, not a substitute for the practice's
 * own legal review before publication.
 */

import { SITE } from '@/lib/site';

export type LegalSection = {
  id: string;
  heading: string;
  /** Paragraphs. */
  body: string[];
  /** Optional definition rows — used for the data tables. */
  rows?: { term: string; detail: string }[];
  /** Optional plain list. */
  list?: string[];
};

export const PRIVACY_UPDATED = '14 September 2026';
export const TERMS_UPDATED = '14 September 2026';

export const PRIVACY: LegalSection[] = [
  {
    id: 'summary',
    heading: 'The short version',
    body: [
      'This website runs no analytics, sets no advertising or tracking cookies, and embeds nothing from a social network. There is no tag manager, no pixel and no session recorder anywhere in it. Nobody is profiled for visiting.',
      'Two forms collect personal data, and only because they cannot work otherwise: the enquiry form and the compliance calendar subscription. Everything below is the detail of those two.',
    ],
  },
  {
    id: 'enquiry',
    heading: 'When you send an enquiry',
    body: [
      'The contact form stores what you type so that somebody can reply to it. Nothing is inferred, enriched or bought in from anywhere else.',
    ],
    rows: [
      { term: 'Name', detail: 'Required, so a reply can be addressed to someone.' },
      { term: 'Email address', detail: 'Required. This is how we reply.' },
      { term: 'Phone number', detail: 'Optional. Given only if you would rather be called.' },
      { term: 'Company', detail: 'Optional. Helps scope the answer.' },
      { term: 'Service of interest', detail: 'Optional. Whichever service you arrived from.' },
      { term: 'Your message', detail: 'Required, and kept as written.' },
    ],
  },
  {
    id: 'calendar',
    heading: 'When you subscribe to the compliance calendar',
    body: [
      'The subscription stores your email address so the monthly reminder can be sent, and an optional name so it can be addressed properly. You also pick which set of dates applies to you, which decides what the email contains.',
      'Every email carries a one-click unsubscribe link and an unsubscribe header your mail client can act on directly. Unsubscribing removes you from the sending list immediately; you do not have to ask anyone.',
    ],
  },
  {
    id: 'storage',
    heading: 'Where it is kept, and for how long',
    body: [
      'Enquiries and subscriptions are stored in a Postgres database hosted by Supabase in the Mumbai (ap-south-1) region, so this data does not leave India in normal operation.',
      'Enquiries are retained while the matter is live and for as long afterwards as a professional engagement requires records to be kept. Subscriptions are retained until you unsubscribe. Ask and we will delete either sooner, unless a statutory retention obligation applies to an engagement that has already begun.',
    ],
  },
  {
    id: 'processors',
    heading: 'Who else touches it',
    body: [
      'Three service providers process data on our behalf, each for one narrow purpose, and none of them are permitted to use it for their own:',
    ],
    rows: [
      {
        term: 'Supabase',
        detail:
          'Database and authentication. Hosts the enquiry and subscription records, in India.',
      },
      {
        term: 'Vercel',
        detail: 'Website hosting. Serves the pages and keeps standard server request logs.',
      },
      {
        term: 'Resend',
        detail: 'Email delivery. Sends the enquiry notification and the monthly calendar email.',
      },
    ],
  },
  {
    id: 'browser',
    heading: 'What is stored in your browser',
    body: [
      'One value: whether you chose the light or dark theme, under the key `pp.theme`. It stays on your device, is never transmitted, and exists so the site does not flash the wrong colour at you on the next page.',
      'There are no cookies on the public site. The administrative console, which only the practice can reach, uses a session cookie to keep a signed-in user signed in.',
    ],
  },
  {
    id: 'rights',
    heading: 'What you can ask for',
    body: [
      'Under the Digital Personal Data Protection Act, 2023 you have specific rights over the data this practice holds about you, and none of them require a reason:',
    ],
    rows: [
      {
        term: 'Access',
        detail:
          'A summary of the personal data held about you, what it is being processed for, and which of the providers below it has been shared with.',
      },
      {
        term: 'Correction',
        detail:
          'Correction of anything inaccurate, completion of anything incomplete, and updating of anything out of date.',
      },
      {
        term: 'Erasure',
        detail:
          'Deletion, unless a statutory retention obligation applies to an engagement already under way — in which case you are told which one and for how long.',
      },
      {
        term: 'Withdraw consent',
        detail:
          'As easily as it was given. The calendar email carries a one-click unsubscribe; for anything else, one line to the address below.',
      },
      {
        term: 'Nominate',
        detail:
          'Nominate someone to exercise these rights on your behalf in the event of death or incapacity, under section 14.',
      },
      {
        term: 'Complain',
        detail:
          'Raise a grievance with us first — see below — and, if you are not satisfied with how it is handled, complain to the Data Protection Board of India.',
      },
    ],
  },
  {
    id: 'grievance',
    heading: 'Who answers, and how fast',
    body: [
      `Grievances about personal data are handled by the practice’s Data Protection contact, reachable at ${SITE.email} with “Data protection” in the subject line, or on ${SITE.phone}.`,
      'You will get an acknowledgement within two working days and a substantive answer within thirty days, which is the period the Act works to. If a request is refused you are told which provision it is refused under, not simply that it cannot be done.',
      'If that does not resolve it, you can escalate to the Data Protection Board of India. Doing so does not require our permission and will not affect any engagement.',
    ],
  },
  {
    id: 'children',
    heading: 'Children',
    body: [
      'This is a website for businesses and the people who run them. It is not directed at children, it does not knowingly collect data from anyone under eighteen, and there is no behavioural tracking or advertising on it of the kind section 9 prohibits in relation to children — because there is none of that on it for anyone.',
      'If you believe a child has sent us personal data through this site, tell us and it will be deleted.',
    ],
  },
  {
    id: 'contact',
    heading: 'Asking',
    body: [
      `Write to ${SITE.email}, or call ${SITE.phone}. The practice operates remotely across India, so there is no counter to visit — but there is always a named person answering.`,
    ],
  },
];

export const TERMS: LegalSection[] = [
  {
    id: 'scope',
    heading: 'What these terms cover',
    body: [
      'These terms govern your use of this website. They are not the terms of a professional engagement. Any actual piece of work — a filing, a defence, an audit, a build — is governed by a separate written engagement letter that sets out scope, fee and timeline, and that letter prevails over anything on this site.',
    ],
  },
  {
    id: 'not-advice',
    heading: 'Nothing here is advice for your situation',
    body: [
      'The Knowledge Corner, the compliance calendar and everything else published here is general information about how Indian tax, GST, corporate and audit obligations work. It is written carefully and reviewed, but it is written for nobody in particular.',
      'Statute changes, due dates are extended, and the facts of your case decide the answer. Do not act on a page of this website without taking advice on your own position. If you act on general information and it goes wrong, that is not a matter this website can be held to.',
    ],
  },
  {
    id: 'dates',
    heading: 'The compliance calendar',
    body: [
      'The dates published here are the standard statutory positions. The department extends deadlines at its discretion, sometimes at very short notice, and an extension will not always be reflected here immediately.',
      'The calendar is a prompt, not a guarantee. The obligation to meet a statutory deadline remains yours, or your engaged advisor’s under the terms of that engagement.',
    ],
  },
  {
    id: 'news',
    heading: 'Aggregated news',
    body: [
      'The news page collects headlines from third-party publications and links to them. Those articles are the work and property of their publishers, are reproduced only as a headline and a link, and carry no endorsement. Follow the link to read the original.',
    ],
  },
  {
    id: 'work',
    heading: 'Client work shown on this site',
    body: [
      'Projects in the portfolio are shown with the client’s permission. The screenshots are captures of the live sites at a point in time; those sites belong to the clients and continue to change without reference to this one.',
    ],
  },
  {
    id: 'ip',
    heading: 'This site’s own material',
    body: [
      'The written content, diagrams, layout, identity and code of this website belong to The Paper Plane. Read it, quote it with attribution, send it to a colleague. Do not republish it wholesale as your own.',
    ],
  },
  {
    id: 'availability',
    heading: 'Availability',
    body: [
      'The site is offered as it is. It is maintained attentively, but no uptime is promised, and a page may be changed, corrected or withdrawn at any time — including because it became wrong.',
    ],
  },
  {
    id: 'law',
    heading: 'Governing law',
    body: [
      'These terms are governed by the laws of India, and the courts of India have jurisdiction over any dispute arising from use of this website.',
    ],
  },
];
