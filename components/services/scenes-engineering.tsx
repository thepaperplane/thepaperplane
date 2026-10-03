import {
  BadgeCheck,
  Banknote,
  Bot,
  CreditCard,
  Database,
  FileText,
  IndianRupee,
  Lock,
  Mail,
  MousePointerClick,
  Search,
  Smartphone,
  Sparkles,
  UserRound,
} from 'lucide-react';
import {
  At,
  Avatar,
  Badge,
  Bars,
  Beam,
  bezier,
  Card,
  Count,
  Doc,
  Flyer,
  Glow,
  Label,
  Lines,
  Phone,
  Pill,
  Pointer,
  Pulse,
  Ring,
  Row,
  Stamp,
  Win,
  Wire,
  Wires,
} from '@/components/motion/props';
import { Stage } from '@/components/motion/stage';

/**
 * Engineering-side scenes: books, digital infrastructure, brand and design.
 * Same grammar as the advisory set — in, work, out — and the same colour
 * rules: green is the outcome, amber the exception.
 */

/* ===================================================================== */
/* Books & audit readiness                                                */
/* ===================================================================== */

export function BookkeepingScene() {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  return (
    <Stage
      hue="books"
      cycle={10000}
      label="Bank feeds, bills and sales flow into the ledger; every entry is matched to its voucher and the bank is reconciled, the month is closed, and a profit and loss is ready."
    >
      <Pill x={4} y={8} m="fly" fx={-5} at={150} icon={<Banknote />}>
        Bank feed
      </Pill>
      <Pill x={4} y={16} m="fly" fx={-5} at={330} icon={<FileText />}>
        Bills
      </Pill>
      <Pill x={4} y={24} m="fly" fx={-5} at={510} icon={<FileText />}>
        Sales
      </Pill>
      <Wires>
        <Wire d="M21 10.5 C 25 10.5, 25 18, 29 18" m="draw" at={900} dur={600} />
        <Wire d="M15 18.5 C 22 18.5, 22 23, 29 23" m="draw" at={1050} dur={600} />
        <Wire d="M16 26.5 C 22 26.5, 23 28, 29 28" m="draw" at={1200} dur={600} />
      </Wires>

      <Doc x={29} y={7} w={38} h={48} tone="raised" title="Ledger · September" m="rise" at={600}>
        <Beam at={1700} dur={1700} travel={34} />
        <div className="ms-col">
          <Row label="Office rent" value="₹45,000" checkAt={2000} />
          <Row label="Cloud hosting" value="₹12,480" checkAt={2400} />
          <Row label="Client receipt" value="₹2,40,000" checkAt={2800} />
          <Row label="Bank charges" value="₹236" checkAt={3200} />
          <Row label="Bank reconciled" value="₹0 diff" tone="ok" m="fade" at={3500} />
        </div>
      </Doc>

      {/* Month after month, closed */}
      <Card x={70} y={7} w={26} h={22} m="rise" at={300} className="ms-doc">
        <span className="ms-t ms-xs ms-c-ink-3 ms-sb">Month-end close</span>
      </Card>
      {months.map((mth, i) => (
        <At
          key={mth}
          x={71.6 + (i % 3) * 7.8}
          y={12.6 + Math.floor(i / 3) * 7.6}
          w={7}
          h={6.6}
          className="ms-card-tint"
          style={{ borderRadius: '1cqi' }}
        >
          <Label x={3.5} y={1.7} size="xs" tone="ink-3" center>
            {mth}
          </Label>
          <At
            x={3.5}
            y={4.6}
            w={2.6}
            h={2.6}
            center
            className="ms-tick"
            m="pop"
            at={3900 + i * 200}
          >
            <BadgeCheck strokeWidth={3} />
          </At>
        </At>
      ))}

      {/* What you get */}
      <Card x={70} y={32} w={26} h={23} m="rise" at={5200} className="ms-doc" tone="ok">
        <span className="ms-t ms-xs ms-c-ink-3">Net profit · Sep</span>
        <span className="ms-t ms-l ms-b">
          ₹<Count to={384000} at={5400} dur={1300} />
        </span>
        <Lines widths={[90, 66]} tone="ok" />
      </Card>
      <Stamp x={33} y={49} tone="ok" m="stamp" at={6400}>
        Closed by the 7th
      </Stamp>
    </Stage>
  );
}

