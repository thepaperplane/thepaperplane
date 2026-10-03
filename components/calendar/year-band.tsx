'use client';

import { useEffect, useRef } from 'react';
import { MONTHS, eventsForMonth } from '@/content/calendar';
import { cn } from '@/lib/utils';

/**
 * The statutory year, as a shape.
 *
 * This replaces a plain row of month pills. Same job — pick a month — but it
 * also answers the question the pills could not: which months are heavy. Four
 * obligations recur every single month; the annual filings pile on top of them
 * unevenly, and September through December is visibly a different season from
 * February. That is worth showing rather than asserting.
 *
 * One block per deadline, stacked from the baseline. Recurring monthly work is
 * drawn quietly; the annual filings that make a month dangerous are drawn in
 * the accent. Every column is a real button labelled with its own count.
 */
export function YearBand({
  month,
  onSelect,
  currentMonth,
}: {
  month: number;
  onSelect: (month: number) => void;
  /** Today's month, marked so the reader can place themselves in the year. */
  currentMonth?: number;
}) {
  const columns = MONTHS.map((name, i) => {
    const events = eventsForMonth(i + 1);
    return {
      name,
      value: i + 1,
      recurring: events.filter((e) => e.cadence === 'monthly').length,
      annual: events.filter((e) => e.cadence !== 'monthly').length,
      total: events.length,
    };
  });

  const tallest = Math.max(...columns.map((c) => c.total));

  // The band builds itself from the baseline the first time it is seen.
  const band = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = band.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-in', '');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          el.setAttribute('data-in', '');
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    // Backstop: never leave the band empty.
    const t = window.setTimeout(() => el.setAttribute('data-in', ''), 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div ref={band} className="yb">
      {/* 2px gutters on a phone. Twelve columns across 311px of content with
          any more than that drops each one under the 24px minimum tap size,
          and scrolling the band sideways would cost the at-a-glance year that
          is the entire point of it. */}
      <div className="flex items-end gap-[2px] sm:gap-1.5" role="group" aria-label="Select a month">
        {columns.map((col, c) => {
          const selected = col.value === month;
          const isCurrent = col.value === currentMonth;
          return (
            <button
              key={col.name}
              type="button"
              onClick={() => onSelect(col.value)}
              aria-current={selected ? 'true' : undefined}
              aria-label={`${col.name} — ${col.total} ${col.total === 1 ? 'deadline' : 'deadlines'}${
                col.annual
                  ? `, including ${col.annual} annual filing${col.annual === 1 ? '' : 's'}`
                  : ''
              }`}
              className="group focus-visible:outline-accent min-w-0 flex-1 rounded-[var(--radius-sm)] pt-2 pb-1 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {/* Stack, built from the baseline up. */}
              <span
                className="flex flex-col-reverse items-stretch gap-[3px]"
                style={{ height: `${tallest * 11}px` }}
                aria-hidden="true"
              >
                {Array.from({ length: col.total }, (_, i) => {
                  const annual = i >= col.recurring;
                  return (
                    <span
                      key={i}
                      style={{ ['--c' as string]: c, ['--i' as string]: i } as React.CSSProperties}
                      className={cn(
                        'yb-block block h-2 rounded-[1px] transition-colors duration-300',
                        annual
                          ? selected
                            ? 'bg-accent'
                            : 'bg-accent/55 group-hover:bg-accent'
                          : selected
                            ? 'bg-ink-3'
                            : 'bg-faint group-hover:bg-ink-3',
                      )}
                    />
                  );
                })}
              </span>

              <span
                className={cn(
                  'mt-2.5 block h-px w-full transition-colors duration-300',
                  selected ? 'bg-accent' : 'bg-hairline group-hover:bg-hairline-strong',
                )}
              />

              <span
                className={cn(
                  'mt-2 block text-center text-[length:var(--text-micro)] tracking-[0.08em] uppercase transition-colors duration-300',
                  selected ? 'text-ink font-medium' : 'text-ink-3 group-hover:text-ink',
                )}
              >
                <span className="sm:hidden">{col.name.slice(0, 1)}</span>
                <span className="hidden sm:inline">{col.name.slice(0, 3)}</span>
              </span>

              {/* A dot, not a word, so the marker costs no horizontal room. */}
              <span
                className={cn(
                  'mx-auto mt-1.5 block h-1 w-1 rounded-full',
                  isCurrent ? 'bg-ink' : 'bg-transparent',
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <p className="text-ink-3 mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[length:var(--text-micro)]">
        <span className="inline-flex items-center gap-2">
          <span className="bg-faint block h-2 w-3 rounded-[1px]" aria-hidden="true" />
          Recurs every month
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="bg-accent block h-2 w-3 rounded-[1px]" aria-hidden="true" />
          Annual filing
        </span>
        {currentMonth ? (
          <span className="inline-flex items-center gap-2">
            <span className="bg-ink block h-1 w-1 rounded-full" aria-hidden="true" />
            This month
          </span>
        ) : null}
      </p>
    </div>
  );
}
