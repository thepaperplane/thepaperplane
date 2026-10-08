# The Paper Plane

Next.js 15 (App Router), React 19, TypeScript, Tailwind v4, deployed on Vercel.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script              | What it does                                                |
| ------------------- | ----------------------------------------------------------- |
| `npm run dev`       | Development server                                          |
| `npm run build`     | Production build                                            |
| `npm run typecheck` | `tsc --noEmit`                                              |
| `npm run lint`      | ESLint, zero warnings tolerated                             |
| `npm run format`    | Prettier, writes                                            |
| `npm run verify`    | typecheck + lint + build                                    |
| `npm run audit`     | Accessibility, contrast, diagram and link audit — see below |
| `npm run seo`       | Search, answer and generative engine audit — see below      |

---

## The audit

`npm run audit` is the script that matters. Build, serve, then point it at the
running site:

```bash
NEXT_DIST_DIR=.next-audit npm run build
NEXT_DIST_DIR=.next-audit npx next start -p 3104 &
npm run audit -- http://localhost:3104
```

The separate `distDir` is not optional if you have `npm run dev` running.
`next dev` and `next start` share `.next`, so the dev server rewrites the
production build underneath the one being audited and every stylesheet starts
returning 400. The audit then measures an unstyled document. That produced a
six-hundred-line failure report in which every single entry was an artefact —
which is why the run now refuses to start unless it can prove the target is
serving its stylesheets.

It sweeps 15 pages across three viewports and both themes, and exits non-zero on
any failure. Every check in it exists because something actually broke — the
selection criterion is not "what could a linter assert" but "what went wrong
once and must never go wrong silently again":

- **Reveals.** An effect with an empty dependency array inside the root layout
  runs once per session, and the App Router keeps that layout alive across
  navigations. Every page reached by clicking a link rendered with its body at
  `opacity: 0` — thirty blocks and twenty-one service names invisible. Three
  rounds of "clean" audits missed it because those audits set `data-shown` by
  hand before measuring. This one scrolls the page like a visitor and refuses to
  help it along.
- **Contrast**, composited through the full translucent stack. Once the site went
  to glass, stopping at the first opaque ancestor started reporting comfortable
  numbers for text sitting on three stacked translucent layers over a tinted
  field.
- **Target size**, WCAG 2.5.8, with the inline-in-a-sentence exemption actually
  implemented. Twenty to thirty per page were under 24×24 when first measured.
- **Diagram labels** colliding with each other or escaping their frame. Invisible
  to every other kind of test, and there are nearly forty drawings.
- **Structured data** parses. Markup that disagrees with the page is the one SEO
  error that gets a domain distrusted rather than ignored.
- **Internal links** resolve. `/privacy` and `/terms` shipped in every footer and
  in the sitemap while returning 404.
- **Preflight**: that the target is serving its stylesheets at all, before a
  single pixel is measured. See the warning above.

CI runs this on every push. If it fails, the thing it names is real — the audit
has been wrong twice and both times the fix was to the audit, so check it with
a second method before changing the site.

---

## Search, answer and generative engines

`npm run seo` — a second sweep against the same running server, because three
different consumers read this site and want different things:

|         | What it wants                                                                                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEO** | A unique title and description per URL, a canonical pointing at itself, a sitemap that agrees with what is routable, and structured data that does not contradict the page. |
| **AEO** | The question asked in a heading and answered directly beneath it, plus `FAQPage` / `HowTo` / `DefinedTerm` markup to lift the answer out of.                                |
| **GEO** | Specific, checkable facts near the claim — a section number, a due date, a threshold. Thin pages get summarised away; dense ones get quoted.                                |

Current state: 14 indexable pages, 14 unique titles and descriptions, all under
160 characters; `ProfessionalService`, `WebSite`, `BreadcrumbList`, `FAQPage`,
`HowTo` and `DefinedTermSet` present and parsing; 12,418 words carrying 134
citable facts. `/lab` is `noindex`, disallowed in `robots.ts` and absent from
the sitemap, and the audit fails if any of those three drift apart.

Two checks are deliberately narrower than they first appear. The
question-heading check ignores anything without a real answer under it —
"Holding a notice?" above a contact form is a question by punctuation only. And
it skips `/news` entirely: those headlines belong to other publishers, and
marking them up as answers this practice gives would misrepresent authorship
for a rich result.

---

## Design system

Tokens live in `app/globals.css` (type, colour, rhythm) and `app/glass.css`
(material, motion). Nothing hard-codes a colour or a duration.

### Glass

