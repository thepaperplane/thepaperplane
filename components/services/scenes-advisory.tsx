import {
  AlertTriangle,
  Building2,
  CalendarClock,
  FileText,
  Gavel,
  Globe2,
  IndianRupee,
  Landmark,
  Mail,
  Scale,
  ShieldCheck,
  Signature,
  User,
} from 'lucide-react';
import {
  At,
  Avatar,
  bezier,
  Flyer,
  Badge,
  Bars,
  Beam,
  Card,
  Count,
  Doc,
  Glow,
  Label,
  Lines,
  Pill,
  Pulse,
  Ring,
  Row,
  Stamp,
  Wire,
  Wires,
} from '@/components/motion/props';
import { Stage } from '@/components/motion/stage';

/**
 * Advisory scenes: tax, scrutiny defence, incorporation.
 *
 * Each one acts out the three beats under it on the page — what you hand
 * over, what is done with it, what you get back — and lands on the
 * deliverable, in green, held long enough to read.
 */

/* ===================================================================== */
/* Tax architecture & GST                                                 */
/* ===================================================================== */

export function IncomeTaxScene() {
  return (
    <Stage
      hue="tax"
      cycle={10000}
      label="Form 16, AIS and broker statements flow into an income tax return; each figure is matched, the new regime is shown to save tax, and the return is filed and e-verified with a refund on its way."
    >
      {/* What you hand over */}
      <Pill x={4} y={9} m="fly" fx={-6} at={150} icon={<FileText />}>
        Form 16
      </Pill>
      <Pill x={4} y={17} m="fly" fx={-6} at={350} icon={<FileText />}>
        AIS · 26AS
      </Pill>
      <Pill x={4} y={25} m="fly" fx={-6} at={550} icon={<FileText />}>
        Broker P&amp;L
      </Pill>

      <Wires>
        <Wire d="M23 11.5 C 27 11.5, 26 18, 31 18" m="draw" at={1000} dur={700} />
        <Wire d="M25 19.5 C 28 19.5, 27 23.5, 31 23.5" m="draw" at={1150} dur={700} />
        <Wire d="M24 27.5 C 28 27.5, 27 29, 31 29" m="draw" at={1300} dur={700} />
      </Wires>

      {/* What is done: every line reconciled */}
      <Doc
        x={31}
        y={7}
        w={36}
        h={47}
        tone="raised"
        title="Tax return"
        refText="ITR-2"
        m="rise"
        at={700}
      >
        <Beam at={1900} dur={1700} travel={36} />
        <div className="ms-col" style={{ marginTop: '0.4cqi' }}>
          <Row label="Salary" value="₹18.4L" checkAt={2300} />
          <Row label="Capital gains" value="₹2.1L" checkAt={2750} />
          <Row label="Interest" value="₹46k" checkAt={3150} />
          <Row label="TDS credit" value="₹2.86L" checkAt={3550} />
        </div>
        <Lines widths={[78, 54]} />
      </Doc>

      {/* Old versus new regime, in writing */}
      <Card x={70} y={7} w={26} h={27} m="rise" at={3800} className="ms-doc">
        <Label x={1.8} y={1.6} size="xs" tone="ink-3" weight="sb">
          Regime check
        </Label>
        <Bars
          x={2}
          y={6}
          w={22}
          h={12}
          values={[92, 70]}
          highlight={[1]}
          at={4100}
          step={220}
          gap={3}
        />
        <Label x={2} y={19.5} size="xs" tone="ink-3">
          Old
        </Label>
        <Label x={13.5} y={19.5} size="xs" tone="hue" weight="b">
          New
        </Label>
      </Card>
      <Pill x={70} y={36.5} tone="hue" m="pop" at={4700} icon={<IndianRupee />}>
        Saves ₹48,000
      </Pill>

      {/* What you get */}
      <Stamp x={37} y={44} m="stamp" at={5600} dur={650}>
        Filed · e-verified
      </Stamp>
      <Pulse x={83} y={50} tone="ok" at={6300} />
      <Pill x={70} y={47.5} tone="ok" m="pop" at={6300} icon={<IndianRupee />}>
        Refund ₹<Count to={34200} at={6300} dur={1300} />
      </Pill>
    </Stage>
  );
}