export function InternalAuditScene() {
  const tiles = Array.from({ length: 12 }, (_, i) => i);
  return (
    <Stage
      hue="books"
      cycle={10000}
      label="A lens passes over a grid of transactions and finds one unsupported entry; a control is added, and a written findings report lists every issue with its fix before the accounts go anywhere else."
    >
      <Card x={4} y={6} w={52} h={50} tone="raised" m="rise" at={100} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Sample testing</span>
          <span className="ms-ref">120 entries</span>
        </div>
      </Card>
      {tiles.map((i) => (
        <At
          key={i}
          x={7 + (i % 4) * 11.8}
          y={14 + Math.floor(i / 4) * 12.6}
          w={10.4}
          h={10.6}
          className={i === 6 ? 'ms-cell ms-cell-hit' : 'ms-cell'}
          m="fade"
          at={300 + i * 60}
        >
          <Lines widths={[80, 56]} gap={1} thick={0.8} />
        </At>
      ))}
      {/* Findings appear as the lens passes */}
      {tiles.map((i) =>
        i === 6 ? (
          <Badge
            key={`b${i}`}
            x={7 + (i % 4) * 11.8 + 6.6}
            y={14 + Math.floor(i / 4) * 12.6 - 1.2}
            size={4.6}
            tone="warn"
            m="pop"
            at={2500}
          >
            <Search strokeWidth={2.6} />
          </Badge>
        ) : null,
      )}
      <Flyer
        path={bezier([10, 18], [40, 10], [44, 34], [20, 46], 30)}
        at={900}
        dur={2600}
        size={11}
      >
        <span className="ms-lens">
          <Search strokeWidth={2.2} />
        </span>
      </Flyer>

      {/* The fix */}
      <Pill x={5} y={53} tone="warn" m="pop" at={2900} icon={<FileText />}>
        #318 · no voucher
      </Pill>
      <Pill x={31} y={53} tone="hue" m="pop" at={3700} icon={<Lock />}>
        Control added
      </Pill>

      {/* Findings report */}
      <Doc
        x={60}
        y={6}
        w={36}
        h={50}
        tone="raised"
        title="Findings report"
        refText="Written"
        m="rise"
        at={4300}
      >
        <Row label="Unsupported entry" value="Fixed" tone="ok" checkAt={5000} />
        <Row label="Duplicate vendor" value="Fixed" tone="ok" checkAt={5300} />
        <Row label="Stock variance" value="Fixed" tone="ok" checkAt={5600} />
        <Lines widths={[90, 74, 82]} />
      </Doc>
      <Stamp x={66} y={44} tone="ok" m="stamp" at={6400}>
        Audit-ready
      </Stamp>
    </Stage>
  );
}

export function AccountingSystemsScene() {
  return (
    <Stage
      hue="books"
      cycle={10000}
      label="Records move from old books into a properly configured accounting system; the chart of accounts is mapped, every balance ties back, and bank feeds start filling themselves in."
    >
      {/* Old books */}
      <Card x={4} y={10} w={24} h={40} tone="tint" m="rise" at={100} className="ms-doc">
        <span className="ms-t ms-s ms-b ms-c-ink-2">Old books</span>
        <Lines widths={[90, 70, 84, 60, 78, 66, 88]} />
      </Card>
      <Label x={16} y={53} size="xs" tone="ink-3" center m="fade" at={300}>
        Any software
      </Label>

      {/* Records in transit */}
      <Wires>
        <path
          d="M29 30 L 55 30"
          className="ms-stroke-ctx"
          strokeWidth={0.35}
          strokeDasharray="0.8 1"
          fill="none"
        />
      </Wires>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <At
          key={i}
          x={29}
          y={28}
          w={5}
          h={4}
          className="ms-packet"
          m="travel"
          fx={0}
          tx={22}
          at={900 + i * 330}
          dur={900}
        >
          <Database />
        </At>
      ))}
      <Card x={33} y={36} w={18} h={11} m="rise" at={900} className="ms-doc">
        <span className="ms-t ms-xs ms-c-ink-3">Migrated</span>
        <span className="ms-t ms-m ms-b">
          <Count to={12480} at={900} dur={2600} />
        </span>
      </Card>
      <Pill x={33} y={14} m="pop" at={1200} icon={<FileText />}>
        Chart mapped
      </Pill>

      {/* The new system */}
      <Win x={56} y={6} w={40} h={50} url="books.yourfirm.in" m="rise" at={600}>
        <div className="ms-col" style={{ padding: '1.6cqi 1.8cqi', gap: '1.2cqi' }}>
          <span className="ms-t ms-s ms-b">Bank feed</span>
          <Row label="NEFT · Asha Traders" value="₹84,000" checkAt={3800} m="fade" at={3500} />
          <Row label="UPI · 1,204 receipts" value="₹2.6L" checkAt={4200} m="fade" at={3900} />
          <Row label="Card · fuel" value="₹3,120" checkAt={4600} m="fade" at={4300} />
          <Row label="Trial balance" value="Ties" tone="ok" m="fade" at={5000} />
        </div>
      </Win>
      <Pill x={60} y={47.5} tone="ok" m="pop" at={5600} icon={<BadgeCheck />}>
        Every balance ties back
      </Pill>
    </Stage>
  );
}