Five layers, and it looks wrong if any one is missing: a translucent fill, a
backdrop blur **with a saturation lift**, a specular rim, an interior sheen, and
depth. The saturation is why glass reads as alive over colour rather than as
frosted plastic, and the rim is a masked gradient ring because a real edge
catches light unevenly.

Values are calibrated against measurements — Apple's published Liquid Glass
components were imported through the Figma plugin API and their fills, radii and
effects read off. **No third-party asset is reproduced**; these are numbers, and
the implementation is ours. That measurement corrected three wrong assumptions:
the radius is far larger than it looks (34px), the blur far smaller (12–14px),
and the fill is a **blend** — `color-burn` in dark, `screen` in light — not an
alpha wash. The blend is the whole difference between rich and milky.

`backdrop-filter` makes the compositor re-sample everything behind an element on
every frame it changes, so the material carries a budget:

| Material  | Use                                               |
| --------- | ------------------------------------------------- |
| `regular` | The default. Panels, sheets.                      |
| `thin`    | Bars over content that must stay readable.        |
| `thick`   | Surfaces that should obscure what they cover.     |
| `clear`   | Barely there; only needs an edge.                 |
| `static`  | **No filter.** Anything that repeats down a list. |

Cards are static. `/calendar` carries 16 glass surfaces and **2** live filters;
`/services` carries 24 and the same 2. Keep it that way.

**Never hand-write `-webkit-backdrop-filter`.** Lightning CSS treats the two
spellings as one property and keeps whichever comes last, so the conventional
unprefixed-then-prefixed pair compiles to _the prefixed one alone_ — and
Chromium does not support `-webkit-backdrop-filter` at all (`CSS.supports`
returns false for it). Written that way, every glass surface on the site shipped
with no blur in any browser but Safari, which was a legibility bug rather than a
cosmetic one: page content read straight through the header. Write the standard
property by itself and let the compiler prefix it.

Glass also needs something behind it — `.ambient-field` in `app/layout.tsx`. It
is a `position: fixed` element at `z-index: 0` with content lifted above it,
which is neither of the two obvious approaches, both of which fail: a negative
`z-index` child paints _behind_ body's own background, and gradients on `:root`
with `background-attachment: fixed` cannot be composited and repaint the whole
viewport on every scroll.

### Motion

A hierarchy, not a pile of durations — the size of the thing moving sets how
long it takes, from `--dur-press` (90ms) to `--dur-hero` (980ms). Springs are
solved and sampled as `linear()` ramps.

**A spring ramp must terminate at exactly 1.** One of these shipped ending at
1.1213, which does not read as a bounce: it lands every animation using it
permanently 12% past its target.

Scroll reveals are driven by `components/site/reveal.tsx`, keyed on the
pathname, with a passive scroll pass as a backstop and **no dependency on
`requestAnimationFrame`** — rAF does not fire in a backgrounded tab, and nothing
that decides whether content is visible should depend on the compositor running.

Everything resolves to its finished state under `prefers-reduced-motion`.
Nothing is merely sped up.

### Motion stages

Every explanatory animation — the 22 service scenes, the two practice scenes,
the five engagement steps, the nine Knowledge Corner walkthrough scenes, the
calendar dial and the About page's vision scene — is a **motion stage**
(`components/motion`). A stage is ordinary server-rendered markup authored in
its finished state; `stage.tsx` layers the film on top with the Web Animations
API from `data-m` / `data-at` attributes. So:

- with motion reduced, scripts off, or for a crawler, every stage is simply its
  finished picture;
- everything is placed and sized in `cqi`, so a scene is one drawing at any
  width, type included;
- a stage plays only while a third of it is on screen and pauses — keeping its
  place — when scrolled away, so a page of twenty runs one or two at a time;
- animated elements use the individual `translate` / `rotate` / `scale`
  properties for static placement, never `transform`, which the film owns.

Each scene acts out the same three beats as the words beside it — what the
client hands over, what is done, what comes back — and lands on the deliverable
in green. Colours never change meaning: the discipline's hue for the subject,
green for the outcome, amber for the exception. Scene markup lives beside its
page (`components/services/scenes-*.tsx`, `components/practice/scenes.tsx`,
`components/home/process-scenes.tsx`, `components/knowledge/scenes.tsx`); styles
in `app/motion.css`. The service's three beats as text are in
`content/service-flows.ts`, which the site assistant also reads.

---

## The design lab

`/lab` — every material, timing, spring and drawing on one page, with replay
controls. It is `noindex` and excluded in `robots.ts`.

