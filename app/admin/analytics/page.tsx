import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { EmptyState, PageHeader, Panel, Stat } from '@/components/admin/ui';
import { requireProfile } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics' };

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

type Row = { label: string; views: number };

function Breakdown({
  title,
  rows,
  empty,
  format,
}: {
  title: string;
  rows: Row[];
  empty: string;
  format?: (l: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <p className="text-ink-3 px-6 py-5 text-[0.875rem]">{empty}</p>
      ) : (
        <ul className="space-y-2.5 px-6 py-5">
          {rows.map((r) => (
            <li key={r.label} className="relative">
              <span
                aria-hidden="true"
                className="bg-accent-wash absolute inset-y-0 left-0 rounded-[var(--radius-sm)]"
                style={{ width: `${(r.views / max) * 100}%` }}
              />
              <span className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-[0.8125rem]">
                <span className="text-ink min-w-0 truncate font-medium">
                  {format ? format(r.label) : r.label || '—'}
                </span>
                <span className="text-ink-2 shrink-0 tabular-nums">
                  {r.views.toLocaleString('en-IN')}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/**
 * Where visitors come from, what they read, and whether they get in touch.
 * Counted without cookies or identifiers — see /api/track for exactly what is
 * stored. Enquiry sources come from the campaign tags on the link a visitor
 * arrived by, carried into the contact form.
 */
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireProfile();
  const { days: raw } = await searchParams;
  const days = RANGES.some((r) => String(r.days) === raw) ? Number(raw) : 30;
  const from = new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10);
  const supabase = serviceClient();

  let daily: { day: string; views: number }[] = [];
  const top: Record<string, Row[]> = {};
  let enquiries = 0;
  const sources = new Map<string, number>();

  if (supabase) {
    const dims = [
      'path',
      'referrer_host',
      'utm_source',
      'utm_campaign',
      'device',
      'country',
    ] as const;
    const [d, ...rest] = await Promise.all([
      supabase.rpc('analytics_daily', { p_from: from }),
      ...dims.map((dim) =>
        supabase.rpc('analytics_top', { p_from: from, p_dim: dim, p_limit: 10 }),
      ),
    ]);
    const byDay = new Map((d.data ?? []).map((r) => [r.day, Number(r.views)]));
    daily = Array.from({ length: days }, (_, i) => {
      const day = new Date(Date.now() - (days - 1 - i) * 864e5).toISOString().slice(0, 10);
      return { day, views: byDay.get(day) ?? 0 };
    });
    dims.forEach((dim, i) => {
      top[dim] = (rest[i]?.data ?? []).map((r) => ({
        label: r.label ?? '',
        views: Number(r.views),
      }));
    });

    const { data: enq } = await supabase
      .from('enquiries')
      .select('id, created_at')
      .gte('created_at', from)
      .neq('state', 'spam');
    enquiries = enq?.length ?? 0;
    if (enq?.length) {
      const { data: meta } = await supabase
        .from('enquiry_meta')
        .select('enquiry_id, utm_source')
        .in(
          'enquiry_id',
          enq.map((e) => e.id),
        );
      const tagged = new Map((meta ?? []).map((m) => [m.enquiry_id, m.utm_source]));
      for (const e of enq) {
        const s = tagged.get(e.id) || 'Direct or search';
        sources.set(s, (sources.get(s) ?? 0) + 1);
      }
    }
  }

  const total = daily.reduce((s, d) => s + d.views, 0);
  const max = Math.max(1, ...daily.map((d) => d.views));
  const conversion = total ? ((enquiries / total) * 100).toFixed(2) : '—';
  const pages = Math.max(1, top.path?.length ?? 1);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Visits, sources and enquiries — counted without cookies, without IP addresses, and without following anyone."
        action={
          <nav aria-label="Range" className="flex gap-2">
            {RANGES.map((r) => (
              <Link
                key={r.days}
                href={`/admin/analytics?days=${r.days}`}
                className={
                  r.days === days
                    ? 'bg-ink text-ground rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium'
                    : 'text-ink-2 rounded-full px-3.5 py-1.5 text-[0.8125rem] ring-1 ring-[var(--hairline)]'
                }
              >
                {r.label}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={`Page views, ${days} days`}
          value={total.toLocaleString('en-IN')}
          tone="accent"
        />
        <Stat label="Enquiries" value={enquiries} tone="positive" />
        <Stat
          label="Visit → enquiry"
          value={`${conversion}%`}
          hint="Enquiries per hundred page views"
        />
        <Stat label="Pages viewed" value={pages} hint="Distinct pages with traffic" />
      </div>

      <Panel title="Daily views" className="mb-6">
        {total === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No visits counted yet"
            description="Counting starts as soon as this version of the site is live. Visits from this signed-in browser are never counted."
          />
        ) : (
          <div className="px-6 pt-6 pb-5">
            <div className="flex h-44 items-end gap-[2px]">
              {daily.map((d) => (
                <span
                  key={d.day}
                  title={`${formatDate(d.day)}: ${d.views}`}
                  className="bg-accent/75 hover:bg-accent flex-1 rounded-t-[3px]"
                  style={{ height: `${Math.max(2, (d.views / max) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Breakdown title="Most-read pages" rows={top.path ?? []} empty="No page views yet." />
        <Breakdown
          title="Referring websites"
          rows={(top.referrer_host ?? []).filter((r) => r.label)}
          empty="No referrals yet. Direct visits and searches with no referrer are not listed."
        />
        <Breakdown
          title="Campaign sources"
          rows={(top.utm_source ?? []).filter((r) => r.label)}
          empty="No tagged visits yet. Build tagged links under Campaigns."
        />
        <Breakdown
          title="Campaigns"
          rows={(top.utm_campaign ?? []).filter((r) => r.label)}
          empty="No campaign tags yet."
        />
        <Panel title="Enquiries by source">
          {sources.size === 0 ? (
            <p className="text-ink-3 px-6 py-5 text-[0.875rem]">No enquiries in this range.</p>
          ) : (
            <ul className="divide-y divide-[var(--hairline)]">
              {[...sources.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => (
                  <li
                    key={source}
                    className="flex items-center justify-between px-6 py-3 text-[0.875rem]"
                  >
                    <span className="text-ink font-medium">{source}</span>
                    <span className="text-ink-2 tabular-nums">{count}</span>
                  </li>
                ))}
            </ul>
          )}
        </Panel>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <Breakdown title="Devices" rows={top.device ?? []} empty="—" />
          <Breakdown
            title="Countries"
            rows={(top.country ?? []).filter((r) => r.label)}
            empty="—"
          />
        </div>
      </div>
    </>
  );
}