const GST_ROWS = [
  { inv: '#412', amt: '₹42,000' },
  { inv: '#415', amt: '₹8,650' },
  { inv: '#418', amt: '₹14,200' },
  { inv: '#421', amt: '₹61,300' },
];

export function GstScene() {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  return (
    <Stage
      hue="tax"
      cycle={10000}
      label="Purchase invoices are matched against GSTR-2B; a mismatch is caught and fixed before credit is claimed, then GSTR-1 and GSTR-3B are filed on time, month after month."
    >
      {/* Your invoices against GSTR-2B */}
      <Card x={4} y={5} w={52} h={40} tone="raised" m="rise" at={100} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Input credit match</span>
          <span className="ms-ref">GSTR-2B</span>
        </div>
      </Card>
      <Label x={6} y={12} size="xs" tone="ink-3" weight="sb" m="fade" at={300}>
        Your purchases
      </Label>
      <Label x={32.5} y={12} size="xs" tone="ink-3" weight="sb" m="fade" at={300}>
        Supplier filed
      </Label>
      {GST_ROWS.map((r, i) => (
        <Pill
          key={`l${r.inv}`}
          x={6}
          y={15.6 + i * 5.6}
          w={20.5}
          tone="quiet"
          m="fly"
          fx={-4}
          at={500 + i * 140}
        >
          {r.inv} · {r.amt}
        </Pill>
      ))}
      {GST_ROWS.map((r, i) =>
        i === 2 ? (
          <Pill
            key={`r${r.inv}`}
            x={32.5}
            y={15.6 + i * 5.6}
            w={20.5}
            tone="quiet"
            m="fly"
            fx={4}
            at={600 + i * 140}
            out={4250}
          >
            {r.inv} · missing
          </Pill>
        ) : (
          <Pill
            key={`r${r.inv}`}
            x={32.5}
            y={15.6 + i * 5.6}
            w={20.5}
            tone="quiet"
            m="fly"
            fx={4}
            at={600 + i * 140}
          >
            {r.inv} · {r.amt}
          </Pill>
        ),
      )}
      <Pill x={32.5} y={26.8} w={20.5} tone="quiet" m="pop" at={4300}>
        #418 · ₹14,200
      </Pill>
      <Wires>
        {[0, 1, 3].map((i, k) => (
          <Wire
            key={i}
            d={`M27 ${18.1 + i * 5.6} L32 ${18.1 + i * 5.6}`}
            tone="ok"
            width={0.45}
            m="draw"
            at={1500 + k * 300}
            dur={420}
          />
        ))}
        <Wire d="M27 29.3 L32 29.3" tone="warn" width={0.45} dashed m="fade" at={2400} out={4300} />
        <Wire d="M27 29.3 L32 29.3" tone="ok" width={0.45} m="draw" at={4300} dur={420} />
      </Wires>
      <Badge x={27.7} y={27.5} size={3.6} tone="warn" m="pop" at={2500} out={4250}>
        <AlertTriangle strokeWidth={2.6} />
      </Badge>
      <Pill
        x={30}
        y={40.5}
        tone="warn"
        m="pop"
        at={2700}
        out={4250}
        center
        icon={<AlertTriangle />}
      >
        ₹14,200 not in 2B
      </Pill>
      <Pill x={30} y={40.5} tone="ok" m="pop" at={4400} center>
        Supplier chased · matched
      </Pill>

      {/* Filed on time, every month */}
      <Card x={60} y={5} w={36} h={40} m="rise" at={300} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Filing calendar</span>
          <CalendarClock style={{ width: '2.6cqi', height: '2.6cqi', color: 'rgb(var(--h))' }} />
        </div>
      </Card>
      {months.map((mth, i) => (
        <At
          key={mth}
          x={62 + (i % 3) * 11}
          y={13.5 + Math.floor(i / 3) * 14.5}
          w={9.6}
          h={12.5}
          className="ms-card-tint"
          style={{ borderRadius: '1cqi' }}
        >
          <Label x={1.2} y={1} size="xs" tone="ink-3">
            {mth}
          </Label>
          <Badge x={2.5} y={5.4} size={4.6} tone="ok" m="pop" at={5000 + i * 260} />
        </At>
      ))}

      {/* What you get */}
      <Pill x={4} y={51} tone="hue" m="rise" at={5200} icon={<FileText />}>
        GSTR-1 filed
      </Pill>
      <Pill x={27} y={51} tone="hue" m="rise" at={5450} icon={<FileText />}>
        GSTR-3B filed
      </Pill>
      <Pill x={60} y={51} tone="ok" m="pop" at={6600} icon={<ShieldCheck />}>
        ITC ₹<Count to={186400} at={6600} dur={1300} /> protected
      </Pill>
    </Stage>
  );
}

