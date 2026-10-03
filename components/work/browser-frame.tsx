'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, Monitor, RotateCw, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A working browser window with a client's site inside it.
 *
 * The client sites refuse to be framed (X-Frame-Options / frame-ancestors),
 * so a live <iframe> would be an empty box. What sits in the window instead is
 * a full-length capture of the real page in a scrolling viewport: wheel,
 * trackpad, touch and keyboard all scroll it, exactly as they would scroll the
 * site. The first time the frame comes into view it glides down a little and
 * back, which is the clearest way to say "this scrolls" without a word.
 *
 * Desktop and phone captures, when both exist, are a toggle away.
 */

type Shot = { src: string | null; full: string | null };

export function BrowserFrame({
  name,
  displayUrl,
  url,
  desktop,
  mobile,
  className,
  height = 'clamp(18rem, 48vw, 34rem)',
  priority = false,
}: {
  name: string;
  displayUrl: string;
  url: string;
  desktop: Shot;
  mobile?: Shot;
  className?: string;
  height?: string;
  priority?: boolean;
}) {
  const hasMobile = Boolean(mobile?.full || mobile?.src);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const peeked = useRef(false);

  const shot = device === 'desktop' ? desktop : (mobile ?? desktop);
  const src = shot.full ?? shot.src;
  const scrollable = Boolean(shot.full);

  // One gentle demonstration the first time the frame is properly in view.
  useEffect(() => {
    const el = frame.current;
    const vp = viewport.current;
    if (!el || !vp || !scrollable) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || peeked.current) return;
        peeked.current = true;
        io.disconnect();
        const down = window.setTimeout(() => {
          if (vp.scrollTop > 0) return;
          vp.scrollTo({ top: Math.min(vp.scrollHeight * 0.18, 520), behavior: 'smooth' });
        }, 650);
        const up = window.setTimeout(() => vp.scrollTo({ top: 0, behavior: 'smooth' }), 2100);
        cleanup = () => {
          window.clearTimeout(down);
          window.clearTimeout(up);
        };
      },
      { threshold: 0.6 },
    );
    let cleanup = () => {};
    io.observe(el);
    return () => {
      io.disconnect();
      cleanup();
    };
  }, [scrollable, device]);

  const onScroll = () => {
    const vp = viewport.current;
    if (!vp) return;
    const max = vp.scrollHeight - vp.clientHeight;
    const p = max > 0 ? vp.scrollTop / max : 0;
    setProgress(p);
    if (vp.scrollTop > 40 && !scrolled) setScrolled(true);
  };

  const reload = () => {
    viewport.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={frame}
        className={cn('bframe', device === 'mobile' && 'mx-auto max-w-[22rem]')}
        data-scrolled={scrolled || undefined}
      >
        <div className="bframe-bar">
          <span className="bframe-lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <button
            type="button"
            onClick={reload}
            aria-label={`Back to the top of ${name}`}
            className="hidden h-7 w-7 items-center justify-center rounded-md text-[#6b6e76] transition-colors hover:bg-black/5 hover:text-[#1d1f24] sm:inline-flex"
          >
            <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <span className="bframe-url">
            <Lock
              className="h-3 w-3 shrink-0 text-[#1f9d55]"
              strokeWidth={2.4}
              aria-hidden="true"
            />
            <span className="truncate" translate="no">
              {displayUrl}
            </span>
          </span>
          {hasMobile ? (
            <span className="flex items-center gap-0.5 rounded-lg bg-[rgb(0_0_0/0.05)] p-0.5">
              {(['desktop', 'mobile'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={device === d}
                  aria-label={d === 'desktop' ? 'Desktop view' : 'Phone view'}
                  onClick={() => {
                    setDevice(d);
                    setScrolled(false);
                    setProgress(0);
                    viewport.current?.scrollTo({ top: 0 });
                  }}
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                    device === d
                      ? 'bg-white text-[#1d1f24] shadow-sm'
                      : 'text-[#6b6e76] hover:text-[#1d1f24]',
                  )}
                >
                  {d === 'desktop' ? (
                    <Monitor className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <Smartphone className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                </button>
              ))}
            </span>
          ) : null}
        </div>

        {/* Reading progress for the page inside the window. */}
        <div className="relative h-[2px] bg-[rgb(0_0_0/0.05)]" aria-hidden="true">
          <span
            className="bg-accent absolute inset-y-0 left-0 origin-left"
            style={{ width: '100%', transform: `scaleX(${progress})` }}
          />
        </div>

        <div
          ref={viewport}
          onScroll={onScroll}
          className="bframe-viewport"
          style={{ height: device === 'mobile' ? 'min(36rem, 70vh)' : height }}
          tabIndex={0}
          role="region"
          aria-label={`${name}, ${device === 'desktop' ? 'desktop' : 'phone'} view. Scroll to explore the page.`}
          data-cursor-label={scrollable ? 'Scroll' : undefined}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote capture, sized by the frame
            <img
              key={src}
              src={src}
              alt={`${name} — ${device === 'desktop' ? 'desktop' : 'phone'} view of ${displayUrl}`}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              width={device === 'desktop' ? 1440 : 390}
              height={device === 'desktop' ? 900 : 844}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#f5f5f7,#ffffff_50%,#eff8ff)] p-6 text-center">
              <p className="text-[0.875rem] font-semibold text-[#3d4048]">Preview being prepared</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.8125rem] font-semibold text-[#1b6e92] underline underline-offset-4"
              >
                Open {displayUrl}
              </a>
            </div>
          )}
        </div>

        {scrollable ? (
          <span className="bframe-hint" aria-hidden="true">
            <span className="bframe-hint-mouse" />
            Scroll inside
          </span>
        ) : null}
      </div>
    </div>
  );
}
