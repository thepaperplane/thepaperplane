'use client';

import { useEffect } from 'react';

/**
 * The opening.
 *
 * A brand moment on first arrival: the plane runs its flight path, the
 * wordmark settles, and the panel lifts to reveal the page. It reuses the
 * trajectory motif from the section dividers, so the first thing a visitor
 * sees is the same gesture they will keep meeting as they scroll.
 *
 * A loader is very easy to get wrong in ways that make a site feel cheaper
 * rather than more considered, so the rules here are strict:
 *
 *   It never delays anything. There is no artificial minimum. It dismisses on
 *   `load`, and the animation is tuned to finish around the point a fast
 *   connection would be ready anyway. Making someone wait to admire your
 *   loader is the opposite of premium.
 *
 *   It cannot trap anyone. The overlay is in the server HTML so there is no
 *   flash of content before it, and a CSS animation removes it on a hard
 *   deadline whether or not any JavaScript runs. If this component never
 *   hydrates, the page still appears.
 *
 *   Once per session. A returning visitor navigating between pages sees the
 *   site, not the intro. Marked in sessionStorage before first paint.
 *
 *   Never under reduced motion. Skipped outright, not shortened.
 *
 * The pre-paint half lives in LOADER_SCRIPT below, inlined into <head>.
 */

const SEEN_KEY = 'pp.seen';

/**
 * Runs before first paint, inlined into <head>.
 *
 * Decides whether the overlay should show at all. It has to happen here
 * rather than in an effect: by the time React hydrates, the overlay has
 * already been painted, and hiding it then is a flicker rather than a
 * decision.
 */
export const LOADER_SCRIPT = `(function(){var d=document.documentElement;try{
if(sessionStorage.getItem('${SEEN_KEY}')){d.classList.add('pp-ready');return;}
if(matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('pp-ready');return;}
sessionStorage.setItem('${SEEN_KEY}','1');
d.classList.add('pp-intro');
}catch(e){d.classList.add('pp-ready');}})();`;

export function Loader() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('pp-intro')) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      root.classList.add('pp-ready');
      // Leave the DOM alone until the exit has played out.
      window.setTimeout(() => root.classList.remove('pp-intro'), 900);
    };

    // Whichever comes first: the page being ready, or a ceiling. The ceiling
    // matters on a slow connection — nobody should stare at a logo because
    // an image is still in flight.
    if (document.readyState === 'complete') {
      window.setTimeout(finish, 520);
    } else {
      window.addEventListener('load', () => window.setTimeout(finish, 240), { once: true });
    }
    const ceiling = window.setTimeout(finish, 2200);

    return () => window.clearTimeout(ceiling);
  }, []);

  return (
    <div className="pp-loader" aria-hidden="true">
      <div className="pp-loader-inner">
        <svg viewBox="0 0 240 80" className="pp-loader-art" role="presentation">
          {/* The trajectory, drawn on. */}
          <path
            className="pp-loader-path"
            d="M 8 62 C 60 62 96 34 140 22 C 172 13 200 10 232 8"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="0.02 0.03"
            pathLength={1}
            vectorEffect="non-scaling-stroke"
          />
          {/* The ground it leaves. */}
          <line
            x1="0"
            y1="70"
            x2="240"
            y2="70"
            stroke="var(--hairline)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* The mark, flying the path. Two axes so the arc scales with the box. */}
        <span className="pp-loader-plane">
          <span>
            <svg viewBox="0 0 20 16" className="h-full w-full">
              <path d="M 0 0 L 20 8 L 0 16 L 5 8 Z" fill="var(--accent)" />
            </svg>
          </span>
        </span>

        <span className="pp-loader-word">The Paper Plane</span>
      </div>
    </div>
  );
}