export function ExportScene() {
  return (
    <Stage
      hue="tax"
      cycle={10000}
      label="An export invoice flies from India to a client abroad under a Letter of Undertaking, billed at zero per cent GST with the import export code in place, and the foreign payment is realised and documented."
    >
      <Glow x={18} y={10} w={64} h={46} />
      {/* The route */}
      <Wires>
        <path
          d="M14 46 C 34 6, 66 6, 86 30"
          fill="none"
          className="ms-stroke-ctx"
          strokeWidth={0.35}
          strokeDasharray="0.9 1.1"
        />
        <Wire d="M14 46 C 34 6, 66 6, 86 30" m="draw" at={1600} dur={2200} width={0.55} />
      </Wires>

      {/* India */}
      <At
        x={6}
        y={41}
        w={16}
        h={16}
        center={false}
        className="ms-card ms-col"
        m="rise"
        at={100}
        style={{ borderRadius: '50%', display: 'grid', placeItems: 'center' }}
      >
        <Landmark style={{ width: '6cqi', height: '6cqi', color: 'rgb(var(--h))' }} />
      </At>
      <Label x={14} y={58.4} size="xs" tone="ink-2" weight="sb" center m="fade" at={300}>
        India
      </Label>

      {/* Client abroad */}
      <At
        x={78}
        y={23}
        w={16}
        h={16}
        className="ms-card"
        m="rise"
        at={300}
        style={{ borderRadius: '50%', display: 'grid', placeItems: 'center' }}
      >
        <Globe2 style={{ width: '6.4cqi', height: '6.4cqi', color: 'rgb(var(--h))' }} />
      </At>
      <Label x={86} y={40.5} size="xs" tone="ink-2" weight="sb" center m="fade" at={500}>
        Client abroad
      </Label>

      {/* The paper plane carries the invoice along the route */}
      <Flyer
        path={bezier([14, 46], [34, 6], [66, 6], [86, 30])}
        at={1600}
        dur={2200}
        size={6}
        keep
      />

      {/* Credentials that make it zero-rated */}
      <Pill x={26} y={22} m="pop" at={700} icon={<ShieldCheck />}>
        IEC allotted
      </Pill>
      <Pill x={44} y={7} m="pop" at={950} icon={<FileText />}>
        LUT renewed
      </Pill>

      {/* Invoice */}
      <Doc
        x={30}
        y={34}
        w={36}
        h={21}
        tone="raised"
        title="Export invoice"
        refText="0% GST"
        m="rise"
        at={3800}
      >
        <Row label="IT services" value="$12,000" />
        <Row label="IGST" value="₹0" tone="ok" checkAt={4600} />
      </Doc>

      {/* Money home */}
      <Pill x={68} y={48} tone="ok" m="pop" at={5600} icon={<IndianRupee />}>
        FIRC · ₹<Count to={1003000} at={5600} dur={1400} />
      </Pill>
      <Stamp x={41} y={26} tone="ok" m="stamp" at={6400}>
        Zero-rated
      </Stamp>
    </Stage>
  );
}

/* ===================================================================== */
/* Scrutiny defence & appeals                                             */
/* ===================================================================== */