It is a route rather than a separate Storybook on purpose: it deploys with the
site, reviewers open a URL with no install step, and it renders with the same
tokens as production, so it physically cannot drift from the real thing. If you
want the Storybook addon ecosystem (interaction tests, a11y panel) that is a
reasonable thing to add alongside — but the a11y panel would be _less_ accurate
than `npm run audit`, which understands this site's translucency.

---

## The console — `/admin`

Exactly one account can use it: **contact@thepaperplane.co.in**. Enforced three times — middleware
(`middleware.ts`), every server action and route handler (`lib/auth.ts`), and Postgres, where
`is_console_owner()` sits under every row-level-security policy. Any other account that signs in is
signed out immediately.

**Two-factor sign-in is mandatory.** The first sign-in goes to `/admin/setup-2fa` to enrol an
authenticator app; every later one to `/admin/verify`. Once a factor exists the database refuses a
password-only session outright. Lost phone: set `CONSOLE_REQUIRE_MFA=false` in Vercel only long
enough to remove the factor in Supabase and enrol a new one.

| Section             | What it is for                                                                   |
| ------------------- | -------------------------------------------------------------------------------- |
| Overview            | New enquiries, money owed, deadlines this week, traffic and conversion           |
| Leads & enquiries   | Pipeline states, campaign source, budget, timeline; convert to client; CSV       |
| Clients             | Records, onboarding, engagements, **document vault**, tasks, invoices            |
| Tasks & deadlines   | Every dated obligation, overdue in red                                           |
| Invoices            | Ledger of billed / paid / overdue; totals for the financial year                 |
| Analytics           | Cookieless page views, referrers, campaigns, devices, enquiry sources            |
| Campaigns           | Tracked-link builder (WhatsApp, Instagram, LinkedIn, QR…), share links, exports  |
| Testimonials        | Add, publish, order; the homepage section appears only once one is published     |
| Pages & copy        | Visual editor entry point and the list of every edit, with reset                 |
| Work                | Capture, re-capture (now including full-length pages), feature, upload captures  |
| Careers             | Post roles (also as Google `JobPosting`), review applications, private CVs       |
| Site settings       | Contact channels, announcement bar, social profiles                              |
| Security            | Protection checklist, sign out everywhere, activity log                          |
| Meetings            | Google Calendar connection, bookable hours, every call booked, cancel            |
| WhatsApp assistant  | The AI bot number: on/off, pause per chat, hand-overs, replies from the console  |
| Site assistant      | On/off, quality/cost tier, opening line, daily limit, extra answers, transcripts |
| Quotations          | Private per-client price pages, request link, filters, add-ons, final invoice    |
| Pricing             | Edit every service's fee, government charges, suggestions                        |
| Autopilot           | What runs on its own, readiness checklist, WhatsApp templates, activity log      |
| Zoho & integrations | Zoho CRM + Books; Books customers → clients, invoices in, leads out              |

Each client record also has **Portal access**: on/off, invite by email, and "Invite to Zoho portal".

### Visual editing

Signing in sets a hint cookie (`pp_editor`) that makes the public site load the editor for the owner
only. Switch editing on from the floating bar, click any outlined text, type, press Enter. Saves go
to `/api/admin/copy`, which re-authorises the owner on every request. Wrap new copy in
`<Editable k="page.slot">` to make it editable.

### Site assistant

`components/assistant` (widget) and `app/api/assistant` (streaming route). It answers from
`lib/assistant/knowledge.ts`, which renders the site's own content modules as text, plus the
owner's extra answers and notes from the console — nothing else. The rules
(`lib/assistant/prompt.ts`) forbid general or personal tax advice, fees, turnaround promises and
outcomes; anything that turns on a visitor's own facts is routed to the free first read. When a
visitor is ready, it records an enquiry (`record_enquiry` tool) after they have typed their contact
details. The model is a console setting (`lib/ai/claude.ts`): **Economy** (Claude Haiku 4.5, the
default — the cheapest, and enough for answering from a fixed reference), Balanced (Sonnet 5.5) or
Best (Opus 5.5). The newer tiers run with adaptive thinking at low effort and `fallbacks: "default"`
(beta `server-side-fallback-2026-07-01`); Haiku takes neither, so those fields are only sent where
accepted. The stable system block (rules + reference) is prompt-cached for an hour. History is read from the database, never
trusted from the browser. Limits: 10 messages per 2 minutes per IP, 60 a day per visitor, and a
site-wide daily cap set in the console. Needs `ANTHROPIC_API_KEY`.