export function PayrollScene() {
  const people = ['AN', 'VK', 'SR', 'PD'];
  return (
    <Stage
      hue="books"
      cycle={10000}
      label="The monthly payroll run computes pay for each person, deducts PF, ESI, professional tax and TDS, credits salaries on time, issues payslips and, at year end, Form 16."
    >
      {/* People */}
      {people.map((p, i) => (
        <Avatar
          key={p}
          x={6 + i * 8}
          y={7}
          size={7}
          tone={i % 2 ? 'ink' : 'hue'}
          m="pop"
          at={150 + i * 120}
        >
          {p}
        </Avatar>
      ))}
      <Wires>
        {people.map((p, i) => (
          <Wire
            key={p}
            d={`M${9.5 + i * 8} 14.5 C ${9.5 + i * 8} 20, 22 18, 22 23`}
            m="draw"
            at={700 + i * 100}
            dur={500}
          />
        ))}
      </Wires>

      {/* The run */}
      <Card x={6} y={23} w={34} h={33} tone="raised" m="rise" at={600} className="ms-doc">
        <div className="ms-doc-h">
          <span className="ms-t ms-s ms-b">Payroll · September</span>
        </div>
        <Row label="Gross" value="₹9,80,000" />
        <Row label="Statutory" value="−₹1,38,000" />
        <Row label="Net pay" value="₹8,42,000" tone="hue" />
      </Card>
      {['PF', 'ESI', 'PT', 'TDS'].map((t, i) => (
        <Pill
          key={t}
          x={44}
          y={9 + i * 7.2}
          tone="paper"
          m="fly"
          fx={-4}
          at={1500 + i * 260}
          icon={<FileText />}
        >
          {t} filed
        </Pill>
      ))}
      {['PF', 'ESI', 'PT', 'TDS'].map((t, i) => (
        <Badge key={`b${t}`} x={58.6} y={9.6 + i * 7.2} size={3.8} m="pop" at={1900 + i * 260} />
      ))}

      {/* Payslips fan out */}
      {[0, 1, 2].map((i) => (
        <Doc
          key={i}
          x={71.5 + i * 2.2}
          y={8 + i * 3}
          w={22}
          h={30}
          tone={i === 2 ? 'raised' : 'paper'}
          title={i === 2 ? 'Payslip' : undefined}
          refText={i === 2 ? 'Sep' : undefined}
          m="fly"
          fx={-10}
          fy={6}
          at={3200 + i * 220}
        >
          {i === 2 ? (
            <>
              <Row label="Net" value="₹62,400" />
              <Lines widths={[88, 64]} />
            </>
          ) : null}
        </Doc>
      ))}

      <Pill x={44} y={44} tone="ok" m="pop" at={4800} icon={<IndianRupee />}>
        Salaries credited · 1st
      </Pill>
      <Stamp x={50} y={52} tone="ok" m="stamp" at={5800}>
        Form 16 issued
      </Stamp>
    </Stage>
  );
}

/* ===================================================================== */
/* Digital infrastructure                                                 */
/* ===================================================================== */