export function NoticeReplyScene() {
  return (
    <Stage
      hue="scrutiny"
      cycle={10000}
      label="An income tax notice arrives with a deadline; each flagged figure is traced and reconciled, a written reply is filed well before the window closes, and the demand is corrected to nil."
    >
      {/* The notice */}
      <Doc
        x={5}
        y={7}
        w={36}
        h={47}
        tone="raised"
        title="Intimation"
        refText="s.143(1)"
        m="drop"
        at={100}
        fy={-10}
      >
        <Row label="Income per return" value="₹14.2L" />
        <Row label="Income per AIS" value="₹16.9L" tone="warn" />
        <Row label="Demand raised" value="₹82,400" tone="bad" />
        <Lines widths={[90, 72, 84]} />
      </Doc>
      <Badge x={37.5} y={4.5} size={5.4} tone="bad" m="pop" at={500}>
        <Mail strokeWidth={2.4} />
      </Badge>

      {/* The clock */}
      <Ring x={48} y={7} size={17} pct={70} tone="warn" at={900} dur={1500}>
        <span className="ms-col" style={{ alignItems: 'center' }}>
          <span className="ms-t ms-l ms-b">
            <Count to={9} from={30} at={900} dur={2600} />
          </span>
          <span className="ms-t ms-xs ms-c-ink-3">days used</span>
        </span>
      </Ring>
      <Label x={56.5} y={26.5} size="xs" tone="ink-3" center m="fade" at={1100}>
        of 30 to reply
      </Label>

      {/* Reconciliation: the gap explained */}
      <Card x={68} y={7} w={28} h={23} m="rise" at={2000} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Reconciliation</span>
        </div>
        <Row label="Gap" value="₹2.7L" tone="warn" />
        <Row label="Explained" value="₹2.7L" checkAt={3300} m="fade" at={2900} />
      </Card>
      <Wires>
        <Wire d="M41 23.5 C 52 34, 60 32, 68 22" tone="warn" dashed m="draw" at={1900} dur={900} />
      </Wires>

      {/* Reply filed */}
      <Doc
        x={45}
        y={34}
        w={33}
        h={20}
        tone="raised"
        title="Reply"
        refText="e-filed"
        m="rise"
        at={4200}
      >
        <Lines widths={[92, 80, 60]} stagger={160} at={4500} />
      </Doc>
      <Pill x={80} y={36} tone="ok" m="pop" at={5600} icon={<IndianRupee />}>
        Demand ₹<Count to={0} from={82400} at={5600} dur={1200} />
      </Pill>
      <Stamp x={12} y={42} tone="ok" m="stamp" at={6500}>
        Closed
      </Stamp>
    </Stage>
  );
}

export function ReassessmentScene() {
  const layers = [
    { label: 'Procedural record', at: 1400 },
    { label: 'Reason to believe', at: 1900 },
    { label: 'Case law', at: 2400 },
  ];
  return (
    <Stage
      hue="scrutiny"
      cycle={10000}
      label="A reassessment notice under section 148 is met by a defence built in layers — the procedural record, a challenge to the reason to believe, and High Court precedent — and the assessment closes with no addition."
    >
      <Doc
        x={4}
        y={10}
        w={28}
        h={34}
        tone="raised"
        title="Notice"
        refText="s.148"
        m="drop"
        fy={-10}
        at={100}
      >
        <Lines widths={[94, 80, 88, 62]} />
        <Row label="Income escaped" value="₹40L" tone="bad" />
      </Doc>

      {/* The challenge travels toward the defence */}
      <At
        x={33}
        y={24}
        w={6}
        h={6}
        className="ms-badge ms-badge-bad"
        m="travel"
        fx={0}
        tx={11}
        at={3000}
        dur={900}
      >
        <AlertTriangle strokeWidth={2.4} />
      </At>

      {/* The defence, layer on layer */}
      <Glow x={42} y={4} w={40} h={54} />
      <At x={46} y={7} w={32} h={46} className="ms-shield" m="rise" at={900}>
        <svg viewBox="0 0 100 140" className="ms-fill">
          <path
            d="M50 4 L94 20 V62 C94 98 72 124 50 136 C28 124 6 98 6 62 V20 Z"
            className="ms-fill-soft ms-stroke-hue"
            strokeWidth={2.4}
          />
        </svg>
      </At>
      {layers.map((l, i) => (
        <Pill
          key={l.label}
          x={62}
          y={18 + i * 7.6}
          center
          tone={i === 2 ? 'hue' : 'paper'}
          m="pop"
          at={l.at}
        >
          {l.label}
        </Pill>
      ))}
      <Pulse x={62} y={30} size={30} at={3900} />
      <Badge x={58.5} y={39.5} size={7} tone="hue" m="pop" at={3900}>
        <Scale strokeWidth={2.4} />
      </Badge>

      {/* Hearing and outcome */}
      <Pill x={4} y={49} m="rise" at={4400} icon={<Gavel />}>
        Faceless hearing
      </Pill>
      <Card x={80} y={10} w={17} h={30} m="rise" at={5000} className="ms-doc">
        <span className="ms-t ms-xs ms-c-ink-3">Proposed</span>
        <span className="ms-t ms-s ms-b ms-strike">₹40L</span>
        <span className="ms-t ms-xs ms-c-ink-3">Final</span>
        <Label x={1.8} y={19} size="l" weight="b" tone="ok" m="pop" at={5600}>
          ₹0
        </Label>
      </Card>
      <Stamp x={71} y={51} tone="ok" m="stamp" at={6600}>
        No addition
      </Stamp>
    </Stage>
  );
}

