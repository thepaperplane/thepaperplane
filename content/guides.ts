/**
 * Plain-language guides: "which rules apply to me?"
 *
 * The site assistant and the WhatsApp assistant use these — and only these —
 * to explain, without jargon, how a rule usually applies to the situation a
 * visitor describes, and which of the practice's services that points to.
 *
 * They state general positions and published thresholds, not advice on one
 * person's affairs. Every figure here carries the date it was last checked
 * (GUIDES_CHECKED). Thresholds change; when the practice learns of a change
 * it must be edited here, because the assistants will repeat whatever this
 * file says. Keep the language the way you would explain it to a shop owner.
 */

export const GUIDES_CHECKED = '1 October 2026';

export type Guide = {
  id: string;
  title: string;
  /** When the assistant should reach for this guide. */
  when: string;
  body: string[];
  /** Quote-catalogue service ids this usually leads to. */
  services: string[];
};

export const GUIDES: Guide[] = [
  {
    id: 'gst-registration',
    title: 'Do I need a GST registration?',
    when: 'Anyone asking whether they need GST, or describing a business that sells goods or services.',
    services: ['gstreg', 'gstret'],
    body: [
      'GST registration is a number from the government that lets a business charge GST on its bills and claim back the GST it paid on its purchases.',
      'Registration is compulsory once yearly sales (turnover) cross a limit. For a business that only sells goods the limit is ₹40 lakh a year; for a business that sells services, or goods and services together, it is ₹20 lakh. In a few north-eastern and other special-category states the limits are lower (for example ₹20 lakh for goods) — ask which state they are in, and say the team confirms the exact limit for that state.',
      'Some businesses must register from the very first rupee, whatever the sales: anyone selling goods to customers in another state; anyone selling through an online marketplace such as Amazon or Flipkart; and a few special cases such as people who must pay tax on behalf of their suppliers. A business below the limit that sells only inside its own state and only offline need not register.',
      'Below the limit a business can still register by choice. The reasons to: customers who are themselves GST-registered businesses want bills that let them claim credit; the business wants credit on its own purchases; or it wants to sell online or to other states later. The cost of registering: returns have to be filed every month or quarter, even in months with no sales.',
      'Worked example: a shop selling goods, ₹10 lakh a year, selling only in its own state and not online. It is well below the ₹40 lakh limit and not in any must-register case, so GST registration is not compulsory — it is a choice. If it starts selling to other states or on a marketplace, registration becomes compulsory at once. Explain that in this order: the limit, the exceptions, the choice.',
      'Small goods traders and manufacturers with yearly sales up to about ₹1.5 crore can opt for the composition scheme: they pay a small flat percentage of sales (around 1% for most traders), file less often, but cannot charge GST on their bills or claim credit on purchases, and cannot use it if they sell to other states or online.',
      'What we do: GST Registration (a fixed fee, with any query from the tax officer handled by us) and, afterwards, GST Monthly Returns priced by the number of business invoices a month.',
    ],
  },
  {
    id: 'gst-returns',
    title: 'What GST returns will I have to file?',
    when: 'After registration, or when someone asks about monthly work, penalties or nil returns.',
    services: ['gstret', 'books'],
    body: [
      'A registered business files two main things each month: a statement of what it sold (GSTR-1) and a summary that pays the tax (GSTR-3B). Businesses with yearly sales up to ₹5 crore can choose to file quarterly and pay monthly. Composition-scheme businesses file quarterly.',
      'A return has to be filed even when there were no sales (a nil return). Late filing carries a daily late fee and interest on tax paid late, and a long gap can lead to the registration being cancelled — so a registered business should never let returns lapse.',
      'The fee for returns depends on how many business-to-business (B2B) invoices the client issues in a month; bills to ordinary consumers (B2C) are included free.',
    ],
  },
  {
    id: 'income-tax-return',
    title: 'Do I need to file an income tax return?',
    when: 'Individuals, professionals and small businesses asking who must file.',
    services: ['itr'],
    body: [
      'A return must be filed when total income for the year is above the tax-free limit. That limit is different under the old and new tax systems and is revised from time to time, so give the general idea and say the team confirms the current figure.',
      'Many people should file even when their income is below the limit: to get back tax already cut at source (TDS), to carry forward a business loss, if they have income or assets abroad, if they are a company director or hold unlisted shares, or if they have made large cash deposits or very large payments during the year.',
      'Business owners and professionals usually file a different form from salaried people, because business income and expenses are reported. Filing on time also avoids a late fee, and a return filed for the right year is useful proof of income for loans and visas.',
      'Past-year or late returns can still be filed; each year is charged separately.',
    ],
  },
  {
    id: 'structure',
    title: 'Which kind of business should I set up?',
    when: 'Someone starting a business or asking about firm, LLP or company.',
    services: ['partnership', 'company', 'gstreg', 'msme'],
    body: [
      'Proprietorship: one person owns the business. Simplest and cheapest, and no separate registration is needed beyond licences like GST; but the owner is personally responsible for every debt.',
      'Partnership firm: two or more people share a business under a written deed. Easy to set up, and the deed records who puts in what and who takes what; the partners are personally responsible for the firm’s debts.',
      'LLP (limited liability partnership): partners’ personal liability is limited to what they put in. A little more paperwork and yearly filings; looks more established to banks and customers.',
      'Private limited company: a separate legal person owned through shares. Best when you plan to raise investment, hire with share options or grow large; the most compliance and filings each year.',
      'A rule of thumb to share: starting alone and small, a proprietorship is enough; two or more people in a business, a partnership firm or LLP; planning investors or fast growth, a private limited company. Always add that the right choice depends on their plans and the team helps them decide in the free first conversation.',
      'Our partnership firm registration includes the partnership deed (up to 5 partners) and the firm’s PAN card; our company or LLP incorporation includes the company’s GST registration. Stamp duty and government fees are paid at actual cost.',
    ],
  },
  {
    id: 'msme',
    title: 'What is MSME (Udyam) registration and who is it for?',
    when: 'Small business owners asking about benefits, loans or schemes.',
    services: ['msme'],
    body: [
      'Udyam registration is a free government recognition of a small business as a micro, small or medium enterprise. We prepare and file it; there is no government fee.',
      'A business counts as micro, small or medium by how much it has invested in plant and machinery or equipment and by yearly sales. As revised in 2025: micro — investment up to ₹2.5 crore and sales up to ₹10 crore; small — up to ₹25 crore and ₹100 crore; medium — up to ₹125 crore and ₹500 crore.',
      'What it helps with: easier and cheaper bank loans under priority-sector lending, eligibility for government schemes and subsidies, and some protection on delayed payments from larger buyers. It does not by itself make a business exempt from GST or tax.',
    ],
  },
  {
    id: 'fssai',
    title: 'Which FSSAI food licence do I need?',
    when: 'Anyone making, selling, storing or serving food.',
    services: ['fssai'],
    body: [
      'Every food business needs registration or a licence from the food safety authority (FSSAI). Which one depends mainly on yearly sales and what the business does.',
      'Basic registration: small food businesses with yearly sales up to ₹12 lakh. State licence: sales above ₹12 lakh and up to ₹20 crore. Central licence: sales above ₹20 crore, and certain businesses regardless of size, such as importers and those operating in several states.',
      'The government fee depends on the licence (and is paid at actual cost, separately from our fee). Operating without the right licence can bring penalties, so it is worth getting the type right the first time.',
    ],
  },
  {
    id: 'import-export',
    title: 'Do I need an Import-Export Code?',
    when: 'Anyone who imports, exports or sells to customers abroad.',
    services: ['impexp'],
    body: [
      'An Import-Export Code (IEC) is a one-time number needed to import or export goods. Exporting services does not strictly need one, but it is commonly used for receiving foreign payments smoothly and claiming export benefits.',
      'An RCMC is a separate membership certificate from an export promotion council, needed to claim export benefits. It is not needed just to start exporting.',
    ],
  },
  {
    id: 'notice',
    title: 'I received a tax notice. What do I do?',
    when: 'Someone describing an income tax or GST notice.',
    services: ['notice'],
    body: [
      'First: a notice is a question or a request for information, not automatically a penalty. Many are routine mismatches or reminders.',
      'Look for three things on it: which law and section it is under, the date it was issued, and the date by which a reply is due. The reply has to be filed on the government portal within that date; ignoring it is the one thing that makes a small matter bigger.',
      'Ask them to send a photo or PDF of the notice so the team can read it. Whether and how to reply depends on the notice and their records, so say a person has to read it; the first read is free.',
    ],
  },
  {
    id: 'website',
    title: 'Which website do I need?',
    when: 'Anyone asking about a website, online store or app.',
    services: ['landing', 'booking', 'store', 'custom', 'domain', 'careplan'],
    body: [
      'A landing page or business website: to be found on Google, show what you do and get calls and WhatsApp messages. Right for most local businesses and professionals.',
      'A website with online bookings: for clinics, salons, studios and consultants who want customers to book (and pay an advance) without a phone call.',
      'An online store: to sell products with a cart, secure payments and shipping.',
      'A custom website or web app: when the business needs logins, dashboards, memberships or tools built around how it works. A fixed quote is agreed before any work begins.',
      'A domain name and a yearly care plan (hosting, backups, updates) keep any of these running.',
    ],
  },
];