export function WebDesignScene() {
  return (
    <Stage
      hue="digital"
      cycle={10000}
      label="A website assembles in a browser — headline, image and call to action — adapts to a phone, scores 98 for performance, and a visitor clicks through to send an enquiry."
    >
      <Glow x={10} y={0} w={60} h={60} />
      <Win x={4} y={5} w={60} h={52} url="yourbrand.in" m="rise" at={100}>
        {/* Nav */}
        <At
          x={2.4}
          y={2}
          w={8}
          h={1.8}
          className="ms-hue-solid ms-round"
          m="grow-x"
          at={500}
          dur={500}
        />
        {[0, 1, 2].map((i) => (
          <At
            key={i}
            x={34 + i * 6.4}
            y={2.4}
            w={4.6}
            h={1}
            className="ms-line"
            m="fade"
            at={600 + i * 80}
          />
        ))}
        {/* Headline types itself */}
        <Label x={2.4} y={6.6} size="l" weight="b" m="type" at={900} dur={600}>
          Grow with
        </Label>
        <Label x={2.4} y={11.6} size="l" weight="b" m="type" at={1400} dur={600}>
          clarity
        </Label>
        <At x={2.4} y={17.6} w={26} h={1.1} className="ms-line" m="grow-x" at={1700} dur={500} />
        <At x={2.4} y={20} w={20} h={1.1} className="ms-line" m="grow-x" at={1800} dur={500} />
        {/* Call to action */}
        <At x={2.4} y={23.6} w={15} h={5} className="ms-cta" m="pop" at={2000}>
          <span className="ms-t ms-xs ms-b ms-c-white">Get a quote</span>
        </At>
        {/* Hero image */}
        <At x={35} y={6} w={21.6} h={24} className="ms-hero-img" m="rise" at={1300} />
        {/* Cards */}
        {[0, 1, 2].map((i) => (
          <At
            key={`c${i}`}
            x={2.4 + i * 18}
            y={32}
            w={16.4}
            h={10}
            className="ms-card-tint"
            style={{ borderRadius: '1cqi' }}
            m="rise"
            at={2300 + i * 140}
          >
            <Lines widths={[60, 80]} gap={1} thick={0.8} className="ms-pad" />
          </At>
        ))}
      </Win>
      <Pointer x={40} y={46} m="travel" fx={0} fy={0} tx={-27} ty={-11} at={3000} dur={1100} />
      <Pulse x={13} y={35.5} size={8} at={4100} />

      {/* Phone */}
      <Phone x={70} y={6} w={17} h={34} m="rise" at={2600}>
        <At x={1.4} y={2} w={6} h={1.4} className="ms-hue-solid ms-round" />
        <Label x={1.4} y={5.4} size="xs" weight="b">
          Grow with
        </Label>
        <Label x={1.4} y={8.4} size="xs" weight="b">
          clarity
        </Label>
        <At x={1.4} y={12.6} w={12.6} h={9} className="ms-hero-img" />
        <At x={1.4} y={23.6} w={9} h={3.2} className="ms-cta" />
      </Phone>

      {/* Outcome */}
      <Ring x={72} y={42} size={15} pct={98} tone="ok" at={3600} dur={1300}>
        <span className="ms-t ms-m ms-b ms-c-ok">
          <Count to={98} at={3600} dur={1300} />
        </span>
      </Ring>
      <Label x={88} y={46} size="xs" tone="ink-3" m="fade" at={3900}>
        Speed
      </Label>
      <Pill x={34} y={49} tone="ok" m="pop" at={4600} icon={<Mail />}>
        New enquiry received
      </Pill>
    </Stage>
  );
}

