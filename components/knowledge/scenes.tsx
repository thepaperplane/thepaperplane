import {
  Archive,
  BadgeCheck,
  Building2,
  FileText,
  FolderOpen,
  IndianRupee,
  Search,
} from 'lucide-react';
import {
  At,
  Badge,
  Bars,
  Beam,
  bezier,
  Card,
  Count,
  Doc,
  Flyer,
  Label,
  Lines,
  Pill,
  Row,
  Stamp,
  Wire,
  Wires,
} from '@/components/motion/props';
import { Stage } from '@/components/motion/stage';
import type { DiagramKey } from '@/content/knowledge';

/**
 * One scene per kind of step in the Knowledge Corner walkthrough.
 *
 * These run on the walkthrough's own clock — a stage is on screen for about
 * six and a half seconds — so each one makes its point inside four and holds.
 */

const CYCLE = 6500;

function NormaliseScene() {
  const rows = [
    { t: 'AWS invoice', to: 2, y: 9 },
    { t: 'Office rent', to: 0, y: 17 },
    { t: 'Uber · Mumbai', to: 1, y: 25 },
    { t: 'Rent – Oct', to: 0, y: 33 },
    { t: 'Flight BLR', to: 1, y: 41 },
  ];
  const heads = ['Rent', 'Travel', 'Software'];
  return (
    <Stage
      hue="tax"
      cycle={CYCLE}
      label="Ragged purchase rows from your books being sorted into named accounting heads, ready to map to GST fields."
    >
      {rows.map((r, i) => (
        <Pill
          key={r.t}
          x={4}
          y={r.y}
          w={24}
          tone="quiet"
          m="fly"
          fx={-4}
          at={100 + i * 90}
          icon={<FileText />}
        >
          {r.t}
        </Pill>
      ))}
      {heads.map((h, i) => (
        <Card
          key={h}
          x={56 + 0}
          y={6 + i * 17}
          w={40}
          h={14}
          m="rise"
          at={300 + i * 120}
          className="ms-doc"
        >
          <span className="ms-t ms-s ms-b">{h}</span>
          <Lines widths={[60, 40]} tone="hue" />
        </Card>
      ))}
      <Wires>
        {rows.map((r, i) => (
          <Wire
            key={r.t}
            d={`M29 ${r.y + 2.5} C 42 ${r.y + 2.5}, 44 ${13 + r.to * 17}, 55 ${13 + r.to * 17}`}
            m="draw"
            at={1100 + i * 220}
            dur={600}
          />
        ))}
      </Wires>
      {heads.map((h, i) => (
        <Badge key={`b${h}`} x={90} y={7.6 + i * 17} size={4.2} m="pop" at={2400 + i * 220} />
      ))}
      <Pill x={4} y={53} tone="ok" m="pop" at={3200} icon={<BadgeCheck />}>
        GSTINs valid · place of supply fixed
      </Pill>
    </Stage>
  );
}

function MatchScene() {
  const rows = ['#412 · ₹42,000', '#415 · ₹8,650', '#418 · ₹14,200', '#421 · ₹61,300'];
  return (
    <Stage
      hue="tax"
      cycle={CYCLE}
      label="Two independent records compared line by line; three lines match and one is left unmatched and listed rather than absorbed."
    >
      <Label x={6} y={5} size="xs" tone="ink-3" weight="sb">
        Your ledger
      </Label>
      <Label x={58} y={5} size="xs" tone="ink-3" weight="sb">
        GSTR-2B
      </Label>
      {rows.map((r, i) => (
        <Pill
          key={`a${r}`}
          x={6}
          y={10 + i * 8}
          w={34}
          tone="paper"
          m="fly"
          fx={-4}
          at={100 + i * 90}
        >
          {r}
        </Pill>
      ))}
      {rows.map((r, i) =>
        i === 2 ? (
          <Pill
            key={`b${r}`}
            x={58}
            y={10 + i * 8}
            w={34}
            tone="quiet"
            m="fly"
            fx={4}
            at={200 + i * 90}
          >
            — not uploaded —
          </Pill>
        ) : (
          <Pill
            key={`b${r}`}
            x={58}
            y={10 + i * 8}
            w={34}
            tone="paper"
            m="fly"
            fx={4}
            at={200 + i * 90}
          >
            {r}
          </Pill>
        ),
      )}
      <Wires>
        {[0, 1, 3].map((i, k) => (
          <Wire
            key={i}
            d={`M41 ${12.5 + i * 8} L57 ${12.5 + i * 8}`}
            tone="ok"
            width={0.5}
            m="draw"
            at={1000 + k * 350}
            dur={400}
          />
        ))}
        <Wire d="M41 28.5 L57 28.5" tone="warn" width={0.5} dashed m="fade" at={2200} />
      </Wires>
      <Badge x={46.9} y={26.2} size={4.6} tone="warn" m="pop" at={2300}>
        <Search strokeWidth={2.6} />
      </Badge>
      <Pill x={50} y={50} center tone="warn" m="pop" at={2900} icon={<FileText />}>
        Listed for follow-up — not claimed
      </Pill>
    </Stage>
  );
}

