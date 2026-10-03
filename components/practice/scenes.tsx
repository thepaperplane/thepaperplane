import { BadgeCheck, IndianRupee, Mail, Sparkles, UserRound } from 'lucide-react';
import {
  At,
  Badge,
  Bars,
  bezier,
  Card,
  Count,
  Flyer,
  Glow,
  Label,
  Pill,
  Row,
  Win,
  Wires,
} from '@/components/motion/props';
import { Stage } from '@/components/motion/stage';

/**
 * The two halves of the practice, each as a short film.
 *
 * Advisory: four live obligations — a return, a GST filing, a notice, the
 * monthly books — and the plane flies its route through all four, closing
 * each one as it passes. Engineering: a site, a portal, a brand and an
 * automation, built in the same pass. Same plane, same route, same team.
 */

// Along the gutter between the four cards, left to right.
const ROUTE: [number, number][] = [
  [-6, 34],
  [30, 25],
  [70, 37],
  [106, 28],
];

export function AdvisoryScene() {
  return (
    <Stage
      hue="tax"
      cycle={11000}
      label="Four obligations on a live desk — an income tax return, a GST filing, a notice and the monthly books — and the paper plane flies through each one, turning it from pending to done."
    >
      <Glow x={20} y={6} w={60} h={50} />
      <Wires>
        <path
          d="M-6 34 C 30 25, 70 37, 106 28"
          className="ms-stroke-ctx"
          strokeWidth={0.35}
          strokeDasharray="0.8 1.2"
          fill="none"
        />
      </Wires>

      {/* Return */}
      <Card x={4} y={5} w={42} h={24} m="rise" at={100} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Income tax return</span>
          <span className="ms-ref">ITR-3</span>
        </div>
        <Row label="Matched to AIS" value="12 / 12" checkAt={2100} />
        <Row label="Refund due" value="₹41,600" tone="ok" />
      </Card>
      {/* GST */}
      <Card x={54} y={5} w={42} h={24} m="rise" at={250} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">GST · September</span>
          <span className="ms-ref">3B</span>
        </div>
        <Row label="Input credit" value="₹1.2L" checkAt={3450} />
        <Row label="Filed" value="18th · 2 days early" tone="ok" />
      </Card>
      {/* Notice */}
      <Card x={4} y={33} w={42} h={24} m="rise" at={400} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Notice</span>
          <span className="ms-ref">s.143(2)</span>
        </div>
        <Row label="Reply due" value="in 30 days" tone="warn" />
        <Row label="Reply filed" value="Day 6" tone="ok" checkAt={2250} m="fade" at={2050} />
      </Card>
      {/* Books */}
      <Card x={54} y={33} w={42} h={24} m="rise" at={550} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Books</span>
          <span className="ms-ref">Monthly close</span>
        </div>
        <Row label="Bank reconciled" value="₹0 diff" checkAt={3600} />
        <Row label="Ready for audit" value="Yes" tone="ok" />
      </Card>

      <Flyer
        path={bezier(ROUTE[0], ROUTE[1], ROUTE[2], ROUTE[3], 36)}
        at={1300}
        dur={3000}
        size={7}
      />
      <Pill x={50} y={59.5} tone="ok" center m="pop" at={4400} icon={<BadgeCheck />}>
        All four handled · one team
      </Pill>
    </Stage>
  );
}

export function EngineeringScene() {
  return (
    <Stage
      hue="digital"
      cycle={11000}
      label="A website, a client portal, a brand and an automation are built together: the site goes live, the dashboard fills with real figures, the mark is set, and invoices start reading themselves."
    >
      <Glow x={20} y={6} w={60} h={50} />
      {/* Website */}
      <Win x={4} y={5} w={46} h={33} url="yourbrand.in" m="rise" at={100}>
        <At x={2.4} y={2.2} w={22} h={3.2} className="ms-t ms-m ms-b" m="type" at={700} dur={700}>
          <span>Grow online</span>
        </At>
        <At x={2.4} y={7.4} w={18} h={1} className="ms-line" m="grow-x" at={1300} dur={500} />
        <At x={2.4} y={9.8} w={14} h={1} className="ms-line" m="grow-x" at={1400} dur={500} />
        <At x={2.4} y={13.4} w={11} h={4} className="ms-cta" m="pop" at={1700} />
        <At x={27} y={2.4} w={16.5} h={16} className="ms-hero-img" m="rise" at={1000} />
        <Pill x={2.4} y={21.5} tone="ok" m="pop" at={2300}>
          Live · speed 98
        </Pill>
      </Win>

      {/* Portal */}
      <Card x={54} y={5} w={42} h={33} m="rise" at={300} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Client portal</span>
          <span className="ms-ref">Roles</span>
        </div>
        <Bars
          x={2}
          y={8}
          w={22}
          h={17}
          values={[34, 52, 46, 72, 90]}
          highlight={[4]}
          at={2600}
          step={120}
          gap={1.2}
        />
        <Label x={27} y={8} size="xs" tone="ink-3">
          Collected
        </Label>
        <Label x={27} y={11.4} size="l" weight="b">
          <Count to={92} at={2700} dur={1300} />%
        </Label>
        <Label x={27} y={19} size="xs" tone="ink-3">
          <UserRound style={{ width: '2cqi', height: '2cqi', verticalAlign: '-0.3cqi' }} /> 14
          signed in
        </Label>
      </Card>

      {/* Brand */}
      <Card x={4} y={42} w={30} h={16} m="rise" at={500} className="ms-doc ms-inline">
        <span className="ms-brandmark" data-m="pop" data-at="3600" data-dur="600" />
        <span className="ms-col">
          <span className="ms-t ms-s ms-b">Identity</span>
          <span className="ms-t ms-xs ms-c-ink-3">Mark · type</span>
        </span>
      </Card>

      {/* Automation */}
      <Card x={38} y={42} w={58} h={16} m="rise" at={700} className="ms-doc">
        <span className="ms-t ms-xs ms-c-ink-3 ms-sb">Invoices read and posted automatically</span>
      </Card>
      <Wires>
        <path d="M46 53 L 86 53" className="ms-stroke-ctx" strokeWidth={0.35} fill="none" />
      </Wires>
      <Badge x={42} y={50} size={6} tone="paper" m="pop" at={4200}>
        <Mail strokeWidth={2.4} />
      </Badge>
      <Badge x={63} y={50} size={6} tone="hue" m="pop" at={4500}>
        <Sparkles strokeWidth={2.4} />
      </Badge>
      <Badge x={84} y={50} size={6} tone="ok" m="pop" at={4800} />
      {[0, 1, 2].map((i) => (
        <At
          key={i}
          x={47}
          y={51.5}
          w={3}
          h={3}
          className="ms-token"
          m="travel"
          tx={36}
          at={5000 + i * 900}
          dur={800}
        />
      ))}
      <Pill x={74} y={37.5} tone="ok" m="pop" at={5600} icon={<IndianRupee />}>
        <Count to={1204} at={5600} dur={1500} /> posted
      </Pill>

      <Flyer
        path={bezier([2, 40], [30, 30], [60, 46], [99, 36], 30)}
        at={6200}
        dur={1800}
        size={6}
      />
    </Stage>
  );
}

export const PRACTICE_SCENES = {
  advisory: AdvisoryScene,
  engineering: EngineeringScene,
} as const;
