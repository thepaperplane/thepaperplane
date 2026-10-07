import type { ChecklistGroup, ChecklistItem, ChecklistKind } from './types';

/**
 * What each service needs from the client, in the order we ask for it.
 *
 * Modelled on the practice's own GST-registration message: every item is one
 * specific thing, numbered, and marked as a document to send, a detail to tell
 * us, a photo, or a map location. Lists can differ by variant (for example GST
 * for a proprietorship and for a firm). Processing times are the practice's
 * usual experience, worded as "typically", and depend on the department —
 * review them against how long things really take before relying on them.
 */

const item =
  (kind: ChecklistKind) =>
  (t: string, note?: string): ChecklistItem => ({ t, kind, note });
const d = item('doc');
const i = item('info');
const p = item('photo');
const l = item('location');
const g = (title: string, ...items: ChecklistItem[]): ChecklistGroup => ({ title, items });

type Entry = {
  timeline: string;
  groups: ChecklistGroup[];
  byVariant?: Record<string, ChecklistGroup[]>;
};

const placeOfBusiness = (who: string) =>
  g(
    'Place of business',
    i(`${who} address`),
    d('Rental agreement (₹200 stamp paper) or NOC from the property owner'),
    d('Latest EB bill or property tax receipt'),
    p('Photo of the inside of the office'),
    p('Photo of the office with the name board'),
    l('Google Maps location of the office'),
    i('Office or business phone number'),
    i('Additional place of business, if any'),
  );

const person = (who: string) => [
  i(`${who} full name`),
  d(`${who} Aadhaar card`),
  d(`${who} PAN card`),
  p(`Passport-size photo of ${who.toLowerCase()}`),
  i(`${who} mobile number and email ID`),
];

