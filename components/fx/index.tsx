import Link from 'next/link';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Server-renderable pieces of the interaction layer. None of these ship any
 * JavaScript of their own: they set the data attributes that the single
 * client engine (./interactions.tsx) responds to, and the markup is complete
 * and usable without it.
 */

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** The mark reduced to a glyph: a dart, nose right. */
export function PlaneGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 16" aria-hidden="true" className={className}>
      <path d="M 0 0 L 20 8 L 0 16 L 5 8 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * The primary call to action. A capsule with an arrow disc, magnetic toward
 * the pointer. Internal links use next/link; `external` opens a new tab.
 */
export function CtaLink({
  href,
  children,
  tone = 'accent',
  size = 'md',
  external,
  className,
  magnetic = 0.32,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  tone?: 'accent' | 'ghost' | 'light' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  external?: boolean;
  className?: string;
  magnetic?: number | false;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'>) {
  const classes = cn('cta', `cta-${tone}`, size !== 'md' && `cta-${size}`, className);
  const inner = (
    <>
      <span data-magnetic-inner>{children}</span>
      <span className="cta-icon" aria-hidden="true">
        <ArrowIcon />
      </span>
    </>
  );
  const data = magnetic === false ? {} : { 'data-magnetic': String(magnetic) };

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...data}
        {...rest}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...data} {...rest}>
      {inner}
    </Link>
  );
}

/**
 * A surface that tilts toward the pointer, with a moving highlight. Use on
 * cards, not on anything that also carries `.reveal` — both want `transform`.
 */
export function Tilt<T extends React.ElementType = 'div'>({
  as,
  max = 6,
  className,
  children,
  label,
  ...rest
}: {
  as?: T;
  /** Maximum rotation in degrees. */
  max?: number;
  className?: string;
  children?: React.ReactNode;
  /** Word shown inside the cursor while over this surface, e.g. "View". */
  label?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'className' | 'children'>) {
  const Tag = (as ?? 'div') as React.ElementType;
  return (
    <Tag
      data-tilt={String(max)}
      data-cursor-label={label}
      className={cn('relative', className)}
      {...rest}
    >
      {children}
      <span className="tilt-glare" aria-hidden="true" />
    </Tag>
  );
}

/** The reading-progress hairline, with the mark riding its leading edge. */
export function ScrollProgress() {
  return (
    <div className="fx-progress" aria-hidden="true">
      <span className="fx-progress-bar" />
      <span className="fx-progress-plane">
        <PlaneGlyph className="h-full w-full" />
      </span>
    </div>
  );
}

/**
 * An endless band of words. The second copy exists only to close the loop, so
 * it is hidden from assistive technology; the first carries the content.
 */
export function Marquee({
  items,
  outline = false,
  reverse = false,
  className,
  label,
}: {
  items: string[];
  outline?: boolean;
  reverse?: boolean;
  className?: string;
  label?: string;
}) {
  const track = (hidden: boolean) => (
    <ul className="marquee-track" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className={cn('marquee-item', outline && 'is-outline')}>
          {item}
          <PlaneGlyph />
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className={cn('marquee', className)}
      data-reverse={reverse || undefined}
      aria-label={label}
      role={label ? 'region' : undefined}
    >
      {track(false)}
      {track(true)}
    </div>
  );
}

/** A sentence that lights word by word as it is scrolled through. */
export function ScrubWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(/\s+/);
  return (
    <span className={cn('scrub-words', className)}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span className="sw">{word}</span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </span>
  );
}