export function DemandScene() {
  return (
    <Stage
      hue="scrutiny"
      cycle={10000}
      label="A demand of six lakh forty thousand rupees with penalty is raised; a stay of recovery is secured, immunity is sought under section 270AA, and the amount actually at stake shrinks to a fraction."
    >
      <Card x={5} y={7} w={58} h={30} tone="raised" m="rise" at={100} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Outstanding demand</span>
          <span className="ms-ref">s.156</span>
        </div>
        <span className="ms-t ms-xl ms-b">
          ₹<Count to={160000} from={640000} at={4400} dur={1500} />
        </span>
      </Card>
      {/* The bar: what is at risk, shrinking as each step lands */}
      <At x={7} y={27} w={54} h={4} className="ms-round ms-warn-soft" />
      <At
        x={7}
        y={27}
        w={54}
        h={4}
        className="ms-round ms-bar-bad"
        m="grow-x"
        at={500}
        dur={900}
        then="scaleX(0.25)"
        thenAt={4400}
        thenDur={1500}
      />

      {/* The steps */}
      <Card x={5} y={41} w={18} h={15} m="rise" at={1800} className="ms-doc">
        <span className="ms-t ms-xs ms-c-ink-3">Step 1</span>
        <span className="ms-t ms-s ms-b">Stay</span>
      </Card>
      <Card x={25} y={41} w={18} h={15} m="rise" at={2500} className="ms-doc">
        <span className="ms-t ms-xs ms-c-ink-3">Step 2</span>
        <span className="ms-t ms-s ms-b">Immunity</span>
      </Card>
      <Card x={45} y={41} w={18} h={15} m="rise" at={3200} className="ms-doc">
        <span className="ms-t ms-xs ms-c-ink-3">Step 3</span>
        <span className="ms-t ms-s ms-b">Waiver</span>
      </Card>
      <Badge x={19} y={38.5} size={4.4} m="pop" at={2100} />
      <Badge x={39} y={38.5} size={4.4} m="pop" at={2800} />
      <Badge x={59} y={38.5} size={4.4} m="pop" at={3500} />

      {/* Outcome */}
      <Card x={68} y={7} w={28} h={49} m="rise" at={5000} className="ms-doc" tone="ok">
        <ShieldCheck style={{ width: '6cqi', height: '6cqi', color: 'rgb(var(--ms-ok))' }} />
        <span className="ms-t ms-s ms-b">Recovery stayed</span>
        <Row label="Penalty" value="Waived" tone="ok" />
        <Row label="Interest" value="Reduced" tone="ok" />
        <Row label="Ref." value="270AA" />
      </Card>
      <Pulse x={82} y={18} size={14} tone="ok" at={5200} />
    </Stage>
  );
}

/** Hops between points with a short rest at each landing. */
function hops(points: [number, number][], rest = 5): string {
  const parts: string[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i]!;
    const [bx, by] = points[i + 1]!;
    const lift = Math.min(ay, by) - 12;
    const seg = bezier(
      [ax, ay],
      [ax + (bx - ax) * 0.2, lift],
      [ax + (bx - ax) * 0.8, lift],
      [bx, by],
      12,
      true,
    );
    parts.push(i === 0 ? seg : seg.split(';').slice(1).join(';'));
    parts.push(Array(rest).fill(`${bx},${by},0`).join(';'));
  }
  return parts.join(';');
}

