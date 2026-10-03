# The Paper Plane — design system

**Brand line:** Your Vision, Our Wings — `SITE.tagline` in `lib/site.ts`, the single source for the
homepage headline, logo lockup, share card, footer sign-off and organisation schema.

**Dials:** design variance 7 · motion intensity 7 · visual density 4.

## Promise of the homepage (the five-second test)

| Question a visitor has  | Where it is answered                                      |
| ----------------------- | --------------------------------------------------------- |
| What business is this?  | Kicker above the headline: websites, software, tax        |
| Who are they?           | Headline: the brand line                                  |
| What do I get?          | Lede and the two-discipline offer                         |
| Why them?               | Proof chips, "What changes the week you join", process    |
| What problem goes away? | "Sound familiar?" — three pains, struck through, answered |

## Tokens

Type, colour and rhythm: `app/globals.css`. Material and motion timing: `app/glass.css`. Interaction
layer, 3D scene, CTA, bento and browser frame: `app/fx.css`.

- **Type** — IBM Plex Serif (display, 500), Plex Sans (body/UI), Plex Mono (statutory references).
  Hero `--hero-title`: clamp 3.1rem → 7.75rem.
- **Colour** — ink on ground, one accent (`--accent`, `#1b6e92` light / `#4fb6e0` dark), brand blue
  `#35a5d5` for the italic half of the brand line, navy `#1c3252` for the plane's keel and the
  closing panel.
- **Surfaces carrying text use plain `rgb()`**, never `color-mix()` or Tailwind `/NN` opacity — those
  compute to oklab, which the contrast audit cannot read. `--bento-bg`, `--cta-ghost-bg`,
  `--scene-card-bg` exist for this.
- **Radius** — capsules for calls to action (`.cta`), 1.6rem for bento cards, the glass radii for
  glass.

## Interaction layer — `components/fx`

One client engine (`interactions.tsx`), one listener, one sleeping animation loop:

| Attribute                  | Effect                                                         |
| -------------------------- | -------------------------------------------------------------- |
| `data-magnetic="0.3"`      | Pulled toward the pointer; the cursor ring wraps the control   |
| `data-magnetic-inner`      | Moves a little further than its parent, for depth              |
| `data-tilt="6"`            | 3D tilt toward the pointer with a moving glare (`<Tilt>`)      |
| `data-cursor-label="View"` | Cursor becomes a filled disc carrying the word                 |
| `data-parallax`            | Receives `--px` / `--py` (−1…1), smoothed — drives the 3D hero |

Mouse and pen only; never under `prefers-reduced-motion`; the system cursor is hidden only after the
custom one has moved. Never put `data-tilt` on an element that also has `.reveal` — both own
`transform`.

## Motion vocabulary

Word-by-word 3D headline (`data-reveal="words"`), masked line reveals, scroll-scrubbed statement
(`<ScrubWords>`), scroll-driven process rail, marquee, scroll progress flight, magnetic capsules,
tilt cards, the hero plane (arrive → hover → bank toward pointer → climb away on scroll). All CSS
except the pointer; all resolve to their finished state with motion reduced or JavaScript off.

## Editing

Any string rendered through `<Editable k="page.slot">default</Editable>` can be clicked and retyped on
the live site by the console owner (`components/editable`). Defaults live in the code; the database
only overrides. Keys match `COPY_KEY` in `lib/copy.ts`.
