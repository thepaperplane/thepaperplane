import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: { default: 'Your quotation', template: `%s · ${SITE.name}` },
  robots: { index: false, follow: false, nocache: true, noarchive: true },
  referrer: 'no-referrer',
};

export const dynamic = 'force-dynamic';

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ground min-h-dvh">
      <header className="border-b border-[var(--hairline)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="text-ink flex h-10 items-center gap-2 text-[0.9375rem] font-semibold"
          >
            <svg viewBox="0 0 24 24" className="text-accent h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M2.5 11.2 21 3.5l-6.6 17-3.6-6.6z"
                fill="currentColor"
                fillOpacity="0.2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            {SITE.name}
          </Link>
          <span className="text-ink-3 text-[0.8125rem]">Quotation</span>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">{children}</div>
    </div>
  );
}
