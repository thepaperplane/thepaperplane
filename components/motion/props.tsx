import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The props a motion stage is built from.
 *
 * Coordinates are in `cqi` — hundredths of the stage's width — on both axes,
 * so a 16:10 stage is 100 wide and 62.5 tall and a square stays square at any
 * size. Type is sized the same way, which is what lets one scene read the same
 * on a phone and on a 27-inch screen.
 *
 * Every prop takes the motion attributes documented in ./stage.tsx (`m`, `at`,
 * `dur`, `fx`, `fy`, `out`, `then`...). Without them it simply sits in the
 * scene as structure.
 */

export type Motion = {
  m?:
    | 'rise'
    | 'fade'
    | 'pop'
    | 'fly'
    | 'grow-x'
    | 'grow-y'
    | 'draw'
    | 'stamp'
    | 'type'
    | 'flip'
    | 'drop'
    | 'scan'
    | 'travel'
    | 'pulse'
    | 'path';
  at?: number;
  dur?: number;
  fx?: number;
  fy?: number;
  tx?: number;
  ty?: number;
  rot?: number;
  out?: number;
  then?: string;
  thenAt?: number;
  thenDur?: number;
};

export function mo(m: Motion): Record<string, string | undefined> {
  if (!m.m) return {};
  const s = (v: number | string | undefined) => (v === undefined ? undefined : String(v));
  return {
    'data-m': m.m,
    'data-at': s(m.at),
    'data-dur': s(m.dur),
    'data-fx': s(m.fx),
    'data-fy': s(m.fy),
    'data-tx': s(m.tx),
    'data-ty': s(m.ty),
    'data-rot': s(m.rot),
    'data-out': s(m.out),
    'data-then': m.then,
    'data-then-at': s(m.thenAt),
    'data-then-dur': s(m.thenDur),
  };
}

function split<T extends Motion>(props: T): [Motion, Omit<T, keyof Motion>] {
  const { m, at, dur, fx, fy, tx, ty, rot, out, then, thenAt, thenDur, ...rest } = props;
  return [{ m, at, dur, fx, fy, tx, ty, rot, out, then, thenAt, thenDur }, rest];
}

const u = (n: number | undefined) => (n === undefined ? undefined : `${n}cqi`);

type Place = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  z?: number;
  /** Anchor at the centre instead of the top-left corner. */
  center?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** Anything, placed. */
export function At(props: Place & Motion) {
  const [motion, { x, y, w, h, z, center, className, style, children }] = split(props);
  return (
    <div
      className={cn('ms-a', className)}
      style={{
        left: u(x),
        top: u(y),
        width: u(w),
        height: u(h),
        zIndex: z,
        translate: center ? '-50% -50%' : undefined,
        ...style,
      }}
      {...mo(motion)}
    >
      {children}
    </div>
  );
}

type Tone = 'hue' | 'ok' | 'warn' | 'bad' | 'ink' | 'paper' | 'quiet';

/** A card. Paper by default; `tone` tints it. */
export function Card({
  tone = 'paper',
  className,
  ...props
}: Place & Motion & { tone?: 'paper' | 'raised' | 'tint' | 'ink' | 'glass' | 'ok' | 'warn' }) {
  return <At className={cn('ms-card', `ms-card-${tone}`, className)} {...props} />;
}

/** Placeholder lines of text. Widths in percent of the parent. */
export function Lines({
  widths,
  gap = 1.1,
  thick = 0.9,
  tone = 'ctx',
  stagger,
  at = 0,
  className,
}: {
  widths: number[];
  gap?: number;
  thick?: number;
  tone?: 'ctx' | 'hue' | 'ink' | 'ok' | 'warn';
  /** Draw each line on in turn, this many ms apart. */
  stagger?: number;
  at?: number;
  className?: string;
}) {
  return (
    <div className={cn('ms-lines', className)} style={{ gap: u(gap) }}>
      {widths.map((w, i) => (
        <i
          key={i}
          className={`ms-line ms-line-${tone}`}
          style={{ width: `${w}%`, height: u(thick) }}
          {...(stagger !== undefined ? mo({ m: 'grow-x', at: at + i * stagger, dur: 600 }) : {})}
        />
      ))}
    </div>
  );
}

