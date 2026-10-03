'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Loader2,
  Lock,
  Monitor,
  MousePointerClick,
  RotateCw,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A working browser window with a client's site inside it.
 *
 * By default the window holds a full-length capture of the real page in a
 * scrolling viewport: wheel, trackpad, touch and keyboard all scroll it,
 * exactly as they would scroll the site, and it costs one image. The first
 * time the frame comes into view it glides down a little and back, which is
 * the clearest way to say "this scrolls" without a word.
 *
 * Where the client's site allows itself to be framed (`live`, decided on the
 * server by lib/embed.ts), "Try it live" swaps the capture for the real site,
 * rendered at true desktop or phone width and scaled to fit — every link,
 * menu and animation working. It loads only when asked for, so a page of
 * projects never pulls in a dozen live sites at once.
 *
 * Desktop and phone, when both exist, are a toggle away.
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
  live = false,
}: {
  name: string;
  displayUrl: string;
  url: string;
  desktop: Shot;
  mobile?: Shot;
  className?: string;
  height?: string;
  priority?: boolean;
  /** The site permits framing, so the real thing can be shown on request. */
  live?: boolean;
}) {
  const hasMobile = Boolean(mobile?.full || mobile?.src);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<'shot' | 'live'>('shot');
  const [loaded, setLoaded] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
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

  // The live site renders at its real width and is scaled to the window.
  useEffect(() => {
    const vp = viewport.current;
    if (!vp || mode !== 'live') return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setBox({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(vp);
    return () => ro.disconnect();
  }, [mode, device]);

  useEffect(() => {
    if (mode !== 'live' || loaded) return;
    const t = window.setTimeout(() => setStalled(true), 12000);
    return () => window.clearTimeout(t);
  }, [mode, loaded, device]);

  const goLive = () => {
    viewport.current?.scrollTo({ top: 0, behavior: 'instant' });
    setLoaded(false);
    setStalled(false);
    setMode('live');
  };

  const siteWidth = device === 'desktop' ? 1440 : 390;
  const scale = box.w ? box.w / siteWidth : 0;

  const onScroll = () => {
    const vp = viewport.current;
    if (!vp) return;
    const max = vp.scrollHeight - vp.clientHeight;
    const p = max > 0 ? vp.scrollTop / max : 0;
    setProgress(p);
    if (vp.scrollTop > 40 && !scrolled) setScrolled(true);
  };

  const reload = () => {
    if (mode === 'live') {
      setLoaded(false);
      setStalled(false);
      setMode('shot');
      window.requestAnimationFrame(() => setMode('live'));
      return;
    }
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
            {mode === 'live' ? (
              <span className="bframe-live" aria-label="Showing the live site">
                <i />
                Live
              </span>
            ) : null}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${displayUrl} in a new tab`}
            className="hidden h-7 w-7 items-center justify-center rounded-md text-[#6b6e76] transition-colors hover:bg-black/5 hover:text-[#1d1f24] sm:inline-flex"
          >
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
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
                    setLoaded(false);
                    setStalled(false);
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
        <div
          className="relative h-[2px] bg-[rgb(0_0_0/0.05)]"
          aria-hidden="true"
          style={{ opacity: mode === 'live' ? 0 : 1 }}
        >
          <span
            className="bg-accent absolute inset-y-0 left-0 origin-left"
            style={{ width: '100%', transform: `scaleX(${progress})` }}
          />
        </div>

        <div
          ref={viewport}
          onScroll={mode === 'shot' ? onScroll : undefined}
          className={cn('bframe-viewport', mode === 'live' && 'bframe-viewport-live')}
          style={{ height: device === 'mobile' ? 'min(36rem, 70vh)' : height }}
          tabIndex={mode === 'shot' ? 0 : -1}
          role="region"
          aria-label={
            mode === 'live'
              ? `${name}, live site, ${device === 'desktop' ? 'desktop' : 'phone'} width.`
              : `${name}, ${device === 'desktop' ? 'desktop' : 'phone'} view. Scroll to explore the page.`
          }
        >
          {mode === 'live' ? (
            <>
              {scale ? (
                <iframe
                  key={device}
                  src={url}
                  title={`${name} — the live site`}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  onLoad={() => setLoaded(true)}
                  className="bframe-iframe"
                  style={{
                    width: siteWidth,
                    height: box.h / scale,
                    transform: `scale(${scale})`,
                  }}
                />
              ) : null}
              {!loaded ? (
                <div className="bframe-loading" role="status">
                  {stalled ? (
                    <>
                      <p className="text-[0.875rem] font-semibold text-[#3d4048]">
                        The live site is taking a while.
                      </p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.8125rem] font-semibold text-[#1b6e92] underline underline-offset-4"
                      >
                        Open {displayUrl}
                      </a>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-[#1b6e92]" />
                      <p className="text-[0.8125rem] font-medium text-[#3d4048]">
                        Loading the live site…
                      </p>
                    </>
                  )}
                </div>
              ) : null}
            </>
          ) : src ? (
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

        {live ? (
          mode === 'shot' ? (
            <button type="button" onClick={goLive} className="bframe-golive">
              <MousePointerClick className="h-4 w-4" strokeWidth={2.2} />
              Try it live
            </button>
          ) : (
            <button type="button" onClick={() => setMode('shot')} className="bframe-golive">
              Back to preview
            </button>
          )
        ) : null}

        {scrollable && mode === 'shot' ? (
          <span className="bframe-hint" aria-hidden="true">
            <span className="bframe-hint-mouse" />
            Scroll inside
          </span>
        ) : null}
      </div>
    </div>
  );
}
