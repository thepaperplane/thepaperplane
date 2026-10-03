/**
 * Knowledge Corner — client education.
 *
 * Operating philosophy: an informed client is a better client. Every block
 * here exists to answer one unasked question — "what am I actually paying
 * for?" — with specifics rather than reassurance.
 */

/* -------------------------------------------------------------------------
   1. SERVICE ANATOMY — what actually happens inside an engagement

   Deliberately NO durations anywhere in this section.

   An earlier version quantified each service in hours ("~15 min you see,
   4-9 hrs behind it"). That was a liability dressed up as transparency. A
   published number reads as a commitment: the one engagement that runs long
   becomes an argument instead of a conversation, and a client whose volumes
   have grown since onboarding will hold the old figure against us. It also
   prices the work by the hour, which is precisely how this work should not
   be valued.

   Depth is conveyed instead through things we fully control and can always
   stand behind: what the client hands over, the scope we examine, how many
   independent review passes a file gets, and the gates it must clear. What
   actually moves a timeline is stated separately and honestly, so
   variability is understood up front rather than discovered later.
   ------------------------------------------------------------------------- */

export type AnatomyStep = {
  label: string;
  detail: string;
  /** Share of the total work this stage represents — a proportion, never a duration. */
  share: number;
  /** What goes wrong when this stage is skipped or rushed. */
  risk: string;
  /** Which purpose-drawn diagram illustrates this stage. */
  diagram: DiagramKey;
};

/** Keys of the scene set in components/knowledge/scenes.tsx. */
export type DiagramKey =
  | 'normalise'
  | 'match'
  | 'chase'
  | 'offset'
  | 'archive'
  | 'inspect'
  | 'assemble'
  | 'compare'
  | 'structure';

export type ServiceAnatomy = {
  id: string;
  service: string;
  pillarId: string;
  /** The thing clients think they are buying. */
  perception: string;
  /** What the work actually consists of. */
  reality: string;
  /** What the client provides — sets expectations about their side of it. */
  clientInput: string;
  /** The breadth of what we examine. Scope, never time. */
  workScope: string;
  /** Independent review passes before anything leaves the practice. */
  reviewLayers: number;
  /** Gates every file must clear. */
  checkpoints: string[];
  /** The exposure we absorb so the client does not. */
  carriedRisk: string;
  /** Why two engagements of the same type run to different lengths. */
  timelineDrivers: string[];
  steps: AnatomyStep[];
};