function ChaseScene() {
  return (
    <Stage
      hue="tax"
      cycle={CYCLE}
      label="A reminder goes to the supplier who has not uploaded the invoice; they file, and the input credit comes back."
    >
      <Card x={4} y={14} w={30} h={30} m="rise" at={100} className="ms-doc">
        <span className="ms-t ms-s ms-b">You</span>
        <Row label="Credit at risk" value="₹14,200" tone="warn" />
        <Row label="Payment" value="On hold" />
      </Card>
      <Card x={66} y={14} w={30} h={30} m="rise" at={200} className="ms-doc">
        <span className="ms-t ms-s ms-b">Supplier</span>
        <Row label="Invoice #418" value="Not filed" tone="warn" out={2600} m="fade" at={200} />
        <Lines widths={[80, 60]} />
      </Card>
      <Pill x={67.5} y={20.6} tone="ok" m="pop" at={2700} icon={<BadgeCheck />}>
        Uploaded in GSTR-1
      </Pill>
      <Wires>
        <path
          d="M35 24 C 46 12, 56 12, 65 24"
          className="ms-stroke-ctx"
          strokeWidth={0.35}
          strokeDasharray="0.8 1"
          fill="none"
        />
        <path
          d="M65 36 C 56 48, 46 48, 35 36"
          className="ms-stroke-ctx"
          strokeWidth={0.35}
          strokeDasharray="0.8 1"
          fill="none"
        />
      </Wires>
      <Flyer
        path={bezier([35, 24], [46, 12], [56, 12], [65, 24], 18)}
        at={800}
        dur={1300}
        size={6}
      />
      <Label x={50} y={9} size="xs" tone="ink-3" center m="fade" at={800}>
        Reminder
      </Label>
      <At
        x={64}
        y={34}
        w={4}
        h={4}
        className="ms-token ms-token-ok"
        m="travel"
        tx={-30}
        ty={0}
        at={3300}
        dur={900}
      />
      <Pill x={50} y={52} center tone="ok" m="pop" at={4200} icon={<IndianRupee />}>
        ₹14,200 credit restored
      </Pill>
    </Stage>
  );
}

function OffsetScene() {
  return (
    <Stage
      hue="tax"
      cycle={CYCLE}
      label="Input credit set off against the output liability in the statutory order, leaving only the net amount payable in cash."
    >
      <Label x={6} y={7} size="xs" tone="ink-3" weight="sb">
        Output liability
      </Label>
      <Label x={92} y={6.6} size="s" weight="b" className="ms-right">
        ₹4,80,000
      </Label>
      <At x={6} y={11} w={86} h={7} className="ms-round ms-bar-bad" m="grow-x" at={200} dur={800} />
      <Label x={6} y={25} size="xs" tone="ink-3" weight="sb">
        Input credit (IGST → CGST → SGST)
      </Label>
      <At x={6} y={29} w={30} h={7} className="ms-seg ms-seg-1" m="grow-x" at={1200} dur={500} />
      <At x={36} y={29} w={20} h={7} className="ms-seg ms-seg-2" m="grow-x" at={1700} dur={500} />
      <At x={56} y={29} w={16} h={7} className="ms-seg ms-seg-3" m="grow-x" at={2200} dur={500} />
      <Label x={92} y={25} size="xs" tone="ok" weight="sb" className="ms-right" m="fade" at={2900}>
        Cash
      </Label>
      <At x={72} y={29} w={20} h={7} className="ms-round ms-cash" m="pop" at={2900} />
      <Wires>
        <Wire d="M82 37 L82 46" m="draw" at={3100} dur={300} />
      </Wires>
      <Card x={66} y={46} w={28} h={12} m="rise" at={3300} className="ms-doc" tone="ok">
        <span className="ms-t ms-xs ms-c-ink-3">Net payable</span>
        <span className="ms-t ms-m ms-b">
          ₹<Count to={96000} at={3300} dur={1000} />
        </span>
      </Card>
    </Stage>
  );
}

