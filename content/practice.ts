import { PILLARS, type Pillar } from './services';

/**
 * The two halves of the practice.
 *
 * The site's central claim is that advisory and engineering are equally
 * credible here, so this structure exists to guarantee the design treats them
 * identically: same shape, same field names, same rendering. Neither side can
 * become an afterthought because neither has a richer data model than the
 * other.
 */

export type PracticeSide = {
  id: 'advisory' | 'engineering';
  /** Short name used in navigation and labels. */
  name: string;
  /** Display heading — set in the serif. */
  heading: string;
  /** One sentence on what this half actually is. */
  statement: string;
  /** The proposition, in the practice's own voice. */
  body: string;
  /** Four capabilities. Four on both sides, deliberately. */
  capabilities: { title: string; detail: string }[];
  /** Pillar ids from content/services.ts that belong to this half. */
  pillarIds: string[];
  href: string;
};

export const PRACTICE: PracticeSide[] = [
  {
    id: 'advisory',
    name: 'Financial & Legal',
    heading: 'Advisory',
    statement: 'Compliance, structuring and representation.',
    body: 'Returns filed against the department’s own records before they are signed. Notices answered on the procedural record first and the merits second. Books closed so they can be defended three years later, not just accepted this year.',
    capabilities: [
      {
        title: 'Tax & GST compliance',
        detail:
          'ITR 1–7, monthly and annual GST, input credit reconciliation, export documentation.',
      },
      {
        title: 'Scrutiny & litigation support',
        detail:
          'Notices under s.142(1), s.143(2) and s.148. Penalty defence, first appeals, paper books.',
      },
      {
        title: 'Structuring & registration',
        detail:
          'Private Limited, LLP, partnership and proprietorship. MCA filings and constitutional drafting.',
      },
      {
        title: 'Books & audit readiness',
        detail:
          'Book-keeping, monthly verification, internal audit and payroll — the records kept so an examination is a formality.',
      },
    ],
    pillarIds: ['tax', 'scrutiny', 'incorporation', 'books'],
    href: '/services#advisory',
  },
  {
    id: 'engineering',
    name: 'Digital & Tech',
    heading: 'Engineering',
    statement: 'Products, platforms and the systems beneath them.',
    body: 'The people who file your returns also decide how the software works. Invoicing that produces documents the department will accept, portals that keep the records anyone examining them will ask for, and a site that loads quickly for the person you are trying to win.',
    capabilities: [
      {
        title: 'Web & product development',
        detail:
          'Websites, client portals and dashboards, with each person seeing only what they should and a record of every change.',
      },
      {
        title: 'Interface & experience design',
        detail:
          'One consistent look across every screen, and readable for everyone — including anyone using a screen reader.',
      },
      {
        title: 'Brand & identity',
        detail:
          'Marks, typography systems, investor documents and the collateral that closes a room.',
      },
      {
        title: 'Automation & document intelligence',
        detail:
          'Software that reads figures off invoices and statements, checks them against your books, and stops the re-typing.',
      },
    ],
    pillarIds: ['digital', 'design'],
    href: '/services#engineering',
  },
];

export function pillarsFor(side: PracticeSide): Pillar[] {
  return PILLARS.filter((p) => side.pillarIds.includes(p.id));
}
