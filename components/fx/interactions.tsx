'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * The interaction layer.
 *
 * Three behaviours, one window listener and one animation loop. The system
 * pointer is never replaced: people know their own cursor, and a decorative
 * one only gets between them and the page.
 *
 *   magnetic   `data-magnetic="0.1"` leans the element toward the pointer by
 *              that fraction of the distance, capped at a few pixels so a
 *              button acknowledges the pointer without ever running from it.
 *              `[data-magnetic-inner]` moves a touch further, for depth.
 *
 *   tilt       `data-tilt="6"` rotates the element up to that many degrees
 *              toward the pointer and moves a glare across it.
 *
 *   parallax   `data-parallax` receives --px and --py, the pointer position
 *              across the viewport from -1 to 1, smoothed. The hero's 3D scene
 *              is driven entirely by these two numbers in CSS.
 *
 * Everything is written as CSS custom properties, so nothing here causes
 * layout. The loop sleeps when every value has settled and wakes on the next
 * pointer event; an idle page costs nothing.
 *
 * Who gets it: a mouse or a pen, with motion allowed. Touch has no hover to
 * lean toward. Under `prefers-reduced-motion` none of this runs at all.
 */

type Spring = { x: number; y: number; tx: number; ty: number };

const MAGNET_DEFAULT = 0.1;
/** The furthest a magnetic control ever travels, in pixels. */
const MAGNET_MAX_X = 6;
const MAGNET_MAX_Y = 4;
const TILT_DEFAULT = 6;

const settled = (s: Spring, eps = 0.01) => Math.abs(s.x - s.tx) < eps && Math.abs(s.y - s.ty) < eps;

