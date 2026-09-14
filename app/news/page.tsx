import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, ExternalLink, Newspaper, RefreshCw } from 'lucide-react';
import { Badge, ButtonLink, Card, Container, Section, SectionHeading } from '@/components/ui';
import { pageOg } from '@/lib/site';
import { serviceClient, isSupabaseConfigured } from '@/lib/supabase';
import type { NewsItemRow } from '@/lib/database.types';
import { cn, displayHost, formatRelative } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'News',
  description:
    'Daily tax, GST, corporate and economy updates from TaxGuru, the Economic Times, Mint and BusinessLine — headlines and summaries, linked back to the publisher.',
  alternates: { canonical: '/news' },
  openGraph: pageOg({
    title: 'News',
    description:
      'Tax, GST and compliance headlines, refreshed daily from trusted Indian business publishers.',
    path: '/news',
  }),
};

// Rebuild hourly; the aggregation cron runs daily.
export const revalidate = 3600;

type SearchParams = Promise<{ category?: string }>;

async function loadNews(): Promise<{ items: NewsItemRow[]; categories: string[] }> {
  if (!isSupabaseConfigured) return { items: [], categories: [] };

  const supabase = serviceClient();
  if (!supabase) return { items: [], categories: [] };

  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .eq('is_hidden', false)
    .order('published_at', { ascending: false })
    .limit(60);

  if (error) {
    console.error('[news] query failed', error);
    return { items: [], categories: [] };
  }

  const items = data ?? [];
  const categories = [...new Set(items.map((i) => i.category))].sort();
  return { items, categories };
}

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const { category } = await searchParams;
  const { items, categories } = await loadNews();

  const filtered = category ? items.filter((i) => i.category === category) : items;
  const [lead, ...rest] = filtered;

  return (
    <>
      {/* Header */}
      <Section className="pt-[calc(4.5rem+var(--space-section-sm))] pb-12">
        <div className="pointer-events-none absolute inset-0 -z-10" />
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="News"
            title="Tax and compliance, as it lands"
            lede="Headlines gathered each day from TaxGuru, the Economic Times, Mint and BusinessLine. We summarise and link out — the full story always stays with the publisher."
          />
        </Container>
      </Section>

      {/* Filters */}
      {categories.length > 0 ? (
        <Container>
          <nav aria-label="Filter by category" className="flex flex-wrap gap-2 pb-8">
            <Link
              href="/news"
              className={cn(
                'rounded-full px-4 py-2.5 text-[0.875rem] font-medium transition-colors sm:py-2',
                !category
                  ? 'bg-ink text-ground'
                  : 'text-ink-2 hover:text-ink bg-surface ring-1 ring-[var(--hairline)] ring-inset',
              )}
            >
              All
            </Link>
            {categories.map((name) => (
              <Link
                key={name}
                href={`/news?category=${encodeURIComponent(name)}`}
                className={cn(
                  'rounded-full px-4 py-2.5 text-[0.875rem] font-medium transition-colors sm:py-2',
                  category === name
                    ? 'bg-ink text-ground'
                    : 'text-ink-2 hover:text-ink bg-surface ring-1 ring-[var(--hairline)] ring-inset',
                )}
              >
                {name}
              </Link>
            ))}
          </nav>
        </Container>
      ) : null}

      <Section className="pt-0 pb-20">
        <Container>
          {filtered.length === 0 ? (
            /* Empty state — also what shows before the first cron run */
            <Card className="bg-surface p-12 text-center">
              <span className="bg-sunken mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                <Newspaper className="text-ink-3 h-6 w-6" strokeWidth={1.8} />
              </span>
              <h2 className="text-ink mt-5 text-[1.1875rem] font-semibold">
                {category ? `Nothing filed under “${category}” yet` : 'The feed is warming up'}
              </h2>
              <p className="text-ink-3 mx-auto mt-2.5 max-w-md text-[0.9375rem] leading-relaxed">
                {category
                  ? 'Try another category, or check back after the next daily refresh.'
                  : 'Headlines are collected once a day. The first edition appears after the next scheduled refresh.'}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {category ? (
                  <ButtonLink href="/news" tone="outline">
                    Show everything
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/calendar" tone="outline">
                  See the compliance calendar
                </ButtonLink>
              </div>
            </Card>
          ) : (
            <>
              {/* Lead story */}
              {lead ? (
                <Card interactive className="group bg-surface mb-5 overflow-hidden">
                  <a
                    href={lead.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="block p-7 sm:p-9"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{lead.category}</Badge>
                      <span className="text-ink-3 text-[0.8125rem]">{lead.source_name}</span>
                      <span className="text-ink-3 text-[0.8125rem]">·</span>
                      <time dateTime={lead.published_at} className="text-ink-3 text-[0.8125rem]">
                        {formatRelative(lead.published_at)}
                      </time>
                    </div>

                    <h2 className="text-ink group-hover:text-accent mt-4 max-w-3xl text-[length:var(--text-title-2)] leading-tight font-semibold tracking-[-0.022em] transition-colors">
                      {lead.title}
                    </h2>

                    {lead.summary ? (
                      <p className="text-ink-3 mt-3 max-w-2xl text-[1.0625rem] leading-relaxed">
                        {lead.summary}
                      </p>
                    ) : null}

                    <span className="text-accent mt-5 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold">
                      Read at {displayHost(lead.link)}
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                  </a>
                </Card>
              ) : null}

              {/* Grid */}
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((item) => (
                  <li key={item.id}>
                    <Card interactive className="group bg-surface h-full">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="flex h-full flex-col p-6"
                      >
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral">{item.category}</Badge>
                          <time dateTime={item.published_at} className="text-ink-3 text-[0.75rem]">
                            {formatRelative(item.published_at)}
                          </time>
                        </div>

                        <h3 className="text-ink group-hover:text-accent mt-3.5 text-[1.0625rem] leading-snug font-semibold transition-colors">
                          {item.title}
                        </h3>

                        {item.summary ? (
                          <p className="text-ink-3 mt-2.5 line-clamp-3 flex-1 text-[0.875rem] leading-relaxed">
                            {item.summary}
                          </p>
                        ) : (
                          <span className="flex-1" />
                        )}

                        <div className="mt-5 flex items-center justify-between border-t border-[var(--hairline)] pt-3.5">
                          <span className="text-ink-3 text-[0.75rem]">{item.source_name}</span>
                          <ArrowUpRight className="text-ink-3 group-hover:text-accent h-3.5 w-3.5 transition-colors" />
                        </div>
                      </a>
                    </Card>
                  </li>
                ))}
              </ul>

              <p className="text-ink-3 mt-10 flex items-center gap-2 text-[0.8125rem]">
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                Headlines refresh once a day. Summaries are extracted from each publisher&rsquo;s
                own feed; copyright remains with the publisher and every card links to the original.
              </p>
            </>
          )}
        </Container>
      </Section>
    </>
  );
}
