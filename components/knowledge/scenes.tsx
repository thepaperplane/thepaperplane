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
  Pulse,
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

function InspectScene() {
  return (
    <Stage
      hue="scrutiny"
      cycle={CYCLE}
      label="A notice read line by line until the operative clause — the one that has to be answered — is located and marked."
    >
      <Doc
        x={6}
        y={5}
        w={50}
        h={53}
        tone="raised"
        title="Notice"
        refText="s.142(1)"
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
        <span className="ms-t ms-xs ms-c-ink-3">Operative clause</span>
        <span className="ms-t ms-m ms-b">Para 3</span>
        <span className="ms-t ms-xs ms-c-ink-2">Produce ledger, FY 24-25</span>
      </Card>
      <Pill x={66} y={41} tone="ok" m="pop" at={3700} icon={<BadgeCheck />}>
        Answer this, only this
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

function StructureScene() {
  return (
    <Stage
      hue="incorporation"
      cycle={CYCLE}
      label="A holding company with three subsidiaries arranged beneath it, each with its own purpose and filings."
    >
      <Card
        x={36}
        y={5}
        w={28}
        h={15}
        tone="raised"
        m="pop"
        at={100}
        className="ms-node ms-node-hue"
      >
        <Building2 />
        <span className="ms-t ms-xs ms-b">Holding Pvt Ltd</span>
      </Card>
      <Wires>
        <Wire
          d="M50 20 L50 27 M20 27 L80 27 M20 27 L20 35 M50 27 L50 35 M80 27 L80 35"
          m="draw"
          at={700}
          dur={800}
        />
      </Wires>
      {[
        { t: 'Operating Co', s: 'Trading', x: 6 },
        { t: 'Tech LLP', s: 'Software', x: 36 },
        { t: 'Property Co', s: 'Assets', x: 66 },
      ].map((c, i) => (
        <Card
          key={c.t}
          x={c.x}
          y={35}
          w={28}
          h={15}
          m="rise"
          at={1400 + i * 200}
          className="ms-node"
        >
          <Building2 />
          <span className="ms-t ms-xs ms-b">{c.t}</span>
        </Card>
      ))}
      {[0, 1, 2].map((i) => (
        <Pill key={i} x={8 + i * 30} y={53} tone="quiet" m="pop" at={2400 + i * 200}>
          {['GST · ROC', 'ROC · ITR', 'ROC · TDS'][i]}
        </Pill>
      ))}
      <Pulse x={50} y={12.5} size={16} at={3000} />
    </Stage>
  );
}

export const KNOWLEDGE_SCENES: Record<DiagramKey, () => React.ReactElement> = {
  normalise: NormaliseScene,
  match: MatchScene,
  chase: ChaseScene,
  offset: OffsetScene,
  archive: ArchiveScene,
  inspect: InspectScene,
  assemble: AssembleScene,
  compare: CompareScene,
  structure: StructureScene,
};