export const CHECKLISTS: Record<string, Entry> = {
  partnership: {
    timeline:
      'Typically 7–15 working days from receiving everything, depending on the Registrar’s office.',
    groups: [
      g(
        'About every partner',
        i('Full name of every partner'),
        d('Aadhaar card of every partner'),
        d('PAN card of every partner'),
        p('Passport-size photo of every partner'),
        i('Mobile number and email ID of every partner'),
        i('Home address of every partner'),
      ),
      g(
        'About the firm',
        i('Two or three firm name options'),
        i('Nature of business and main products or services'),
        i('Date of commencement of business'),
        i('Capital each partner invests'),
        i('Profit-sharing ratio', 'For example 50:50, or by capital'),
        i('Who manages the firm and who signs on its behalf'),
      ),
      placeOfBusiness('Firm'),
    ],
  },

  deed: {
    timeline: 'Draft typically ready within 1–2 working days of receiving the details.',
    groups: [
      g(
        'About every partner',
        i('Full name and father’s name of every partner'),
        d('Aadhaar card of every partner'),
        d('PAN card of every partner'),
        i('Home address of every partner'),
      ),
      g(
        'About the firm',
        i('Firm name and address'),
        i('Nature of business'),
        i('Capital each partner invests'),
        i('Profit-sharing ratio'),
        i('Roles of each partner, and who operates the bank account'),
        i('Any salary or interest to partners, and the duration of the firm, if fixed'),
      ),
    ],
  },

  company: {
    timeline:
      'Typically 10–20 working days, depending on name approval and the Registrar’s queries.',
    groups: [
      g(
        'About every director or partner',
        i('Full name of every director or partner'),
        d('Aadhaar card'),
        d('PAN card'),
        p('Passport-size photo'),
        d('Address proof: a recent bank statement or utility bill'),
        i('Mobile number and email ID'),
      ),
      g(
        'About the company or LLP',
        i('Two or three preferred names'),
        i('Nature of business and main activities'),
        i('Capital, and each person’s share or contribution'),
        i('Who will be the directors and the authorised signatory'),
      ),
      g(
        'Registered office',
        i('Office address'),
        d('Rental agreement (₹200 stamp paper) or NOC from the property owner'),
        d('Latest EB bill or property tax receipt'),
        p('Photo of the office with the name board'),
      ),
      g(
        'For the GST registration (included)',
        i('Date of commencement of business'),
        i('Expected annual turnover'),
        p('Photo of the inside of the office'),
        l('Google Maps location of the office'),
        i('Office or business phone number'),
        i('Additional place of business details, if any'),
      ),
    ],
  },

  gstreg: {
    timeline:
      'GST registration is generally completed within 1–7 days, provided the department does not raise any further clarification or query.',
    groups: [
      g(
        'About the proprietor',
        i('Proprietor name'),
        d('Aadhaar card'),
        d('PAN card'),
        p('Passport-size photo'),
        i('Aadhaar-registered mobile number'),
        i('Email ID'),
      ),
      g(
        'About the business',
        i('Shop or business name'),
        i('Nature of business and main products or services'),
        i('Date of commencement of business'),
        i('Expected annual turnover'),
      ),
      g('Home address', i('House address'), l('Google Maps location of the house')),
      g(
        'Place of business',
        i('Shop or office address'),
        d('Rental agreement (₹200 stamp paper) or NOC from the property owner'),
        d('Latest EB bill or property tax receipt'),
        p('Photo of the inside of the office'),
        p('Photo of the office with the name board'),
        l('Google Maps location of the office'),
        i('Office or business phone number'),
        i('Additional place of business details, if any'),
      ),
    ],
    byVariant: {
      firm: [
        g(
          'About the authorised signatory',
          ...person('Signatory'),
          i('Designation in the firm or company'),
        ),
        g(
          'About the firm or company',
          i('Firm or company name'),
          d('Partnership deed, or incorporation certificate'),
          d('PAN card of the firm or company'),
          i('Nature of business and main products or services'),
          i('Date of commencement of business'),
          i('Expected annual turnover'),
        ),
        g(
          'About every partner or director',
          d('Aadhaar card of every partner or director'),
          d('PAN card of every partner or director'),
          p('Passport-size photo of every partner or director'),
          i('Home address of every partner or director'),
        ),
        placeOfBusiness('Firm or office'),
      ],
    },
  },

  msme: {
    timeline: 'Usually completed within 1–2 working days of receiving your details.',
    groups: [
      g(
        'About the owner',
        d('Aadhaar card of the owner or authorised person'),
        d('PAN card'),
        i('Aadhaar-linked mobile number'),
        i('Email ID'),
      ),
      g(
        'About the business',
        i('Business name, and whether it is a proprietorship, firm or company'),
        i('Business address'),
        i('What the business makes or does'),
        i('Date the business started'),
        i('Bank account number and IFSC'),
        i('GST number, if you have one'),
        i('Investment in machinery or equipment, and yearly sales'),
        i('Number of employees'),
      ),
    ],
  },

  pan: {
    timeline: 'An e-PAN is often issued within a few days of filing, subject to the department.',
    groups: [
      g(
        'About the applicant',
        i('Full name, and father’s name'),
        i('Date of birth'),
        d('Aadhaar card'),
        i('Aadhaar-linked mobile number'),
        i('Email ID'),
        p('Passport-size photo'),
        p('Signature on plain white paper'),
      ),
      g(
        'For a firm or company',
        d('Registration papers: deed or incorporation certificate'),
        d('ID proof of the person signing for it'),
      ),
    ],
  },

  fssai: {
    timeline:
      'Basic registration: typically 7–10 working days. State or Central licence: typically 15–30 working days, including any inspection. The department decides the timing.',
    groups: [
      g(
        'About the owner',
        i('Owner, partner or director name'),
        d('Aadhaar card'),
        p('Passport-size photo'),
        i('Mobile number and email ID'),
      ),
      g(
        'About the food business',
        i('Business name and address'),
        i('What you make, sell, store or serve'),
        i('List of the food products'),
        i('Expected yearly turnover'),
        d('Rental agreement or NOC from the property owner'),
        d('Latest EB bill'),
        p('Photo of the premises with the name board'),
      ),
    ],
    byVariant: {
      state: [
        g(
          'About the owner',
          i('Owner, partner or director name'),
          d('Aadhaar card'),
          p('Passport-size photo'),
          i('Mobile number and email ID'),
        ),
        g(
          'About the food business',
          i('Business name and address'),
          i('What you make, sell, store or serve'),
          i('List of the food products'),
          i('Expected yearly turnover'),
          d('Rental agreement or NOC from the property owner'),
          d('Latest EB bill'),
          p('Photo of the premises with the name board'),
        ),
        g(
          'For the licence',
          d('Layout plan of the premises'),
          d('Water test report'),
          d('List of machinery and equipment'),
          d('Partnership deed or company papers, if applicable'),
        ),
      ],
      central: [
        g(
          'About the owner',
          i('Owner, partner or director name'),
          d('Aadhaar card'),
          p('Passport-size photo'),
          i('Mobile number and email ID'),
        ),
        g(
          'About the food business',
          i('Business name and address'),
          i('What you make, sell, store, serve or import'),
          i('List of the food products'),
          i('Expected yearly turnover'),
          d('Rental agreement or NOC from the property owner'),
          d('Latest EB bill'),
          p('Photo of the premises with the name board'),
        ),
        g(
          'For the licence',
          d('Layout plan of the premises'),
          d('Water test report'),
          d('List of machinery and equipment'),
          d('Partnership deed or company papers, if applicable'),
          d('Import-Export Code, if you import food products'),
        ),
      ],
    },
  },

  impexp: {
    timeline:
      'IE Code is typically issued within 1–3 working days; RCMC typically within 3–7 working days, depending on the council.',
    groups: [
      g(
        'For the Import-Export Code',
        d('PAN card of the business'),
        d('Aadhaar card of the owner or partner'),
        p('Passport-size photo of the owner or partner'),
        d('Business address proof'),
        d('Cancelled cheque or bank certificate'),
        i('Mobile number and email ID'),
        i('What you plan to import or export'),
      ),
      g(
        'For the RCMC (export council membership)',
        d('Import-Export Code, once issued'),
        d('GST registration certificate'),
        i('Which products you export, and which council they fall under'),
        i('Yearly export turnover, expected or actual'),
      ),
    ],
    byVariant: {
      ie: [
        g(
          'For the Import-Export Code',
          d('PAN card of the business'),
          d('Aadhaar card of the owner or partner'),
          p('Passport-size photo of the owner or partner'),
          d('Business address proof'),
          d('Cancelled cheque or bank certificate'),
          i('Mobile number and email ID'),
          i('What you plan to import or export'),
        ),
      ],
      rcmc: [
        g(
          'For the RCMC (export council membership)',
          d('Import-Export Code'),
          d('GST registration certificate'),
          d('PAN card of the business'),
          i('Which products you export, and which council they fall under'),
          i('Yearly export turnover, expected or actual'),
        ),
      ],
    },
  },

  rental: {
    timeline: 'Drafted within 1 working day; stamping and signing follow your schedule.',
    groups: [
      g(
        'The landlord and the tenant',
        d('ID proof of the landlord'),
        d('ID proof of the tenant'),
        i('Full names and addresses of both'),
      ),
      g(
        'The property and the terms',
        i('Property address'),
        d('Proof of ownership'),
        i('Residential or commercial use'),
        i('Monthly rent and security deposit'),
        i('Start date and lease period'),
        i('Notice period, rent increase and maintenance terms'),
        i('Any special conditions you want added'),
      ),
    ],
  },

  gstret: {
    timeline:
      'Filed before each due date once we have your month’s documents. Sending them in the first week of the month leaves time to review.',
    groups: [
      g(
        'Every month',
        d('Sales invoices for the month'),
        d('Purchase invoices for the month'),
        d('Bank statement for the month'),
        d('Credit notes and debit notes, if any'),
        i('Tell us if there were no sales or purchases that month'),
      ),
      g(
        'Once, to begin',
        i('GST portal login, shared securely'),
        d('GST registration certificate'),
        d('Last filed return acknowledgement'),
        i('The accounting software you use, if any'),
      ),
    ],
  },

  itr: {
    timeline: 'Typically filed within 2–3 working days of receiving complete documents.',
    groups: [
      g(
        'About you',
        d('PAN card'),
        d('Aadhaar card'),
        i('Mobile number and email ID linked to your tax account'),
        i('Income tax portal login, shared securely'),
        d('Bank account details for the refund'),
      ),
      g(
        'Income',
        d('Form 16 or salary slips, if you are employed'),
        d('Bank statements for the year'),
        d('Interest certificates'),
        d('Statements for shares, mutual funds or property sold'),
        d('Business income and expense details or books, if you run a business'),
        i('Income or assets abroad, if any'),
      ),
      g(
        'Savings and deductions',
        d('Investment proofs'),
        d('Insurance premium receipts'),
        d('Home loan interest certificate'),
        d('Rent receipts, if you claim house rent allowance'),
      ),
    ],
  },

  books: {
    timeline: 'Books are set up in the first week and updated every month once your bills arrive.',
    groups: [
      g(
        'Every month',
        d('Bank statements'),
        d('Sales bills'),
        d('Purchase bills'),
        d('Expense vouchers and receipts'),
      ),
      g(
        'Once, to begin',
        d('Last year’s books or trial balance, if any'),
        i('Stock details'),
        i('Loan details'),
        i('Fixed assets such as machinery, vehicles and furniture'),
        i('The accounting software you use, or whether you want us to set one up'),
        d('GST and TDS returns already filed this year'),
      ),
    ],
  },

  notice: {
    timeline:
      'We read it within 1 working day and tell you the plan. The reply is filed before the deadline printed on the notice.',
    groups: [
      g(
        'The notice',
        d('Copy of the notice or order'),
        i('Date it was issued, and the reply due date'),
        i('The section, and the assessment year or period'),
        d('Earlier letters or correspondence about it'),
      ),
      g(
        'Your records',
        d('Returns already filed for that period'),
        d('Related invoices, bank statements and records'),
        i('Your explanation of what happened, in your own words'),
        i('Portal login, shared securely'),
      ),
    ],
  },

  project: {
    timeline: 'Typically 5–7 working days once we have all the details.',
    groups: [
      g(
        'The promoter',
        d('KYC: PAN and Aadhaar of the promoters'),
        i('Qualification and experience'),
        d('Past 2–3 years’ financials, if the business already runs'),
      ),
      g(
        'The project',
        i('What you plan to build or sell, and for whom'),
        i('Cost of machinery, building and working capital'),
        d('Supplier quotations'),
        i('Loan amount you need, and the bank'),
        i('Expected sales, and how you arrived at them'),
        d('Property details, if you are offering security'),
      ),
    ],
  },

  landing: {
    timeline:
      'Typically 2–4 weeks from receiving your content, depending on the pages and how quickly feedback comes back.',
    groups: [
      g(
        'Your brand',
        i('Business name and tagline'),
        d('Logo, if you have one'),
        i('Brand colours, if you have them'),
        i('Websites you like, for inspiration'),
      ),
      g(
        'Your content',
        i('About you and your services (we can help write it)'),
        p('Photos of your work, team or products'),
        i('Contact details and social media links'),
        l('Google Maps location of your business'),
        i('Preferred domain names'),
      ),
    ],
  },

  booking: {
    timeline: 'Typically 3–5 weeks from receiving your content.',
    groups: [
      g(
        'Your business',
        i('Your services, timings and fees'),
        p('Photos of your place, team and services'),
        d('Logo and brand colours'),
        l('Google Maps location of your business'),
      ),
      g(
        'For bookings and payments',
        i('The Google account to connect for calendar sync'),
        i('Razorpay account details (we help you set it up)'),
        i('Preferred domain names'),
      ),
    ],
  },

  store: {
    timeline: 'Typically 4–8 weeks, depending on the number of products.',
    groups: [
      g(
        'Your products',
        d('Product list with prices and descriptions'),
        p('Product photos'),
        d('Licences needed for your products, for example FSSAI for food'),
      ),
      g(
        'Your business',
        d('Logo, brand colours and packaging photos'),
        i('Business details and GST number'),
        i('Bank account for receiving payments'),
        i('Shipping preferences and delivery areas'),
        i('Preferred domain names'),
      ),
    ],
  },

  custom: {
    timeline: 'Agreed in the fixed quote before any work begins.',
    groups: [
      g(
        'Your idea',
        i('A description of how the work flows today'),
        i('Examples of apps or sites you admire'),
        i('Who will use it, and what each person should do'),
        d('Forms, sheets or data you use today'),
        i('Your timeline and budget range'),
      ),
    ],
  },

  domain: {
    timeline: 'Usually the same day, once you choose the name.',
    groups: [
      g(
        'The domain',
        i('Two or three preferred domain names'),
        i('Existing domain and website access, if any'),
        i('Name and email for the registration'),
      ),
    ],
  },

  careplan: {
    timeline: 'Starts from the day you sign up.',
    groups: [g('To take over the care', i('Your website and hosting access, shared securely'))],
  },

  storecare: {
    timeline: 'Starts from the day you sign up.',
    groups: [g('To take over the care', i('Your store and hosting access, shared securely'))],
  },

  brand: {
    timeline: 'First concepts typically within 5–7 working days.',
    groups: [
      g(
        'Your brand',
        i('Brand name and tagline'),
        i('What you do, and who you serve'),
        i('Colours and styles you like'),
        i('Brands you admire, as references'),
        d('Your existing logo, if any'),
      ),
    ],
  },

  canva: {
    timeline: 'Typically 2–3 working days for each set.',
    groups: [
      g(
        'Your content',
        i('Text and offers to include'),
        p('Photos'),
        d('Logo'),
        i('Brand colours, if you have them'),
        i('Sizes or formats needed, such as Instagram, A4 or a banner'),
      ),
    ],
  },

  whatsapp: {
    timeline: 'Typically 1–2 weeks, depending on the flows.',
    groups: [
      g(
        'Your business',
        i('Your business WhatsApp number'),
        i('Your services, timings and prices'),
        i('Payment gateway account, if you take payments'),
        i('How you would like your messages to sound'),
        i('The questions customers ask most'),
      ),
    ],
  },

  tools: {
    timeline: 'Typically 1–3 weeks, depending on the tool.',
    groups: [
      g(
        'The task',
        i('How you do this task today'),
        d('Your current sheets or forms'),
        i('What you want the result to look like'),
        i('Who will use the tool'),
      ),
    ],
  },

  ai: {
    timeline: 'Scope is agreed first; typically 2–4 weeks.',
    groups: [
      g(
        'What to automate',
        i('A list of tasks you repeat often'),
        i('The tools you use, such as Zoho, Google Sheets, WhatsApp or email'),
        d('Sample data or documents'),
        i('How you prefer to be notified'),
      ),
    ],
  },

  videoconsult: {
    timeline: 'Typically 1–2 weeks after the website is ready.',
    groups: [
      g(
        'Your consultations',
        i('Your consultation timings and fees'),
        i('The Google account for your calendar'),
        i('Payment gateway account, if you take payments'),
      ),
    ],
  },

  gbp: {
    timeline: 'Set up in the first week, then looked after every month.',
    groups: [
      g(
        'Your business',
        i('Business name, address and opening hours'),
        p('Photos of your place, team and work'),
        i('Access to your Google Business Profile, shared securely'),
        l('Google Maps location'),
      ),
    ],
  },
};

export function checklistFor(serviceId: string, variantId?: string) {
  const e = CHECKLISTS[serviceId];
  if (!e) return null;
  const groups = (variantId && e.byVariant?.[variantId]) || e.groups;
  return { groups, timeline: e.timeline, count: groups.reduce((n, x) => n + x.items.length, 0) };
}

/** The practice's plain-text message: numbered items, ready for WhatsApp or email. */
export function checklistText(
  name: string,
  groups: ChecklistGroup[],
  opts: { variant?: string } = {},
): string {
  let n = 0;
  const lines = [
    `${name.toUpperCase()}${opts.variant ? ` – ${opts.variant.toUpperCase()}` : ''}`,
    '',
    'Please share the following documents/details:',
    '',
  ];
  for (const grp of groups) for (const it of grp.items) lines.push(`${++n}. ${it.t}`);
  return lines.join('\n');
}