### WhatsApp assistant

A separate WhatsApp number answered by Claude (`lib/whatsapp-bot.ts`), the way the Vihana Dental
Care bot works. **It must be a new number — never 9025565526**, which stays on the WhatsApp app;
`saveBotSettings` refuses it and the webhook ignores events for any other phone-number ID. The
assistant speaks as the practice's front desk: answers from the same reference as the site
assistant, qualifies the enquiry service by service, saves it (`save_client_details`), offers and
books real calendar slots (`offer_meeting_slots`, `book_meeting`), sends tap-to-reply buttons, and
hands over to a person (`request_human`) — which pauses it for that chat. Clients already on the
books are recognised by phone and pointed to the portal. It replies after the webhook has answered
Meta (`after()`), shows a typing indicator, and has a daily reply cap.

### Meetings — `/book`

`lib/scheduling.ts` offers slots inside the hours set in the console, minus whatever is busy in the
owner's Google Calendar (`freeBusy`), and books them as Calendar events with a Meet link and the
client as a guest (`lib/integrations/google.ts`, OAuth with offline access, tokens encrypted). The
same slots are offered on `/book` and by the WhatsApp assistant.

### Client portal — `/portal`

Clients sign in with the email or phone already on their record: a 6-digit code by email, or by
WhatsApp from the assistant number when an Authentication template is set (Autopilot). Codes are
peppered hashes, expire in 10 minutes and lock after 5 tries; the start endpoint answers the same
way for strangers. Sessions are random tokens (`pp_portal`, httpOnly, 14 days) stored hashed in
`portal_sessions`; access is re-derived from the client record on every request. Clients see
their Zoho Books invoices (PDF, pay online via Zoho), documents the practice has marked "In
portal", and can upload documents back. Set `ZOHO_PORTAL_URL` to also link to Zoho's own portal.

### Autopilot — `/admin/automations`

`lib/automations.ts`, every morning at 07:00 IST (riding on the news cron) or from "Run now":
Zoho Books sync (new customers → clients, invoices mirrored), overdue invoices marked and chased
weekly, today's calls reminded with the Meet link, client deadlines in the next three days nudged
once, and one digest email to the owner. Enquiries get an instant acknowledgement with a link to
`/book`. Every message is logged in `automation_log`, and each job checks it has not already been
done, so running twice sends nothing twice. WhatsApp messages outside the 24-hour window use the
approved templates named in the console.

### Work page: live view and videos

Where a client's site allows being framed (`lib/embed.ts`), the Work page opens it **live** in the
browser frame as it scrolls into view — fully browsable at true desktop width, with "Back to
preview" for anyone who prefers the image. Where it does not (a `X-Frame-Options` or
`frame-ancestors` policy, as on Shopify storefronts), it shows a capture; the console's Portfolio
page states which applies for each project and the header to add on a site you host. Full-page
captures use ScreenshotOne's `by_sections` algorithm so `100vh` heroes are not stretched.

Each project can have **launch or testimonial videos** (`project_videos`, bucket `work-videos`).
The console uploads straight to storage through a signed URL (up to 50 MB, MP4/WebM/MOV). On the
site a project with no video shows no player; with one or more it autoplays muted while on screen,
with play/pause, a sound toggle (one video speaks at a time) and full screen, and a still frame
for visitors who prefer reduced motion.

### Quotations — prices that only clients see

Prices appear **nowhere on the public site**: not in HTML, the sitemap, the assistants' replies or
the Work page. The default menu card lives in `lib/quotes/catalog-data.ts`; the console's
**Pricing** page stores overrides in `quote_services` (professional fees, per-variant fees such
as the GST-return slabs, and government charges shown as separate "at actual cost" lines).

- **Request** — `/get-quote` (unlisted, noindex; accepts `?s=gstreg,gstret` and `?src=instagram`).
  The visitor picks services and answers the one or two questions each depends on. The server
  builds the quotation and emails a private link; the response never contains a price.
- **The page** — `/q/<token>`: 144-bit token, expiring (default 14 days), open-limited (default
  15), watermarked with the client's name, `noindex`, `no-store`, no chrome. Menu-card layout with
  what's included, documents, steps, a value line per service, government charges apart from our
  fee, one-tap suggestions of related services with their price, web work and client video links
  for website quotes, and an explanation that every client is different — it is a starting
  estimate and the final fee is confirmed in writing after understanding the client.