function ArchiveScene() {
  return (
    <Stage
      hue="books"
      cycle={CYCLE}
      label="Working papers filed into an indexed folder with the acknowledgement, and retrieved in seconds years later."
    >
      {[0, 1, 2].map((i) => (
        <Doc
          key={i}
          x={6 + i * 4}
          y={8 + i * 4}
          w={24}
          h={28}
          tone={i === 2 ? 'raised' : 'paper'}
          title={i === 2 ? 'Workings' : undefined}
          m="fly"
          fx={-5}
          at={100 + i * 150}
        >
          {i === 2 ? <Lines widths={[90, 70, 84, 60]} /> : null}
        </Doc>
      ))}
      <Flyer
        path={bezier([28, 28], [40, 14], [52, 20], [62, 30], 16, true)}
        at={900}
        dur={900}
        size={9}
      >
        <span className="ms-casefile">
          <FileText />
        </span>
      </Flyer>
      <Card x={58} y={8} w={36} h={34} tone="raised" m="rise" at={400} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">FY 2025-26</span>
          <Archive style={{ width: '3cqi', height: '3cqi', color: 'rgb(var(--h))' }} />
        </div>
        <Row label="GSTR-3B · Sep" value="ACK ✓" />
        <Row label="Workings" value="Filed" checkAt={1900} />
        <Row label="2B match" value="Filed" checkAt={2200} />
      </Card>
      <Label x={6} y={47} size="xs" tone="ink-3" weight="sb" m="fade" at={2900}>
        Three years later
      </Label>
      <Pill x={6} y={52} m="pop" at={3200} icon={<Search />}>
        &ldquo;Sep 3B workings&rdquo;
      </Pill>
      <Pill x={58} y={48} tone="ok" m="pop" at={3900} icon={<FolderOpen />}>
        Found in 4 seconds
      </Pill>
    </Stage>
  );
}

function AssembleScene() {
  const pieces = [
    { t: 'Bank statement', x: 4, y: 6 },
    { t: 'Sale deed', x: 4, y: 18 },
    { t: 'Ledger extract', x: 4, y: 30 },
    { t: 'Case law', x: 4, y: 42 },
  ];
  return (
    <Stage
      hue="scrutiny"
      cycle={CYCLE}
      label="Separate pieces of evidence — statements, deeds, ledger extracts and case law — assembled and indexed into a single submission."
    >
      {pieces.map((p, i) => (
        <Pill
          key={p.t}
          x={p.x}
          y={p.y}
          tone="paper"
          m="fly"
          fx={-5}
          at={100 + i * 120}
          icon={<FileText />}
        >
          {p.t}
        </Pill>
      ))}
      <Wires>
        {pieces.map((p, i) => (
          <Wire
            key={p.t}
            d={`M30 ${p.y + 2.5} C 40 ${p.y + 2.5}, 42 ${28}, 50 ${28}`}
            m="draw"
            at={900 + i * 200}
            dur={500}
          />
        ))}
      </Wires>
      <Doc
        x={50}
        y={6}
        w={44}
        h={46}
        tone="raised"
        title="Submission"
        refText="Indexed"
        m="rise"
        at={600}
      >
        <Row label="1 · Bank statement" value="p.1" checkAt={1500} />
        <Row label="2 · Sale deed" value="p.7" checkAt={1700} />
        <Row label="3 · Ledger extract" value="p.12" checkAt={1900} />
        <Row label="4 · Case law" value="p.18" checkAt={2100} />
      </Doc>
      <Stamp x={56} y={47} tone="ok" m="stamp" at={3000}>
        Uploaded on time
      </Stamp>
    </Stage>
  );
}

function CompareScene() {
  return (
    <Stage
      hue="tax"
      cycle={CYCLE}
      label="The same income computed under the old and new tax regimes side by side; the cheaper one is chosen and the difference shown."
    >
      <Card x={6} y={6} w={40} h={44} m="rise" at={100} className="ms-doc">
        <span className="ms-t ms-s ms-b">Old regime</span>
        <Row label="Deductions" value="₹2.5L" />
        <Row label="Taxable" value="₹15.5L" />
      </Card>
      <Card x={54} y={6} w={40} h={44} m="rise" at={250} tone="raised" className="ms-doc">
        <span className="ms-t ms-s ms-b ms-c-hue">New regime</span>
        <Row label="Deductions" value="₹75k" />
        <Row label="Taxable" value="₹17.25L" />
      </Card>
      <Bars x={10} y={28} w={32} h={18} values={[92]} at={800} gap={0} />
      <Bars x={58} y={28} w={32} h={18} values={[70]} highlight={[0]} at={1100} gap={0} />
      <Label x={26} y={38} size="m" weight="b" center m="fade" at={1500}>
        ₹2.91L
      </Label>
      <Label x={74} y={41} size="m" weight="b" center className="ms-c-onhue" m="fade" at={1700}>
        ₹2.43L
      </Label>
      <Pill x={50} y={56} center tone="ok" m="pop" at={2500} icon={<IndianRupee />}>
        New regime saves ₹<Count to={48000} at={2500} dur={900} />
      </Pill>
    </Stage>
  );
}

/* ---------------------------------------------------------------------------
   Templates. The GST scenes above were drawn for one service each; the other
   services used to borrow them, which is how an income-tax stage ended up
   showing GSTR-2B. Every stage now has its own scene, built from these
   templates with its own words, so the picture always matches the text.
   --------------------------------------------------------------------------- */

type Hue = 'tax' | 'scrutiny' | 'incorporation' | 'books';

