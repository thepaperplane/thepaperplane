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

### Drawings

Roughly forty inline SVGs across `components/diagrams`, `components/knowledge`,
`components/services` and `components/practice`. All server-rendered — the
services page ships 181 B of client JavaScript with 22 animated drawings on it.

Two rules: **structure is permanent, only the action loops**, and every element
is authored in its finished state with motion layered on top, so reduced motion
and any renderer that ignores CSS animation get the completed diagram rather
than an empty frame.

Diagrams inside a slideshow loop, because one is on screen at a time and the
loop is the explanation. Drawings beside prose play once and hold — a loop next
to a paragraph someone is reading is a distraction.

SVG text is measured in user units, so it shrinks with the frame. Large frames
carry a small-screen scale boost; the small service frames size themselves from
their **container**, not the viewport, because the same breakpoint renders them
at 304px on a desktop and 144px in a two-column tablet grid.

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

## Content

Copy, services, calendar dates and knowledge entries live in `content/` as typed
data, not in components. The CMS in `/admin` overrides `content/` at runtime; the
hard-coded defaults are what renders when the database is unavailable, so the
site is correct with no database at all.

**Legal pages are written against the code.** The cookie policy states there are
no cookies, which is verified by their absence in the source. If you add
analytics, an embed, or anything that writes to a browser, `/cookies` and
`/privacy` change in the same commit — a policy that has drifted from the
software is a written statement that is no longer true.

**Scope.** This practice does not carry out statutory or tax audit; those are
reserved to a practising chartered accountant. `content/services.ts` says so
explicitly. Do not reintroduce them as services.

---

## Deployment

Vercel, `bom1`. `vercel.json` pins the framework and build command because the
dashboard setting was stale. Two cron jobs: news aggregation daily, the calendar
email monthly.

Required environment variables are read at build time — see `lib/supabase.ts`,
`lib/email.ts` and `lib/capture.ts`. Every data path degrades gracefully when
they are absent, which CI exercises by building without them.
