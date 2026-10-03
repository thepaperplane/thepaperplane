import { BadgeCheck, Check, FileText, MessageCircle, Search, UserRound, X } from 'lucide-react';
import {
  At,
  Avatar,
  Badge,
  Beam,
  bezier,
  Card,
  Count,
  Doc,
  Flyer,
  Glow,
  Label,
  Lines,
  Pill,
  Pulse,
  Row,
  Stamp,
  Wire,
  Wires,
} from '@/components/motion/props';
import { Stage } from '@/components/motion/stage';

/**
 * The five steps of every engagement, as five short films.
 *
 * One rule across all five: the thing the client worries about is shown
 * being handled, and the step ends on what the client holds afterwards.
 */

export function ReadScene() {
  return (
    <Stage
      hue="brand"
      cycle={9000}
      label="A notice is read in full, line by line, until the clause that actually needs answering is found and marked — before any fee is quoted, and at no charge."
    >
      <Doc
        x={6}
        y={6}
        w={46}
        h={51}
        tone="raised"
        title="Your document"
        refText="Page 2 of 4"
        m="rise"
        at={100}
      >
        <Beam at={700} dur={2200} travel={42} />
        <Lines widths={[94, 88, 72, 90]} />
        <div className="ms-mark-wrap">
          <i className="ms-mark" data-m="grow-x" data-at="2500" data-dur="700" />
          <Lines widths={[90, 66]} tone="ink" />
        </div>
        <Lines widths={[84, 92, 60, 78]} />
        <Lines widths={[88, 70, 94, 52]} />
      </Doc>
      <Wires>
        <Wire d="M52 30 C 58 30, 58 22, 62 22" m="draw" at={3000} dur={500} />
      </Wires>
      <Card x={62} y={12} w={33} h={22} m="rise" at={3200} className="ms-doc" tone="raised">
        <span className="ms-t ms-xs ms-c-ink-3">The clause you answer</span>
        <span className="ms-t ms-m ms-b">Para 4(b)</span>
        <span className="ms-t ms-xs ms-c-ink-2">not the whole notice</span>
      </Card>
      <Pill x={62} y={39} m="pop" at={4300} icon={<Search />}>
        Read in full
      </Pill>
      <Pill x={62} y={47} tone="ok" m="pop" at={4800} icon={<BadgeCheck />}>
        No charge for this
      </Pill>
    </Stage>
  );
}

export function ScopeScene() {
  return (
    <Stage
      hue="brand"
      cycle={9000}
      label="A one-page scope: what is included, what is explicitly not, the fixed fee and what is needed from you by when — signed before work begins."
    >
      <Doc
        x={6}
        y={5}
        w={52}
        h={53}
        tone="raised"
        title="Scope of work"
        refText="1 page"
        m="rise"
        at={100}
      >
        <Row label="Included" value="Reply, hearing, follow-up" checkAt={700} />
        <Row label="Not included" value="Appeal, if needed" m="fade" at={1100} />
        <Row label="Fee" value="Fixed, in writing" checkAt={1500} />
        <Row label="From you" value="Bank statements · 12 Oct" checkAt={1900} />
        <div className="ms-sigs" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {['You', 'Us'].map((p, i) => (
            <span key={p} className="ms-sig">
              <svg viewBox="0 0 60 20">
                <path
                  d={
                    i === 0
                      ? 'M2 14 C 10 2, 14 18, 22 8 S 34 14, 40 6 S 52 12, 58 8'
                      : 'M2 12 C 8 4, 16 16, 24 10 C 30 6, 36 16, 44 8 L 58 10'
                  }
                  fill="none"
                  className="ms-stroke-hue"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1"
                  data-m="draw"
                  data-at={String(2600 + i * 500)}
                  data-dur="600"
                />
              </svg>
              <span className="ms-t ms-xs ms-c-ink-3">{p}</span>
            </span>
          ))}
        </div>
      </Doc>
      <Badge x={56} y={13.6} size={4.6} tone="bad" m="pop" at={1200}>
        <X strokeWidth={3} />
      </Badge>
      <Card x={64} y={9} w={31} h={22} m="rise" at={3500} className="ms-doc" tone="ok">
        <span className="ms-t ms-xs ms-c-ink-3">If it grows</span>
        <span className="ms-t ms-s ms-b">You hear first</span>
        <span className="ms-t ms-xs ms-c-ink-2">not in the invoice</span>
      </Card>
      <Stamp x={56} y={44} tone="ok" m="stamp" at={4300}>
        Agreed in writing
      </Stamp>
    </Stage>
  );
}

export function GroundworkScene() {
  const tracks = [
    { l: 'Ledgers reconciled', v: 100, at: 600 },
    { l: 'Evidence gathered', v: 100, at: 1100 },
    { l: 'Discovery on the build', v: 100, at: 1600 },
  ];
  return (
    <Stage
      hue="brand"
      cycle={9000}
      label="The unseen groundwork — ledgers reconciled, evidence gathered, discovery done on a build — each filled to completion before anything is presented."
    >
      <Card x={6} y={6} w={56} h={50} tone="raised" m="rise" at={100} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Groundwork</span>
          <span className="ms-ref">Most of the work</span>
        </div>
      </Card>
      {tracks.map((t, i) => (
        <At key={t.l} x={9} y={15 + i * 12.5} w={50} h={10}>
          <Label x={0} y={0} size="xs" tone="ink-2" weight="sb">
            {t.l}
          </Label>
          <Label x={50} y={0} size="xs" tone="hue" weight="b" className="ms-right">
            <Count to={t.v} at={t.at} dur={1500} />%
          </Label>
          <At x={0} y={4.4} w={50} h={2.2} className="ms-round ms-hue-soft" />
          <At
            x={0}
            y={4.4}
            w={50}
            h={2.2}
            className="ms-round ms-hue-solid"
            m="grow-x"
            at={t.at}
            dur={1500}
          />
        </At>
      ))}
      {/* The visible part — small, on top */}
      <Card x={67} y={14} w={28} h={14} m="rise" at={3300} className="ms-doc">
        <span className="ms-t ms-xs ms-c-ink-3">What you see</span>
        <span className="ms-t ms-s ms-b">The result</span>
      </Card>
      <Card x={67} y={31} w={28} h={25} m="rise" at={3000} className="ms-doc" tone="tint">
        <span className="ms-t ms-xs ms-c-ink-3">What decides it</span>
        <span className="ms-t ms-s ms-b">Everything under it</span>
        <Lines widths={[90, 70, 84]} />
      </Card>
      <Pill x={6} y={52.5} tone="ok" m="pop" at={4300} icon={<BadgeCheck />}>
        Holds up when examined
      </Pill>
    </Stage>
  );
}