export function WebAppScene() {
  return (
    <Stage
      hue="digital"
      cycle={10000}
      label="A private portal: people sign in with their own role, figures update as they change, and every action leaves a record."
    >
      <Win x={4} y={5} w={66} h={53} url="portal.yourfirm.in" m="rise" at={100}>
        {/* Sidebar */}
        <At x={0} y={0} w={11} h={49} className="ms-side" />
        {[0, 1, 2, 3, 4].map((i) => (
          <At
            key={i}
            x={2.4}
            y={3 + i * 5.2}
            w={6}
            h={1.2}
            className={i === 1 ? 'ms-hue-solid ms-round' : 'ms-line'}
            m="fade"
            at={400 + i * 70}
          />
        ))}
        {/* KPIs */}
        {[
          { l: 'Open orders', v: 128 },
          { l: 'Due today', v: 14 },
          { l: 'Collected', v: 92 },
        ].map((k, i) => (
          <Card
            key={k.l}
            x={14 + i * 17}
            y={3}
            w={15}
            h={11}
            m="rise"
            at={700 + i * 150}
            className="ms-doc"
            tone="tint"
          >
            <span className="ms-t ms-xs ms-c-ink-3">{k.l}</span>
            <span className="ms-t ms-m ms-b">
              <Count to={k.v} at={900 + i * 150} dur={1300} />
              {i === 2 ? '%' : ''}
            </span>
          </Card>
        ))}
        {/* Chart */}
        <At
          x={14}
          y={17}
          w={49}
          h={15}
          className="ms-card-tint"
          style={{ borderRadius: '1cqi' }}
          m="fade"
          at={1300}
        />
        <Wires w={66} h={48.6}>
          <Wire
            d="M16 30 C 22 27, 26 29, 31 24 S 40 22, 45 20 S 56 16, 61 19"
            m="draw"
            at={1500}
            dur={1300}
            width={0.5}
          />
        </Wires>
        {/* Table rows */}
        {[0, 1, 2].map((i) => (
          <At
            key={`r${i}`}
            x={14}
            y={35 + i * 4.6}
            w={49}
            h={3.6}
            className="ms-tr"
            m="rise"
            at={2400 + i * 180}
          >
            <span className="ms-t ms-xs ms-c-ink-2">
              {['Order #2291', 'Order #2290', 'Order #2288'][i]}
            </span>
            <span className={`ms-t ms-xs ms-b ${i === 2 ? 'ms-c-warn' : 'ms-c-ok'}`}>
              {i === 2 ? 'Pending' : 'Shipped'}
            </span>
          </At>
        ))}
      </Win>

      {/* Roles */}
      {[
        { r: 'Owner', t: 'hue' as const, a: 3200 },
        { r: 'Staff', t: 'ink' as const, a: 3500 },
        { r: 'Client', t: 'paper' as const, a: 3800 },
      ].map((p, i) => (
        <Pill key={p.r} x={74} y={8 + i * 8} m="fly" fx={5} at={p.a} icon={<UserRound />}>
          {p.r}
        </Pill>
      ))}
      {[0, 1, 2].map((i) => (
        <Badge
          key={i}
          x={90}
          y={8.4 + i * 8}
          size={4.2}
          tone={i === 2 ? 'quiet' : 'hue'}
          m="pop"
          at={3500 + i * 300}
        >
          <Lock strokeWidth={2.6} />
        </Badge>
      ))}
      <Card x={74} y={34} w={22} h={14} m="rise" at={4600} className="ms-doc">
        <span className="ms-t ms-xs ms-c-ink-3">Activity log</span>
        <Lines widths={[90, 72, 84]} stagger={150} at={4800} tone="hue" />
      </Card>
      <Pill x={74} y={51} tone="ok" m="pop" at={5600} icon={<BadgeCheck />}>
        Backed up daily
      </Pill>
    </Stage>
  );
}

export function FinancialSaasScene() {
  return (
    <Stage
      hue="digital"
      cycle={10000}
      label="A GST-correct invoice is sent with a payment link; the customer pays by UPI on their phone in a tap, and the receipt and GST entries post themselves to the books."
    >
      <Doc
        x={4}
        y={7}
        w={32}
        h={46}
        tone="raised"
        title="Invoice #1042"
        refText="GST"
        m="rise"
        at={100}
      >
        <Row label="Design retainer" value="₹50,000" />
        <Row label="CGST + SGST 18%" value="₹9,000" />
        <Row label="Total" value="₹59,000" tone="hue" />
        <At x={1.8} y={30} w={28} h={5.2} className="ms-cta" m="pop" at={900}>
          <span className="ms-t ms-xs ms-b ms-c-white">Pay now</span>
        </At>
      </Doc>
      {/* The link travels */}
      <Wires>
        <path
          d="M33 39.5 C 40 39.5, 42 26, 47 26"
          className="ms-stroke-ctx"
          strokeWidth={0.35}
          strokeDasharray="0.8 1"
          fill="none"
        />
      </Wires>
      <Flyer
        path={bezier([33, 39.5], [40, 39.5], [42, 26], [47, 26], 20)}
        at={1300}
        dur={900}
        size={4.4}
      />

      {/* Phone */}
      <Phone x={47} y={5} w={20} h={52} m="rise" at={700}>
        <Label x={9.2} y={4} size="xs" tone="ink-3" center>
          Pay Your Studio
        </Label>
        <Label x={9.2} y={9} size="l" weight="b" center>
          ₹59,000
        </Label>
        {['UPI', 'Card', 'Netbanking'].map((t, i) => (
          <At
            key={t}
            x={1.6}
            y={15 + i * 6}
            w={15.2}
            h={4.8}
            className={i === 0 ? 'ms-opt ms-opt-on' : 'ms-opt'}
            m="rise"
            at={2200 + i * 120}
          >
            {i === 0 ? <Smartphone /> : i === 1 ? <CreditCard /> : <Banknote />}
            <span className="ms-t ms-xs ms-sb">{t}</span>
          </At>
        ))}
        <At x={0} y={0} w={18.4} h={50.4} className="ms-paid" m="fade" at={3600} dur={300}>
          <Badge x={9.2} y={18} size={9} center m="pop" at={3700} />
          <Label x={9.2} y={27} size="m" weight="b" center tone="ok">
            Paid
          </Label>
          <Label x={9.2} y={31.5} size="xs" tone="ink-3" center>
            UPI · 2 seconds
          </Label>
        </At>
      </Phone>
      <Pointer x={56} y={40} m="travel" tx={-3} ty={-20} at={2600} dur={900} />
      <Pulse x={52.5} y={22.5} size={7} at={3450} />

      {/* Books update themselves */}
      <Card x={71} y={7} w={25} h={30} m="rise" at={4300} className="ms-doc">
        <span className="ms-t ms-s ms-b">Books</span>
        <Row label="Receipt" value="₹59,000" checkAt={4700} />
        <Row label="GST" value="₹9,000" checkAt={5000} />
        <Row label="Ageing" value="Cleared" tone="ok" />
      </Card>
      <Bars
        x={72}
        y={41}
        w={23}
        h={13}
        values={[38, 52, 46, 68, 84]}
        highlight={[4]}
        at={5300}
        step={110}
        gap={1.4}
      />
    </Stage>
  );
}