/** The id → plain name list the assistants need to build a quote link. */
export const QUOTE_SERVICE_IDS: [string, string][] = [
  ['partnership', 'Partnership firm registration (includes the partnership deed and the firm PAN)'],
  ['deed', 'Partnership deed drafting on its own'],
  ['company', 'Private limited company or LLP (includes the company’s GST registration)'],
  ['gstreg', 'GST registration'],
  ['msme', 'MSME (Udyam) registration'],
  ['pan', 'PAN card application'],
  ['fssai', 'FSSAI food licence'],
  ['impexp', 'Import-export code and RCMC'],
  ['rental', 'Rental agreement'],
  ['gstret', 'GST monthly returns'],
  ['itr', 'Income tax return'],
  ['books', 'Bookkeeping and accounts'],
  ['notice', 'Tax notice reply'],
  ['project', 'Project report for loans'],
  ['landing', 'Landing page or business website'],
  ['booking', 'Website with online bookings'],
  ['store', 'Online store'],
  ['custom', 'Custom website or web app'],
  ['domain', 'Domain purchase'],
  ['careplan', 'Website care plan'],
  ['storecare', 'Online store care plan'],
  ['brand', 'Brand identity and logo'],
  ['canva', 'Canva design pack'],
  ['whatsapp', 'WhatsApp automation'],
  ['tools', 'Smart business tools'],
  ['ai', 'AI and workflow automation'],
  ['videoconsult', 'Video consultation module'],
  ['gbp', 'Google Business Profile management'],
];

export function guidesText(): string {
  const parts = [
    `PLAIN-LANGUAGE GUIDES (checked ${GUIDES_CHECKED}). Use these to explain how a rule usually applies to what the visitor told you. They are general positions and published limits, not advice on one person’s affairs.`,
    ...GUIDES.map(
      (g) =>
        `## ${g.title}\nUse when: ${g.when}\n${g.body.join('\n')}\nUsually leads to: ${g.services.join(', ')}`,
    ),
    'QUOTATION SERVICE IDS (for quotation links; never state prices):',
    ...QUOTE_SERVICE_IDS.map(([id, name]) => `- ${id}: ${name}`),
  ];
  return parts.join('\n\n');
}
