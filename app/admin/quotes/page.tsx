import Link from 'next/link';
import { FileSignature, Plus } from 'lucide-react';
import {
  ADMIN_FIELD,
  DataTable,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  Pill,
  Stat,
} from '@/components/admin/ui';
import { CopyButton, SubmitButton } from '@/components/admin/form-bits';
import { saveQuoteSettings, sendQuoteNow } from '@/app/admin/_actions/quotes';
import { requireRole } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { inr, computeTotals, summarise } from '@/lib/quotes/engine';
import { SITE } from '@/lib/site';
import { serviceClient } from '@/lib/supabase';
import type { QuoteRow } from '@/lib/quotes/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Quotations' };

const when = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

const TABS: [string, string][] = [
  ['review', 'Needs review'],
  ['open', 'Out with clients'],
  ['accepted', 'Accepted'],
  ['all', 'All'],
];

const TONE: Record<string, 'neutral' | 'accent' | 'positive' | 'caution' | 'critical'> = {
  draft: 'neutral',
  pending_review: 'caution',
  sent: 'accent',
  viewed: 'accent',
  accepted: 'positive',
  declined: 'critical',
  expired: 'neutral',
  void: 'neutral',
};

const SOURCES = [
  ['whatsapp', 'WhatsApp'],
  ['instagram', 'Instagram'],
  ['linkedin', 'LinkedIn'],
  ['google', 'Google profile'],
  ['referral', 'Referral'],
  ['qr', 'QR code / print'],
  ['email', 'Email signature'],
];

/**
 * Every quotation, from every channel. Requests that came in through the
 * website or WhatsApp are screened first; the ones that failed a filter wait
 * here for one click.
 */