export function AutomationScene() {
  return (
    <Stage
      hue="digital"
      cycle={10000}
      label="Invoices arriving by email are read automatically, checked against the books and posted when they match; the one that does not match is sent to a person to approve, and hours are saved every week."
    >
      <Wires>
        <path
          d="M20 31 L 33 31 M 47 31 L 58 31 M 70 27 C 76 27, 74 17, 80 17 M 70 35 C 76 35, 74 45, 80 45"
          className="ms-stroke-ctx"
          strokeWidth={0.4}
          fill="none"
        />
      </Wires>
      {/* Tokens travel each leg */}
      {[0, 1, 2].map((i) => (
        <At
          key={`a${i}`}
          x={19}
          y={29.5}
          w={3}
          h={3}
          className="ms-token"
          m="travel"
          tx={13}
          at={800 + i * 1400}
          dur={600}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <At
          key={`b${i}`}
          x={46}
          y={29.5}
          w={3}
          h={3}
          className="ms-token"
          m="travel"
          tx={11}
          at={1400 + i * 1400}
          dur={500}
        />
      ))}
      {[0, 1].map((i) => (
        <At
          key={`c${i}`}
          x={69}
          y={25.5}
          w={3}
          h={3}
          className="ms-token ms-token-ok"
          m="travel"
          tx={10}
          ty={-10}
          at={2000 + i * 1400}
          dur={500}
        />
      ))}
      <At
        x={69}
        y={33.5}
        w={3}
        h={3}
        className="ms-token ms-token-warn"
        m="travel"
        tx={10}
        ty={10}
        at={4800}
        dur={500}
      />

      {/* Nodes */}
      <Card x={4} y={23} w={16} h={16} m="rise" at={100} className="ms-node">
        <Mail />
        <span className="ms-t ms-xs ms-sb">Invoice email</span>
      </Card>
      <Card
        x={33}
        y={21}
        w={14}
        h={20}
        tone="raised"
        m="pop"
        at={400}
        className="ms-node ms-node-hue"
      >
        <Sparkles />
        <span className="ms-t ms-xs ms-sb">Reads it</span>
      </Card>
      <Card x={58} y={23} w={12} h={16} m="rise" at={600} className="ms-node">
        <Database />
        <span className="ms-t ms-xs ms-sb">Match</span>
      </Card>
      <Card x={80} y={9} w={16} h={16} m="rise" at={800} className="ms-node ms-node-ok">
        <BadgeCheck />
        <span className="ms-t ms-xs ms-sb">Posted</span>
      </Card>
      <Card x={80} y={37} w={16} h={16} m="rise" at={1000} className="ms-node ms-node-warn">
        <UserRound />
        <span className="ms-t ms-xs ms-sb">Ask a person</span>
      </Card>

      {/* Extracted fields */}
      <Pill x={28} y={8} tone="quiet" m="pop" at={1700} icon={<FileText />}>
        GSTIN ✓
      </Pill>
      <Pill x={44} y={8} tone="quiet" m="pop" at={1900} icon={<IndianRupee />}>
        ₹18,400 ✓
      </Pill>
      <Badge x={92} y={34.6} size={4.4} tone="warn" m="pop" at={5300}>
        <MousePointerClick strokeWidth={2.4} />
      </Badge>

      {/* What you get */}
      <Card x={4} y={45} w={42} h={12} m="rise" at={5600} className="ms-doc ms-inline" tone="ok">
        <Bot style={{ width: '5cqi', height: '5cqi', color: 'rgb(var(--ms-ok))', flex: 'none' }} />
        <span className="ms-col">
          <span className="ms-t ms-m ms-b">
            <Count to={38} at={5800} dur={1300} /> hours
          </span>
          <span className="ms-t ms-xs ms-c-ink-3">given back this month</span>
        </span>
      </Card>
    </Stage>
  );
}