/** Loose items sorted into named groups. */
function SortScene({
  hue,
  label,
  items,
  groups,
  result,
}: {
  hue: Hue;
  label: string;
  items: { t: string; to: number }[];
  groups: string[];
  result: string;
}) {
  const step = Math.min(17, 46 / groups.length);
  const gy = (i: number) => 6 + i * step;
  return (
    <Stage hue={hue} cycle={CYCLE} label={label}>
      {items.map((r, i) => (
        <Pill
          key={r.t}
          x={4}
          y={9 + i * 8}
          w={26}
          tone="quiet"
          m="fly"
          fx={-4}
          at={100 + i * 90}
          icon={<FileText />}
        >
          {r.t}
        </Pill>
      ))}
      {groups.map((h, i) => (
        <Card
          key={h}
          x={56}
          y={gy(i)}
          w={40}
          h={step - 3}
          m="rise"
          at={300 + i * 120}
          className="ms-doc"
        >
          <span className="ms-t ms-s ms-b">{h}</span>
        </Card>
      ))}
      <Wires>
        {items.map((r, i) => (
          <Wire
            key={r.t}
            d={`M31 ${11.5 + i * 8} C 42 ${11.5 + i * 8}, 44 ${gy(r.to) + (step - 3) / 2}, 55 ${gy(r.to) + (step - 3) / 2}`}
            m="draw"
            at={1100 + i * 220}
            dur={600}
          />
        ))}
      </Wires>
      <Pill x={4} y={53} tone="ok" m="pop" at={3200} icon={<BadgeCheck />}>
        {result}
      </Pill>
    </Stage>
  );
}

/** Two records compared line by line; one line differs and is acted on. */
function MatchTemplate({
  hue,
  label,
  left,
  right,
  rows,
  odd,
  oddText,
  result,
}: {
  hue: Hue;
  label: string;
  left: string;
  right: string;
  rows: string[];
  odd: number;
  oddText: string;
  result: string;
}) {
  return (
    <Stage hue={hue} cycle={CYCLE} label={label}>
      <Label x={6} y={5} size="xs" tone="ink-3" weight="sb">
        {left}
      </Label>
      <Label x={58} y={5} size="xs" tone="ink-3" weight="sb">
        {right}
      </Label>
      {rows.map((r, i) =>
        i === odd ? (
          <Pill
            key={`a${r}`}
            x={6}
            y={10 + i * 8}
            w={34}
            tone="quiet"
            m="fly"
            fx={-4}
            at={100 + i * 90}
          >
            {oddText}
          </Pill>
        ) : (
          <Pill
            key={`a${r}`}
            x={6}
            y={10 + i * 8}
            w={34}
            tone="paper"
            m="fly"
            fx={-4}
            at={100 + i * 90}
          >
            {r}
          </Pill>
        ),
      )}
      {rows.map((r, i) => (
        <Pill
          key={`b${r}`}
          x={58}
          y={10 + i * 8}
          w={34}
          tone="paper"
          m="fly"
          fx={4}
          at={200 + i * 90}
        >
          {r}
        </Pill>
      ))}
      <Wires>
        {rows.map((_, i) =>
          i === odd ? null : (
            <Wire
              key={i}
              d={`M41 ${12.5 + i * 8} L57 ${12.5 + i * 8}`}
              tone="ok"
              width={0.5}
              m="draw"
              at={1000 + i * 300}
              dur={400}
            />
          ),
        )}
        <Wire
          d={`M41 ${12.5 + odd * 8} L57 ${12.5 + odd * 8}`}
          tone="warn"
          width={0.5}
          dashed
          m="fade"
          at={2200}
        />
      </Wires>
      <Badge x={46.9} y={10.2 + odd * 8} size={4.6} tone="warn" m="pop" at={2300}>
        <Search strokeWidth={2.6} />
      </Badge>
      <Pill x={50} y={50} center tone="ok" m="pop" at={2900} icon={<BadgeCheck />}>
        {result}
      </Pill>
    </Stage>
  );
}

/** A worked computation: lines added and taken away, the result counted up. */
function ComputeScene({
  hue,
  label,
  title,
  lines,
  totalLabel,
  total,
  result,
}: {
  hue: Hue;
  label: string;
  title: string;
  lines: { l: string; v: string }[];
  totalLabel: string;
  total: number;
  result: string;
}) {
  return (
    <Stage hue={hue} cycle={CYCLE} label={label}>
      <Doc x={6} y={5} w={52} h={50} tone="raised" title={title} m="rise" at={100}>
        {lines.map((r, i) => (
          <Row key={r.l} label={r.l} value={r.v} m="fade" at={500 + i * 350} />
        ))}
      </Doc>
      <Wires>
        <Wire d="M58 30 C 64 30, 64 22, 68 22" m="draw" at={500 + lines.length * 350} dur={400} />
      </Wires>
      <Card
        x={68}
        y={12}
        w={27}
        h={18}
        m="rise"
        at={700 + lines.length * 350}
        className="ms-doc"
        tone="ok"
      >
        <span className="ms-t ms-xs ms-c-ink-3">{totalLabel}</span>
        <span className="ms-t ms-m ms-b">
          ₹<Count to={total} at={700 + lines.length * 350} dur={1000} />
        </span>
      </Card>
      <Pill x={68} y={36} tone="ok" m="pop" at={3600} icon={<BadgeCheck />}>
        {result}
      </Pill>
    </Stage>
  );
}

