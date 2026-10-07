import type { Metadata } from 'next';
import { Container, Section, SectionHeading } from '@/components/ui';
import { RequestForm, type FormService } from '@/components/quote/request-form';
import { getCatalog } from '@/lib/quotes/engine';
import { CATEGORIES } from '@/lib/quotes/types';

// Unlisted: sent in messages and links, never in the menu or the sitemap.
export const metadata: Metadata = {
  title: 'Get your quotation',
  description: 'Tell us what you need and we will send a personalised quotation to your email.',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default async function GetQuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) ?? '';
  const catalog = await getCatalog();
  // Names and descriptions only. Prices never leave the server on this page.
  const services: FormService[] = catalog
    .filter((s) => s.active)
    .map((s) => ({
      id: s.id,
      cat: s.cat,
      name: s.name,
      line: s.line,
      ask: s.ask,
      askLabel: s.askLabel,
      variants: s.variants.map((v) => ({ id: v.id, label: v.label })),
      defaultVariant: s.defaultVariant,
    }));
  const pre = one('s')
    .split(',')
    .map((x) => x.trim())
    .filter((id) => services.some((s) => s.id === id))
    .slice(0, 10);

  return (
    <Section className="pt-[calc(4.5rem+var(--space-section-sm))] pb-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            as="h1"
            eyebrow="Your quotation"
            title="Tell us what you need"
            lede="Choose the services you are thinking about and tell us a little about your business. We will email you a personalised quotation — usually within minutes."
          />
          <RequestForm
            services={services}
            categories={CATEGORIES}
            preselected={pre}
            src={{
              source: one('src') || one('utm_source'),
              medium: one('utm_medium'),
              campaign: one('utm_campaign'),
            }}
          />
        </div>
      </Container>
    </Section>
  );
}
