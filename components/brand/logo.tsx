import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * The Paper Plane mark.
 *
 * Extracted from the supplied Illustrator vector, so it is the real artwork
 * rather than a reconstruction. Two variants exist: the original, and one
 * whose navies are raised in lightness for dark grounds (the plane is drawn
 * in #11284a–#333b51, which sits at ~1.3:1 against #0a0b0d and would
 * otherwise disappear).
 *
 * Rendered as a CSS background rather than <img> so the browser downloads
 * only the variant the active theme actually uses — a hidden <img> is still
 * fetched. The swap lives in globals.css under `.logo-mark`.
 *
 * Intrinsic ratio is 214.53 × 150.28 (≈ 1.43:1).
 */

export const BRAND = {
  blue: '#35a5d5',
  accent: '#578ac8',
  navy: '#11284a',
  navyWordmark: '#1c3252',
} as const;

export function LogoMark({
  className,
  title = 'The Paper Plane',
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      className={cn('logo-mark block', className)}
    />
  );
}

/**
 * Mark plus wordmark.
 *
 * The wordmark is live text, not part of the image: it stays selectable and
 * searchable, scales with the reader's font settings, inherits the theme's
 * ink colour automatically, and keeps the masthead legible if the asset ever
 * fails to load.
 */
export function Logo({
  className,
  showTagline = false,
}: {
  className?: string;
  /** Present for the footer lockup; the masthead stays to the wordmark alone. */
  showTagline?: boolean;
  /** Accepted for call-site compatibility; the CSS background needs no hint. */
  priority?: boolean;
}) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <LogoMark className="h-8 w-[2.85rem] shrink-0" title="" />
      <span className="flex flex-col leading-none">
        <span className="text-ink text-[0.9375rem] font-medium tracking-[-0.01em]">
          The Paper Plane
        </span>
        {showTagline ? (
          <span className="text-ink-3 mt-1.5 text-[length:var(--text-micro)]">{SITE.tagline}</span>
        ) : null}
      </span>
    </span>
  );
}