export const SERVICE_ANATOMY: ServiceAnatomy[] = [
  {
    id: 'gst-monthly',
    service: 'Monthly GST filing',
    pillarId: 'tax',
    perception: '“You upload my sales figures to a portal once a month.”',
    reality:
      'Filing is the last step and the smallest one. The work is reconciling what your vendors reported against what you recorded — because the credit you claim is only as good as their compliance, not yours.',
    clientInput: 'Your purchase and sales registers, in whatever format you already keep them.',
    workScope:
      'Every purchase invoice matched three ways — your register, the portal’s auto-drafted statement, and the credit actually claimed — with each difference itemised rather than absorbed.',
    reviewLayers: 3,
    checkpoints: [
      'GSTIN and place of supply validated on every line',
      'Mismatches itemised and assigned an owner',
      'Set-off order confirmed before any cash moves',
      'Working papers archived alongside the acknowledgement',
    ],
    carriedRisk:
      'An unreconciled input credit claim is recoverable from you with 18% interest — years later, when the vendor’s default surfaces in a departmental audit.',
    timelineDrivers: [
      'The number of invoices in the period',
      'Whether your suppliers have filed on time',
      'How clean the purchase register is when it reaches us',
      'Whether earlier months need correcting first',
    ],
    steps: [
      {
        label: 'Purchase register normalisation',
        detail:
          'Your books, in your format, mapped to GST fields. GSTINs validated, place of supply corrected, reverse-charge entries separated.',
        share: 20,
        risk: 'Wrong place of supply turns a valid credit into an ineligible one.',
        diagram: 'normalise',
      },
      {
        label: 'GSTR-2B three-way match',
        detail:
          'Every purchase invoice matched against the auto-drafted statement and your ledger. Mismatches are listed, not absorbed.',
        share: 35,
        risk: 'Silently claiming unmatched credit is the single most common cause of GST demand notices.',
        diagram: 'match',
      },
      {
        label: 'Vendor default chase',
        detail:
          'Suppliers who have not uploaded invoices are identified and pursued so you can withhold payment until they do.',
        share: 20,
        risk: 'Unchased defaults become permanently lost credit once the claim window closes.',
        diagram: 'chase',
      },
      {
        label: 'Liability computation and set-off',
        detail:
          'Output liability computed, credit set off in the statutory order, net cash position confirmed before payment.',
        share: 15,
        risk: 'Incorrect set-off order overstates cash payable or triggers interest.',
        diagram: 'offset',
      },
      {
        label: 'Filing and archival',
        detail:
          'GSTR-1 and 3B filed, acknowledgements archived with the working papers that produced them.',
        share: 10,
        risk: 'Filings without retained workings cannot be defended three years later.',
        diagram: 'archive',
      },
    ],
  },
  {
    id: 'itr-filing',
    service: 'Income tax return filing',
    pillarId: 'tax',
    perception: '“You copy numbers from my Form 16 into a return.”',
    reality:
      'The department already holds a parallel record of your year — AIS, TIS and Form 26AS. The job is reconciling your position against theirs before you sign, because every unexplained gap is an automated notice waiting to be issued.',
    clientInput:
      'Form 16, bank and broker statements, and anything else that produced income during the year.',
    workScope:
      'Every entry the department already holds about you, traced back to your own records or formally explained — alongside both tax regimes computed in parallel.',
    reviewLayers: 3,
    checkpoints: [
      'Department’s own data reconciled line by line',
      'Head-wise classification confirmed',
      'Both regimes computed and the difference shown in writing',
      'Verification completed inside the statutory window',
    ],
    carriedRisk:
      'A return that contradicts the department’s own data is selected for scrutiny by software, not by chance.',
    timelineDrivers: [
      'How many income sources and capital gains transactions there are',
      'Whether the department’s records agree with yours',
      'How quickly missing documents and confirmations arrive',
      'Whether an earlier year needs revising first',
    ],
    steps: [
      {
        label: 'AIS, TIS and 26AS reconciliation',
        detail:
          'Every reported interest payment, dividend, securities transaction and high-value entry traced to your records — or formally explained.',
        share: 30,
        risk: 'Unreconciled entries are the most common trigger for a section 143(1) adjustment.',
        diagram: 'match',
      },
      {
        label: 'Head-wise classification',
        detail:
          'Income correctly assigned across salary, house property, business, capital gains and other sources.',
        share: 15,
        risk: 'Misclassification changes the rate, the set-off rights and the carry-forward position.',
        diagram: 'normalise',
      },
      {
        label: 'Capital gains computation',
        detail:
          'Holding periods, indexation where available, grandfathering, and loss set-off ordering applied transaction by transaction.',
        share: 25,
        risk: 'Errors here are large, obvious to the department, and expensive to unwind.',
        diagram: 'offset',
      },
      {
        label: 'Regime comparison',
        detail:
          'Old and new regime computed in parallel, with the difference put in front of you before the election is made.',
        share: 15,
        risk: 'The election is binding for the year — and for businesses, for longer.',
        diagram: 'compare',
      },
      {
        label: 'Filing and e-verification',
        detail: 'Return filed, verification completed inside the window, acknowledgement archived.',
        share: 15,
        risk: 'An unverified return is legally treated as never filed.',
        diagram: 'archive',
      },
    ],
  },
  {
    id: 'scrutiny-defence',
    service: 'Scrutiny notice defence',
    pillarId: 'scrutiny',
    perception: '“You write a letter back to the department.”',
    reality:
      'You are building an evidentiary record that a judge may read years from now. The reply filed at the first stage constrains every argument available at every stage after it.',
    clientInput: 'The notice itself, and the records behind the year it questions.',
    workScope:
      'The procedural validity of the notice, the complete evidentiary record behind the year in question, and the binding case law on every point in issue.',
    reviewLayers: 4,
    checkpoints: [
      'Jurisdiction, limitation and sanction tested before the merits',
      'Paper book indexed and cross-referenced to the submission',
      'Binding precedent identified for each ground',
      'Submission reviewed as it will read on appeal, not just today',
    ],
    carriedRisk:
      'A weak first reply cannot be withdrawn. Appellate authorities read it as your considered position.',
    timelineDrivers: [
      'The deadline stated on the notice — that governs everything else',
      'How many assessment years and issues are in scope',
      'Whether the department has actually furnished the material it relies on',
      'How complete and retrievable the underlying records are',
    ],
    steps: [
      {
        label: 'Notice validity audit',
        detail:
          'Jurisdiction, limitation period, sanctioning authority and service of notice tested before the merits are touched at all.',
        share: 20,
        risk: 'A procedurally void notice can end proceedings outright — but only if challenged in time.',
        diagram: 'inspect',
      },
      {
        label: 'Evidence assembly',
        detail:
          'Bank trails, contracts, invoices and confirmations collected and indexed into a paper book.',
        share: 30,
        risk: 'Evidence produced late is frequently refused at the appellate stage.',
        diagram: 'assemble',
      },
      {
        label: 'Legal research',
        detail:
          'Binding precedent identified from jurisdictional High Court and Tribunal decisions on the specific point.',
        share: 20,
        risk: 'An argument without authority is an opinion the officer is free to disregard.',
        diagram: 'inspect',
      },
      {
        label: 'Written submission drafting',
        detail:
          'Facts, law and relief drafted as a self-contained document that still reads correctly to a stranger in three years.',
        share: 20,
        risk: 'Submissions that assume context the reader lacks fail on appeal.',
        diagram: 'assemble',
      },
      {
        label: 'Hearing representation',
        detail:
          'Appearance through the faceless portal or in person, with responses to further queries inside their deadlines.',
        share: 10,
        risk: 'A missed hearing is decided ex parte, on the department’s version alone.',
        diagram: 'archive',
      },
    ],
  },
  {
    id: 'incorporation',
    service: 'Company incorporation',
    pillarId: 'incorporation',
    perception: '“You fill in one government form.”',
    reality:
      'SPICe+ collapses ten registrations into a single submission — which means one rejected field rejects everything. Getting the structure right before filing costs far less than restructuring after.',
    clientInput:
      'Identity and address documents for each director, and a clear picture of what the business intends to do.',
    workScope:
      'Entity structure, shareholding, authorised capital and object clauses, plus ten separate registrations that must all agree with one another.',
    reviewLayers: 3,
    checkpoints: [
      'Structure agreed against your actual plans, not a template',
      'Name tested against existing companies and trademark classes',
      'Constitutional documents drafted to your objects',
      'Registers, certificates and a twelve-month calendar handed over',
    ],
    carriedRisk:
      'Share structure, object clauses and director particulars are slow and expensive to amend once registered.',
    timelineDrivers: [
      'MCA processing queues, which no adviser controls',
      'Whether the proposed names clear on the first attempt',
      'How quickly digital signatures and director documents are ready',
      'Whether the structure needs advisory work before anything is filed',
    ],
    steps: [
      {
        label: 'Structure advisory',
        detail:
          'Entity type, shareholding split, authorised capital and founder vesting decided against your actual plans.',
        share: 25,
        risk: 'The wrong structure becomes a restructuring cost, plus tax, later.',
        diagram: 'structure',
      },
      {
        label: 'Name reservation',
        detail:
          'Options tested against existing companies, trademark classes and naming rules before submission.',
        share: 15,
        risk: 'Rejections cost fees and days, and can repeat indefinitely.',
        diagram: 'inspect',
      },
      {
        label: 'Constitutional drafting',
        detail:
          'Memorandum and articles drafted around your object clauses rather than pasted from a template.',
        share: 25,
        risk: 'Narrow object clauses block activities you have not thought of yet.',
        diagram: 'assemble',
      },
      {
        label: 'Integrated filing',
        detail:
          'DIN, DSC, PAN, TAN, EPFO, ESIC, professional tax and bank account submitted as a single application.',
        share: 20,
        risk: 'One inconsistent field rejects the entire bundle.',
        diagram: 'structure',
      },
      {
        label: 'Post-incorporation handover',
        detail:
          'Certificate, statutory registers, share certificates and a twelve-month compliance calendar handed over.',
        share: 15,
        risk: 'First-year compliance is missed most often by companies that were never told it had begun.',
        diagram: 'archive',
      },
    ],
  },
];

