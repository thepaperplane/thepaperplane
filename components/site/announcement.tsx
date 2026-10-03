'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * The announcement the owner switches on from the console. Floats at the
 * bottom-left rather than pushing the header down, and once dismissed stays
 * dismissed for the session — for that wording; new wording shows again.
 */
export function Announcement({ text, href, cta }: { text: string; href: string; cta: string }) {
  const id = `pp.announce.${text.length}.${text.slice(0, 24)}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(sessionStorage.getItem(id) !== '1');
    } catch {
      setShow(true);
    }
  }, [id]);

  if (!show) return null;

  const external = /^https?:\/\//.test(href);
  return (
    <div
      role="region"
      aria-label="Announcement"
      className="glass glass-thick fixed bottom-5 left-5 z-[70] flex max-w-[min(26rem,calc(100vw-2.5rem))] items-start gap-3 rounded-[1.25rem] p-4 pr-2 shadow-[var(--glass-shadow-lifted)]"
    >
      <span className="bg-accent mt-1.5 h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
      <p className="text-ink text-[0.875rem] leading-snug">
        {text}{' '}
        {href ? (
          external ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent font-semibold underline underline-offset-4"
            >
              {cta}
            </a>
          ) : (
            <Link href={href} className="text-accent font-semibold underline underline-offset-4">
              {cta}
            </Link>
          )
        ) : null}
      </p>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          setShow(false);
          try {
            sessionStorage.setItem(id, '1');
          } catch {
            /* ignore */
          }
        }}
        className="text-ink-3 hover:text-ink -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