export function AppealScene() {
  const steps = [
    { label: 'Order', x: 6, y: 40 },
    { label: 'Form 35', x: 30, y: 30 },
    { label: 'Hearing', x: 54, y: 20 },
    { label: 'CIT(A)', x: 78, y: 10 },
  ];
  // The case file rests on each step's top edge.
  const stops = steps.map((st) => [st.x + 9, st.y + 3] as [number, number]);
  return (
    <Stage
      hue="scrutiny"
      cycle={10000}
      label="An assessment order is taken up the steps of appeal: Form 35 and grounds are filed, the paper book is presented at the hearing, the appeal is allowed by the CIT(A) and the refund is released."
    >
      {steps.map((st, i) => (
        <At
          key={st.label}
          x={st.x}
          y={st.y + 8}
          w={18}
          h={62.5 - st.y - 8}
          className="ms-step"
          m="grow-y"
          at={150 + i * 220}
          dur={700}
        />
      ))}
      {steps.map((st, i) => (
        <Label
          key={`l${st.label}`}
          x={st.x + 9}
          y={st.y + 12}
          size="xs"
          tone="ink-2"
          weight="sb"
          center
          m="fade"
          at={450 + i * 220}
        >
          {st.label}
        </Label>
      ))}
      {steps.slice(1).map((st, i) => (
        <Badge
          key={`b${st.label}`}
          x={st.x + 14.5}
          y={st.y + 5.6}
          size={4.4}
          m="pop"
          at={[1900, 3350, 4850][i]}
        />
      ))}

      {/* The case file climbs, step by step */}
      <Flyer path={hops(stops)} at={800} dur={4400} size={12} keep>
        <span className="ms-casefile">
          <FileText />
          <span className="ms-t ms-xs ms-b">Appeal</span>
        </span>
      </Flyer>

      {/* Outcome */}
      <Stamp x={73} y={33} tone="ok" m="stamp" at={5300}>
        Allowed
      </Stamp>
      <Pulse x={87} y={13} size={18} tone="ok" at={5000} />
      <Pill x={6} y={9} tone="ok" m="pop" at={6200} icon={<IndianRupee />}>
        Refund ₹<Count to={312000} at={6200} dur={1300} /> released
      </Pill>
      <Label x={6} y={17} size="xs" tone="ink-3" m="fade" at={6400}>
        with interest under s.244A
      </Label>
    </Stage>
  );
}

/* ===================================================================== */
/* Structuring & incorporation                                            */
/* ===================================================================== */

export function CompanyScene() {
  const steps = ['DSC', 'DIN', 'Name', 'SPICe+'];
  return (
    <Stage
      hue="incorporation"
      cycle={10000}
      label="Digital signatures, director identification, name approval and the SPICe+ filing click into place one after another, and the certificate of incorporation is issued with the company's PAN and TAN."
    >
      {/* The four filings, in order */}
      {steps.map((s, i) => (
        <Pill
          key={s}
          x={5}
          y={8 + i * 9.2}
          tone={i === 3 ? 'hue' : 'paper'}
          m="fly"
          fx={-5}
          at={200 + i * 380}
          icon={<FileText />}
        >
          {s}
        </Pill>
      ))}
      {steps.map((s, i) => (
        <Badge key={`b${s}`} x={22.5} y={8.4 + i * 9.2} size={4.2} m="pop" at={700 + i * 380} />
      ))}
      <Wires>
        <Wire d="M28 26 C 33 26, 33 26, 38 26" m="draw" at={2100} dur={500} width={0.5} />
      </Wires>
      <Label x={6} y={48} size="xs" tone="ink-3" m="fade" at={2000}>
        Filed with the MCA
      </Label>

      {/* The certificate */}
      <Glow x={34} y={2} w={46} h={58} />
      <Card
        x={39}
        y={6}
        w={34}
        h={50}
        tone="raised"
        m="flip"
        at={2400}
        dur={900}
        className="ms-cert"
      >
        <span className="ms-cert-seal">
          <Building2 />
        </span>
        <span className="ms-t ms-xs ms-c-ink-3" style={{ letterSpacing: '0.12em' }}>
          CERTIFICATE OF
        </span>
        <span className="ms-t ms-m ms-b">Incorporation</span>
        <Lines widths={[86, 70, 80]} />
        <span className="ms-ref" style={{ alignSelf: 'center' }}>
          CIN U72900…
        </span>
      </Card>

      {/* What comes with it */}
      <Pill x={76} y={11} tone="ok" m="pop" at={3800} icon={<FileText />}>
        PAN
      </Pill>
      <Pill x={76} y={20} tone="ok" m="pop" at={4100} icon={<FileText />}>
        TAN
      </Pill>
      <Pill x={76} y={29} tone="ok" m="pop" at={4400} icon={<Landmark />}>
        Bank-ready
      </Pill>
      <Pill x={76} y={38} m="pop" at={4700} icon={<ShieldCheck />}>
        EPFO · ESIC
      </Pill>
      <Stamp x={44} y={50.5} tone="ok" m="stamp" at={5600}>
        Incorporated
      </Stamp>
    </Stage>
  );
}