/* ===================================================================== */
/* Brand & visual design                                                  */
/* ===================================================================== */

export function BrandScene() {
  const swatches = ['ms-sw-1', 'ms-sw-2', 'ms-sw-3', 'ms-sw-4', 'ms-sw-5'];
  return (
    <Stage
      hue="design"
      cycle={10000}
      label="A brand mark is constructed on a grid, a colour palette and a typeface are chosen to work with it, and everything is gathered into a guideline book your team can use."
    >
      {/* Construction */}
      <Card x={4} y={6} w={40} h={50} tone="raised" m="rise" at={100} className="ms-doc" />
      <Wires>
        <circle
          cx="24"
          cy="27"
          r="13"
          fill="none"
          className="ms-stroke-ctx"
          strokeWidth={0.3}
          pathLength={1}
          strokeDasharray="1"
          data-m="draw"
          data-at="400"
          data-dur="900"
        />
        <circle
          cx="24"
          cy="27"
          r="7.5"
          fill="none"
          className="ms-stroke-ctx"
          strokeWidth={0.3}
          pathLength={1}
          strokeDasharray="1"
          data-m="draw"
          data-at="600"
          data-dur="900"
        />
        <path
          d="M8 27 H 40 M 24 10 V 44"
          className="ms-stroke-ctx"
          strokeWidth={0.25}
          pathLength={1}
          strokeDasharray="1"
          data-m="draw"
          data-at="500"
          data-dur="700"
          fill="none"
        />
        <path
          d="M12 31 L 36 19 L 29 38 L 24 31 Z"
          className="ms-stroke-hue ms-fill-soft"
          strokeWidth={0.7}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          data-m="draw"
          data-at="1300"
          data-dur="1100"
        />
        <path
          d="M24 31 L 36 19 L 21 29 Z"
          className="ms-fill-hue"
          data-m="fade"
          data-at="2300"
          data-dur="500"
        />
      </Wires>
      <Label x={24} y={50.5} size="xs" tone="ink-3" center m="fade" at={2400}>
        Works from favicon to billboard
      </Label>

      {/* Palette */}
      {swatches.map((c, i) => (
        <At
          key={c}
          x={49 + i * 6.6}
          y={8}
          w={5.6}
          h={5.6}
          className={`ms-swatch ${c}`}
          m="drop"
          at={2600 + i * 140}
        />
      ))}
      <Label x={49} y={16.5} size="xs" tone="ink-3" m="fade" at={2800}>
        Palette
      </Label>

      {/* Type */}
      <Card x={49} y={21} w={20} h={18} m="rise" at={3300} className="ms-doc ms-type">
        <span className="ms-aa">Aa</span>
        <span className="ms-t ms-xs ms-c-ink-3">Display serif</span>
      </Card>
      <Card x={71} y={21} w={25} h={18} m="rise" at={3500} className="ms-doc">
        <span className="ms-t ms-s ms-b">Headline</span>
        <Lines widths={[94, 80, 88]} />
      </Card>

      {/* The guideline book */}
      <Doc
        x={49}
        y={42}
        w={47}
        h={14}
        tone="raised"
        title="Brand guidelines"
        refText="v1.0"
        m="rise"
        at={4300}
      >
        <div className="ms-chips">
          {['Logo', 'Colour', 'Type', 'Voice', 'Files'].map((t, i) => (
            <span
              key={t}
              className="ms-chip"
              {...{ 'data-m': 'pop', 'data-at': String(4600 + i * 120), 'data-dur': '450' }}
            >
              {t}
            </span>
          ))}
        </div>
      </Doc>
      <Stamp x={67} y={33} tone="ok" m="stamp" at={5800}>
        Ready to use
      </Stamp>
    </Stage>
  );
}