/**
 * Shown wherever service anatomy appears. States plainly that timelines are
 * agreed per engagement, so nothing on this site can be read as a commitment
 * for work whose scope we have not yet seen.
 */
export const TIMELINE_POSITION = {
  heading: 'Why we do not publish turnaround times',
  body: 'Two clients buying the same service rarely need the same work. Volumes grow, records arrive in different states, and a notice sets its own deadline. Publishing an average would be easy, and occasionally wrong — and the engagement it is wrong about is the one that matters. We agree a timeline with you in writing once we have seen the actual scope, and we tell you the moment anything changes it.',
  note: 'Statutory deadlines shown elsewhere on this site are set by the department, not by us. Those are fixed, and they are the dates we work backwards from.',
};

/* -------------------------------------------------------------------------
   2. COST OF NON-COMPLIANCE
   ------------------------------------------------------------------------- */

export type PenaltyItem = {
  trigger: string;
  statute: string;
  exposure: string;
  compounding: string;
  category: string;
};

export const PENALTY_EXPOSURE: PenaltyItem[] = [
  {
    trigger: 'Late TDS deposit',
    statute: 'Income Tax Act — s.201(1A)',
    exposure: '1.5% per month',
    compounding: 'Part months count as full months, from deduction to payment.',
    category: 'Income Tax',
  },
  {
    trigger: 'Late ITR — non-audit',
    statute: 'Income Tax Act — s.234F, s.234A',
    exposure: '₹1,000 – ₹5,000 + 1% per month',
    compounding: 'Losses of the year can no longer be carried forward.',
    category: 'Income Tax',
  },
  {
    trigger: 'Tax audit not filed',
    statute: 'Income Tax Act — s.271B',
    exposure: '0.5% of turnover, capped at ₹1,50,000',
    compounding: 'Applies per assessment year, independent of tax payable.',
    category: 'Audit',
  },
  {
    trigger: 'Under-reporting of income',
    statute: 'Income Tax Act — s.270A',
    exposure: '50% of tax — 200% if misreported',
    compounding: 'Immunity under s.270AA is lost if the window is missed.',
    category: 'Income Tax',
  },
  {
    trigger: 'Late GSTR-3B',
    statute: 'CGST Act — s.47, s.50',
    exposure: '₹50/day + 18% p.a. interest',
    compounding: 'Interest runs on gross liability where returns stay unfiled.',
    category: 'GST',
  },
  {
    trigger: 'Ineligible input credit claimed',
    statute: 'CGST Act — s.16, s.73/74',
    exposure: 'Credit reversal + interest + up to 100% penalty',
    compounding: 'Recoverable from you even when the supplier caused the default.',
    category: 'GST',
  },
  {
    trigger: 'Late PF / ESI payment',
    statute: 's.36(1)(va), Income Tax Act',
    exposure: 'Permanent disallowance of the expense',
    compounding: 'Deduction is lost outright — later payment does not restore it.',
    category: 'Payroll',
  },
  {
    trigger: 'Late MCA annual filing',
    statute: 'Companies Act — s.92, s.137',
    exposure: '₹100 per day, per form',
    compounding: 'No upper cap, and officers are personally liable.',
    category: 'MCA',
  },
];

