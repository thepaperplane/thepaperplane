'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

type Video = {
  id: string;
  kind: 'launch' | 'testimonial' | 'walkthrough';
  title: string | null;
  src: string;
  width: number | null;
  height: number | null;
  orientation: 'landscape' | 'portrait';
};

const LABEL: Record<Video['kind'], string> = {
  launch: 'Launch film',
  testimonial: 'Client testimonial',
  walkthrough: 'Walkthrough',
};

/**
 * The project's own film, beside its website preview.
 *
 * Renders nothing when a project has no published video. Otherwise it plays
 * by itself, muted (browsers only allow sound after a tap), and only while it
 * is actually on screen, so a page of projects never plays several at once or
 * spends a visitor's data off-screen. The sound button turns the audio on for
 * this video and quietly mutes any other one. Visitors who prefer reduced
 * motion get a still frame and a play button instead.
 */
export function ProjectVideos({ videos, name }: { videos: Video[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLVideoElement>(null);
  const uid = useRef(Math.random().toString(36).slice(2));
  const userPaused = useRef(false);

  const v = videos[index];

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Play while visible, pause when scrolled away (unless the visitor paused it).
  useEffect(() => {
    const node = wrap.current;
    const video = el.current;
    if (!node || !video || reduced) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e) return;
        if (e.isIntersecting && !userPaused.current) void video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [reduced, index]);

  // Keep the buttons truthful even when autoplay began before this ran.
  useEffect(() => {
    const video = el.current;
    if (!video) return;
    const sync = () => setPlaying(!video.paused);
    sync();
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    video.addEventListener('playing', sync);
    return () => {
      video.removeEventListener('play', sync);
      video.removeEventListener('pause', sync);
      video.removeEventListener('playing', sync);
    };
  }, [index]);

  // Only one video speaks at a time.
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== uid.current) {
        setMuted(true);
        if (el.current) el.current.muted = true;
      }
    };
    window.addEventListener('pp:video-sound', onOther);
    return () => window.removeEventListener('pp:video-sound', onOther);
  }, []);

  const toggleSound = useCallback(() => {
    const video = el.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    if (!next) {
      window.dispatchEvent(new CustomEvent('pp:video-sound', { detail: uid.current }));
      void video.play().catch(() => undefined);
    }
  }, []);

  const togglePlay = () => {
    const video = el.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      void video.play().catch(() => undefined);
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  if (!videos.length || !v) return null;

  // The owner chooses the shape; the footage is letterboxed rather than cropped.
  const portrait = v.orientation === 'portrait';
  const ratio = portrait ? '9 / 16' : '16 / 9';

  return (
    <div className="mt-8" ref={wrap}>
      {videos.length > 1 ? (
        <div role="tablist" aria-label={`Videos for ${name}`} className="mb-3 flex flex-wrap gap-2">
          {videos.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => {
                userPaused.current = false;
                setIndex(i);
              }}
              className={cn(
                'inline-flex h-9 items-center rounded-full px-4 text-[0.8125rem] font-semibold ring-1 ring-inset',
                i === index
                  ? 'bg-accent text-accent-ink ring-accent'
                  : 'text-ink-2 ring-[var(--hairline-strong)] hover:ring-[var(--accent)]',
              )}
            >
              {x.title || LABEL[x.kind]}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-ink-3 mb-2 text-[0.75rem] font-semibold tracking-[0.07em] uppercase">
          {v.title || LABEL[v.kind]}
        </p>
      )}

      <div
        className={cn(
          'group relative mx-auto overflow-hidden rounded-[var(--radius-lg)] bg-black shadow-[0_18px_50px_-24px_rgb(0_0_0/0.55)]',
          portrait ? 'w-full max-w-[16rem]' : 'w-full',
        )}
        style={{ aspectRatio: ratio }}
      >
        <video
          key={v.id}
          ref={el}
          src={`${v.src}#t=0.1`}
          muted={muted}
          loop
          playsInline
          autoPlay={!reduced}
          preload={reduced ? 'metadata' : 'auto'}
          aria-label={`${v.title || LABEL[v.kind]} — ${name}`}
          className="h-full w-full object-contain"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause the video' : 'Play the video'}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-black"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={!muted}
            aria-label={muted ? 'Turn the sound on' : 'Turn the sound off'}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white/90 px-4 text-[0.8125rem] font-semibold text-black"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {muted ? 'Sound off' : 'Sound on'}
          </button>
          <button
            type="button"
            onClick={() => void el.current?.requestFullscreen?.()}
            aria-label="Full screen"
            className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-white/90 text-black"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