/** Two parties: a request goes out, an answer comes back, the matter moves. */
function ExchangeScene({
  hue,
  label,
  left,
  leftRows,
  right,
  rightRows,
  message,
  answered,
  result,
}: {
  hue: Hue;
  label: string;
  left: string;
  leftRows: { l: string; v: string }[];
  right: string;
  rightRows: { l: string; v: string }[];
  message: string;
  answered: string;
  result: string;
}) {
  return (
    <Stage hue={hue} cycle={CYCLE} label={label}>
      <Card x={4} y={14} w={30} h={30} m="rise" at={100} className="ms-doc">
        <span className="ms-t ms-s ms-b">{left}</span>
        {leftRows.map((r) => (
          <Row key={r.l} label={r.l} value={r.v} />
        ))}
      </Card>
      <Card x={66} y={14} w={30} h={30} m="rise" at={200} className="ms-doc">
        <span className="ms-t ms-s ms-b">{right}</span>
        {rightRows.map((r) => (
          <Row key={r.l} label={r.l} value={r.v} tone="warn" out={2600} m="fade" at={200} />
        ))}
        <Lines widths={[80, 60]} />
      </Card>
      <Pill x={67.5} y={20.6} tone="ok" m="pop" at={2700} icon={<BadgeCheck />}>
        {answered}
      </Pill>
      <Wires>
        <path
          d="M35 24 C 46 12, 56 12, 65 24"
          className="ms-stroke-ctx"
          strokeWidth={0.35}
          strokeDasharray="0.8 1"
          fill="none"
        />
      </Wires>
      <Flyer
        path={bezier([35, 24], [46, 12], [56, 12], [65, 24], 18)}
        at={800}
        dur={1300}
        size={6}
      />
      <Label x={50} y={9} size="xs" tone="ink-3" center m="fade" at={800}>
        {message}
      </Label>
      <Pill x={50} y={52} center tone="ok" m="pop" at={3800} icon={<BadgeCheck />}>
        {result}
      </Pill>
    </Stage>
  );
}

/** Papers filed into an indexed record, and found again later. */
function RecordScene({
  hue,
  label,
  title,
  rows,
  later,
  query,
  found,
}: {
  hue: Hue;
  label: string;
  title: string;
  rows: { l: string; v: string }[];
  later: string;
  query: string;
  found: string;
}) {
  return (
    <Stage hue={hue} cycle={CYCLE} label={label}>
      {[0, 1, 2].map((i) => (
        <Doc
          key={i}
          x={6 + i * 4}
          y={8 + i * 4}
          w={24}
          h={28}
          tone={i === 2 ? 'raised' : 'paper'}
          m="fly"
          fx={-5}
          at={100 + i * 150}
        >
          {i === 2 ? <Lines widths={[90, 70, 84, 60]} /> : null}
        </Doc>
      ))}
      <Flyer
        path={bezier([28, 28], [40, 14], [52, 20], [62, 30], 16, true)}
        at={900}
        dur={900}
        size={9}
      >
        <span className="ms-casefile">
          <FileText />
        </span>
      </Flyer>
      <Card x={58} y={8} w={36} h={34} tone="raised" m="rise" at={400} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">{title}</span>
          <Archive style={{ width: '3cqi', height: '3cqi', color: 'rgb(var(--h))' }} />
        </div>
        {rows.map((r, i) => (
          <Row key={r.l} label={r.l} value={r.v} checkAt={1600 + i * 300} />
        ))}
      </Card>
      <Label x={6} y={47} size="xs" tone="ink-3" weight="sb" m="fade" at={2900}>
        {later}
      </Label>
      <Pill x={6} y={52} m="pop" at={3200} icon={<Search />}>
        {query}
      </Pill>
      <Pill x={58} y={48} tone="ok" m="pop" at={3900} icon={<FolderOpen />}>
        {found}
      </Pill>
    </Stage>
  );
}