/* -------------------------------------------------------------------------
   3. JARGON, DECODED
   ------------------------------------------------------------------------- */

export type DecoderEntry = {
  key: string;
  title: string;
  act: string;
  plainEnglish: string;
  whatToDo: string;
  clock: string;
  severity: 'routine' | 'attention' | 'urgent';
};

export const DECODER: DecoderEntry[] = [
  {
    key: '143(1)',
    title: 'Section 143(1) — intimation',
    act: 'Income Tax Act, 1961',
    plainEnglish:
      'An automated statement comparing your return with the department’s records. It is not an accusation — but it is a demand if the numbers differ.',
    whatToDo:
      'Reconcile the difference. File a rectification under s.154 if the department is wrong; pay if it is right.',
    clock: 'Usually issued within 30 days of verification.',
    severity: 'routine',
  },
  {
    key: '142(1)',
    title: 'Section 142(1) — inquiry notice',
    act: 'Income Tax Act, 1961',
    plainEnglish: 'The officer is asking for documents or explanations before deciding anything.',
    whatToDo:
      'Produce exactly what is asked, in the format asked, inside the deadline. Volunteering more is rarely wise.',
    clock: 'Typically 15 days from receipt.',
    severity: 'attention',
  },
  {
    key: '143(2)',
    title: 'Section 143(2) — scrutiny selection',
    act: 'Income Tax Act, 1961',
    plainEnglish:
      'Your return has been selected for detailed examination. This is a formal proceeding with a defined record.',
    whatToDo:
      'Assemble a paper book and written submissions. Treat every filing as evidence for a future appeal.',
    clock: 'Served within 3 months of the end of the financial year in which the return was filed.',
    severity: 'urgent',
  },
  {
    key: '148',
    title: 'Sections 148 & 148A — reassessment',
    act: 'Income Tax Act, 1961',
    plainEnglish:
      'The department believes income escaped assessment in an earlier year and wants to reopen it.',
    whatToDo:
      'Reply to the 148A show-cause first. Test limitation, sanction and the sufficiency of the material before arguing merits.',
    clock: '7 to 30 days, as stated in the show-cause notice.',
    severity: 'urgent',
  },
  {
    key: '270A',
    title: 'Section 270A — under-reporting penalty',
    act: 'Income Tax Act, 1961',
    plainEnglish:
      'A penalty on top of the tax — half the tax for under-reporting, twice it for misreporting.',
    whatToDo:
      'Consider immunity under s.270AA, which requires paying tax and interest and not appealing.',
    clock: 'Immunity petition within 1 month of the assessment order.',
    severity: 'urgent',
  },
  {
    key: '44AB',
    title: 'Section 44AB — tax audit',
    act: 'Income Tax Act, 1961',
    plainEnglish:
      'Above a turnover threshold, a practising chartered accountant must audit and certify your accounts. That certification is theirs to give, not ours.',
    whatToDo:
      'Close the books early and have them verified, so the audit is an examination rather than a reconstruction. The report is due before the return, not with it.',
    clock: 'Report by 30 September; return by 31 October.',
    severity: 'attention',
  },
  {
    key: 'GSTR-2B',
    title: 'GSTR-2B — auto-drafted credit statement',
    act: 'CGST Act, 2017',
    plainEnglish:
      'A monthly, frozen statement of the credit you are actually entitled to — based on what your suppliers filed.',
    whatToDo:
      'Match it against your purchase register before claiming. Withhold payment from suppliers who have not filed.',
    clock: 'Generated on the 14th of each month.',
    severity: 'routine',
  },
  {
    key: 'GSTR-3B',
    title: 'GSTR-3B — summary return',
    act: 'CGST Act, 2017',
    plainEnglish:
      'Your monthly self-assessment: what you owe, what credit you are setting off, and what you pay in cash.',
    whatToDo: 'Reconcile 2B first. Interest under s.50 runs from the due date, not from filing.',
    clock: 'Due on the 20th of each month.',
    severity: 'routine',
  },
];

