/**
 * The hero's 3D scene: a paper plane, folded from four polygons in real CSS
 * 3D, hovering over the work it carries — a website going live, a return
 * reconciled, a scope agreed in writing. It is the proposition drawn: the
 * papers and the build, carried by one plane.
 *
 * Decorative in full. Everything it says is said in text beside it, so the
 * whole scene is hidden from assistive technology. All motion is CSS (see the
 * scene section of app/fx.css); the pointer tilt comes from the interaction
 * engine writing --px and --py onto `[data-parallax]`.
 */
export function HeroScene() {
  return (
    <div className="scene-wrap" aria-hidden="true">
      <div className="scene" data-parallax>
        {/* The backdrop — light, orbits, trail and shadow — sits in its own 3D
            context. Sharing one with the plane lets the browser slice the
            plane's faces against these large tilted layers. */}
        <div className="scene-back">
          <div className="scene-glow" />

          <div className="scene-orbit">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="49"
                fill="none"
                stroke="var(--accent)"
                strokeOpacity="0.45"
                strokeWidth="0.25"
                strokeDasharray="0.6 1.6"
              />
              <circle cx="50" cy="1" r="1.1" fill="var(--accent)" />
            </svg>
          </div>
          <div className="scene-orbit scene-orbit-2">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="49"
                fill="none"
                stroke="var(--brand-blue)"
                strokeOpacity="0.35"
                strokeWidth="0.3"
              />
              <circle cx="99" cy="50" r="1.4" fill="var(--brand-blue)" />
            </svg>
          </div>

          <div className="scene-trail">
            <svg viewBox="0 0 100 92" preserveAspectRatio="none">
              <path
                d="M -4 88 C 14 84 26 72 34 62 C 40 54 44 50 50 47"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="0.45"
                strokeLinecap="round"
                strokeDasharray="0.012 0.022"
                pathLength={1}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div className="pl-shadow" />
        </div>

        <div className="scene-stage">
          <div className="scene-world">
            {/* The work it carries */}
            <div
              className="scene-card"
              style={{ left: '2%', top: '58%', ['--z' as string]: '120px', ['--ci' as string]: 0 }}
            >
              <span className="scene-card-label">
                <span className="scene-dot" /> Website · Live
              </span>
              <div className="scene-browser">
                <div className="scene-browser-bar">
                  <i />
                  <i />
                  <i />
                  <span>yourbrand.in</span>
                </div>
                <div className="scene-browser-body">
                  <i />
                  <b />
                  <i />
                  <i style={{ width: '70%' }} />
                </div>
              </div>
            </div>

            <div
              className="scene-card"
              style={{ left: '6%', top: '6%', ['--z' as string]: '-90px', ['--ci' as string]: 1 }}
            >
              <span className="scene-card-label">GST · Monthly</span>
              <div className="scene-card-title">GSTR-3B reconciled</div>
              <div className="scene-bar">
                <i />
              </div>
              <div className="scene-card-meta">Filed before the 20th</div>
            </div>

            <div
              className="scene-card"
              style={{
                right: '0%',
                top: '62%',
                width: '15em',
                ['--z' as string]: '60px',
                ['--ci' as string]: 2,
              }}
            >
              <span className="scene-card-label">Scope of work</span>
              <div className="scene-checks">
                <span>Fee fixed in writing</span>
                <span>Timeline agreed</span>
                <span>Two-person review</span>
              </div>
            </div>

            <span
              className="scene-spark"
              style={{ left: '78%', top: '14%', ['--z' as string]: '160px', ['--ci' as string]: 0 }}
            />
            <span
              className="scene-spark"
              style={{ left: '88%', top: '40%', ['--z' as string]: '-40px', ['--ci' as string]: 1 }}
            />
            <span
              className="scene-spark"
              style={{ left: '42%', top: '86%', ['--z' as string]: '80px', ['--ci' as string]: 2 }}
            />

            {/* The plane */}
            <div className="pl-away">
              <div className="pl-arrive">
                <div className="pl-bob">
                  <div className="pl-steer">
                    <div className="pl-body">
                      <i className="pl-face pl-keel pl-keel-far" />
                      <i className="pl-face pl-wing pl-wing-far" />
                      <i className="pl-face pl-keel pl-keel-near" />
                      <i className="pl-face pl-wing pl-wing-near" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
