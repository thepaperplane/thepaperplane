'use client';

import { useEffect, useRef } from 'react';
import './quote.css';

type Step = { t: string; d: string };
type Kind = 'share' | 'prepare' | 'verify' | 'file' | 'follow' | 'deliver';

/** Picks the drawing that matches what the step is about. */
export function stepKind(title: string, index: number, count: number): Kind {
  const t = title.toLowerCase();
  if (
    /deliver|receive|handed|go live|acknowledg|certificate|goes live|hand over|you are incorporated/.test(
      t,
    )
  )
    return 'deliver';
  if (/verif|otp|approve|review|sign|confirm|summary|go-ahead|test/.test(t)) return 'verify';
  if (/\bfile|submit|apply|register/.test(t)) return 'file';
  if (/follow|track|quer|inspection|monitor|care|monthly|wait/.test(t)) return 'follow';
  if (
    /prepare|fill|draft|design|build|record|set up|choose|check|match|pick|reconcile|explain/.test(
      t,
    )
  )
    return 'prepare';
  if (/share|send|tell|collect|documents|bills|details/.test(t)) return 'share';
  if (index === 0) return 'share';
  if (index === count - 1) return 'deliver';
  return index % 2 ? 'prepare' : 'file';
}

function Illustration({ kind }: { kind: Kind }) {
  const common = { viewBox: '0 0 120 90', className: 'pf-ill', 'aria-hidden': true as const };
  switch (kind) {
    case 'share':
      return (
        <svg {...common}>
          <rect className="fa" x="10" y="14" width="34" height="62" rx="7" />
          <path className="g" d="M18 28h18M18 36h12M18 44h16" />
          <circle className="fk" cx="27" cy="66" r="2.2" />
          <path className="fs" d="M78 40l8-6h12l4 5h8v30H78z" />
          <path className="a" d="M78 46h34" />
          <g className="sheet">
            <rect className="fs" x="52" y="30" width="14" height="18" rx="2" />
            <path className="a" d="M55 36h8M55 41h6" />
          </g>
          <g className="sheet two">
            <rect className="fs" x="52" y="46" width="14" height="18" rx="2" />
            <path className="a" d="M55 52h8M55 57h6" />
          </g>
        </svg>
      );
    case 'prepare':
      return (
        <svg {...common}>
          <rect className="fa" x="28" y="12" width="56" height="70" rx="6" />
          <rect className="fs" x="45" y="7" width="22" height="11" rx="4" />
          <path className="a draw" style={{ '--len': 38 } as React.CSSProperties} d="M38 36h36" />
          <path
            className="a draw l2"
            style={{ '--len': 38 } as React.CSSProperties}
            d="M38 50h36"
          />
          <path
            className="a draw l3"
            style={{ '--len': 24 } as React.CSSProperties}
            d="M38 64h22"
          />
          <g className="pencil">
            <path className="fk" d="M82 26l9 9-20 8 3-9z" />
            <path className="g" d="M91 35l4-4-9-9-4 4" />
          </g>
        </svg>
      );
    case 'verify':
      return (
        <svg {...common}>
          <rect className="fa" x="38" y="8" width="44" height="74" rx="8" />
          <path className="g" d="M52 16h16" />
          <circle className="fk blink" cx="48" cy="40" r="3.4" />
          <circle className="fk blink d2" cx="58" cy="40" r="3.4" />
          <circle className="fk blink d3" cx="68" cy="40" r="3.4" />
          <circle className="fk blink d4" cx="78" cy="40" r="0" />
          <circle className="fp tick" cx="60" cy="62" r="0" />
          <path className="p tick" d="M50 62l7 7 14-15" />
        </svg>
      );
    case 'file':
      return (
        <svg {...common}>
          <rect className="fs" x="8" y="42" width="24" height="32" rx="3" />
          <path className="a" d="M13 50h14M13 57h14M13 64h9" />
          <path className="fs" d="M76 74V44l22-12 22 12v30z" transform="translate(-14 0)" />
          <path
            className="a"
            d="M70 74V44M84 74V44M98 74V44M64 46h42M64 74h42"
            transform="translate(-10 0)"
          />
          <g className="glide">
            <path className="fk" d="M34 30l24-8-8 22-5-8z" />
            <path className="g" d="M45 36l5-14" />
          </g>
        </svg>
      );
    case 'follow':
      return (
        <svg {...common}>
          <circle className="fa" cx="60" cy="45" r="30" />
          <path className="g" d="M60 20v5M60 65v5M35 45h5M80 45h5" />
          <g className="hand">
            <path className="a" d="M60 45V27" />
          </g>
          <path className="a" d="M60 45l12 7" />
          <circle className="fk" cx="60" cy="45" r="3" />
          <circle className="fs" cx="96" cy="68" r="11" />
          <path className="p" d="M90 68l4 4 8-9" style={{ strokeWidth: 2.4 }} />
        </svg>
      );
    case 'deliver':
      return (
        <svg {...common}>
          <rect className="fa" x="20" y="12" width="80" height="58" rx="6" />
          <path className="g" d="M32 28h40M32 38h56M32 48h30" />
          <g className="stamp">
            <circle className="fp" cx="82" cy="54" r="13" />
            <path
              d="M75 54l5 5 9-10"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <path className="fk spark" d="M14 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          <path className="fk spark d2" d="M104 14l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" />
          <path
            className="fk spark d3"
            d="M106 62l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4z"
          />
        </svg>
      );
  }
}

const Plane = () => (
  <svg viewBox="0 0 24 24" className="pf-plane" fill="none" aria-hidden="true">
    <path
      d="M2.5 11.2 21 3.5l-6.6 17-3.6-6.6z"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * "How it works" as a short illustrated flight: numbered stops along a
 * dashed path, a paper plane flying through them, and a small drawing for
 * each step that comes to life when it scrolls into view.
 */
export function ProcessFlow({ steps, label }: { steps: Step[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        el.dataset.run = e?.isIntersecting ? 'true' : 'false';
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="pf"
      style={{ '--pf-n': steps.length } as React.CSSProperties}
      role="group"
      aria-label={label}
    >
      <div className="pf-lane" aria-hidden="true">
        {steps.map((_, i) => (
          <span key={i} className="pf-dot" style={{ '--i': i } as React.CSSProperties}>
            {i + 1}
          </span>
        ))}
        <Plane />
      </div>
      <ol className="pf-list">
        {steps.map((s, i) => (
          <li key={s.t} className="pf-step" style={{ '--i': i } as React.CSSProperties}>
            <Illustration kind={stepKind(s.t, i, steps.length)} />
            <div>
              <p className="pf-title">
                <span className="pf-num" aria-hidden="true">
                  {i + 1}
                </span>
                {s.t}
              </p>
              <p className="pf-desc">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
