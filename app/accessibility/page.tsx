import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { ACCESSIBILITY, ACCESSIBILITY_UPDATED } from '@/content/legal-more';
import { pageOg } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Accessibility',
  description:
    'This site targets WCAG 2.2 Level AA. Which criteria are checked programmatically, what is known to be imperfect, and how to tell us when something is wrong.',
  alternates: { canonical: '/accessibility' },
  openGraph: pageOg({
    title: 'Accessibility',
    description:
      'WCAG 2.2 AA target, the criteria actually measured, the known gaps, and how to report a problem.',
    path: '/accessibility',
  }),
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Accessibility"
      title={
        <>
          What has been measured, <span className="em-serif">and what has not</span>
        </>
      }
      lede="This site targets WCAG 2.2 Level AA. Rather than claim compliance, this sets out exactly which criteria are checked programmatically, what is known to be imperfect, and how to tell us when something does not work."
      updated={ACCESSIBILITY_UPDATED}
      sections={ACCESSIBILITY}
    />
  );
}
