import Link from 'next/link';
import * as React from 'react';
import { cn } from '@/lib/utils';

/* ==========================================================================
   EDITORIAL PRIMITIVES

   Note what is NOT here: there is no <Card>. v2 had 35 of them and every
   section ended up as a rounded box on a tinted ground, which is the default
   Tailwind/shadcn look the redesign is trying to escape. Structure now comes
   from Rule, Measure, Index and generous space.
   ========================================================================== */

/* --- Layout --------------------------------------------------------------- */

export function Container({
  className,
  size = 'page',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: 'page' | 'text' | 'wide' | 'content' }) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-6 sm:px-10',
        size === 'page' && 'max-w-[84rem]',
        (size === 'text' || size === 'content') && 'max-w-[38rem]',
        size === 'wide' && 'max-w-[96rem]',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Sections carry one of three heights. Varying the rhythm is what stops the
 * page reading as a stack of identical slabs.
 */
export function Section({
  className,
  rhythm = 'default',
  tone = 'ground',
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  rhythm?: 'sm' | 'default' | 'lg';
  tone?: 'ground' | 'surface' | 'sunken' | 'inverse';
}) {
  return (
    <section
      className={cn(
        rhythm === 'sm' && 'py-[var(--space-section-sm)]',
        rhythm === 'default' && 'py-[var(--space-section)]',
        rhythm === 'lg' && 'py-[var(--space-section-lg)]',
        tone === 'surface' && 'bg-surface',
        tone === 'sunken' && 'bg-sunken',
        tone === 'inverse' && 'bg-inverse text-inverse-ink',
        className,
      )}
      {...props}
    />
  );
}

/** Full-width hairline. The primary structural device. */
export function Rule({ className }: { className?: string }) {
  return <div className={cn('rule', className)} role="presentation" />;
}

/* --- Type ----------------------------------------------------------------- */

export function Label({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('label', className)} {...props} />;
}

/** Statutory reference: s.148, GSTR-3B, GSTR-2B. */
export function Ref({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('ref text-ink-3', className)} {...props} />;
}

/** Editorial index numeral — 01, 02, 03. */
export function Numeral({ value, className }: { value: number | string; className?: string }) {
  const text = typeof value === 'number' ? String(value).padStart(2, '0') : value;
  return (
    <span className={cn('numeral', className)} aria-hidden="true">
      {text}
    </span>
  );
}

/**
 * Section heading. Deliberately asymmetric by default — the eyebrow sits in a
 * narrow left column with the heading beside it, rather than stacked and
 * centred.
 */
