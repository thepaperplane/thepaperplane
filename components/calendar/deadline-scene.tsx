import { BellRing } from 'lucide-react';
import { At, Badge, Count, Label, Pill, Pulse, Wire, Wires } from '@/components/motion/props';
import { Stage } from '@/components/motion/stage';

/**
 * The month as a dial. The hand sweeps from the 1st to the 30th and each
 * recurring deadline it reaches is closed — TDS on the 7th, GSTR-1 on the
 * 11th, PF and ESI on the 15th, GSTR-3B on the 20th — with the matching line
 * ticked off on the right at the same moment.
 */

const CX = 25;
const CY = 31.25;
const R = 21;

function point(day: number, r = R): [number, number] {
  const a = -Math.PI / 2 + ((day - 1) / 30) * Math.PI * 2;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function arc(from: number, to: number): string {
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  const large = (to - from) / 30 > 0.5 ? 1 : 0;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const DUES = [
  { day: 7, title: 'TDS / TCS deposit', at: 1200 },
  { day: 11, title: 'GSTR-1', at: 1750 },
  { day: 15, title: 'PF & ESI', at: 2300 },
  { day: 20, title: 'GSTR-3B & payment', at: 2950 },
];

export function DeadlineScene() {
  const segments = [
    { a: 1, b: 7, at: 500, dur: 700 },
    { a: 7, b: 11, at: 1250, dur: 500 },
    { a: 11, b: 15, at: 1800, dur: 500 },
    { a: 15, b: 20, at: 2350, dur: 600 },
    { a: 20, b: 30.6, at: 3000, dur: 1100 },
  ];
  return (
    <Stage
      hue="tax"
      cycle={9000}
      label="A month drawn as a dial: as the days pass, TDS on the 7th, GSTR-1 on the 11th, PF and ESI on the 15th and GSTR-3B on the 20th are each closed on time, with a reminder sent three days before each."
    >
      <Wires>
        <circle cx={CX} cy={CY} r={R} className="ms-ring-track" strokeWidth={1.6} fill="none" />
        {Array.from({ length: 30 }, (_, i) => {
          const [x1, y1] = point(i + 1, R - 3.2);
          const [x2, y2] = point(i + 1, R - (i % 5 === 0 ? 4.8 : 3.9));
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className="ms-stroke-ctx"
              strokeWidth={0.3}
            />
          );
        })}
        {segments.map((s) => (
          <Wire key={s.a} d={arc(s.a, s.b)} width={1.6} m="draw" at={s.at} dur={s.dur} />
        ))}
      </Wires>
      {DUES.map((d) => {
        const [x, y] = point(d.day);
        return (
          <At key={d.day} x={x} y={y} w={0} h={0}>
            <Badge x={0} y={0} size={5.4} center tone="ok" m="pop" at={d.at} />
            <Pulse x={0} y={0} size={9} tone="ok" at={d.at} />
          </At>
        );
      })}
      {DUES.map((d) => {
        const [x, y] = point(d.day, R + 6.4);
        return (
          <Label key={`n${d.day}`} x={x} y={y} size="xs" tone="ink-2" weight="b" center>
            {d.day}
          </Label>
        );
      })}
      <Label x={CX} y={CY - 4} size="xs" tone="ink-3" center>
        This month
      </Label>
      <Label x={CX} y={CY + 1.4} size="l" weight="b" center>
        <Count to={4} at={1200} dur={1800} /> of 4
      </Label>
      <Label x={CX} y={CY + 6.4} size="xs" tone="ok" weight="sb" center>
        on time
      </Label>

      {/* The same four, as a list */}
      {DUES.map((d, i) => (
        <At
          key={`r${d.day}`}
          x={56}
          y={8 + i * 9.6}
          w={40}
          h={7.4}
          className="ms-due"
          m="rise"
          at={150 + i * 120}
        >
          <span className="ms-due-day">{d.day}</span>
          <span className="ms-t ms-s ms-sb ms-trunc">{d.title}</span>
          <span
            className="ms-tick"
            style={{ marginLeft: 'auto' }}
            data-m="pop"
            data-at={String(d.at)}
            data-dur="500"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </At>
      ))}
      <Pill x={56} y={49} tone="hue" m="pop" at={3800} icon={<BellRing />}>
        Reminder three days before each
      </Pill>
    </Stage>
  );
}