export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string }>;
}) {
  await requireRole('editor');
  const { tab = 'review', error } = await searchParams;
  const settings = await getSettings();
  const s = settings.quotes;
  const supabase = serviceClient();
  let rows: QuoteRow[] = [];
  if (supabase) {
    let query = supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (tab === 'review') query = query.eq('status', 'pending_review');
    else if (tab === 'open') query = query.in('status', ['sent', 'viewed']);
    else if (tab === 'accepted') query = query.eq('status', 'accepted');
    const { data } = await query;
    rows = data ?? [];
  }
  const counts = { review: 0, open: 0, accepted: 0, openValue: 0 };
  if (supabase) {
    const { data } = await supabase
      .from('quotes')
      .select('status, items, discount')
      .in('status', ['pending_review', 'sent', 'viewed', 'accepted']);
    for (const r of data ?? []) {
      if (r.status === 'pending_review') counts.review++;
      else if (r.status === 'accepted') counts.accepted++;
      else {
        counts.open++;
        counts.openValue += computeTotals(r.items, Number(r.discount)).dueNow;
      }
    }
  }
  const base = `${SITE.url}/get-quote`;

  return (
    <>
      <PageHeader
        title="Quotations"
        description="Prices appear nowhere on the public website. They live in a private, expiring page sent to each client, built only from the services they asked about."
        action={
          <Link
            href="/admin/quotes/new"
            className="bg-accent text-accent-ink hover:bg-accent-hover inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.875rem] font-semibold"
          >
            <Plus className="h-4 w-4" /> New quotation
          </Link>
        }
      />
      {error ? (
        <p
          role="alert"
          className="bg-critical/10 text-critical mb-5 rounded-[var(--radius-md)] px-4 py-3 text-[0.875rem] font-medium"
        >
          That quotation could not be saved — check the details and try again.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Needs your review"
          value={counts.review}
          tone={counts.review ? 'caution' : 'neutral'}
          hint="Held by a filter"
        />
        <Stat
          label="Out with clients"
          value={counts.open}
          tone="accent"
          hint={`${inr(counts.openValue)} to begin`}
        />
        <Stat label="Accepted" value={counts.accepted} tone="positive" />
        <Stat
          label="Filter"
          value={
            s.mode === 'auto' ? 'Auto' : s.mode === 'qualified' ? `Score ≥ ${s.minScore}` : 'Manual'
          }
          hint="Set below"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter quotations">
        {TABS.map(([k, label]) => (
          <Link
            key={k}
            href={`/admin/quotes?tab=${k}`}
            role="tab"
            aria-selected={tab === k}
            className={`inline-flex h-9 items-center rounded-full px-4 text-[0.8125rem] font-semibold ring-1 ring-inset ${
              tab === k
                ? 'bg-accent text-accent-ink ring-accent'
                : 'text-ink-2 ring-[var(--hairline-strong)]'
            }`}
          >
            {label}
            {k === 'review' && counts.review ? ` · ${counts.review}` : ''}
          </Link>
        ))}
      </div>

      <Panel className="mt-4">
        {rows.length ? (
          <DataTable head={['Quotation', 'Client', 'Services', 'To begin', 'Status', 'Opens', '']}>
            {rows.map((q) => {
              const t = computeTotals(q.items, Number(q.discount));
              return (
                <tr key={q.id}>
                  <td className="px-6 py-3 text-[0.8125rem] whitespace-nowrap">
                    <Link href={`/admin/quotes/${q.id}`} className="text-accent font-semibold">
                      {q.number}
                    </Link>
                    <span className="text-ink-3 block">{when.format(new Date(q.created_at))}</span>
                  </td>
                  <td className="px-6 py-3 text-[0.8125rem]">
                    <span className="text-ink block font-medium">{q.name}</span>
                    <span className="text-ink-3 block">
                      {q.company ?? q.email ?? q.phone ?? '—'}
                    </span>
                  </td>
                  <td className="text-ink-2 max-w-[18rem] px-6 py-3 text-[0.8125rem]">
                    <span className="line-clamp-2">{summarise(q.items)}</span>
                    <span className="text-ink-3 block text-[0.75rem]">via {q.source}</span>
                  </td>
                  <td className="text-ink px-6 py-3 text-[0.8125rem] whitespace-nowrap tabular-nums">
                    {inr(t.dueNow)}
                    {t.month ? <span className="text-ink-3 block">+ {inr(t.month)}/mo</span> : null}
                  </td>
                  <td className="px-6 py-3">
                    <Pill tone={TONE[q.status] ?? 'neutral'}>{q.status.replace('_', ' ')}</Pill>
                    {q.hold_reason && q.status === 'pending_review' ? (
                      <span className="text-ink-3 mt-1 block max-w-[14rem] text-[0.75rem]">
                        {q.hold_reason}
                      </span>
                    ) : null}
                  </td>
                  <td className="text-ink-2 px-6 py-3 text-[0.8125rem] whitespace-nowrap">
                    {q.view_count}
                    <span className="text-ink-3 block text-[0.75rem]">score {q.score}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {q.status === 'pending_review' ? (
                      <form action={sendQuoteNow}>
                        <input type="hidden" name="id" value={q.id} />
                        <SubmitButton className="h-9" pendingText="Sending…">
                          Approve and send
                        </SubmitButton>
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        ) : (
          <EmptyState
            icon={FileSignature}
            title={tab === 'review' ? 'Nothing waiting for you' : 'No quotations here yet'}
            description="Requests from the website and the WhatsApp assistant appear here the moment they come in."
          />
        )}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          title="Your quotation-request link"
          description="Share this anywhere. People choose their services, and the quotation reaches their inbox — never a price on the page."
        >
          <div className="grid gap-3 px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <code className="ref bg-sunken rounded px-2 py-1 text-[0.8125rem]">{base}</code>
              <CopyButton value={base} label="Copy" />
            </div>
            <p className="text-ink-3 text-[0.8125rem]">
              Tagged links show in Analytics and on each quotation, so you can see which channel
              brings serious clients:
            </p>
            <ul className="grid gap-2">
              {SOURCES.map(([k, label]) => (
                <li
                  key={k}
                  className="flex flex-wrap items-center justify-between gap-2 text-[0.8125rem]"
                >
                  <span className="text-ink-2">{label}</span>
                  <CopyButton value={`${base}?src=${k}`} label="Copy link" />
                </li>
              ))}
            </ul>
            <p className="text-ink-3 text-[0.8125rem]">
              Preselect services for a campaign by adding{' '}
              <code className="ref">?s=gstreg,gstret</code>.
            </p>
          </div>
        </Panel>

        <Panel
          title="Filters and defaults"
          description="Decide who gets a quotation automatically and who waits for you."
        >
          <form action={saveQuoteSettings} className="grid gap-4 px-6 py-5">
            <Field label="When a request comes in" htmlFor="qs-mode">
              <select id="qs-mode" name="mode" defaultValue={s.mode} className={ADMIN_FIELD}>
                <option value="auto">Send to everyone who passes the checks</option>
                <option value="qualified">
                  Send only if the score is high enough (recommended)
                </option>
                <option value="manual">Hold every request for my approval</option>
              </select>
            </Field>
            <Field
              label="Minimum score"
              htmlFor="qs-min"
              hint="Out of 100: business email, phone, business name, a real message, service value and urgency each add to it."
            >
              <input
                id="qs-min"
                name="minScore"
                type="number"
                min={0}
                max={100}
                defaultValue={s.minScore}
                className={ADMIN_FIELD}
              />
            </Field>
            <Field
              label="Competitor names, domains or phrases"
              htmlFor="qs-block"
              hint="One per line or comma-separated. A match in the email, name, business or message holds the request for you instead of sending prices. Throwaway email addresses are always held."
            >
              <textarea
                id="qs-block"
                name="blockedTerms"
                rows={3}
                defaultValue={s.blockedTerms}
                placeholder="examplecafirm.com, Example & Associates"
                className={`${ADMIN_FIELD} h-auto py-3`}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link stays open (days)" htmlFor="qs-days">
                <input
                  id="qs-days"
                  name="validDays"
                  type="number"
                  min={1}
                  max={180}
                  defaultValue={s.validDays}
                  className={ADMIN_FIELD}
                />
              </Field>
              <Field
                label="Most opens per link"
                htmlFor="qs-views"
                hint="Stops a link being passed round."
              >
                <input
                  id="qs-views"
                  name="maxViews"
                  type="number"
                  min={1}
                  max={200}
                  defaultValue={s.maxViews}
                  className={ADMIN_FIELD}
                />
              </Field>
              <Field label="Combination saving: from this many services" htmlFor="qs-cmin">
                <input
                  id="qs-cmin"
                  name="comboMinServices"
                  type="number"
                  min={2}
                  max={10}
                  defaultValue={s.comboMinServices}
                  className={ADMIN_FIELD}
                />
              </Field>
              <Field
                label="… takes this % off one-time fees"
                htmlFor="qs-cpct"
                hint="0 switches it off."
              >
                <input
                  id="qs-cpct"
                  name="comboPercent"
                  type="number"
                  min={0}
                  max={30}
                  step="0.5"
                  defaultValue={s.comboPercent}
                  className={ADMIN_FIELD}
                />
              </Field>
            </div>
            <Field label="Line printed under the totals" htmlFor="qs-tax">
              <textarea
                id="qs-tax"
                name="taxNote"
                rows={2}
                required
                defaultValue={s.taxNote}
                className={`${ADMIN_FIELD} h-auto py-3`}
              />
            </Field>
            <label className="text-ink flex items-center gap-2.5 text-[0.875rem] font-medium">
              <input
                type="checkbox"
                name="followUps"
                defaultChecked={settings.automations.quoteFollowUps}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Follow up automatically when a quotation is not opened, or not answered
            </label>
            <div>
              <SubmitButton>Save</SubmitButton>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
