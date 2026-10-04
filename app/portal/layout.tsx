import type { Metadata } from 'next';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { getPortalSession } from '@/lib/portal/auth';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: { default: 'Client portal', template: `%s · Client portal · ${SITE.name}` },
  description: 'Invoices, documents and deadlines for clients of The Paper Plane.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getPortalSession();
  return (
    <div className="bg-ground min-h-dvh">
      <header className="border-b border-[var(--hairline)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
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
          <span className="text-ink-3 hidden text-[0.8125rem] sm:inline">Client portal</span>
          {session ? (
            <div className="ml-auto flex items-center gap-2">
              {session.clients.length > 1 ? (
                <form action="/api/portal/switch" method="post" className="flex items-center gap-2">
                  <label htmlFor="pt-client" className="sr-only">
                    Business
                  </label>
                  <select
                    id="pt-client"
                    name="client"
                    defaultValue={session.active.id}
                    className="text-ink bg-surface h-10 max-w-[12rem] rounded-[var(--radius-md)] px-3 text-[0.8125rem] ring-1 ring-[var(--hairline-strong)] ring-inset"
                  >
                    {session.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="text-accent h-10 px-2 text-[0.8125rem] font-semibold"
                  >
                    Switch
                  </button>
                </form>
              ) : (
                <span className="text-ink hidden max-w-[16rem] truncate text-[0.875rem] font-medium sm:inline">
                  {session.active.name}
                </span>
              )}
              <form action="/api/portal/signout" method="post">
                <button
                  type="submit"
                  className="text-ink-2 hover:text-ink hover:bg-sunken inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-[0.8125rem] font-medium"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
        {session ? (
          <nav aria-label="Portal" className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6">
            {[
              { href: '/portal', label: 'Overview' },
              { href: '/portal/invoices', label: 'Invoices' },
              { href: '/portal/documents', label: 'Documents' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink-2 hover:text-ink inline-flex h-11 items-center px-3 text-[0.875rem] font-medium"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>
    </div>
  );
}