export function Heading({
  eyebrow,
  title,
  lede,
  as: Tag = 'h2',
  size = 'default',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  size?: 'default' | 'large';
  className?: string;
}) {
  return (
    <div className={cn('max-w-4xl', className)}>
      {eyebrow ? (
        <div className="mb-5 flex items-center gap-3">
          <span className="bg-accent h-px w-6 shrink-0" />
          <Label>{eyebrow}</Label>
        </div>
      ) : null}
      <Tag
        className={cn(
          'reveal',
          size === 'large'
            ? 'text-[length:var(--text-display-2)]'
            : 'text-[length:var(--text-title-1)]',
        )}
        data-reveal="mask"
      >
        <span className="line-mask">
          <span>{title}</span>
        </span>
      </Tag>
      {lede ? (
        <p className="text-ink-2 mt-6 max-w-[42ch] text-[length:var(--text-lede)] leading-[1.55]">
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/* --- Actions -------------------------------------------------------------- */

type ButtonTone = 'accent' | 'outline' | 'quiet';
type ButtonSize = 'sm' | 'md' | 'lg';

/* A control has to answer the pointer faster than it can be perceived, then
   settle with some weight behind it. Press is --dur-press so the response is
   immediate; release runs the spring, which overshoots slightly and is what
   makes the control feel like an object rather than a rectangle changing
   colour. Only transform and colour animate — both compositor-friendly. */
const BASE =
  'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap ' +
  'transition-[background-color,color,box-shadow,transform] ' +
  'duration-[var(--dur-control)] ease-[var(--spring-snappy)] ' +
  'hover:-translate-y-px active:translate-y-0 active:scale-[0.985] ' +
  'active:duration-[var(--dur-press)] active:ease-[var(--ease-exit)] ' +
  'motion-reduce:transform-none motion-reduce:transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-45';

const TONES: Record<ButtonTone, string> = {
  // Square-ish, not a pill — pills read as SaaS template.
  accent: 'bg-accent text-accent-ink hover:bg-accent-hover',
  outline: 'text-ink ring-1 ring-inset ring-[var(--hairline-strong)] hover:bg-sunken',
  quiet: 'text-ink-2 hover:text-ink',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-[var(--radius-sm)] px-4 text-[length:var(--text-small)]',
  md: 'h-11 rounded-[var(--radius-sm)] px-5 text-[length:var(--text-small)]',
  lg: 'h-12 rounded-[var(--radius-sm)] px-6 text-[length:var(--text-body)]',
};

export function Button({
  tone = 'accent',
  size = 'md',
  className,
  ...props
}: {
  tone?: ButtonTone;
  size?: ButtonSize;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      data-magnetic="0.08"
      className={cn(BASE, TONES[tone], SIZES[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  tone = 'accent',
  size = 'md',
  className,
  href,
  external,
  children,
  ...props
}: {
  tone?: ButtonTone;
  size?: ButtonSize;
  href: string;
  external?: boolean;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const classes = cn(BASE, TONES[tone], SIZES[size], className);
  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        data-magnetic="0.08"
        {...props}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} data-magnetic="0.08" {...props}>
      {children}
    </Link>
  );
}

/**
 * Text link with a rule that draws in on hover — print's way of marking a
 * link, and a deliberate replacement for the arrow-icon-on-every-card habit.
 */
export function TextLink({
  href,
  children,
  className,
  external,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const classes = cn(
    'group/tl link-underline tap text-accent inline-flex items-center gap-1.5 text-[length:var(--text-small)] font-medium',
    className,
  );
  // The arrow travels a few pixels on hover: the link says where it goes
  // before it is clicked. Decorative, so hidden from assistive technology.
  const arrow = (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-[0.9em] w-[0.9em] shrink-0 transition-transform duration-[var(--dur-control)] ease-[var(--spring-snappy)] group-hover/tl:translate-x-1 motion-reduce:transition-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
        {arrow}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
      {arrow}
    </Link>
  );
}

/* --- Small pieces --------------------------------------------------------- */

export function Tag({
  className,
  tone = 'neutral',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'accent' | 'positive' | 'caution' | 'critical';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-xs)] px-2 py-1 text-[length:var(--text-micro)] font-medium',
        tone === 'neutral' && 'text-ink-3 ring-1 ring-[var(--hairline)] ring-inset',
        tone === 'accent' && 'text-accent ring-accent/30 ring-1 ring-inset',
        tone === 'positive' && 'text-positive ring-positive/30 ring-1 ring-inset',
        tone === 'caution' && 'text-caution ring-caution/30 ring-1 ring-inset',
        tone === 'critical' && 'text-critical ring-critical/30 ring-1 ring-inset',
        className,
      )}
      {...props}
    />
  );
}

/**
 * An indexed editorial row: numeral, rule, content. This replaces the
 * three-column feature-card grid.
 */
export function IndexRow({
  index,
  title,
  children,
  meta,
  href,
  className,
}: {
  index: number | string;
  title: React.ReactNode;
  children?: React.ReactNode;
  meta?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const inner = (
    <div
      className={cn(
        'group grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 py-8 sm:grid-cols-[4rem_1fr_auto] sm:gap-x-10',
        className,
      )}
    >
      <Numeral value={index} className="pt-1 text-[length:var(--text-title-2)]" />
      <div className="min-w-0">
        <h3 className="group-hover:text-accent text-[length:var(--text-title-2)] transition-colors duration-300">
          {title}
        </h3>
        {children ? (
          <div className="text-ink-2 mt-3 max-w-[52ch] text-[length:var(--text-small)] leading-relaxed">
            {children}
          </div>
        ) : null}
      </div>
      {meta ? (
        <div className="text-ink-3 col-start-2 text-[length:var(--text-micro)] sm:col-start-3 sm:pt-2 sm:text-right">
          {meta}
        </div>
      ) : null}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ==========================================================================
   COMPATIBILITY SURFACE

   The v2 pages call Card / Badge / Eyebrow / SectionHeading. Rather than
   leave shims that reintroduce the old look, these names now resolve to
   editorial implementations: a Card is a bordered panel with no shadow and
   no pill radius, a Badge is a Tag, an Eyebrow is a Label. Pages keep
   compiling while they are converted one at a time, and nothing renders in
   the old component-library style in the meantime.
   ========================================================================== */

/**
 * A glass card.
 *
 * Static glass, not live: cards appear in lists — a month of calendar
 * deadlines, a page of news — and twenty live backdrop filters on one screen
 * is how you lose 60fps. They keep the fill, the rim and the depth; only the
 * blur is dropped, and against this site's soft ambient field the difference
 * is close to invisible.
 *
 * `interactive` adds the lift, which runs the snappy spring on the way up and
 * a fast ease on the way down — press has to answer sooner than release
 * settles, or the control feels sticky.
 */
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      data-tilt={interactive ? '4' : undefined}
      className={cn(
        'glass glass-static rounded-[var(--radius-md)]',
        interactive && 'glass-interactive cursor-pointer',
        className,
      )}
      {...props}
    />
  );
}

export const Badge = Tag;
export const Eyebrow = Label;

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  className,
  as = 'h2',
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <Heading
      eyebrow={eyebrow}
      title={title}
      lede={lede}
      as={as}
      size={as === 'h1' ? 'large' : 'default'}
      className={cn(align === 'center' && 'mx-auto text-center', className)}
    />
  );
}
