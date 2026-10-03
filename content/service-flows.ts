/**
 * What a client hands over, what the practice does with it, and what comes
 * back — for every service.
 *
 * This is the sentence a prospective client is actually trying to work out
 * when they read a services page, so it is said plainly and in the same three
 * beats every time. The animated scene above each service acts out the same
 * three beats; the words are here so the meaning never depends on the motion.
 *
 * Also read by the site assistant, so keep every line factual: what is done,
 * not how good it is.
 */

export type ServiceFlow = {
  /** What the client provides. */
  give: string;
  /** What the practice does with it. */
  work: string;
  /** What the client receives at the end. */
  get: string;
};

export const SERVICE_FLOWS: Record<string, ServiceFlow> = {
  /* Tax Architecture & GST */
  'income-tax-filing': {
    give: 'Form 16, AIS, and your bank, broker and rental statements',
    work: 'Every figure reconciled with Form 26AS and AIS, and the old and new regimes compared in writing',
    get: 'A filed, e-verified return with its acknowledgement, and the refund tracked until it lands',
  },
  'master-gst': {
    give: 'Sales and purchase invoices each month, or read access to your billing software',
    work: 'GSTR-1 and 3B filed on time, with every purchase matched to GSTR-2B before credit is claimed',
    get: 'Returns filed before the due date, input credit protected, and a monthly note of what is payable',
  },
  'export-import': {
    give: 'PAN, bank details and your export invoices',
    work: 'IEC obtained, the LUT renewed every year and foreign-exchange realisation documented',
    get: 'Exports billed at zero GST, nothing blocked at the border, and refunds claimed when due',
  },

  /* Scrutiny Defence & Appeals */
  'sec-143-142': {
    give: 'The notice or intimation, exactly as it arrived',
    work: 'Each flagged figure traced to its source, reconciled, and answered in writing inside the window',
    get: 'A reply on record before the deadline and, where the figure was wrong, a corrected demand',
  },
  'sec-148': {
    give: 'The notice, the returns for the years in question and the supporting records',
    work: 'The reopening tested on procedure and precedent, and represented at every faceless hearing',
    get: 'A defence built on the record, and an assessment that holds if the matter goes further',
  },
  'demand-penalty': {
    give: 'The demand or penalty order, and the assessment behind it',
    work: 'Stay of recovery applied for, immunity sought under section 270AA, interest waiver argued',
    get: 'Recovery paused while the case is heard, and the penalty contested or waived',
  },
  appeals: {
    give: 'The order you disagree with, inside the appeal window',
    work: 'Form 35, grounds of appeal and the paper book drafted, and the case presented to the CIT(A)',
    get: 'An appeal argued on its merits, and refunds pursued until they are released',
  },

  /* Structuring & Incorporation */
  'company-incorporation': {
    give: 'Proposed names, director KYC and proof of the registered office',
    work: 'Digital signatures, DIN and name approval arranged, then SPICe+ or FiLLiP filed with the MCA',
    get: 'Certificate of incorporation, PAN and TAN, and an entity the bank will open an account for',
  },
  proprietorship: {
    give: 'PAN, Aadhaar and proof of your business address',
    work: 'Udyam, trade licence, shop and establishment and GST registered, and the bank dossier prepared',
    get: 'A business that can invoice and be paid, usually within a week',
  },
  partnership: {
    give: 'Partner details, capital contributions and the profit share you have agreed',
    work: 'The deed drafted, stamped and signed, and filed with the Registrar of Firms',
    get: 'A registered firm with its PAN, and a deed that settles questions before they arise',
  },
  'project-reports': {
    give: 'Your plan, the costs, and recent accounts if the business is running',
    work: 'Five-year projections, CMA data and ratios built, with the narrative a credit officer reads first',
    get: 'A bank-ready project report that answers the lender’s questions before they are asked',
  },

  /* Books & Audit Readiness */
  bookkeeping: {
    give: 'Bills, bank statements and sales records — forwarded, photographed or synced',
    work: 'Every entry posted and matched to its voucher, with bank and ledger reconciled each month',
    get: 'Books closed every month, and a profit and loss you can make decisions from',
  },
  'internal-audit': {
    give: 'Access to the books, the processes and the people who run them',
    work: 'Entries sampled by risk, controls tested and every exception traced to its cause',
    get: 'Written findings with the fix for each, settled before the accounts go anywhere else',
  },
  'accounting-systems': {
    give: 'Your current books, in whatever software and whatever state they are in',
    work: 'The chart of accounts mapped, history migrated and every balance tied back',
    get: 'Zoho Books, Tally Prime or QuickBooks set up properly, with bank feeds filling themselves in',
  },
  'payroll-hrms': {
    give: 'Headcount, salary structures and attendance each month',
    work: 'Pay computed, PF, ESI, professional tax and TDS deducted, and every return filed',
    get: 'Salaries on time, payslips out without chasing, and Form 16 issued every year',
  },

  /* Digital Infrastructure */
  'web-design': {
    give: 'Your business, your audience and what the site has to make people do',
    work: 'Designed, written and built in-house — fast, accessible and set up to be found',
    get: 'A live site that loads quickly on any phone and turns visitors into enquiries',
  },
  'web-apps': {
    give: 'The spreadsheet, process or workaround your team is living with',
    work: 'A secure portal designed around how your team actually works, with roles and a full record',
    get: 'One place to sign in, where everyone sees exactly what they should',
  },
  'financial-saas': {
    give: 'How you bill, collect and reconcile today',
    work: 'GST-correct invoices, payment links and recurring billing built into your product',
    get: 'Customers pay by card or UPI in a tap, and every payment posts itself to the books',
  },
  automation: {
    give: 'The tasks your team repeats every day',
    work: 'Your tools connected, with software reading invoices and statements and checking them for you',
    get: 'Hours back every week, with a person still approving anything that matters',
  },

  /* Brand & Visual Design */
  'brand-identity': {
    give: 'What you stand for, who you serve and who you compete with',
    work: 'The mark, typefaces and palette designed together, and the rules for using them written down',
    get: 'A complete identity and guidelines your team can apply without us',
  },
  'pitch-collateral': {
    give: 'Your numbers, your story and who is going to read it',
    work: 'The argument structured, every slide designed and every figure checked',
    get: 'A deck or proposal a decision-maker can follow in minutes',
  },
  'marketing-systems': {
    give: 'Your products, your channels and the campaign calendar',
    work: 'Packaging, print and social templates designed as one system',
    get: 'Material that looks like the same brand wherever it appears',
  },
};