export function DeckScene() {
  const slides = [
    { t: 'Series A', s: 'Cover', at: 300 },
    { t: 'Market', s: 'Why now', at: 650 },
    { t: 'Traction', s: 'Proof', at: 1000 },
    { t: 'The ask', s: 'Raise', at: 1350 },
  ];
  return (
    <Stage
      hue="design"
      cycle={10000}
      label="An investor deck takes shape slide by slide — cover, market, traction and the ask — every figure is checked, and the story reads in four minutes."
    >
      <Glow x={6} y={4} w={60} h={56} />
      {slides.map((sl, i) => (
        <Card
          key={sl.t}
          x={5 + i * 5}
          y={5 + i * 8.2}
          w={46}
          h={i === 3 ? 28 : 26}
          tone={i === 3 ? 'raised' : 'paper'}
          m="fly"
          fx={-6}
          fy={4}
          at={sl.at}
          className="ms-slide"
        >
          <span className="ms-t ms-xs ms-c-ink-3">
            {String(i + 1).padStart(2, '0')} · {sl.s}
          </span>
          <span className="ms-t ms-s ms-b">{sl.t}</span>
          {i === 3 ? (
            <>
              <span className="ms-t ms-xl ms-b ms-c-hue" style={{ marginTop: '1.4cqi' }}>
                ₹<Count to={12} at={1600} dur={1100} /> Cr
              </span>
              <Bars
                x={30}
                y={8}
                w={13}
                h={16}
                values={[30, 48, 70, 96]}
                highlight={[3]}
                at={1700}
                step={110}
                gap={1}
              />
            </>
          ) : null}
        </Card>
      ))}
      <Pill x={58} y={8} m="pop" at={2600} icon={<BadgeCheck />}>
        Every figure checked
      </Pill>
      <Pill x={58} y={16} m="pop" at={2900} icon={<FileText />}>
        One idea per slide
      </Pill>
      <Card x={58} y={26} w={30} h={17} m="rise" at={3600} className="ms-doc" tone="ok">
        <span className="ms-t ms-xs ms-c-ink-3">Reads in</span>
        <span className="ms-t ms-l ms-b">
          <Count to={4} at={3800} dur={900} /> minutes
        </span>
      </Card>
      <Stamp x={60} y={49} tone="ok" m="stamp" at={5000}>
        Investor-ready
      </Stamp>
    </Stage>
  );
}

export function MarketingScene() {
  return (
    <Stage
      hue="design"
      cycle={10000}
      label="Packaging, a print catalogue and a set of social posts all carry the same mark, colour and type, so the brand looks the same wherever it appears."
    >
      {/* Packaging — a box in three dimensions */}
      <At x={6} y={10} w={26} h={36} className="ms-box-wrap" m="rise" at={200}>
        <span className="ms-box-shadow" />
        <div className="ms-box">
          <span className="ms-box-f ms-box-front">
            <span className="ms-box-band" />
            <span className="ms-t ms-s ms-b">yourbrand</span>
          </span>
          <span className="ms-box-f ms-box-side" />
          <span className="ms-box-f ms-box-top" />
        </div>
      </At>
      <Label x={19} y={51} size="xs" tone="ink-3" center m="fade" at={600}>
        Packaging
      </Label>

      {/* Catalogue */}
      <Doc x={38} y={9} w={24} h={36} tone="raised" m="rise" at={1200} className="ms-catalogue">
        <At x={0} y={0} w={24} h={14} className="ms-hero-img" />
        <span style={{ height: '13cqi' }} />
        <span className="ms-t ms-s ms-b">Catalogue ’26</span>
        <Lines widths={[90, 72]} />
      </Doc>
      <Label x={50} y={51} size="xs" tone="ink-3" center m="fade" at={1500}>
        Print
      </Label>

      {/* Social posts */}
      {[0, 1, 2, 3].map((i) => (
        <At
          key={i}
          x={68 + (i % 2) * 14}
          y={9 + Math.floor(i / 2) * 18}
          w={12.6}
          h={16}
          className={`ms-post ms-post-${i}`}
          m="pop"
          at={2200 + i * 180}
        >
          <span className="ms-post-mark" />
        </At>
      ))}
      <Label x={81} y={51} size="xs" tone="ink-3" center m="fade" at={2500}>
        Social
      </Label>

      <Pill x={34} y={55.3} tone="hue" m="pop" at={3800}>
        One mark · one palette · one voice
      </Pill>
    </Stage>
  );
}
