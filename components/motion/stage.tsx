'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * A motion stage: a small animated film that explains one thing.
 *
 * The scene inside is ordinary server-rendered markup, authored in its
 * FINISHED state — what someone with motion turned off, scripts off, or a
 * crawler sees is the completed picture. This component layers the film on
 * top with the Web Animations API:
 *
 *   data-m="rise"        how the element arrives (see `pose` below)
 *   data-at="1200"       when, in ms from the start of the cycle
 *   data-dur="700"       how long the arrival takes
 *   data-fx / data-fy    where it arrives from, in cqi (stage width / 100)
 *   data-out="5200"      leaves early, for something that is replaced
 *   data-then="scaleX(.2)" data-then-at="4600"   a second movement later on
 *
 * Every element shares one cycle, so the whole scene assembles, holds long
 * enough to be read, clears together and replays. Counters (`data-count`) tick
 * on the same clock.
 *
 * It plays only while at least a third of it is on screen and pauses — keeping
 * its place — when scrolled away, so a page of twenty scenes runs one or two
 * at a time. Static placement on animated elements must use the individual
 * `translate` / `rotate` / `scale` properties, never `transform`, which the
 * animation owns.
 */

type Hue = 'tax' | 'scrutiny' | 'incorporation' | 'books' | 'digital' | 'design' | 'brand';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const LEAVE = 0.93;
const GONE = 0.985;

type Pose = { from: Keyframe; to: Keyframe; mid?: Keyframe; origin?: string };

function pose(m: string, fx: string, fy: string, rot: string): Pose {
  switch (m) {
    case 'fade':
      return { from: { opacity: 0 }, to: { opacity: 1 } };
    case 'pop':
      return {
        from: { opacity: 0, transform: 'scale(0.4)' },
        mid: { opacity: 1, transform: 'scale(1.08)' },
        to: { opacity: 1, transform: 'scale(1)' },
      };
    case 'fly':
      return {
        from: { opacity: 0, transform: `translate(${fx}, ${fy}) rotate(${rot})` },
        to: { opacity: 1, transform: 'translate(0, 0) rotate(0deg)' },
      };
    case 'grow-x':
      return {
        from: { opacity: 1, transform: 'scaleX(0)' },
        to: { opacity: 1, transform: 'scaleX(1)' },
        origin: 'left center',
      };
    case 'grow-y':
      return {
        from: { opacity: 1, transform: 'scaleY(0)' },
        to: { opacity: 1, transform: 'scaleY(1)' },
        origin: 'center bottom',
      };
    case 'draw':
      return {
        from: { opacity: 1, strokeDashoffset: '1' },
        to: { opacity: 1, strokeDashoffset: '0' },
      };
    case 'stamp':
      return {
        from: { opacity: 0, transform: 'scale(2.3) rotate(-14deg)' },
        mid: { opacity: 1, transform: 'scale(0.94) rotate(0deg)' },
        to: { opacity: 1, transform: 'scale(1) rotate(0deg)' },
      };
    case 'type':
      return {
        from: { opacity: 1, clipPath: 'inset(0 100% 0 0)' },
        to: { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
      };
    case 'flip':
      return {
        from: { opacity: 0, transform: 'perspective(60cqi) rotateY(80deg)' },
        to: { opacity: 1, transform: 'perspective(60cqi) rotateY(0deg)' },
        origin: 'left center',
      };
    case 'drop':
      return {
        from: { opacity: 0, transform: `translate(0, ${fy === '0cqi' ? '-8cqi' : fy})` },
        mid: { opacity: 1, transform: 'translate(0, 0.6cqi)' },
        to: { opacity: 1, transform: 'translate(0, 0)' },
      };
    case 'rise':
    default:
      return {
        from: {
          opacity: 0,
          transform: `translate(${fx}, ${fy === '0cqi' ? '2.6cqi' : fy}) scale(0.97)`,
        },
        to: { opacity: 1, transform: 'translate(0, 0) scale(1)' },
      };
  }
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

function framesFor(el: HTMLElement | SVGElement, cycle: number): Keyframe[] | null {
  const d = el.dataset;
  const m = d.m ?? 'rise';
  const at = Number(d.at ?? 0);
  const dur = Number(d.dur ?? (m === 'draw' ? 1100 : m === 'type' ? 900 : 750));
  const fx = `${d.fx ?? 0}cqi`;
  const fy = `${d.fy ?? 0}cqi`;
  const s = clamp(at / cycle);
  const e = clamp((at + dur) / cycle);

  // A pass: crosses the scene once in its window and is gone, never held.
  if (m === 'scan' || m === 'travel') {
    const tx = `${d.tx ?? 0}cqi`;
    const ty = `${d.ty ?? 0}cqi`;
    const enter = { transform: `translate(${fx}, ${fy})` };
    const exit = { transform: `translate(${tx}, ${ty})` };
    const fade = Math.min(0.025, (e - s) / 4);
    return [
      { offset: 0, opacity: 0, ...enter },
      { offset: s, opacity: 0, ...enter, easing: m === 'scan' ? 'linear' : EASE },
      { offset: s + fade, opacity: 1 },
      { offset: Math.max(s + fade, e - fade), opacity: 1 },
      { offset: e, opacity: 0, ...exit },
      { offset: 1, opacity: 0, ...exit },
    ];
  }

  // Flight along sampled points: "x,y,deg;x,y,deg;..." in cqi.
  if (m === 'path' && d.path) {
    const pts = d.path.split(';').map((p) => p.split(',').map(Number));
    const n = pts.length - 1;
    const keep = d.keep !== undefined;
    const pose = (p: number[]) => ({
      transform: `translate(${p[0]}cqi, ${p[1]}cqi) rotate(${p[2] ?? 0}deg)`,
    });
    const frames: Keyframe[] = [
      { offset: 0, opacity: 0, ...pose(pts[0]!) },
      { offset: s, opacity: 0, ...pose(pts[0]!) },
    ];
    pts.forEach((p, i) => {
      const o = s + ((e - s) * i) / n;
      frames.push({ offset: o, opacity: 1, ...pose(p) });
    });
    const last = pose(pts[n]!);
    if (keep) {
      frames.push({ offset: LEAVE, opacity: 1, ...last });
      frames.push({ offset: GONE, opacity: 0, ...last });
    } else {
      frames.push({ offset: Math.min(1, e + 0.03), opacity: 0, ...last });
    }
    frames.push({ offset: 1, opacity: 0, ...last });
    // Offsets must be strictly increasing for the browser to accept them.
    return frames.filter(
      (f, i) => i === 0 || (f.offset as number) > (frames[i - 1]!.offset as number) - 1e-9,
    );
  }

  // A ring that swells and fades once — an arrival being acknowledged.
  if (m === 'pulse') {
    return [
      { offset: 0, opacity: 0, transform: 'scale(0.6)' },
      { offset: s, opacity: 0.55, transform: 'scale(0.6)', easing: 'ease-out' },
      { offset: e, opacity: 0, transform: 'scale(2)' },
      { offset: 1, opacity: 0, transform: 'scale(2)' },
    ];
  }

  const p = pose(m, fx, fy, `${d.rot ?? 0}deg`);
  if (p.origin && el instanceof HTMLElement && !el.style.transformOrigin) {
    el.style.transformOrigin = p.origin;
  }
  const out = d.out ? clamp(Number(d.out) / cycle) : LEAVE;
  const gone = d.out ? clamp(out + 0.03) : GONE;

  const frames: Keyframe[] = [
    { offset: 0, ...p.from },
    { offset: s, ...p.from, easing: EASE },
  ];
  if (p.mid) frames.push({ offset: s + (e - s) * 0.62, ...p.mid, easing: EASE });
  frames.push({ offset: e, ...p.to });

  let held: Keyframe = p.to;
  if (d.then && d.thenAt) {
    const ts = clamp(Number(d.thenAt) / cycle);
    const te = clamp((Number(d.thenAt) + Number(d.thenDur ?? 900)) / cycle);
    if (ts > e && te < out) {
      held = { ...p.to, transform: d.then };
      frames.push({ offset: ts, ...p.to, easing: EASE });
      frames.push({ offset: te, ...held });
    }
  }
  frames.push({ offset: out, ...held, easing: 'ease-in' });
  frames.push({ offset: gone, ...held, opacity: 0 });
  frames.push({ offset: 1, ...held, opacity: 0 });
  return frames;
}

/* Counters ------------------------------------------------------------- */

const IN = new Intl.NumberFormat('en-IN');

type Counter = {
  el: HTMLElement;
  from: number;
  to: number;
  at: number;
  dur: number;
  decimals: number;
};

function readCounters(root: HTMLElement): Counter[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-count]')).map((el) => ({
    el,
    from: Number(el.dataset.from ?? 0),
    to: Number(el.dataset.count),
    at: Number(el.dataset.at ?? 0),
    dur: Number(el.dataset.countDur ?? 1400),
    decimals: Number(el.dataset.decimals ?? 0),
  }));
}