/** A document read until the point that matters is found. */
function ReadScene({
  hue,
  label,
  title,
  refText,
  findLabel,
  find,
  note,
  result,
}: {
  hue: Hue;
  label: string;
  title: string;
  refText: string;
  findLabel: string;
  find: string;
  note: string;
  result: string;
}) {
  return (
    <Stage hue={hue} cycle={CYCLE} label={label}>
      <Doc
        x={6}
        y={5}
        w={50}
        h={53}
        tone="raised"
        title={title}
        refText={refText}
        m="rise"
        at={100}
      >
        <Beam at={500} dur={2000} travel={42} />
        <Lines widths={[92, 86, 70, 90]} />
        <div className="ms-mark-wrap">
          <i className="ms-mark" data-m="grow-x" data-at="2300" data-dur="600" />
          <Lines widths={[88, 62]} tone="ink" />
        </div>
        <Lines widths={[80, 94, 54, 86]} />
        <Lines widths={[90, 66, 84, 48]} />
      </Doc>
      <Wires>
        <Wire d="M56 34 C 62 34, 62 24, 66 24" m="draw" at={2700} dur={400} />
      </Wires>
      <Card x={66} y={13} w={29} h={22} m="rise" at={2900} className="ms-doc" tone="raised">
        <span className="ms-t ms-xs ms-c-ink-3">{findLabel}</span>
        <span className="ms-t ms-m ms-b">{find}</span>
        <span className="ms-t ms-xs ms-c-ink-2">{note}</span>
      </Card>
      <Pill x={66} y={41} tone="ok" m="pop" at={3700} icon={<BadgeCheck />}>
        {result}
      </Pill>
    </Stage>
  );
}

/** Separate pieces drawn together into one indexed document. */
function BuildScene({
  hue,
  label,
  pieces,
  title,
  refText,
  stamp,
}: {
  hue: Hue;
  label: string;
  pieces: { t: string; p: string }[];
  title: string;
  refText: string;
  stamp: string;
}) {
  return (
    <Stage hue={hue} cycle={CYCLE} label={label}>
      {pieces.map((p, i) => (
        <Pill
          key={p.t}
          x={4}
          y={6 + i * 12}
          tone="paper"
          m="fly"
          fx={-5}
          at={100 + i * 120}
          icon={<FileText />}
        >
          {p.t}
        </Pill>
      ))}
      <Wires>
        {pieces.map((p, i) => (
          <Wire
            key={p.t}
            d={`M30 ${8.5 + i * 12} C 40 ${8.5 + i * 12}, 42 28, 50 28`}
            m="draw"
            at={900 + i * 200}
            dur={500}
          />
        ))}
      </Wires>
      <Doc
        x={50}
        y={6}
        w={44}
        h={46}
        tone="raised"
        title={title}
        refText={refText}
        m="rise"
        at={600}
      >
        {pieces.map((p, i) => (
          <Row key={p.t} label={`${i + 1} · ${p.t}`} value={p.p} checkAt={1500 + i * 200} />
        ))}
      </Doc>
      <Stamp x={56} y={47} tone="ok" m="stamp" at={3000}>
        {stamp}
      </Stamp>
    </Stage>
  );
}

/** Two options weighed side by side; one is recommended. */
function ChoiceScene({
  hue,
  label,
  a,
  b,
  result,
}: {
  hue: Hue;
  label: string;
  a: { t: string; rows: { l: string; v: string }[]; score: number };
  b: { t: string; rows: { l: string; v: string }[]; score: number };
  result: string;
}) {
  return (
    <Stage hue={hue} cycle={CYCLE} label={label}>
      <Card x={6} y={6} w={40} h={44} m="rise" at={100} className="ms-doc">
        <span className="ms-t ms-s ms-b">{a.t}</span>
        {a.rows.map((r) => (
          <Row key={r.l} label={r.l} value={r.v} />
        ))}
      </Card>
      <Card x={54} y={6} w={40} h={44} m="rise" at={250} tone="raised" className="ms-doc">
        <span className="ms-t ms-s ms-b ms-c-hue">{b.t}</span>
        {b.rows.map((r) => (
          <Row key={r.l} label={r.l} value={r.v} />
        ))}
      </Card>
      <Bars x={10} y={34} w={32} h={12} values={[a.score]} at={800} gap={0} />
      <Bars x={58} y={34} w={32} h={12} values={[b.score]} highlight={[0]} at={1100} gap={0} />
      <Pill x={50} y={56} center tone="ok" m="pop" at={2500} icon={<BadgeCheck />}>
        {result}
      </Pill>
    </Stage>
  );
}

/** Candidates checked one by one; some fail, one passes. */
function ScreenScene({
  hue,
  label,
  heading,
  items,
  result,
}: {
  hue: Hue;
  label: string;
  heading: string;
  items: { t: string; s: string; ok: boolean }[];
  result: string;
}) {
  return (
    <Stage hue={hue} cycle={CYCLE} label={label}>
      <Label x={6} y={5} size="xs" tone="ink-3" weight="sb">
        {heading}
      </Label>
      {items.map((it, i) => (
        <Pill
          key={it.t}
          x={6}
          y={11 + i * 10}
          w={44}
          tone="paper"
          m="fly"
          fx={-4}
          at={100 + i * 150}
        >
          {it.t}
        </Pill>
      ))}
      {items.map((it, i) => (
        <Pill
          key={`s${it.t}`}
          x={56}
          y={11 + i * 10}
          w={38}
          tone={it.ok ? 'ok' : 'warn'}
          m="pop"
          at={1100 + i * 500}
          icon={it.ok ? <BadgeCheck /> : <Search />}
        >
          {it.s}
        </Pill>
      ))}
      <Stamp x={30} y={50} tone="ok" m="stamp" at={1300 + items.length * 500}>
        {result}
      </Stamp>
    </Stage>
  );
}

