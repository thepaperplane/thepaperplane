'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * The interaction layer.
 *
 * Four behaviours, one window listener and one animation loop:
 *
 *   cursor     A dot that tracks the pointer exactly and a ring that follows
 *              it on a spring. Over a link the ring opens; over anything
 *              marked `data-magnetic` it lets go of the pointer and wraps the
 *              control itself, corner radius included, so the pointer reads as
 *              having snapped onto it. `data-cursor-label="View"` turns the
 *              ring into a filled disc carrying that word.
 *
 *   magnetic   `data-magnetic="0.3"` pulls the element toward the pointer by
 *              that fraction of the distance, and `[data-magnetic-inner]`
 *              inside it a little further, which is what gives the pull depth.
 *
 *   tilt       `data-tilt="8"` rotates the element up to that many degrees
 *              toward the pointer and moves a glare across it.
 *
 *   parallax   `data-parallax` receives --px and --py, the pointer position
 *              across the viewport from -1 to 1, smoothed. The hero's 3D scene
 *              is driven entirely by these two numbers in CSS.
 *
 * Everything is written as CSS custom properties or a transform, so nothing
 * here causes layout. The loop sleeps when every value has settled and wakes
 * on the next pointer event; an idle page costs nothing.
 *
 * Who gets it: a mouse or a pen, with motion allowed. Touch has no hover to
 * be magnetic toward, and a cursor that follows a finger is just a smudge
 * under it. Under `prefers-reduced-motion` none of this runs at all, and the
 * system cursor is never hidden until the custom one has demonstrably moved,
 * so a failure here can never leave someone without a pointer.
 */

type Spring = { x: number; y: number; tx: number; ty: number };

const MAGNET_DEFAULT = 0.3;
const TILT_DEFAULT = 7;
const INTERACTIVE =
  'a, button, [role="button"], [role="tab"], label, summary, select, [data-cursor]';
const TEXT_ENTRY = 'input, textarea, select, [contenteditable="true"]';

const settled = (s: Spring, eps = 0.01) => Math.abs(s.x - s.tx) < eps && Math.abs(s.y - s.ty) < eps;