function paint(c: Counter, t: number) {
  const k = Math.max(0, Math.min(1, (t - c.at) / c.dur));
  const eased = 1 - Math.pow(1 - k, 3);
  const v = c.from + (c.to - c.from) * eased;
  c.el.textContent = c.decimals > 0 ? v.toFixed(c.decimals) : IN.format(Math.round(v));
}

/* Stage ---------------------------------------------------------------- */

export function Stage({
  label,
  hue = 'brand',
  cycle = 9000,
  ratio = '16 / 10',
  className,
  children,
}: {
  /** What the film shows, for anyone who cannot see it. */
  label: string;
  hue?: Hue;
  cycle?: number;
  ratio?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof root.animate !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const anims: Animation[] = [];
    root.querySelectorAll<HTMLElement>('[data-m]').forEach((el) => {
      const frames = framesFor(el, cycle);
      if (!frames) return;
      const a = el.animate(frames, { duration: cycle, iterations: Infinity, fill: 'both' });
      a.pause();
      anims.push(a);
    });
    // A silent master clock, so counters keep time even in a scene with no
    // other moving parts.
    const clock = root.animate([{ opacity: 1 }, { opacity: 1 }], {
      duration: cycle,
      iterations: Infinity,
    });
    clock.pause();
    const counters = readCounters(root);
    counters.forEach((c) => paint(c, 0));

    let raf = 0;
    const loop = () => {
      const t = Number(clock.currentTime ?? 0) % cycle;
      counters.forEach((c) => paint(c, t));
      raf = requestAnimationFrame(loop);
    };

    const play = () => {
      const t = Number(clock.currentTime ?? 0);
      [clock, ...anims].forEach((a) => {
        a.currentTime = t;
        a.play();
      });
      root.setAttribute('data-play', '');
      if (counters.length && !raf) raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      [clock, ...anims].forEach((a) => a.pause());
      root.removeAttribute('data-play');
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) play();
        else pause();
      },
      { threshold: 0.35 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      anims.forEach((a) => a.cancel());
      clock.cancel();
      counters.forEach((c) => paint(c, Infinity));
      root.removeAttribute('data-play');
    };
  }, [cycle]);

  return (
    <figure
      ref={ref}
      role="img"
      aria-label={label}
      data-hue={hue}
      className={cn('ms', className)}
      style={{ aspectRatio: ratio }}
    >
      <div className="ms-w" aria-hidden="true">
        {children}
      </div>
    </figure>
  );
}