export function ProprietorshipScene() {
  const tiles = [
    { label: 'Udyam', x: 10, y: 9 },
    { label: 'GST', x: 72, y: 9 },
    { label: 'Trade licence', x: 6, y: 42 },
    { label: 'Current account', x: 68, y: 42 },
  ];
  return (
    <Stage
      hue="incorporation"
      cycle={10000}
      label="A single owner at the centre; Udyam, GST, the trade licence and a current account register around them one by one, and the business is ready to invoice within a week."
    >
      <Glow x={30} y={6} w={40} h={50} />
      <Wires>
        <Wire d="M42 25 L 26 14" dashed m="draw" at={700} dur={500} />
        <Wire d="M58 25 L 74 14" dashed m="draw" at={1300} dur={500} />
        <Wire d="M42 36 L 24 46" dashed m="draw" at={1900} dur={500} />
        <Wire d="M58 36 L 76 46" dashed m="draw" at={2500} dur={500} />
      </Wires>
      <Avatar x={50} y={30} size={16} center tone="hue" m="pop" at={200}>
        <User strokeWidth={2.2} />
      </Avatar>
      <Label x={50} y={42} size="s" weight="b" center m="fade" at={400}>
        You
      </Label>
      {tiles.map((t, i) => (
        <Pill key={t.label} x={t.x} y={t.y} m="pop" at={1000 + i * 600} icon={<ShieldCheck />}>
          {t.label}
        </Pill>
      ))}
      {tiles.map((t, i) => (
        <Pulse
          key={`p${t.label}`}
          x={t.x + 6}
          y={t.y + 2.5}
          size={10}
          tone="ok"
          at={1000 + i * 600}
        />
      ))}

      {/* A week, counted */}
      <Card x={34} y={47} w={32} h={11} m="rise" at={3600} className="ms-doc ms-ready">
        <span className="ms-t ms-xs ms-c-ink-3">Ready to invoice in</span>
        <span className="ms-t ms-m ms-b ms-c-ok">
          <Count to={7} from={0} at={3800} dur={1200} /> days
        </span>
      </Card>
      <Stamp x={40} y={1.5} tone="ok" m="stamp" at={5200}>
        Open for business
      </Stamp>
    </Stage>
  );
}