/* -------------------------------------------------------------------------
   4. MYTH VS REALITY
   ------------------------------------------------------------------------- */

/** `question` is the natural-language form used for FAQ structured data.
    Turning a myth into a question mechanically produces "A refund means the
    department has accepted my return?", which reads as a statement with a
    question mark and is not what anybody types or asks aloud. */
export const MYTHS: { myth: string; question: string; reality: string }[] = [
  {
    myth: 'A refund means the department has accepted my return.',
    question: 'Does receiving an income tax refund mean my return has been accepted?',
    reality:
      'A refund is an automated processing outcome. Your return can still be selected for scrutiny afterwards, and reassessment can reopen the year later still.',
  },
  {
    myth: 'My supplier failed to file, so their penalty is their problem.',
    question: 'What happens to my input tax credit if my supplier does not file their GST return?',
    reality:
      'Input credit is recovered from the person who claimed it. You carry the cost of your supplier’s default, plus interest.',
  },
  {
    myth: 'Filing a nil return is optional if I had no business.',
    question: 'Do I have to file a return if my business had no activity this period?',
    reality:
      'Nil returns are still due. Late fees accrue on nil filings, and a break in filing history complicates every subsequent registration.',
  },
  {
    myth: 'Cheaper filing is the same service at a lower price.',
    question: 'Is a cheaper tax filing service the same work for less money?',
    reality:
      'Filing is a commodity; reconciliation and defensibility are not. The difference in price is usually the reconciliation that was never done.',
  },
  {
    myth: 'I can fix an aggressive position later if it is questioned.',
    question: 'Can I correct an aggressive tax position later if it gets questioned?',
    reality:
      'Positions taken in a filed return constrain every argument available afterwards. Revision windows are short and visible to the department.',
  },
];

