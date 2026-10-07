/**
 * Privacy and terms content.
 *
 * Written against what the code actually does, not from a template. Every
 * claim here is checkable in the repository:
 *
 *   - the enquiry fields are the Zod schema in app/api/contact/route.ts
 *   - the subscription fields are the schema in app/api/calendar/subscribe/route.ts
 *   - the application fields are the schema in app/api/careers/apply/route.ts
 *   - the visit counter is app/api/track/route.ts: an aggregate counter with no
 *     cookie, no IP address and no identifier, and no third-party analytics
 *     package, tag manager or pixel anywhere in the project
 *   - browser storage is the theme key (components/site/theme.tsx) and the
 *     tab-scoped keys in components/site/analytics.tsx and the loader
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

export const PRIVACY_UPDATED = '7 October 2026';
export const TERMS_UPDATED = '14 September 2026';

export const PRIVACY: LegalSection[] = [
  {
    id: 'summary',
    heading: 'The short version',
    body: [
      'This website sets no advertising or tracking cookies and embeds nothing from a social network. There is no tag manager, no pixel, no third-party analytics and no session recorder anywhere in it. Nobody is profiled for visiting.',
      'It does count visits — how many times each page was read, which site or campaign link sent the visitor, and the device type and country — as anonymous daily totals. No cookie is set for this, no IP address is stored, and nothing in the count can identify you or link one visit to another. If your browser sends Do Not Track or Global Privacy Control, the visit is not counted at all.',
      'Personal data is collected only where something cannot work otherwise: the enquiry form, booking a call, the compliance calendar subscription, the job application form, the site assistant if you choose to use it, messages you send to our WhatsApp numbers, and — for clients — the client portal. Everything below is the detail of each.',
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
      { term: 'Budget and timeline', detail: 'Optional. Helps us answer with a realistic scope.' },
      { term: 'Your message', detail: 'Required, and kept as written.' },
      {
        term: 'How you found us',
        detail:
          'If you arrived through a tagged link (for example one shared on WhatsApp or LinkedIn), the campaign name on that link and the first page you landed on are sent with your enquiry. Nothing else about your visit is.',
      },
    ],
  },
  {
    id: 'booking',
    heading: 'When you book a call',
    body: [
      'Booking a call on the website, or through our WhatsApp assistant, stores your name, email address, optional phone number, what you would like to discuss and the time you chose. The call is placed in the practice’s own Google Calendar with you as a guest and a Google Meet link, so Google sends you the invitation and handles the video call under its own terms.',
      'On the morning of the call we send one reminder, by email and — if you booked on WhatsApp or have messaged us there — on WhatsApp. Booking records are kept with the enquiry they belong to.',
    ],
  },
  {
    id: 'quotation',
    heading: 'When you ask for a quotation',
    body: [
      'Prices are not published on this website. If you ask for a quotation — through the request page, our assistants, or because we prepared one for you — we store what you gave us so that it can be prepared and followed up: your name, email address, optional phone number and business name, the services you chose and the answers you gave about them, anything you wrote, when you need it, and the campaign link you arrived by if there was one.',
      'The quotation is a private page whose address is known only to you and us. It is sent to the email address you entered (or in the WhatsApp chat you started). It stops working after a set number of days or opens. Each time it is opened we record the time, your browser type and a one-way scrambled form of your network address — never the address itself — so that we can tell you have read it and notice if the link is being passed around. Quotations carry your name as a faint watermark for the same reason.',
      'A quotation request is screened automatically before it is sent: for example, throwaway email addresses, repeated requests and requests that match names we have asked the system to look out for are held for a person to review rather than answered automatically. Nothing is blocked from contacting us another way. If you accept a quotation, a client record is created from it so that onboarding can begin.',
      'Quotations and the add-ons asked for during a job are kept with the engagement as a record of what was agreed and charged, and for as long afterwards as a professional engagement requires; a quotation that was never accepted is kept for up to twelve months. Ask and we will delete it sooner.',
    ],
  },
  {
    id: 'careers',
    heading: 'When you apply for a role',
    body: [
      'The application form stores what you send so that we can consider you for the role: your name, email, and whatever optional details you add — phone, city, portfolio and LinkedIn links, years of experience, a note and a CV.',
      'Your CV is kept in private storage that is never publicly reachable; it is opened only by the practice, through links that expire within minutes. Applications are kept while a role is open and for up to twelve months afterwards in case a suitable role opens, unless you ask us to delete them sooner.',
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
    id: 'assistant',
    heading: 'When you use the site assistant',
    body: [
      'The assistant in the corner of the site answers questions from the website’s own content. To do that, what you type is sent to Anthropic, whose Claude model writes the reply; under Anthropic’s commercial terms that content is not used to train its models. The assistant does not ask for, and should not be given, identification numbers, bank details or documents.',
      'The conversation is stored so the practice can see what visitors ask and improve the answers the site gives: your messages and the replies, the page you started on, your browser type, and a one-way hash of your IP address that is used only to apply a daily limit and cannot be turned back into the address. Conversations are kept for up to twelve months and then deleted, or sooner if you ask.',
      'If you ask the assistant to pass your request to the team and give your name and an email or phone number, those details become an enquiry, handled exactly like one sent through the contact form.',
    ],
  },
  {
    id: 'whatsapp',
    heading: 'When you message us on WhatsApp',
    body: [
      'Messages to our WhatsApp numbers reach us through Meta’s WhatsApp Business Platform. We store your number, the name on your WhatsApp profile and the messages exchanged, so that the practice can reply and keep a record of what was agreed. WhatsApp’s own handling of the message is governed by Meta’s terms and privacy policy.',
      'Our WhatsApp assistant number is answered first by an AI assistant, and says so. As with the site assistant, your messages are sent to Anthropic, whose Claude model writes the reply, and are not used to train its models. It may ask for your name, email address, city, business name and what you need, so that it can open an enquiry for you and book a call; it never asks for PAN, Aadhaar, bank details or passwords. Photos and documents you send are kept by Meta and opened only by the practice; the files are not passed to the AI model. You can ask for a person at any time, and the practice can read and take over any conversation.',
    ],
  },
  {
    id: 'portal',
    heading: 'When you use the client portal',
    body: [
      'Clients can sign in at /portal with the email address or phone number registered with us. A six-digit code is sent to that address or number (by email, or by WhatsApp from our assistant number); only a one-way hash of the code is stored, it expires in ten minutes and can be used once. To stop guessing, a few wrong attempts lock the code.',
      'Once signed in, a session cookie keeps you signed in for up to fourteen days (see “What is stored in your browser”). We record when you signed in and your browser type, so that you and we can see unexpected sessions. Your invoices are fetched from Zoho Books when you open them; documents you upload are kept in private storage that is never publicly reachable. Signing out ends the session at once.',
    ],
  },
  {
    id: 'automated',
    heading: 'Messages we send automatically',
    body: [
      'Some routine messages go out without anyone pressing send: a thank-you when you submit an enquiry, a reminder on the morning of a booked call, a reminder when one of our invoices to you is past due (at most once a week), up to three gentle follow-ups on a quotation we sent you (if it has not been opened, is unanswered, or is about to close), and — for clients — a note when a deadline we are tracking for you is three days away. Each is about something you asked us for or an engagement already under way; none is marketing. Ask and we will switch any of them off for you.',
    ],
  },
  {
    id: 'storage',
    heading: 'Where it is kept, and for how long',
    body: [
      'Enquiries, subscriptions and applications are stored in a Postgres database hosted by Supabase in the Mumbai (ap-south-1) region, so this data does not leave India in normal operation.',
      'Enquiries are retained while the matter is live and for as long afterwards as a professional engagement requires records to be kept. Subscriptions are retained until you unsubscribe. Ask and we will delete either sooner, unless a statutory retention obligation applies to an engagement that has already begun.',
    ],
  },
  {
    id: 'processors',
    heading: 'Who else touches it',
    body: [
      'These service providers process data on our behalf, each for one narrow purpose, and none of them are permitted to use it for their own:',
    ],
    rows: [
      {
        term: 'Supabase',
        detail:
          'Database, file storage and authentication. Hosts the enquiry, subscription and application records and CVs, in India.',
      },
      {
        term: 'Vercel',
        detail: 'Website hosting. Serves the pages and keeps standard server request logs.',
      },
      {
        term: 'Resend',
        detail:
          'Email delivery. Sends enquiry and application notifications, acknowledgements and reminders, portal sign-in codes and the monthly calendar email.',
      },
      {
        term: 'Anthropic',
        detail:
          'Writes the replies of the site assistant and the WhatsApp assistant. Receives the conversation, not your IP address or any file you send.',
      },
      {
        term: 'Google',
        detail:
          'Google Calendar and Google Meet, for calls you book: the calendar event, the invitation and the video call.',
      },
      {
        term: 'Meta (WhatsApp)',
        detail:
          'Delivers WhatsApp messages between you and our business numbers, including portal sign-in codes and reminders.',
      },
      {
        term: 'Zoho',
        detail:
          'Our CRM and accounting software (Zoho CRM and Zoho Books, India data centre). An enquiry may be recorded there as a lead, and a client’s billing details as a customer; the invoices shown in the client portal are read from Zoho Books.',
      },
    ],
  },
  {
    id: 'browser',
    heading: 'What is stored in your browser',
    body: [
      'Your theme choice, under the key `pp.theme`, so the site does not flash the wrong colour at you on the next page. It stays on your device and is never transmitted.',
      'For the length of the browser tab only (session storage, cleared when the tab closes): whether the opening animation has already played, the first page you landed on, the campaign tags of the link you arrived by, and — if you use the assistant — your conversation, so it survives moving between pages. The landing page and campaign tags leave your device only inside an enquiry you choose to send.',
      'There are no cookies on the public site for visitors. Clients who sign in to the client portal get one session cookie, `pp_portal`, which keeps them signed in for up to fourteen days and is deleted when they sign out. The administrative console, which only the practice can reach, uses a session cookie to keep a signed-in user signed in, and a flag that tells the site to show the practice its editing tools.',
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