export function PartnershipScene() {
  return (
    <Stage
      hue="incorporation"
      cycle={10000}
      label="Three partners agree a profit share of fifty, thirty and twenty per cent; the deed is drafted and signed by each of them and registered with the Registrar of Firms, with a PAN for the firm."
    >
      <Avatar x={8} y={10} size={9} tone="hue" m="pop" at={150}>
        AK
      </Avatar>
      <Avatar x={8} y={25} size={9} tone="ink" m="pop" at={300}>
        RS
      </Avatar>
      <Avatar x={8} y={40} size={9} tone="paper" m="pop" at={450}>
        MP
      </Avatar>

      {/* Profit share */}
      <At x={20} y={14} w={26} h={26} m="rise" at={800}>
        <svg viewBox="0 0 42 42" className="ms-fill" style={{ rotate: '-90deg' }}>
          <circle cx="21" cy="21" r="15.9" fill="none" className="ms-ring-track" strokeWidth="5" />
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            className="ms-stroke-hue"
            strokeWidth="5"
            pathLength={100}
            strokeDasharray="50 100"
          />
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            className="ms-donut-2"
            strokeWidth="5"
            pathLength={100}
            strokeDasharray="30 100"
            strokeDashoffset="-50"
          />
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            className="ms-donut-3"
            strokeWidth="5"
            pathLength={100}
            strokeDasharray="20 100"
            strokeDashoffset="-80"
          />
        </svg>
        <div className="ms-ring-c">
          <span className="ms-t ms-s ms-b">50 · 30 · 20</span>
        </div>
      </At>
      <Label x={33} y={42.5} size="xs" tone="ink-3" center m="fade" at={1100}>
        Profit share
      </Label>

      {/* The deed */}
      <Doc x={50} y={6} w={34} h={50} tone="raised" title="Partnership deed" m="rise" at={1500}>
        <Lines widths={[92, 84, 90, 70]} stagger={140} at={1800} />
        <div className="ms-sigs">
          {['AK', 'RS', 'MP'].map((p, i) => (
            <span key={p} className="ms-sig">
              <svg viewBox="0 0 60 20">
                <path
                  d={
                    [
                      'M2 14 C 10 2, 14 18, 22 8 S 34 14, 40 6 S 52 12, 58 8',
                      'M2 12 C 8 4, 16 16, 24 10 C 30 6, 36 16, 44 8 L 58 10',
                      'M2 10 C 12 16, 18 2, 28 12 S 44 4, 58 12',
                    ][i]
                  }
                  fill="none"
                  className="ms-stroke-hue"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1"
                  data-m="draw"
                  data-at={String(2900 + i * 450)}
                  data-dur="600"
                />
              </svg>
              <span className="ms-t ms-xs ms-c-ink-3">{p}</span>
            </span>
          ))}
        </div>
      </Doc>
      <Badge x={80.5} y={3} size={6} tone="hue" m="pop" at={4300}>
        <Signature strokeWidth={2.2} />
      </Badge>

      {/* Registered */}
      <Pill x={86} y={20} tone="ok" m="pop" at={5000} icon={<Landmark />}>
        RoF
      </Pill>
      <Pill x={86} y={29} tone="ok" m="pop" at={5300} icon={<FileText />}>
        PAN
      </Pill>
      <Stamp x={13} y={49} tone="ok" m="stamp" at={6000}>
        Registered firm
      </Stamp>
    </Stage>
  );
}

export function ProjectReportScene() {
  return (
    <Stage
      hue="incorporation"
      cycle={10000}
      label="A five-year projection is built, debt service coverage rises to a comfortable 1.8 times, break-even is marked, and the bank sanctions the loan."
    >
      <Card x={5} y={6} w={56} h={50} tone="raised" m="rise" at={100} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Five-year projection</span>
          <span className="ms-ref">CMA</span>
        </div>
      </Card>
      <Bars
        x={9}
        y={16}
        w={48}
        h={30}
        values={[26, 40, 55, 72, 92]}
        highlight={[3, 4]}
        at={600}
        step={200}
        gap={2.2}
      />
      <Wires>
        <Wire d="M9 37 L 57 37" tone="warn" dashed m="draw" at={1800} dur={700} width={0.35} />
        <Wire
          d="M13.5 41 C 22 37, 30 32, 33 28 S 46 18, 52 13"
          tone="hue"
          m="draw"
          at={1900}
          dur={1200}
          width={0.5}
        />
      </Wires>
      <Label x={9} y={34} size="xs" tone="warn" weight="sb" m="fade" at={2200}>
        Break-even
      </Label>
      {['Y1', 'Y2', 'Y3', 'Y4', 'Y5'].map((y, i) => (
        <Label key={y} x={13.2 + i * 9.9} y={48} size="xs" tone="ink-3" center>
          {y}
        </Label>
      ))}

      {/* The ratio a lender reads first */}
      <Ring x={66} y={6} size={22} pct={72} tone="hue" at={2800} dur={1400}>
        <span className="ms-col" style={{ alignItems: 'center' }}>
          <span className="ms-t ms-l ms-b">
            <Count to={1.8} decimals={1} at={2800} dur={1400} />×
          </span>
          <span className="ms-t ms-xs ms-c-ink-3">DSCR</span>
        </span>
      </Ring>
      <Pill x={90} y={31} center m="pop" at={3900}>
        IRR 21%
      </Pill>

      <Stamp x={64} y={41} tone="ok" m="stamp" at={5200}>
        Loan sanctioned
      </Stamp>
      <Pulse x={80} y={44} size={18} tone="ok" at={5300} />
    </Stage>
  );
}