- **Filters** — every request is scored (business email, phone, business name, message,
  value, urgency) and screened: throwaway emails, repeats and the console's competitor list are
  _held for review_ rather than sent. Modes: auto / score threshold / manual. Nothing is
  discarded.
- **Separate quotes** — each enquiry gets a quotation containing only the services asked about.
  The console builder (`/admin/quotes/new?enquiry=…`) edits amounts per client; the WhatsApp
  assistant's `send_quote` tool and the website request do the same automatically, 24×7.
- **Add-ons** — extra work after acceptance is added to the quotation's ledger
  (`quote_addons`) with a price, approved by the client on their quotation page, and carried onto
  the **final invoice** with its date: the original quotation first, then each add-on.
- **Documents and process** — every service has a numbered checklist (`lib/quotes/checklists.ts`,
  modelled on the GST-registration message: send a scan, tell us, take a photo, share a location),
  a typical processing time and an illustrated, animated process flow on the quotation page. On
  acceptance the list is emailed; **Send the documents list** in the console also sends it on
  WhatsApp. On a **Final** accepted quotation the page shows the fee, a UPI QR and "make the
  payment to initiate the work" (UPI ID is set in Quotations → Filters). Processing times are
  written as "typically" — keep them honest.
- **Included services** — allied work is never sold twice: partnership registration includes the
  deed and firm PAN, company incorporation includes GST registration (`includes` in the catalogue).
- **Follow-ups** — Autopilot nudges unopened, unanswered and expiring quotations.

Plain-language guidance — "do I need GST at ₹10 lakh turnover?" — comes from
`content/guides.ts`, which both assistants use and nothing else. **Thresholds change: update the
file (and `GUIDES_CHECKED`) when they do**, because the assistants repeat whatever it says.

### Integrations

- **Zoho CRM + Books** — one OAuth connection (`lib/integrations/zoho.ts`, India data centre by
  default). Tokens are AES-256-GCM encrypted before storage (`INTEGRATIONS_KEY`). Every push is
  recorded in `integration_links`, so syncing twice never duplicates. Optional: every new enquiry
  (form or assistant) goes to CRM automatically, after the visitor already has their answer.
- **WhatsApp Business** — `app/api/whatsapp/webhook` verifies Meta's `X-Hub-Signature-256` over the
  raw body before parsing; the inbox at `/admin/whatsapp` replies inside Meta's 24-hour window and
  sends approved templates outside it.
- **Live previews on /work** — `lib/embed.ts` checks each client site's `X-Frame-Options` /
  `frame-ancestors`. Where framing is allowed, "Try it live" swaps the capture for the real site,
  scaled from its true width. To allow it on a site built here, send
  `Content-Security-Policy: frame-ancestors 'self' https://www.thepaperplane.co.in https://thepaperplane.co.in`
  and no `X-Frame-Options`.

### Database

Migrations live in `supabase/migrations/`. Everything added in October 2026 is additive: new tables
(testimonials, jobs, job_applications, client_documents, tasks, invoices, enquiry_meta,
project_media, page_views, audit_log, site_settings; then assistant_conversations,
assistant_messages, assistant_knowledge, integrations, integration_links, integration_log,
wa_contacts, wa_messages; then meetings, portal_codes, portal_sessions, client_portal,
automation_log — RLS on, no policies, server-only) and three storage buckets — `site-media`
(public images), `vault` and `resumes` (private, signed URLs only).

---

## Content

Copy, services, calendar dates and knowledge entries live in `content/` as typed
data, not in components. The CMS in `/admin` overrides `content/` at runtime; the
hard-coded defaults are what renders when the database is unavailable, so the
site is correct with no database at all.

**Legal pages are written against the code.** The cookie policy states there are
no cookies for visitors, which is verified by their absence in the source; the
visit counter (`app/api/track`) is aggregate and cookieless, and the policy says
exactly what it stores. If you add
analytics, an embed, or anything that writes to a browser, `/cookies` and
`/privacy` change in the same commit — a policy that has drifted from the
software is a written statement that is no longer true.

**Scope.** This practice does not carry out statutory or tax audit; those are
reserved to a practising chartered accountant. `content/services.ts` says so
explicitly. Do not reintroduce them as services.

---

## Deployment

Vercel, `bom1`. `vercel.json` pins the framework and build command because the
dashboard setting was stale. Two cron jobs: news aggregation daily (which also
runs Autopilot), the calendar email monthly.

Required environment variables are read at build time — see `lib/supabase.ts`,
`lib/email.ts` and `lib/capture.ts`. Every data path degrades gracefully when
they are absent, which CI exercises by building without them.