/** A document: header, optional reference, then whatever it contains. */
export function Doc({
  title,
  refText,
  lines,
  children,
  tone = 'paper',
  className,
  ...props
}: Place &
  Motion & {
    title?: React.ReactNode;
    refText?: string;
    lines?: number[];
    tone?: 'paper' | 'raised' | 'tint' | 'ink' | 'glass';
  }) {
  return (
    <Card tone={tone} className={cn('ms-doc', className)} {...props}>
      {title || refText ? (
        <div className="ms-doc-h">
          {title ? <span className="ms-t ms-s ms-b ms-trunc">{title}</span> : <span />}
          {refText ? <span className="ms-ref">{refText}</span> : null}
        </div>
      ) : null}
      {lines ? <Lines widths={lines} /> : null}
      {children}
    </Card>
  );
}

/** A labelled row inside a document; `checkAt` ticks it off at that moment. */
export function Row({
  label,
  value,
  tone,
  checkAt,
  checkTone = 'ok',
  className,
  ...motion
}: Motion & {
  label: React.ReactNode;
  value?: React.ReactNode;
  tone?: 'ok' | 'warn' | 'bad' | 'hue';
  checkAt?: number;
  checkTone?: 'ok' | 'warn' | 'hue';
  className?: string;
}) {
  return (
    <div className={cn('ms-row', tone && `ms-row-${tone}`, className)} {...mo(motion)}>
      <span className="ms-trunc">{label}</span>
      <span className="ms-row-v">
        {value !== undefined ? (
          <b
            className={
              typeof value === 'string' && /^[-−₹$\d]/.test(value) ? 'ms-mono-v' : undefined
            }
          >
            {value}
          </b>
        ) : null}
        {checkAt !== undefined ? (
          <span
            className={`ms-tick ms-tick-${checkTone}`}
            {...mo({ m: 'pop', at: checkAt, dur: 500 })}
          >
            <Check strokeWidth={3.4} />
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** A reading head passing down whatever it sits in. */
export function Beam({
  at,
  dur = 1600,
  travel = 30,
}: {
  at: number;
  dur?: number;
  travel?: number;
}) {
  return <div className="ms-beam" {...mo({ m: 'scan', at, dur, fy: 0, ty: travel })} />;
}

/** A pill: a tag, a status, a document in flight. */
export function Pill({
  tone = 'paper',
  icon,
  children,
  className,
  ...props
}: Place & Motion & { tone?: Tone; icon?: React.ReactNode }) {
  return (
    <At className={cn('ms-pill', `ms-pill-${tone}`, className)} {...props}>
      {icon ? <span className="ms-pill-i">{icon}</span> : null}
      <span className="ms-trunc">{children}</span>
    </At>
  );
}

/** A rubber stamp. Lands last; it is the outcome. */
export function Stamp({
  tone = 'ok',
  children,
  tilt = -8,
  className,
  ...props
}: Place & Motion & { tone?: 'ok' | 'hue' | 'warn' | 'bad'; tilt?: number }) {
  return (
    <At className={cn('ms-stamp-wrap', className)} {...props}>
      <span className={`ms-stamp ms-stamp-${tone}`} style={{ rotate: `${tilt}deg` }}>
        {children}
      </span>
    </At>
  );
}

/** A round badge holding an icon — a check by default. */
export function Badge({
  size = 6,
  tone = 'ok',
  children,
  className,
  ...props
}: Omit<Place, 'w' | 'h'> & Motion & { size?: number; tone?: Tone }) {
  return (
    <At className={cn('ms-badge', `ms-badge-${tone}`, className)} w={size} h={size} {...props}>
      {children ?? <Check strokeWidth={3} />}
    </At>
  );
}

/** A soft ring that swells once when something arrives. Invisible at rest. */
export function Pulse({
  size = 8,
  tone = 'hue',
  ...props
}: Omit<Place, 'w' | 'h'> & Motion & { size?: number; tone?: 'hue' | 'ok' | 'warn' }) {
  return (
    <At
      className={`ms-pulse ms-pulse-${tone}`}
      w={size}
      h={size}
      center
      m="pulse"
      dur={900}
      {...props}
    />
  );
}

/** Plain text, placed. */
export function Label({
  size = 's',
  tone = 'ink',
  weight,
  mono,
  children,
  className,
  ...props
}: Place &
  Motion & {
    size?: 'xs' | 's' | 'm' | 'l' | 'xl';
    tone?: 'ink' | 'ink-2' | 'ink-3' | 'hue' | 'ok' | 'warn' | 'bad' | 'white';
    weight?: 'b' | 'sb';
    mono?: boolean;
  }) {
  return (
    <At
      className={cn(
        'ms-t',
        `ms-${size}`,
        `ms-c-${tone}`,
        weight && `ms-${weight}`,
        mono && 'ms-mono',
        className,
      )}
      {...props}
    >
      {children}
    </At>
  );
}

/** A number that counts up to its final value. Rendered at the final value. */
export function Count({
  to,
  from = 0,
  at = 0,
  dur = 1400,
  decimals = 0,
}: {
  to: number;
  from?: number;
  at?: number;
  dur?: number;
  decimals?: number;
}) {
  const final =
    decimals > 0 ? to.toFixed(decimals) : new Intl.NumberFormat('en-IN').format(Math.round(to));
  return (
    <span
      className="ms-num"
      data-count={to}
      data-from={from}
      data-at={at}
      data-count-dur={dur}
      data-decimals={decimals || undefined}
    >
      {final}
    </span>
  );
}

/** Bars of a chart, growing in turn. Values are percent of the box height. */
export function Bars({
  values,
  highlight = [],
  at = 0,
  step = 120,
  gap = 1,
  className,
  ...place
}: Place & {
  values: number[];
  highlight?: number[];
  at?: number;
  step?: number;
  gap?: number;
}) {
  return (
    <At className={cn('ms-bars', className)} style={{ gap: u(gap) }} {...place}>
      {values.map((v, i) => (
        <i
          key={i}
          className={highlight.includes(i) ? 'ms-bar ms-bar-on' : 'ms-bar'}
          style={{ height: `${v}%` }}
          {...mo({ m: 'grow-y', at: at + i * step, dur: 700 })}
        />
      ))}
    </At>
  );
}

/** A progress ring that draws itself to `pct`, with anything in the middle. */
export function Ring({
  pct,
  size = 14,
  stroke = 1.4,
  tone = 'hue',
  at = 0,
  dur = 1400,
  children,
  ...place
}: Omit<Place, 'w' | 'h'> & {
  pct: number;
  size?: number;
  stroke?: number;
  tone?: 'hue' | 'ok' | 'warn';
  at?: number;
  dur?: number;
}) {
  const r = 50 - (stroke / size) * 50 - 1;
  return (
    <At className="ms-ring" w={size} h={size} {...place}>
      <svg viewBox="0 0 100 100" className="ms-ring-svg">
        <circle
          cx="50"
          cy="50"
          r={r}
          className="ms-ring-track"
          strokeWidth={(stroke / size) * 100}
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          className={`ms-ring-fill ms-stroke-${tone}`}
          strokeWidth={(stroke / size) * 100}
          pathLength={1}
          strokeDasharray={`${pct / 100} 2`}
          transform="rotate(-90 50 50)"
          {...mo({ m: 'draw', at, dur })}
        />
      </svg>
      <div className="ms-ring-c">{children}</div>
    </At>
  );
}

/** A person. Initials, or an icon. */
export function Avatar({
  size = 7,
  tone = 'hue',
  children,
  ...props
}: Omit<Place, 'w' | 'h'> & Motion & { size?: number; tone?: 'hue' | 'ink' | 'paper' | 'ok' }) {
  return (
    <At className={`ms-avatar ms-avatar-${tone}`} w={size} h={size} {...props}>
      {children}
    </At>
  );
}

/** A browser window. */
export function Win({ url, children, className, ...props }: Place & Motion & { url?: string }) {
  return (
    <Card tone="paper" className={cn('ms-win', className)} {...props}>
      <div className="ms-win-bar">
        <i />
        <i />
        <i />
        {url ? <span className="ms-url ms-trunc">{url}</span> : null}
      </div>
      <div className="ms-win-body">{children}</div>
    </Card>
  );
}

/** A phone. */
export function Phone({ children, className, ...props }: Place & Motion) {
  return (
    <At className={cn('ms-phone', className)} {...props}>
      <div className="ms-phone-screen">{children}</div>
    </At>
  );
}

/** A soft pool of the scene's colour behind the subject. */
export function Glow({ tone = 'hue', ...props }: Place & Motion & { tone?: 'hue' | 'ok' }) {
  return <At className={`ms-glow ms-glow-${tone}`} {...props} />;
}

/** An overlay for lines and arrows, in the same units as everything else. */
export function Wires({
  w = 100,
  h = 62.5,
  children,
  className,
}: {
  /** The viewBox, in cqi — match the box the wires sit in. */
  w?: number;
  h?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={cn('ms-svg', className)}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
    </svg>
  );
}

/** A connector that draws itself on. */
export function Wire({
  d,
  tone = 'hue',
  width = 0.35,
  dashed,
  ...motion
}: Motion & {
  d: string;
  tone?: 'hue' | 'ok' | 'warn' | 'bad' | 'ctx';
  width?: number;
  dashed?: boolean;
}) {
  const drawn = motion.m === 'draw';
  return (
    <path
      d={d}
      className={cn('ms-wire', `ms-stroke-${tone}`, dashed && 'ms-wire-dash')}
      strokeWidth={width}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={drawn ? 1 : undefined}
      strokeDasharray={drawn ? '1' : dashed ? `${width * 3} ${width * 3}` : undefined}
      {...mo(motion)}
    />
  );
}

/** A tilted plane that its children sit on, for depth. Never animated itself. */
export function Plane3D({
  rx = 0,
  ry = 0,
  rz = 0,
  children,
}: {
  rx?: number;
  ry?: number;
  rz?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="ms-plane"
      style={{ transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}
    >
      {children}
    </div>
  );
}

/** The pointer, travelling to something and clicking it. */
export function Pointer(props: Omit<Place, 'w' | 'h'> & Motion) {
  return (
    <At className="ms-pointer" w={3.4} h={3.4} {...props}>
      <svg viewBox="0 0 24 24">
        <path
          d="M5 3l14 8-6.2 1.6L10 19z"
          fill="var(--ms-pointer-fill)"
          stroke="var(--ms-pointer-edge)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </At>
  );
}

type Pt = [number, number];

/** Samples a cubic Bézier into "x,y,angle" points for a `path` flight. */
export function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 28, flat = false): string {
  const at = (t: number): Pt => {
    const u1 = 1 - t;
    return [
      u1 ** 3 * p0[0] + 3 * u1 ** 2 * t * p1[0] + 3 * u1 * t ** 2 * p2[0] + t ** 3 * p3[0],
      u1 ** 3 * p0[1] + 3 * u1 ** 2 * t * p1[1] + 3 * u1 * t ** 2 * p2[1] + t ** 3 * p3[1],
    ];
  };
  const out: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x, y] = at(t);
    const [ax, ay] = at(Math.min(1, t + 0.01));
    const [bx, by] = at(Math.max(0, t - 0.01));
    const deg = flat ? 0 : (Math.atan2(ay - by, ax - bx) * 180) / Math.PI;
    out.push(`${x.toFixed(2)},${y.toFixed(2)},${deg.toFixed(1)}`);
  }
  return out.join(';');
}

/**
 * Something flying a route — the paper plane, by default. Positioned by the
 * flight itself, so it sits at the route's end when nothing is animating.
 */
export function Flyer({
  path,
  at,
  dur = 2000,
  keep,
  size = 5,
  children,
}: {
  path: string;
  at: number;
  dur?: number;
  keep?: boolean;
  size?: number;
  children?: React.ReactNode;
}) {
  const last = path.split(';').at(-1)!.split(',').map(Number);
  return (
    <div
      className="ms-flyer"
      style={{
        width: u(size),
        height: u(size),
        transform: `translate(${last[0]}cqi, ${last[1]}cqi) rotate(${last[2]}deg)`,
        opacity: keep ? 1 : 0,
      }}
      data-m="path"
      data-path={path}
      data-at={at}
      data-dur={dur}
      data-keep={keep ? '' : undefined}
    >
      {children ?? <PlaneMark />}
    </div>
  );
}

/** The brand's paper plane, pointing right. */
export function PlaneMark() {
  return (
    <svg viewBox="0 0 48 48" className="ms-plane-mark">
      <path d="M4 22 L44 6 L30 42 L22 28 Z" className="ms-plane-top" />
      <path d="M22 28 L44 6 L18 25 Z" className="ms-plane-fold" />
      <path d="M18 25 L22 28 L20 36 Z" className="ms-plane-keel" />
    </svg>
  );
}