/** One source fanning out into everything it produces. */
function HubScene({
  hue,
  label,
  root,
  nodes,
  tags,
}: {
  hue: Hue;
  label: string;
  root: string;
  nodes: string[];
  tags: string[];
}) {
  return (
    <Stage hue={hue} cycle={CYCLE} label={label}>
      <Card
        x={34}
        y={5}
        w={32}
        h={15}
        tone="raised"
        m="pop"
        at={100}
        className="ms-node ms-node-hue"
      >
        <Building2 />
        <span className="ms-t ms-xs ms-b">{root}</span>
      </Card>
      <Wires>
        <Wire
          d="M50 20 L50 27 M20 27 L80 27 M20 27 L20 35 M50 27 L50 35 M80 27 L80 35"
          m="draw"
          at={700}
          dur={800}
        />
      </Wires>
      {nodes.map((c, i) => (
        <Card
          key={c}
          x={6 + i * 30}
          y={35}
          w={28}
          h={15}
          m="rise"
          at={1400 + i * 200}
          className="ms-node"
        >
          <BadgeCheck />
          <span className="ms-t ms-xs ms-b">{c}</span>
        </Card>
      ))}
      {tags.map((t, i) => (
        <Pill key={t} x={8 + i * 30} y={53} tone="quiet" m="pop" at={2400 + i * 200}>
          {t}
        </Pill>
      ))}
    </Stage>
  );
}

/* ---------------------------------------------------------------------------
   Income tax return filing
   --------------------------------------------------------------------------- */

const ItrAisScene = () => (
  <MatchTemplate
    hue="tax"
    label="Your own records compared with the income-tax department's AIS and Form 26AS; a dividend the department knows about but your records missed is caught and added to the return."
    left="Your records"
    right="AIS · 26AS"
    rows={['Salary · ₹18,40,000', 'FD interest · ₹42,300', 'Dividend · ₹6,120', 'TDS · ₹2,61,000']}
    odd={2}
    oddText="— not in your records —"
    result="Added to the return, not left for a notice"
  />
);

const ItrHeadsScene = () => (
  <SortScene
    hue="tax"
    label="Each receipt in the year sorted under the head of income it belongs to: salary, house property, capital gains and other sources."
    items={[
      { t: 'Salary slips', to: 0 },
      { t: 'Rent received', to: 1 },
      { t: 'Shares sold', to: 2 },
      { t: 'Mutual fund units', to: 2 },
      { t: 'FD interest', to: 3 },
    ]}
    groups={['Salary', 'House property', 'Capital gains', 'Other sources']}
    result="Every rupee under its correct head"
  />
);

const ItrGainsScene = () => (
  <ComputeScene
    hue="tax"
    label="A capital gain worked out line by line: sale value, less the cost of buying and the expenses of selling, gives the taxable gain."
    title="Capital gains"
    lines={[
      { l: 'Sale value', v: '₹12,00,000' },
      { l: 'Less: cost of purchase', v: '−₹7,50,000' },
      { l: 'Less: brokerage, fees', v: '−₹15,000' },
      { l: 'Holding period', v: '26 months' },
    ]}
    totalLabel="Long-term gain"
    total={435000}
    result="Right rate applied"
  />
);

const ItrFileScene = () => (
  <RecordScene
    hue="tax"
    label="The return uploaded and e-verified, with the computation and acknowledgement kept together for the year."
    title="AY 2026-27"
    rows={[
      { l: 'Return uploaded', v: 'ACK ✓' },
      { l: 'E-verified', v: 'Aadhaar OTP' },
      { l: 'Computation', v: 'Filed' },
    ]}
    later="When the refund is processed"
    query="“Refund status”"
    found="Tracked to credit"
  />
);

/* ---------------------------------------------------------------------------
   Scrutiny notice defence
   --------------------------------------------------------------------------- */

const ScrValidityScene = () => (
  <ReadScene
    hue="scrutiny"
    label="The notice itself checked before anything else: the section it is issued under, whether it carries a valid document number, and whether it was issued within the time allowed."
    title="Notice"
    refText="s.143(2)"
    findLabel="Validity check"
    find="DIN · time limit"
    note="Right section, in time?"
    result="Validity settled first"
  />
);

const ScrEvidenceScene = AssembleScene;

const ScrResearchScene = () => (
  <SortScene
    hue="scrutiny"
    label="Rulings and circulars on the issue sorted by weight: binding authority, persuasive authority, and cases the department may cite that can be distinguished."
    items={[
      { t: 'Supreme Court', to: 0 },
      { t: 'CBDT circular', to: 0 },
      { t: 'Other High Court', to: 1 },
      { t: 'Tribunal order', to: 1 },
      { t: 'Case cited by AO', to: 2 },
    ]}
    groups={['Binding', 'Persuasive', 'Distinguished']}
    result="Arguments ranked by authority"
  />
);

