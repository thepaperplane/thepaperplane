import { headers } from 'next/headers';
import Link from 'next/link';
import { QuoteView } from '@/components/quote/quote-view';
import { clientIp } from '@/lib/api';
import { getSettings } from '@/lib/settings';
import { loadPortfolio } from '@/lib/portfolio';
import { loadTestimonials } from '@/lib/public-data';
import { getAddons, getCatalog, hashIp, openQuote } from '@/lib/quotes/engine';
import { whatsappLink } from '@/lib/site';

export const dynamic = 'force-dynamic';

const WHY: Record<string, { t: string; d: string }> = {
  missing: {
    t: 'We could not find that quotation',
    d: 'Please check the link in your email or message.',
  },
  unavailable: {
    t: 'This quotation is not ready yet',
    d: 'We are still preparing it. You will receive it as soon as it is.',
  },
  expired: {
    t: 'This quotation has expired',
    d: 'Quotations stay open for a limited time. Ask us for a fresh one and we will send it straight away.',
  },
  limit: {
    t: 'This link has been opened too many times',
    d: 'For your privacy a quotation link stops working after many opens. Ask us and we will send a fresh one.',
  },
  void: {
    t: 'This quotation has been withdrawn',
    d: 'Please contact us if you would like an updated one.',
  },
};

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const h = await headers();
  const access = await openQuote(token, {
    ipHash: hashIp(clientIp(new Request('http://x', { headers: h }))),
    userAgent: h.get('user-agent') ?? undefined,
  });

  if (!access.ok) {
    const msg = WHY[access.reason] ?? WHY.missing!;
    return (
      <div className="bg-surface rounded-[1.1rem] border border-[var(--hairline)] p-8">
        <h1 className="text-[1.5rem]">{msg.t}</h1>
        <p className="text-ink-2 mt-3 text-[0.9375rem] leading-relaxed">{msg.d}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/get-quote"
            className="bg-accent text-accent-ink inline-flex h-11 items-center rounded-full px-5 text-[0.9375rem] font-semibold"
          >
            Request a new quotation
          </Link>
          <a
            href={whatsappLink('Hello, my quotation link is not working.')}
            className="text-accent inline-flex h-11 items-center rounded-full px-5 text-[0.9375rem] font-semibold ring-1 ring-[var(--hairline-strong)] ring-inset"
          >
            Message us
          </a>
        </div>
      </div>
    );
  }

  const q = access.quote;
  const [catalog, addons, settings, projects, testimonials] = await Promise.all([
    getCatalog(),
    getAddons(q.id),
    getSettings(),
    loadPortfolio().catch(() => []),
    loadTestimonials().catch(() => []),
  ]);
  return (
    <QuoteView
      quote={q}
      addons={addons}
      catalog={catalog}
      taxNote={settings.quotes.taxNote}
      work={projects
        .filter((p) => p.status === 'live')
        .map((p) => ({
          name: p.name,
          displayUrl: p.displayUrl,
          url: p.url,
          sector: p.sector,
          summary: p.summary,
        }))}
      stories={testimonials
        .filter((t) => t.video_url)
        .map((t) => ({
          id: t.id,
          author_name: t.author_name,
          company: t.company,
          quote: t.quote,
          video_url: t.video_url!,
        }))}
    />
  );
}