export function ReviewScene() {
  return (
    <Stage
      hue="brand"
      cycle={9000}
      label="One person prepares the work and a second reviews it separately from the underlying records; the reviewer catches a figure that does not tie, it is corrected, and only then does it leave."
    >
      <Avatar x={8} y={6} size={8} tone="hue" m="pop" at={100}>
        <UserRound strokeWidth={2.2} />
      </Avatar>
      <Label x={18} y={8.4} size="s" weight="b" m="fade" at={200}>
        Prepared
      </Label>
      <Doc x={6} y={17} w={40} h={39} tone="raised" m="rise" at={300}>
        <Row label="Turnover" value="₹2.4 Cr" checkAt={800} />
        <Row label="Input credit" value="₹18.6L" checkAt={1100} />
        <Row label="TDS" value="₹3.1L" checkAt={1400} />
        <Row label="Net payable" value="₹4.2L" checkAt={1700} />
      </Doc>

      <Avatar x={56} y={6} size={8} tone="ink" m="pop" at={2000}>
        <UserRound strokeWidth={2.2} />
      </Avatar>
      <Label x={66} y={8.4} size="s" weight="b" m="fade" at={2100}>
        Reviewed
      </Label>
      <Doc x={54} y={17} w={40} h={39} tone="raised" m="rise" at={2200}>
        <Beam at={2500} dur={1600} travel={22} />
        <Row label="Turnover" value="₹2.4 Cr" checkAt={2800} />
        <Row label="Input credit" value="₹18.6L" checkAt={4900} />
        <Row label="TDS" value="₹3.1L" checkAt={3600} />
        <Row label="Net payable" value="₹4.2L" checkAt={4000} />
      </Doc>
      <Pill x={56} y={44} tone="warn" m="pop" at={3300} out={4700} icon={<Search />}>
        ₹42,000 not in 2B
      </Pill>
      <Pill x={56} y={44} tone="ok" m="pop" at={4800} icon={<Check />}>
        Corrected · ties
      </Pill>
      <Stamp x={28} y={53} tone="ok" m="stamp" at={5400}>
        Two pairs of eyes
      </Stamp>
    </Stage>
  );
}

export function AftercareScene() {
  return (
    <Stage
      hue="brand"
      cycle={9000}
      label="The paper plane takes off: the site goes live and the return is filed. Weeks later a follow-up question arrives and is answered as part of the same engagement."
    >
      <Glow x={10} y={0} w={70} h={60} />
      <At x={4} y={52} w={36} h={0.5} className="ms-line ms-line-ink" />
      <Wires>
        <path
          d="M6 50 C 30 50, 44 30, 96 6"
          className="ms-stroke-ctx"
          strokeWidth={0.35}
          strokeDasharray="0.8 1.2"
          fill="none"
        />
      </Wires>
      <Flyer
        path={bezier([6, 50], [30, 50], [44, 30], [96, 6], 34)}
        at={300}
        dur={2400}
        size={8}
        keep
      />
      <Pill x={18} y={31} tone="ok" m="pop" at={1100} icon={<BadgeCheck />}>
        Site live
      </Pill>
      <Pill x={44} y={12} tone="ok" m="pop" at={1800} icon={<FileText />}>
        Return filed
      </Pill>
      <Label x={4} y={56} size="xs" tone="ink-3" m="fade" at={500}>
        Takeoff
      </Label>

      {/* Later */}
      <Label x={54} y={30} size="xs" tone="ink-3" weight="sb" m="fade" at={3000}>
        Three weeks later
      </Label>
      <Card x={54} y={35} w={42} h={10.5} m="rise" at={3200} className="ms-doc ms-bubble">
        <span className="ms-t ms-xs ms-c-ink-3">You</span>
        <span className="ms-t ms-xs ms-sb">Can we add a careers page?</span>
      </Card>
      <Card
        x={48}
        y={48.5}
        w={42}
        h={10.5}
        m="rise"
        at={4100}
        className="ms-doc ms-bubble ms-bubble-us"
      >
        <span className="ms-t ms-xs ms-c-ink-3">The Paper Plane</span>
        <span className="ms-t ms-xs ms-sb">Live tomorrow, no new contract.</span>
      </Card>
      <Badge x={88} y={45.5} size={4.6} tone="hue" m="pop" at={4300}>
        <MessageCircle strokeWidth={2.4} />
      </Badge>
      <Pulse x={90.3} y={47.8} size={10} at={4300} />
      <Pill x={4} y={41} m="pop" at={5000} icon={<BadgeCheck />}>
        The file stays open
      </Pill>
    </Stage>
  );
}