export function Interactions() {
  const pathname = usePathname();
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  // Set by the engine; called on navigation so it can let go of nodes the
  // new page no longer has.
  const onRouteRef = useRef<() => void>(() => {});

  useEffect(() => {
    onRouteRef.current();
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduced.matches) return;

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!cursor || !ring || !dot || !label) return;

    /* ---------------------------------------------------------------- state */

    const pointer = { x: -100, y: -100, seen: false, down: false };
    let target: Element | null = null;

    // Ring geometry: centre, size and radius, each sprung separately.
    const ringPos: Spring = { x: -100, y: -100, tx: -100, ty: -100 };
    const ringSize: Spring = { x: 34, y: 34, tx: 34, ty: 34 };
    let ringRadius = 17;
    let ringRadiusTarget = 17;

    let magnet: HTMLElement | null = null;
    let magnetBase: DOMRect | null = null;
    let magnetRadius = 0;
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
    let state = '';

    /* -------------------------------------------------------------- helpers */

    const setState = (next: string) => {
      if (next === state) return;
      state = next;
      cursor.dataset.state = next;
    };

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
        setState('default');
        return;
      }

      // Text entry keeps the system caret; the custom cursor steps aside.
      if (el.closest(TEXT_ENTRY)) {
        releaseMagnet();
        releaseTilt();
        setState('text');
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
          const radius = parseFloat(getComputedStyle(nextMagnet).borderTopLeftRadius) || 0;
          magnetRadius = Math.min(radius, r.height / 2);
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

      const labelled = el.closest<HTMLElement>('[data-cursor-label]');
      if (labelled) {
        label.textContent = labelled.dataset.cursorLabel ?? '';
        setState('label');
      } else if (magnet) {
        setState('snap');
      } else if (el.closest(INTERACTIVE)) {
        setState('hover');
      } else {
        setState('default');
      }
    };

    /* ---------------------------------------------------------------- loop */

    const tick = () => {
      frame = 0;
      let busy = false;

      // Magnet targets follow the pointer while it is over the element.
      if (magnet && magnetBase) {
        const strength = parseFloat(magnet.dataset.magnetic || '') || MAGNET_DEFAULT;
        const cx = magnetBase.left + magnetBase.width / 2;
        const cy = magnetBase.top + magnetBase.height / 2;
        const s = magnets.get(magnet)!;
        const limitX = magnetBase.width * 0.35;
        const limitY = magnetBase.height * 0.45;
        s.tx = Math.max(-limitX, Math.min(limitX, (pointer.x - cx) * strength));
        s.ty = Math.max(-limitY, Math.min(limitY, (pointer.y - cy) * strength));
      }

      magnets.forEach((s, el) => {
        s.x += (s.tx - s.x) * 0.2;
        s.y += (s.ty - s.y) * 0.2;
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

      // Cursor. The dot is exact; the ring is sprung.
      if (state === 'snap' && magnet && magnetBase) {
        const s = magnets.get(magnet)!;
        const pad = 6;
        ringPos.tx = magnetBase.left + magnetBase.width / 2 + s.x;
        ringPos.ty = magnetBase.top + magnetBase.height / 2 + s.y;
        ringSize.tx = magnetBase.width + pad * 2;
        ringSize.ty = magnetBase.height + pad * 2;
        ringRadiusTarget = magnetRadius + pad;
      } else {
        const d = state === 'label' ? 88 : state === 'hover' ? 54 : state === 'text' ? 0 : 34;
        const pressed = pointer.down ? 0.82 : 1;
        ringPos.tx = pointer.x;
        ringPos.ty = pointer.y;
        ringSize.tx = d * pressed;
        ringSize.ty = d * pressed;
        ringRadiusTarget = (d * pressed) / 2;
      }

      const follow = state === 'snap' ? 0.24 : 0.18;
      ringPos.x += (ringPos.tx - ringPos.x) * follow;
      ringPos.y += (ringPos.ty - ringPos.y) * follow;
      ringSize.x += (ringSize.tx - ringSize.x) * 0.22;
      ringSize.y += (ringSize.ty - ringSize.y) * 0.22;
      ringRadius += (ringRadiusTarget - ringRadius) * 0.22;
      if (!settled(ringPos, 0.1) || !settled(ringSize, 0.1)) busy = true;
      if (Math.abs(ringRadius - ringRadiusTarget) > 0.1) busy = true;

      ring.style.transform = `translate3d(${(ringPos.x - ringSize.x / 2).toFixed(2)}px, ${(
        ringPos.y -
        ringSize.y / 2
      ).toFixed(2)}px, 0)`;
      ring.style.width = `${ringSize.x.toFixed(2)}px`;
      ring.style.height = `${ringSize.y.toFixed(2)}px`;
      ring.style.borderRadius = `${ringRadius.toFixed(2)}px`;
      dot.style.transform = `translate3d(${pointer.x - 3}px, ${pointer.y - 3}px, 0)`;

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
      if (!pointer.seen) {
        pointer.seen = true;
        // Start the ring where the pointer is rather than sweeping in from a corner.
        ringPos.x = ringPos.tx = e.clientX;
        ringPos.y = ringPos.ty = e.clientY;
        root.classList.add('fx-cursor-on');
      }
      watchParallax();
      if (e.target !== target) {
        target = e.target as Element;
        resolve();
      }
      cursor.dataset.visible = 'true';
      wake();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointer.down = true;
      cursor.dataset.down = 'true';
      wake();
    };

    const onUp = () => {
      pointer.down = false;
      delete cursor.dataset.down;
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
      cursor.dataset.visible = 'false';
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
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
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
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onLeave);
      fine.removeEventListener('change', onPreferenceChange);
      reduced.removeEventListener('change', onPreferenceChange);
      root.classList.remove('fx-cursor-on');
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

  return (
    <div ref={cursorRef} className="fx-cursor" aria-hidden="true" data-state="default">
      <div ref={ringRef} className="fx-cursor-ring">
        <span ref={labelRef} className="fx-cursor-label" />
      </div>
      <div ref={dotRef} className="fx-cursor-dot" />
    </div>
  );
}
