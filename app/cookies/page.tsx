import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { COOKIES, COOKIES_UPDATED } from '@/content/legal-more';
import { pageOg } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Cookies',
  description:
    'The public pages of this site set no cookies at all. What that means, what the single stored value is, and why you are never asked to consent to anything.',
  alternates: { canonical: '/cookies' },
  openGraph: pageOg({
    title: 'Cookies',
    description:
      'No cookies on the public site, one local-storage value for your theme, and no consent banner because there is nothing to consent to.',
    path: '/cookies',
  }),
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title={
        <>
          What this site stores, and why there is no banner{' '}
          <span className="em-serif">which is almost nothing</span>
        </>
      }
      lede="The public pages of this site set no cookies at all. This explains what that means, what the one stored value actually is, and why you are not being asked to consent to anything."
      updated={COOKIES_UPDATED}
      sections={COOKIES}
    />
  );
}
