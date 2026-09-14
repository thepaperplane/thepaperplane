import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { COPYRIGHT, COPYRIGHT_UPDATED } from '@/content/legal-more';
import { pageOg } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Copyright',
  description:
    'What belongs to this practice, to the publications the news page links to, and to clients — and the route to take if something here infringes your rights.',
  alternates: { canonical: '/copyright' },
  openGraph: pageOg({
    title: 'Copyright',
    description:
      'Ownership of material on this site, the news aggregator’s position, and the takedown route.',
    path: '/copyright',
  }),
};

export default function CopyrightPage() {
  return (
    <LegalPage
      eyebrow="Copyright"
      title={
        <>
          Whose work is whose, <span className="em-serif">and how to have something removed</span>
        </>
      }
      lede="What belongs to this practice, what belongs to the publications the news page links to, what belongs to clients — and the route to take if something here infringes your rights."
      updated={COPYRIGHT_UPDATED}
      sections={COPYRIGHT}
    />
  );
}
