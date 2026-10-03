'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/brand/logo';
import { CtaLink } from '@/components/fx';
import { ThemeToggle } from '@/components/site/theme';
import { PRIMARY_NAV, SITE } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * Site header.
 *
 * Transparent over the hero, then a floating glass capsule once there is
 * content underneath to refract. On the desktop bar a highlight slides to
 * whichever item the pointer is over — the bar answers the pointer before a
 * click, which is most of what makes a navigation feel responsive.
 */
export function SiteHeader({
  contact,
}: {
  contact?: { phone: string; phoneIntl: string; whatsappHref: string };
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number; on: boolean }>({
    x: 0,
    w: 0,
    on: false,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const moveTo = (el: HTMLElement) => {
    const nav = navRef.current;
    if (!nav) return;
    const a = el.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    setPill({ x: a.left - n.left, w: a.width, on: true });
  };

  const phone = contact?.phone ?? SITE.phone;
  const phoneIntl = contact?.phoneIntl ?? SITE.phoneIntl;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <div
          className={cn(
            'mx-auto flex h-[3.75rem] w-full max-w-[84rem] items-center gap-6 px-3 sm:px-5',
            'transition-[background-color,box-shadow,border-radius,max-width] duration-[var(--dur-section)] ease-[var(--ease-standard)]',
            scrolled
              ? 'glass glass-thin max-w-[78rem] rounded-full'
              : 'rounded-none bg-transparent shadow-none',
          )}
        >
          <Link
            href="/"
            aria-label={`${SITE.name} — home`}
            className="flex min-h-11 shrink-0 items-center"
          >
            <Logo priority />
          </Link>

          <nav
            ref={navRef}
            className="relative ml-auto hidden items-center lg:flex"
            aria-label="Primary"
            onPointerLeave={() => setPill((p) => ({ ...p, on: false }))}
          >
            <span
              aria-hidden="true"
              className="bg-accent-wash pointer-events-none absolute top-1/2 h-9 -translate-y-1/2 rounded-full transition-[transform,width,opacity] duration-[var(--dur-control)] ease-[var(--ease-standard)] motion-reduce:transition-none"
              style={{
                width: pill.w,
                transform: `translate(${pill.x}px, -50%)`,
                opacity: pill.on ? 1 : 0,
                left: 0,
              }}
            />
            {PRIMARY_NAV.filter((item) => !item.compact).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                onPointerEnter={(e) => moveTo(e.currentTarget)}
                onFocus={(e) => moveTo(e.currentTarget)}
                className={cn(
                  'relative inline-flex h-10 items-center rounded-full px-3.5 text-[length:var(--text-small)] whitespace-nowrap transition-colors duration-300',
                  isActive(item.href) ? 'text-ink font-medium' : 'text-ink-2 hover:text-ink',
                )}
              >
                {item.short ?? item.label}
                {isActive(item.href) ? (
                  <span
                    aria-hidden="true"
                    className="bg-accent absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                  />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-0 lg:gap-2">
            <ThemeToggle />

            <CtaLink href="/contact" size="sm" className="hidden sm:inline-flex">
              Start a project
            </CtaLink>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="text-ink relative inline-flex h-11 w-11 items-center justify-center lg:hidden"
            >
              <span className="relative block h-3 w-5" aria-hidden="true">
                <span
                  className="bg-ink absolute left-0 block h-px w-full transition-all duration-400 ease-[var(--ease-out-editorial)]"
                  style={{
                    top: open ? '50%' : 0,
                    transform: open ? 'rotate(45deg)' : 'none',
                  }}
                />
                <span
                  className="bg-ink absolute left-0 block h-px w-full transition-all duration-400 ease-[var(--ease-out-editorial)]"
                  style={{
                    bottom: open ? '50%' : 0,
                    transform: open ? 'rotate(-45deg) translateY(-0.5px)' : 'none',
                  }}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — a full-height index, staggered in. */}
      <div
        id="site-menu"
        aria-hidden={!open}
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'glass glass-thick absolute inset-0 rounded-none transition-opacity',
            'duration-[var(--dur-control)] ease-[var(--ease-standard)]',
            open ? 'opacity-100' : 'opacity-0',
          )}
        />
        <nav
          aria-label="Mobile"
          className={cn(
            'relative flex h-full flex-col overflow-y-auto px-6 pt-[6rem] pb-10 sm:px-10',
            'transition-[transform,opacity] duration-[var(--dur-section)] ease-[var(--spring-gentle)]',
            open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <ul className="flex-1">
            {PRIMARY_NAV.map((item, i) => (
              <li
                key={item.href}
                className="border-b transition-[opacity,transform] duration-[var(--dur-section)] ease-[var(--ease-emphasis)] last:border-b-0 motion-reduce:transition-none"
                style={{
                  transitionDelay: open ? `${80 + i * 45}ms` : '0ms',
                  opacity: open ? 1 : 0,
                  transform: open ? 'none' : 'translateY(10px)',
                }}
              >
                <Link
                  href={item.href}
                  tabIndex={open ? 0 : -1}
                  className="flex items-baseline gap-5 py-4"
                >
                  <span className="numeral w-5 shrink-0 text-[length:var(--text-caption)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block text-[length:var(--text-title-2)] leading-tight',
                        'font-[family-name:var(--font-display)]',
                        isActive(item.href) ? 'text-accent' : 'text-ink',
                      )}
                    >
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="text-ink-3 mt-1 block text-[length:var(--text-caption)]">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 space-y-3">
            <CtaLink
              href="/contact"
              size="lg"
              tabIndex={open ? 0 : -1}
              className="w-full justify-between"
              magnetic={false}
            >
              Start a project
            </CtaLink>
            <div className="text-ink-3 flex items-center justify-between text-[length:var(--text-caption)]">
              <a href={`tel:${phoneIntl}`} className="tap" tabIndex={open ? 0 : -1}>
                {phone}
              </a>
              <a
                href={contact?.whatsappHref ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="tap"
                tabIndex={open ? 0 : -1}
              >
                WhatsApp
              </a>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
