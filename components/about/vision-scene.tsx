import { At, Badge, bezier, Flyer, Glow, Label, Pill, Wires } from '@/components/motion/props';
import { Stage } from '@/components/motion/stage';

/**
 * "Your Vision, Our Wings", drawn: a business climbing from an idea to a
 * company that runs itself, with the plane carrying it through each stage.
 */

// Points on the flight path itself (t = 0, ¼, ½, ¾, 1), timed to the plane.
const STOPS = [
  { t: 'Idea', x: 8, y: 52, at: 500 },
  { t: 'Registered', x: 27.6, y: 45.2, at: 1450 },
  { t: 'Compliant', x: 47.8, y: 34.8, at: 2400 },
  { t: 'Online', x: 69, y: 22.5, at: 3350 },
  { t: 'Growing', x: 92, y: 10, at: 4300 },
];

export function VisionScene() {
  return (
    <Stage
      hue="brand"
      cycle={10000}
      label="A business climbs from an idea to registered, compliant, online and growing, with the paper plane carrying it through each stage."
    >
      <Glow x={30} y={0} w={70} h={50} />
      <Wires>
        <path
          d="M8 52 C 34 46, 60 26, 92 10"
          className="ms-stroke-ctx"
          strokeWidth={0.35}
          strokeDasharray="0.8 1.2"
          fill="none"
        />
      </Wires>
      {/* The last stop is marked by the plane itself, where it comes to rest. */}
      {STOPS.slice(0, -1).map((s) => (
        <At key={s.t} x={s.x} y={s.y} w={0} h={0}>
          <Badge x={0} y={0} size={4.4} center tone="hue" m="pop" at={s.at} />
        </At>
      ))}
      {STOPS.map((s) => (
        <Label
          key={`l${s.t}`}
          x={s.x}
          y={s.y + (s.t === 'Growing' ? 6.4 : 5.4)}
          size="xs"
          tone="ink-2"
          weight="sb"
          center
          m="fade"
          at={s.at + 100}
        >
          {s.t}
        </Label>
      ))}
      <Flyer
        path={bezier([8, 52], [34, 46], [60, 26], [92, 10], 36)}
        at={500}
        dur={3800}
        size={7}
        keep
      />
      <Pill x={6} y={6} tone="quiet" m="rise" at={4700}>
        Your vision
      </Pill>
      <Pill x={6} y={14} tone="hue" m="rise" at={5000}>
        Our wings
      </Pill>
    </Stage>
  );
}