/* -------------------------------------------------------------------------
   5. LONG-FORM ARTICLES
   ------------------------------------------------------------------------- */

export type Article = {
  slug: string;
  title: string;
  summary: string;
  category: 'Income Tax' | 'GST' | 'Corporate Law' | 'Digital';
  readingTime: string;
  author: string;
  authorRole: string;
  date: string;
  tags: string[];
  reference?: string;
  body: { heading?: string; paragraphs: string[] }[];
};

export const ARTICLES: Article[] = [
  {
    slug: 'section-148-reassessment',
    title: 'Reassessment notices under sections 148 and 148A: what actually decides the outcome',
    summary:
      'Show-cause procedure, the “reason to believe” threshold, monetary limits, and the procedural defects that end proceedings before the merits are ever reached.',
    category: 'Income Tax',
    readingTime: '6 min read',
    author: 'Tax Litigation Desk',
    authorRole: 'The Paper Plane',
    date: '2026-07-15',
    tags: ['Income Tax', 'Section 148', 'Reassessment', 'Faceless assessment'],
    reference: 'Income Tax Act, 1961 — ss.147, 148, 148A, 149, 151',
    body: [
      {
        paragraphs: [
          'Reassessment notices have become substantially more common as the department has matched third-party data through the Annual Information Statement against filed returns. Most taxpayers respond to the merits immediately. That is usually a mistake — the procedural questions are both easier to win and dispositive.',
        ],
      },
      {
        heading: 'The show-cause stage is the stage that matters',
        paragraphs: [
          'Before issuing a notice under section 148, the assessing officer must conduct an inquiry under 148A(a) and give an opportunity of being heard under 148A(b), supplying the material relied on. This is not a formality. It is the only stage at which the proceeding can be stopped without an assessment order existing.',
          'Your reply at this stage should test four things before it addresses the income at all: whether the material was actually furnished to you, whether the limitation period under section 149 has expired, whether the monetary threshold is met for the year in question, and whether sanction under section 151 came from the authority the statute designates.',
        ],
      },
      {
        heading: 'Where these notices fail',
        paragraphs: [
          'Non-furnishing of the underlying material is the most frequent defect — the notice recites a conclusion without enclosing what produced it, leaving you unable to meaningfully respond.',
          'Limitation and threshold are the next most common. For years beyond the shorter window, the escaped income must cross the statutory monetary limit, and that limit must be demonstrable from the material rather than asserted.',
          'Sanction from a non-designated authority is rarer but fatal where it occurs, because the defect is jurisdictional rather than procedural.',
        ],
      },
      {
        heading: 'What we do with it',
        paragraphs: [
          'We draft show-cause replies that put the procedural challenge first and the merits second, citing jurisdictional High Court authority on each point. Where the defect is clear, proceedings are frequently dropped before an assessment order is ever passed — which is both cheaper and faster than winning the same point on appeal two years later.',
        ],
      },
    ],
  },
  {
    slug: 'gstr-2b-input-credit',
    title: 'GSTR-2B reconciliation: why your input credit depends on someone else’s discipline',
    summary:
      'Section 16(2)(aa) made your credit contingent on supplier filing. Here is how credit leaks, and the three-way match that stops it.',
    category: 'GST',
    readingTime: '5 min read',
    author: 'GST Practice',
    authorRole: 'The Paper Plane',
    date: '2026-07-10',
    tags: ['GST', 'GSTR-2B', 'Input tax credit', 'Reconciliation'],
    reference: 'CGST Act, 2017 — s.16(2)(aa), s.41, s.50',
    body: [
      {
        paragraphs: [
          'Input tax credit is working capital. Under section 16(2)(aa), you cannot claim it unless your supplier has uploaded the invoice and it appears in your auto-drafted GSTR-2B. Your own diligence is necessary but no longer sufficient.',
        ],
      },
      {
        heading: 'The four ways credit leaks',
        paragraphs: [
          'Suppliers on quarterly filing schedules upload late, so credit that is legitimately yours arrives a quarter after you paid for it.',
          'Place of supply or GSTIN mismatches convert a valid invoice into one the system cannot match to you.',
          'Vendors tag business-to-business invoices as business-to-consumer, in which case the invoice never reaches your statement at all.',
          'And invoices are simply missed — by them, or by you, in a purchase register that was never reconciled line by line.',
        ],
      },
      {
        heading: 'The three-way match',
        paragraphs: [
          'The discipline that prevents all four is a monthly three-way match: purchase register against GSTR-2B against the credit actually claimed in GSTR-3B. Every difference is itemised and assigned an owner rather than absorbed into a rounding line.',
          'The commercial control that makes it enforceable is withholding the tax component of a supplier payment until their invoice appears in your statement. Written into purchase terms, this converts a compliance problem into a payment-terms problem — which vendors respond to far more reliably.',
        ],
      },
    ],
  },
  {
    slug: 'spice-plus-incorporation',
    title: 'SPICe+ in practice: what founders get wrong before they ever file',
    summary:
      'The integrated incorporation form collapses ten registrations into one submission — which means the decisions you make before filing are the ones that are expensive to reverse.',
    category: 'Corporate Law',
    readingTime: '4 min read',
    author: 'Corporate Advisory',
    authorRole: 'The Paper Plane',
    date: '2026-07-02',
    tags: ['Corporate Law', 'MCA', 'Incorporation', 'Startups'],
    reference: 'Companies Act, 2013 · MCA SPICe+ (INC-32, INC-33, INC-34)',
    body: [
      {
        paragraphs: [
          'SPICe+ combines name reservation, incorporation, DIN allotment, PAN, TAN, EPFO, ESIC, professional tax and bank account opening into a single integrated submission. It is genuinely efficient. It is also unforgiving: one inconsistent field rejects the whole bundle.',
        ],
      },
      {
        heading: 'Decisions that are cheap now and expensive later',
        paragraphs: [
          'Authorised capital determines your filing fee today and your headroom for future allotments. Setting it at the minimum to save a small fee frequently costs an amendment within eighteen months.',
          'Object clauses define what the company may lawfully do. Drafted narrowly from a template, they block the second product line before it exists.',
          'Shareholding split and vesting are the hardest to unwind. Equity moved after incorporation has tax consequences that equity structured correctly at incorporation does not.',
        ],
      },
      {
        heading: 'What arrives at the end',
        paragraphs: [
          'A complete handover is the certificate of incorporation, the statutory registers, share certificates, and a twelve-month compliance calendar — because first-year compliance is missed most often by founders who were never told it had begun.',
        ],
      },
    ],
  },
  {
    slug: 'compliance-infrastructure',
    title: 'Why your compliance runs on software, whether or not anyone designed it',
    summary:
      'Spreadsheets are infrastructure. The question is only whether they were built deliberately, and whether anyone can audit them.',
    category: 'Digital',
    readingTime: '5 min read',
    author: 'Digital Infrastructure',
    authorRole: 'The Paper Plane',
    date: '2026-06-25',
    tags: ['Digital', 'Automation', 'Financial systems'],
    body: [
      {
        paragraphs: [
          'Every business already runs its compliance on software. Usually it is a spreadsheet that one person understands, emailed monthly, with the reconciliation logic living in that person’s head. That is infrastructure — undocumented, unversioned, and unauditable, but infrastructure nonetheless.',
        ],
      },
      {
        heading: 'What changes when it is built deliberately',
        paragraphs: [
          'Reconciliation stops being a monthly act of memory and becomes a rule that runs the same way every time. Exceptions surface as a list rather than as a surprise during audit.',
          'The working papers that justify a filing are captured automatically alongside it, which is what makes a position defensible three years later when the notice arrives.',
          'And the data stops being re-keyed between systems, which removes the single largest source of error in the entire pipeline.',
        ],
      },
      {
        heading: 'Why this sits inside a tax practice',
        paragraphs: [
          'Most agencies can build the software but do not know what a defensible working paper looks like. Most accountants know exactly what it looks like but cannot build the system that produces it. We do both, which means the tool and the filing are designed against the same requirements.',
        ],
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