const ScrDraftScene = () => (
  <BuildScene
    hue="scrutiny"
    label="The written reply put together section by section: the facts, the legal grounds, the evidence index and the relief asked for."
    pieces={[
      { t: 'Facts of the case', p: 'p.1' },
      { t: 'Legal grounds', p: 'p.3' },
      { t: 'Evidence index', p: 'p.9' },
      { t: 'Relief sought', p: 'p.11' },
    ]}
    title="Written reply"
    refText="Para-wise"
    stamp="Filed on time"
  />
);

const ScrHearingScene = () => (
  <ExchangeScene
    hue="scrutiny"
    label="At the hearing the assessing officer raises a query; the response, backed by the indexed evidence, is placed on record."
    left="Our file"
    leftRows={[
      { l: 'Evidence', v: 'Indexed' },
      { l: 'Reply', v: 'On record' },
    ]}
    right="Assessing officer"
    rightRows={[{ l: 'Query on cash deposit', v: 'Open' }]}
    message="Response with evidence"
    answered="Query answered"
    result="Every query answered on record"
  />
);

/* ---------------------------------------------------------------------------
   Company incorporation
   --------------------------------------------------------------------------- */

const IncStructureScene = () => (
  <ChoiceScene
    hue="incorporation"
    label="Two business structures weighed side by side against your plans: an LLP and a private limited company, with the one that fits recommended."
    a={{
      t: 'LLP',
      rows: [
        { l: 'Outside investors', v: 'Harder' },
        { l: 'Yearly filings', v: 'Fewer' },
      ],
      score: 58,
    }}
    b={{
      t: 'Private limited',
      rows: [
        { l: 'Outside investors', v: 'Easy' },
        { l: 'Yearly filings', v: 'More' },
      ],
      score: 86,
    }}
    result="Fits a plan to raise funding"
  />
);

const IncNameScene = () => (
  <ScreenScene
    hue="incorporation"
    label="Proposed company names checked one by one against existing companies and registered trademarks; two are too close, one is clear and is reserved."
    heading="Proposed names"
    items={[
      { t: 'Paperwing Tech Pvt Ltd', s: 'Too close to existing', ok: false },
      { t: 'Skyleaf Systems Pvt Ltd', s: 'Trademark conflict', ok: false },
      { t: 'Northkite Labs Pvt Ltd', s: 'Clear to reserve', ok: true },
    ]}
    result="Name reserved"
  />
);

const IncDraftScene = () => (
  <BuildScene
    hue="incorporation"
    label="The company's constitution drafted from its parts: the objects it may pursue, its share capital, its first directors and the articles that govern it."
    pieces={[
      { t: 'Objects clause', p: 'MoA' },
      { t: 'Share capital', p: 'MoA' },
      { t: 'First directors', p: 'AoA' },
      { t: 'Internal rules', p: 'AoA' },
    ]}
    title="MoA & AoA"
    refText="Drafted"
    stamp="Signed with DSC"
  />
);

const IncFilingScene = () => (
  <HubScene
    hue="incorporation"
    label="One integrated incorporation filing producing the certificate of incorporation, the company's PAN and TAN, and its labour registrations together."
    root="SPICe+ filing"
    nodes={['Incorporation cert.', 'PAN & TAN', 'EPFO · ESIC']}
    tags={['CIN issued', 'One filing', 'Bank-ready']}
  />
);

const IncHandoverScene = () => (
  <RecordScene
    hue="incorporation"
    label="The new company's kit handed over in one indexed folder: certificate, constitution, statutory registers and the first-year compliance calendar."
    title="Company kit"
    rows={[
      { l: 'Certificate of inc.', v: 'CIN' },
      { l: 'MoA & AoA', v: 'Filed' },
      { l: 'Registers', v: 'Opened' },
    ]}
    later="First 30 days"
    query="“First board meeting”"
    found="On your compliance calendar"
  />
);

/** One scene per stage, keyed by the stage's own id in content/knowledge.ts. */
export const KNOWLEDGE_SCENES: Record<DiagramKey, () => React.ReactElement> = {
  'gst-normalise': NormaliseScene,
  'gst-match': MatchScene,
  'gst-chase': ChaseScene,
  'gst-offset': OffsetScene,
  'gst-archive': ArchiveScene,
  'itr-ais': ItrAisScene,
  'itr-heads': ItrHeadsScene,
  'itr-gains': ItrGainsScene,
  'itr-regime': CompareScene,
  'itr-file': ItrFileScene,
  'scr-validity': ScrValidityScene,
  'scr-evidence': ScrEvidenceScene,
  'scr-research': ScrResearchScene,
  'scr-draft': ScrDraftScene,
  'scr-hearing': ScrHearingScene,
  'inc-structure': IncStructureScene,
  'inc-name': IncNameScene,
  'inc-draft': IncDraftScene,
  'inc-filing': IncFilingScene,
  'inc-handover': IncHandoverScene,
};
