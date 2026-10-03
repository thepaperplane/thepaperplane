import { cn } from '@/lib/utils';

/**
 * The section divider, and the thing that ties the drawings to the identity.
 *
 * The diagrams on this site are accurate but they were anonymous: ledgers,
 * bars and connectors that could belong to any practice. The brand is a paper
 * plane and the line is "Your Vision, Our Wings", and none of that appeared
 * anywhere in the artwork.
 *
 * So the divider between major sections is a flight path: a hairline for the
 * ground, a trajectory climbing away from it, and the mark itself travelling
 * the trajectory. It draws as you reach it and the plane runs the path once.
 * Repeated down a page and across pages it becomes the site's connective
 * tissue — the same gesture at every transition, which is what makes a set of
 * drawings read as one identity rather than a folder of illustrations.
 *
 * `offset-path` carries the plane along the curve. Where it is unsupported the
 * plane simply sits at the end of the path, which is a still frame of the same
 * idea rather than a broken one.
 */

const PATH = 'M 0 64 C 260 64 420 30 640 22 C 860 14 1020 12 1200 10';

export function FlightRule({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={cn('reveal relative w-full', className)}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="h-[52px] w-full sm:h-[72px]">
        {/* The ground it leaves. */}
        <line
          x1="0"
          y1="72"
          x2="1200"
          y2="72"
          stroke="var(--hairline)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {/* The trajectory. */}
        {/* pathLength normalises the curve to 1, so the dash pattern has to be
            expressed in those units too — "5 6" is several times the whole
            path and renders as one unbroken line. non-scaling-stroke keeps the
            line an even weight despite preserveAspectRatio="none" stretching
            the box horizontally. */}
        <path
          d={PATH}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="0.006 0.01"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          className="flight-path"
        />
      </svg>

      {/* The mark, running the path. Kept outside the stretched SVG so it is
          not squashed with it, and moved on two axes — see globals.css. */}
      <span className="flight-plane" aria-hidden="true">
        <span>
          <svg viewBox="0 0 20 16" className="h-3 w-[18px]">
            <path d="M 0 0 L 20 8 L 0 16 L 5 8 Z" fill="var(--accent)" />
          </svg>
        </span>
      </span>
    </div>
  );
}