export function Interactions() {
  const pathname = usePathname();
  // Set by the engine; called on navigation so it can let go of nodes the
  // new page no longer has.
  const onRouteRef = useRef<() => void>(() => {});

  useEffect(() => {
    onRouteRef.current();
  }, [pathname]);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduced.matches) return;

    /* ---------------------------------------------------------------- state */

    const pointer = { x: -100, y: -100, seen: false };
    let target: Element | null = null;

    let magnet: HTMLElement | null = null;
    let magnetBase: DOMRect | null = null;
    const magnets = new Map<HTMLElement, Spring>();

    let tilt: HTMLElement | null = null;
    let tiltBase: DOMRect | null = null;
    const tilts = new Map<HTMLElement, Spring & { gx: number; gy: number }>();

    const parallax = new Map<HTMLElement, Spring>();
    const visible = new Set<HTMLElement>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) visible.add(el);
        else visible.delete(el);
      });
    });
    let watching = false;
    const watchParallax = () => {
      if (watching) return;
      watching = true;
      parallax.clear();
      visible.clear();
      io.disconnect();
      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        parallax.set(el, { x: 0, y: 0, tx: 0, ty: 0 });
        io.observe(el);
      });
    };

    let frame = 0;

    /* -------------------------------------------------------------- helpers */

    const releaseMagnet = () => {
      if (!magnet) return;
      const s = magnets.get(magnet);
      if (s) {
        s.tx = 0;
        s.ty = 0;
      }
      magnet.removeAttribute('data-magnet-active');
      magnet = null;
      magnetBase = null;
    };

    const releaseTilt = () => {
      if (!tilt) return;
      const s = tilts.get(tilt);
      if (s) {
        s.tx = 0;
        s.ty = 0;
      }
      tilt.removeAttribute('data-tilt-active');
      tilt = null;
      tiltBase = null;
    };

    /** Work out what the pointer is over and what each behaviour should do. */
    const resolve = () => {
      const el = target;
      if (!el || !(el instanceof Element)) {
        releaseMagnet();
        releaseTilt();
        return;
      }

      const nextMagnet = el.closest<HTMLElement>('[data-magnetic]');
      if (nextMagnet !== magnet) {
        releaseMagnet();
        if (nextMagnet) {
          magnet = nextMagnet;
          const s = magnets.get(nextMagnet) ?? { x: 0, y: 0, tx: 0, ty: 0 };
          magnets.set(nextMagnet, s);
          const r = nextMagnet.getBoundingClientRect();
          // The element may still be springing home from a previous visit;
          // measure where it rests, not where it happens to be this frame.
          magnetBase = new DOMRect(r.left - s.x, r.top - s.y, r.width, r.height);
          nextMagnet.setAttribute('data-magnet-active', '');
        }
      }

      const nextTilt = el.closest<HTMLElement>('[data-tilt]');
      if (nextTilt !== tilt) {
        releaseTilt();
        if (nextTilt) {
          tilt = nextTilt;
          tilts.set(nextTilt, tilts.get(nextTilt) ?? { x: 0, y: 0, tx: 0, ty: 0, gx: 50, gy: 50 });
          tiltBase = nextTilt.getBoundingClientRect();
          nextTilt.setAttribute('data-tilt-active', '');
        }
      }
    };

    /* ---------------------------------------------------------------- loop */

    const tick = () => {
      frame = 0;
      let busy = false;

      // Magnet targets lean toward the pointer while it is over the element.
      if (magnet && magnetBase) {
        const strength = Math.min(0.2, parseFloat(magnet.dataset.magnetic || '') || MAGNET_DEFAULT);
        const cx = magnetBase.left + magnetBase.width / 2;
        const cy = magnetBase.top + magnetBase.height / 2;
        const s = magnets.get(magnet)!;
        const limitX = Math.min(MAGNET_MAX_X, magnetBase.width * 0.06);
        const limitY = Math.min(MAGNET_MAX_Y, magnetBase.height * 0.1);
        s.tx = Math.max(-limitX, Math.min(limitX, (pointer.x - cx) * strength));
        s.ty = Math.max(-limitY, Math.min(limitY, (pointer.y - cy) * strength));
      }

      magnets.forEach((s, el) => {
        s.x += (s.tx - s.x) * 0.14;
        s.y += (s.ty - s.y) * 0.14;
        if (settled(s, 0.05)) {
          s.x = s.tx;
          s.y = s.ty;
        } else busy = true;
        el.style.setProperty('--mx', `${s.x.toFixed(2)}px`);
        el.style.setProperty('--my', `${s.y.toFixed(2)}px`);
        if (el !== magnet && s.x === 0 && s.y === 0) {
          el.style.removeProperty('--mx');
          el.style.removeProperty('--my');
          magnets.delete(el);
        }
      });

      // Tilt.
      if (tilt && tiltBase) {
        const max = parseFloat(tilt.dataset.tilt || '') || TILT_DEFAULT;
        const nx = Math.max(0, Math.min(1, (pointer.x - tiltBase.left) / tiltBase.width));
        const ny = Math.max(0, Math.min(1, (pointer.y - tiltBase.top) / tiltBase.height));
        const s = tilts.get(tilt)!;
        s.tx = (0.5 - ny) * 2 * max;
        s.ty = (nx - 0.5) * 2 * max;
        s.gx = nx * 100;
        s.gy = ny * 100;
      }

      tilts.forEach((s, el) => {
        s.x += (s.tx - s.x) * 0.12;
        s.y += (s.ty - s.y) * 0.12;
        if (settled(s, 0.02)) {
          s.x = s.tx;
          s.y = s.ty;
        } else busy = true;
        el.style.setProperty('--rx', `${s.x.toFixed(2)}deg`);
        el.style.setProperty('--ry', `${s.y.toFixed(2)}deg`);
        el.style.setProperty('--gx', `${s.gx.toFixed(1)}%`);
        el.style.setProperty('--gy', `${s.gy.toFixed(1)}%`);
        if (el !== tilt && s.x === 0 && s.y === 0) {
          ['--rx', '--ry', '--gx', '--gy'].forEach((p) => el.style.removeProperty(p));
          tilts.delete(el);
        }
      });

      // Parallax roots, only while on screen.
      if (pointer.seen) {
        const px = (pointer.x / window.innerWidth) * 2 - 1;
        const py = (pointer.y / window.innerHeight) * 2 - 1;
        parallax.forEach((s, el) => {
          if (!visible.has(el)) return;
          s.tx = px;
          s.ty = py;
          s.x += (s.tx - s.x) * 0.06;
          s.y += (s.ty - s.y) * 0.06;
          if (!settled(s, 0.001)) busy = true;
          el.style.setProperty('--px', s.x.toFixed(4));
          el.style.setProperty('--py', s.y.toFixed(4));
        });
      }

      if (busy) frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    /* -------------------------------------------------------------- events */

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.seen = true;
      watchParallax();
      if (e.target !== target) {
        target = e.target as Element;
        resolve();
      }
      wake();
    };

    // Content moves under a still pointer when the page scrolls, so the
    // element beneath it has to be found again. Magnet and tilt geometry are
    // measured on entry and go stale the moment anything scrolls.
    const onScroll = () => {
      if (!pointer.seen) return;
      releaseMagnet();
      releaseTilt();
      target = document.elementFromPoint(pointer.x, pointer.y);
      resolve();
      wake();
    };

    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      target = null;
      resolve();
      wake();
    };

    onRouteRef.current = () => {
      releaseMagnet();
      releaseTilt();
      watching = false;
      if (!pointer.seen) return;
      watchParallax();
      target = document.elementFromPoint(pointer.x, pointer.y);
      resolve();
      wake();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseout', onLeave);

    const onPreferenceChange = () => {
      if (!fine.matches || reduced.matches) teardown();
    };
    fine.addEventListener('change', onPreferenceChange);
    reduced.addEventListener('change', onPreferenceChange);

    function teardown() {
      onRouteRef.current = () => {};
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onLeave);
      fine.removeEventListener('change', onPreferenceChange);
      reduced.removeEventListener('change', onPreferenceChange);
      magnets.forEach((_, el) => {
        el.style.removeProperty('--mx');
        el.style.removeProperty('--my');
        el.removeAttribute('data-magnet-active');
      });
      tilts.forEach((_, el) => {
        ['--rx', '--ry', '--gx', '--gy'].forEach((p) => el.style.removeProperty(p));
        el.removeAttribute('data-tilt-active');
      });
    }

    return teardown;
  }, []);

  return null;
}
