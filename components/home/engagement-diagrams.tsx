import {
  Bar,
  Chip,
  Frame,
  Panel,
  Pass,
  Rule,
  Tag,
  Trace,
  Value,
  seq,
  travel,
} from '@/components/diagrams/kit';

/**
 * Drawings for the engagement slideshow.
 *
 * Each states the claim its stage makes, and states it in the drawing rather
 * than relying on the paragraph: the summary card that goes unread beside the
 * notice that gets read; the out-of-scope column written with the same care as
 * the in-scope one; the quarter of the work that is visible sitting on the
 * three quarters that are not.
 *
 * Structure is static; only the action loops. See the DIAGRAM MOTION block in
 * globals.css.
 */

type P = { active: boolean };

/* ------------------------------------------------------------------ */
/* 1. First read — the document itself, not a summary of it            */
/* ------------------------------------------------------------------ */
export function ReadDiagram({ active }: P) {
  const lines = [128, 112, 136, 102, 124, 116, 92];
  const hit = 3;
  return (
    <Frame
      active={active}
      cycle={6200}
      label="A one-line summary set aside in favour of reading the full notice, where the operative clause is found"
    >
      {/* What most people work from.
          Kept to one word each: at the mobile --dg-scale boost, "THE
          SUMMARY" ran into "THE NOTICE" beside it, and "NOT READ FROM" ran
          under the notice panel's own left edge -- both measured, not
          guessed, and neither needs the article to read correctly. */}
      <Tag x={14} y={26}>
        SUMMARY
      </Tag>
      <Panel x={14} y={36} w={78} h={30} tone="dashed" />
      <Bar x={24} y={48} w={44} h={5} />
      <Tag x={14} y={84} tone="quiet">
        NOT READ
      </Tag>

      {/* What we work from. */}
      <Tag x={116} y={26} tone="accent">
        THE NOTICE
      </Tag>
      <rect
        x={116}
        y={36}
        width={150}
        height={126}
        rx="2"
        fill="var(--surface)"
        stroke="var(--accent)"
        strokeWidth="1.2"
      />
      {lines.map((w, i) => (
        <Bar
          key={i}
          x={128}
          y={50 + i * 16}
          w={Math.min(w, 126)}
          h={5}
          tone={i === hit ? 'accent' : 'context'}
        />
      ))}

      {/* Read line by line. */}
      <g
        className="dg-sweep"
        style={seq(85, { ['--fy' as string]: '0px', ['--ty' as string]: '86px' })}
      >
        <rect x={116} y={44} width={150} height={13} fill="var(--accent)" fillOpacity="0.1" />
        <line x1={116} y1={57} x2={266} y2={57} stroke="var(--accent)" strokeWidth="1" />
      </g>

      <g className="dg-appear" style={seq(848)}>
        <path d="M 272 92 h 8 v 18 h -8" fill="none" stroke="var(--accent)" strokeWidth="1.4" />
        <Tag x={306} y={122} anchor="end" tone="accent">
          s.143(2)
        </Tag>
      </g>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Scope — the excluded column written as carefully as the included  */
/* ------------------------------------------------------------------ */
export function ScopeDiagram({ active }: P) {
  const items = [
    { label: 'GST returns', side: 0 },
    { label: 'Ledger repair', side: 0 },
    { label: 'Prior years', side: 1 },
    { label: 'Annual audit', side: 1 },
  ];
  return (
    <Frame
      active={active}
      cycle={6200}
      label="Work sorted into an agreed in-scope column and an equally explicit out-of-scope column"
    >
      <Panel x={14} y={34} w={140} h={112} tone="accent" />
      <Tag x={84} y={26} anchor="middle" tone="accent">
        IN SCOPE
      </Tag>

      <Panel x={180} y={34} w={126} h={112} tone="dashed" />
      <Tag x={243} y={26} anchor="middle">
        NOT INCLUDED
      </Tag>

      {items.map((it, i) => {
        const row = items.filter((x) => x.side === it.side).indexOf(it);
        const x = it.side === 0 ? 28 : 194;
        const y = 50 + row * 30;
        return (
          <g key={it.label}>
            <rect
              x={x}
              y={y}
              width={it.side === 0 ? 112 : 98}
              height={20}
              rx="2"
              fill="var(--ink-3)"
              fillOpacity="0.14"
            />
            <g
              className="dg-travel"
              style={travel(113 + i * 640, it.side === 0 ? 46 : -52, 46 - row * 30, 0, 0)}
            >
              <rect
                x={x}
                y={y}
                width={it.side === 0 ? 112 : 98}
                height={20}
                rx="2"
                fill={it.side === 0 ? 'var(--accent)' : 'none'}
                fillOpacity={it.side === 0 ? 0.16 : 1}
                stroke={it.side === 0 ? 'var(--accent)' : 'var(--hairline-strong)'}
                strokeWidth="1.1"
              />
              <Tag x={x + 10} y={y + 14} tone={it.side === 0 ? 'ink' : 'quiet'}>
                {it.label}
              </Tag>
            </g>
          </g>
        );
      })}

      <Rule x1={14} y1={160} x2={306} y2={160} />
      <Tag x={14} y={174}>
        AGREED IN WRITING FIRST
      </Tag>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Groundwork — the quarter you see, on the three quarters you do not */
/* ------------------------------------------------------------------ */
export function GroundworkDiagram({ active }: P) {
  const rows = [
    [30, 54, 38, 62],
    [46, 34, 58, 44],
    [38, 60, 30, 52],
  ];
  return (
    <Frame
      active={active}
      cycle={6200}
      label="A small filed return resting on a much larger body of reconciliation work"
    >
      <rect x={112} y={14} width={96} height={26} rx="2" fill="var(--accent)" />
      <Tag x={160} y={31} anchor="middle" style={{ fill: 'var(--accent-ink)' }}>
        THE RETURN
      </Tag>

      <Rule x1={14} y1={54} x2={306} y2={54} />
      <Tag x={14} y={50}>
        WHAT YOU SEE
      </Tag>
      <Value x={306} y={50} size={10} tone="quiet" anchor="end">
        ~25%
      </Value>

      {rows.map((row, r) => {
        let x = 14;
        return (
          <g key={r}>
            {row.map((w, c) => {
              const el = (
                <rect
                  key={c}
                  x={x}
                  y={72 + r * 24}
                  width={w * 1.18}
                  height={13}
                  rx="1.5"
                  fill="var(--ink-3)"
                  fillOpacity={0.2 + c * 0.04}
                  className="dg-appear"
                  style={seq(85 + (r * 4 + c) * 190, { ['--fy' as string]: '10px' })}
                />
              );
              x += w * 1.18 + 7;
              return el;
            })}
          </g>
        );
      })}

      <Tag x={14} y={162}>
        RECONCILIATION &amp; EVIDENCE
      </Tag>
      <Value
        x={306}
        y={164}
        size={12}
        tone="accent"
        anchor="end"
        className="dg-appear"
        style={seq(763)}
      >
        ~75%
      </Value>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Review — separate passes, and what a second pair of eyes catches  */
/* ------------------------------------------------------------------ */
export function ReviewDiagram({ active }: P) {
  return (
    <Frame
      active={active}
      cycle={6200}
      label="Work prepared, sent back once on review, then passed and filed"
    >
      <Rule x1={20} y1={80} x2={286} y2={80} />

      <Pass cx={92} cy={80} delay={170} />
      <Tag x={92} y={112} anchor="middle">
        PREPARE
      </Tag>

      <Pass cx={192} cy={80} delay={848} />
      <Tag x={192} y={112} anchor="middle">
        REVIEW
      </Tag>

      {/* Out of the preparer's hands. */}
      <Chip x={26} y={73} delay={57} dx={50} tone="context" />

      {/* The reviewer sends one back — the whole reason for the second pass. */}
      <g className="dg-flag dg-c" style={seq(57)}>
        <path
          d="M 176 62 q -42 -30 -84 0"
          fill="none"
          stroke="var(--caution)"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />
        <path
          d="M 92 62 l 5 -6 M 92 62 l 6 5"
          fill="none"
          stroke="var(--caution)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <Tag x={134} y={44} anchor="middle" tone="caution">
          SENT BACK ONCE
        </Tag>
      </g>

      {/* Then through, and out. */}
      <Chip x={210} y={73} delay={1187} dx={54} />
      <g className="dg-appear" style={seq(1300)}>
        <rect x={272} y={66} width={30} height={28} rx="2" fill="var(--accent)" />
        <path
          d="M 280 80 l 4 4 l 9 -10"
          fill="none"
          stroke="var(--accent-ink)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <Tag x={287} y={112} anchor="middle" tone="accent">
        FILED
      </Tag>

      <Rule x1={20} y1={140} x2={286} y2={140} />
      <Tag x={20} y={158}>
        NEVER THE SAME PERSON
      </Tag>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Aftercare — the file outlives the deadline                        */
/* ------------------------------------------------------------------ */
export function AftercareDiagram({ active }: P) {
  const ticks = Array.from({ length: 15 }, (_, i) => 22 + i * 19);
  return (
    <Frame
      active={active}
      cycle={6200}
      label="A return filed, then a notice arriving fourteen months later answered from the retained file"
    >
      <Rule x1={14} y1={86} x2={306} y2={86} />
      {ticks.map((x) => (
        <line key={x} x1={x} y1={82} x2={x} y2={90} stroke="var(--hairline)" strokeWidth="1" />
      ))}

      {/* Filed. */}
      <line x1={22} y1={56} x2={22} y2={86} stroke="var(--accent)" strokeWidth="1.4" />
      <circle cx={22} cy={56} r={4.5} fill="var(--accent)" />
      <Tag x={14} y={44} tone="accent">
        FILED
      </Tag>

      {/* The months passing. */}
      <Trace d="M 22 112 H 288" delay={85} tone="structure" dashed />
      <Tag x={22} y={128}>
        PAPERS HELD &amp; INDEXED
      </Tag>

      {/* The notice, much later. */}
      <g className="dg-flag dg-c" style={seq(57)}>
        <line x1={288} y1={56} x2={288} y2={86} stroke="var(--caution)" strokeWidth="1.4" />
        <circle cx={288} cy={56} r={4.5} fill="var(--caution)" />
        <Tag x={306} y={44} anchor="end" tone="caution">
          NOTICE · M+14
        </Tag>
      </g>

      {/* Answered from the file rather than from memory. */}
      <Chip x={40} y={148} delay={961} dx={222} />
      <Tag x={14} y={168}>
        ANSWERED FROM THE FILE
      </Tag>
      <Value
        x={306}
        y={168}
        size={10}
        tone="accent"
        anchor="end"
        className="dg-appear"
        style={seq(1243)}
      >
        same day
      </Value>
    </Frame>
  );
}
