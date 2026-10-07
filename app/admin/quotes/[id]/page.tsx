import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ADMIN_FIELD, DataTable, Field, PageHeader, Panel, Pill } from '@/components/admin/ui';
import { CopyButton, SubmitButton } from '@/components/admin/form-bits';
import { QuoteView } from '@/components/quote/quote-view';
import {
  addAddon,
  createInvoiceFromQuote,
  deleteQuote,
  remindAddon,
  removeAddon,
  renewQuote,
  sendQuoteNow,
  setAddonStatus,
  setQuoteStatus,
} from '@/app/admin/_actions/quotes';
import { requireRole } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { loadPortfolio } from '@/lib/portfolio';
import { loadTestimonials } from '@/lib/public-data';
import {
  dateIN,
  getAddons,
  getCatalog,
  govTotals,
  inr,
  quoteUrl,
  statement,
} from '@/lib/quotes/engine';
import { serviceClient } from '@/lib/supabase';
import type { QuoteViewRow } from '@/lib/quotes/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Quotation' };

const when = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

const FLASH: Record<string, string> = {
  'sent=email': 'Emailed to the client.',
  'sent=whatsapp': 'Sent on WhatsApp.',
  'sent=email+whatsapp': 'Sent by email and on WhatsApp.',
  'sent=none':
    'Not sent — there is no working email address, and WhatsApp only allows a message within a day of theirs. Copy the link below and send it yourself.',
  'saved=1': 'Saved.',
  'invoice=created': 'Invoice created as a draft. Find it under the client’s invoices.',
  'invoice=failed': 'The invoice could not be created — the number may already be in use.',
};

export default async function QuoteDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole('editor');
  const { id } = await params;
  const sp = await searchParams;
  const supabase = serviceClient();
  if (!supabase || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data: q } = await supabase.from('quotes').select('*').eq('id', id).maybeSingle();
  if (!q) notFound();
  const [addons, catalog, settings, views, projects, testimonials] = await Promise.all([
    getAddons(q.id),
    getCatalog(),
    getSettings(),
    supabase
      .from('quote_views')
      .select('*')
      .eq('quote_id', q.id)
      .order('at', { ascending: false })
      .limit(30),
    loadPortfolio().catch(() => []),
    loadTestimonials().catch(() => []),
  ]);
  const viewRows: QuoteViewRow[] = views.data ?? [];
  const distinct = new Set(viewRows.map((v) => v.ip_hash).filter(Boolean)).size;
  const st = statement(q, addons);
  const gov = govTotals(q.items);
  const url = quoteUrl(q.token);
  const flash = Object.entries(sp)
    .map(([k, v]) => FLASH[`${k}=${v}`])
    .find(Boolean);
  const suggestedNumber = `INV-${q.number.replace('PP-Q-', '')}`;
  const canInvoice = q.status === 'accepted' && !q.invoice_id;

  return (
    <>
      <PageHeader
        title={q.number}
        description={`${q.name}${q.company ? ` · ${q.company}` : ''} — ${q.kind === 'final' ? 'final quotation' : 'starting estimate'}, via ${q.source}.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Pill
              tone={
                q.status === 'accepted'
                  ? 'positive'
                  : q.status === 'pending_review'
                    ? 'caution'
                    : 'accent'
              }
            >
              {q.status.replace('_', ' ')}
            </Pill>
            <Link
              href={`/admin/quotes/${q.id}/edit`}
              className="text-ink-2 inline-flex h-10 items-center rounded-[var(--radius-md)] px-4 text-[0.875rem] font-semibold ring-1 ring-[var(--hairline-strong)] ring-inset"
            >
              Edit
            </Link>
          </div>
        }
      />
      {flash ? (
        <p
          role="status"
          className="bg-sunken text-ink mb-5 rounded-[var(--radius-md)] px-4 py-3 text-[0.875rem] font-medium"
        >
          {flash}
        </p>
      ) : null}
      {q.status === 'pending_review' ? (
        <p
          role="status"
          className="bg-caution/10 text-ink mb-5 rounded-[var(--radius-md)] px-4 py-3 text-[0.875rem]"
        >
          <strong>Held for your review:</strong> {q.hold_reason}. Nothing has been sent. Check the
          details, then send it.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <Panel title="Totals">
            <div className="grid gap-2 px-6 py-5 text-[0.9375rem]">
              <p className="text-ink">
                To begin: <strong>{inr(st.base.dueNow)}</strong>
                {st.base.discount ? (
                  <span className="text-ink-3"> (after {inr(st.base.discount)} off)</span>
                ) : null}
              </p>
              {st.base.month ? (
                <p className="text-ink">
                  Monthly: <strong>{inr(st.base.month)}</strong>
                </p>
              ) : null}
              {st.base.year ? (
                <p className="text-ink">
                  Yearly: <strong>{inr(st.base.year)}</strong>
                </p>
              ) : null}
              {st.addonTotal ? (
                <p className="text-ink">
                  Approved add-ons: <strong>{inr(st.addonTotal)}</strong> → agreed so far{' '}
                  <strong>{inr(st.grand)}</strong>
                </p>
              ) : null}
              {gov.lines.length ? (
                <p className="text-ink-3 text-[0.8125rem]">
                  Government charges shown to the client separately: about {inr(gov.once)}
                  {gov.year ? ` + ${inr(gov.year)}/yr` : ''}
                  {gov.atActual ? `, ${gov.atActual} at actual` : ''}.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Add-ons asked for after the quotation"
            description="Anything beyond the original scope is priced here, approved by the client, and carried onto the final invoice with its date."
          >
            {addons.length ? (
              <DataTable head={['Added', 'What', 'Amount', 'Status', '']}>
                {addons.map((a) => (
                  <tr key={a.id}>
                    <td className="text-ink-3 px-6 py-3 text-[0.8125rem] whitespace-nowrap">
                      {when.format(new Date(a.created_at))}
                      <span className="block">
                        {a.requested_by === 'client' ? 'asked by client' : 'suggested by us'}
                      </span>
                    </td>
                    <td className="text-ink px-6 py-3 text-[0.8125rem]">
                      <span className="font-medium">{a.title}</span>
                      {a.details ? <span className="text-ink-3 block">{a.details}</span> : null}
                    </td>
                    <td className="text-ink px-6 py-3 text-[0.8125rem] tabular-nums">
                      {inr(Number(a.amount))}
                    </td>
                    <td className="px-6 py-3">
                      <Pill
                        tone={
                          a.status === 'approved' || a.status === 'billed'
                            ? 'positive'
                            : a.status === 'declined'
                              ? 'critical'
                              : 'caution'
                        }
                      >
                        {a.status}
                      </Pill>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {a.status === 'proposed' ? (
                          <>
                            <form action={setAddonStatus}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="status" value="approved" />
                              <SubmitButton
                                tone="quiet"
                                className="h-8 px-3 text-[0.75rem]"
                                pendingText="…"
                              >
                                Client agreed
                              </SubmitButton>
                            </form>
                            <form action={remindAddon}>
                              <input type="hidden" name="id" value={a.id} />
                              <SubmitButton
                                tone="quiet"
                                className="h-8 px-3 text-[0.75rem]"
                                pendingText="…"
                              >
                                Ask them
                              </SubmitButton>
                            </form>
                          </>
                        ) : null}
                        {a.status !== 'billed' ? (
                          <form action={removeAddon}>
                            <input type="hidden" name="id" value={a.id} />
                            <SubmitButton
                              tone="danger"
                              className="h-8 px-3 text-[0.75rem]"
                              confirm="Remove this add-on?"
                              pendingText="…"
                            >
                              Remove
                            </SubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <p className="text-ink-3 px-6 py-5 text-[0.875rem]">None yet.</p>
            )}
            <form
              action={addAddon}
              className="grid gap-3 border-t border-[var(--hairline)] px-6 py-5 md:grid-cols-[minmax(0,1fr)_9rem]"
            >
              <input type="hidden" name="quote_id" value={q.id} />
              <input type="hidden" name="requested_by" value="client" />
              <Field label="Add-on or extra feature" htmlFor="ad-title" required>
                <input
                  id="ad-title"
                  name="title"
                  required
                  placeholder="e.g. Extra page: Careers"
                  className={ADMIN_FIELD}
                />
              </Field>
              <Field label="Price (₹)" htmlFor="ad-amt" required>
                <input
                  id="ad-amt"
                  name="amount"
                  type="number"
                  min={0}
                  required
                  className={ADMIN_FIELD}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Details" htmlFor="ad-det">
                  <input
                    id="ad-det"
                    name="details"
                    placeholder="What exactly was asked for"
                    className={ADMIN_FIELD}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                <label className="text-ink-2 flex items-center gap-2 text-[0.8125rem]">
                  <input
                    type="checkbox"
                    name="already_agreed"
                    className="h-4 w-4 accent-[var(--accent)]"
                  />{' '}
                  They already agreed to this price
                </label>
                <label className="text-ink-2 flex items-center gap-2 text-[0.8125rem]">
                  <input
                    type="checkbox"
                    name="notify"
                    defaultChecked
                    className="h-4 w-4 accent-[var(--accent)]"
                  />{' '}
                  Email them to approve
                </label>
                <SubmitButton>Add to the statement</SubmitButton>
              </div>
            </form>
          </Panel>

          <Panel
            title="Final invoice"
            description="One invoice that lists the original quotation first, then every approved add-on with its date and price."
          >
            <div className="grid gap-3 px-6 py-5">
              {q.invoice_id ? (
                <p className="text-ink text-[0.9375rem]">
                  An invoice has been created from this quotation.{' '}
                  <Link href="/admin/invoices" className="text-accent font-semibold">
                    Open invoices
                  </Link>
                </p>
              ) : canInvoice ? (
                <form action={createInvoiceFromQuote} className="grid gap-3 sm:grid-cols-3">
                  <input type="hidden" name="id" value={q.id} />
                  <Field label="Invoice number" htmlFor="iv-no" required>
                    <input
                      id="iv-no"
                      name="number"
                      required
                      defaultValue={suggestedNumber}
                      className={ADMIN_FIELD}
                    />
                  </Field>
                  <Field label="Due on" htmlFor="iv-due">
                    <input id="iv-due" name="due_on" type="date" className={ADMIN_FIELD} />
                  </Field>
                  <Field label="GST on top (₹)" htmlFor="iv-tax">
                    <input
                      id="iv-tax"
                      name="tax_amount"
                      type="number"
                      min={0}
                      defaultValue={0}
                      className={ADMIN_FIELD}
                    />
                  </Field>
                  <div className="sm:col-span-3">
                    <p className="text-ink-3 mb-3 text-[0.8125rem]">
                      Amount: <strong className="text-ink">{inr(st.grand)}</strong> — the quotation
                      plus {st.approved.length} approved add-on{st.approved.length === 1 ? '' : 's'}
                      . Recurring services and government fees are billed separately.
                    </p>
                    <SubmitButton pendingText="Creating…">Create the invoice</SubmitButton>
                  </div>
                </form>
              ) : (
                <p className="text-ink-3 text-[0.875rem]">
                  Available once the client has accepted the quotation.
                </p>
              )}
            </div>
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel title="The client’s link">
            <div className="grid gap-3 px-6 py-5 text-[0.875rem]">
              <div className="flex flex-wrap items-center gap-2">
                <code className="ref bg-sunken max-w-full truncate rounded px-2 py-1 text-[0.75rem]">
                  {url}
                </code>
                <CopyButton value={url} label="Copy" />
              </div>
              <p className="text-ink-3">
                Open until {dateIN(q.valid_until)} · {q.view_count} of {q.max_views} opens used
                {q.sent_at
                  ? ` · sent ${when.format(new Date(q.sent_at))} by ${q.sent_via.join(' and ')}`
                  : ' · not sent yet'}
                .
              </p>
              {distinct >= 4 ? (
                <p className="bg-caution/10 text-ink rounded-[var(--radius-md)] px-3 py-2">
                  Opened from {distinct} different addresses — the link may be being passed around.
                  Renew it to give the client a fresh private link.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <form action={sendQuoteNow}>
                  <input type="hidden" name="id" value={q.id} />
                  <SubmitButton pendingText="Sending…">
                    {q.sent_at ? 'Send again' : 'Send to the client'}
                  </SubmitButton>
                </form>
                <form action={renewQuote} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="days" value={settings.quotes.validDays} />
                  <SubmitButton
                    tone="quiet"
                    confirm="This gives a new link and switches the old one off. Continue?"
                    pendingText="…"
                  >
                    Renew the link
                  </SubmitButton>
                </form>
              </div>
            </div>
          </Panel>

          <Panel title="Who and how">
            <dl className="grid gap-2 px-6 py-5 text-[0.875rem]">
              {[
                ['Email', q.email],
                ['Phone', q.phone],
                ['Score', `${q.score} / 100`],
                ['Source', Object.values(q.utm).filter(Boolean).join(' · ') || q.source],
                ['Created', when.format(new Date(q.created_at))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="text-ink text-right">{v || '—'}</dd>
                </div>
              ))}
              {q.requirement ? (
                <p className="text-ink-2 border-t border-[var(--hairline)] pt-3 whitespace-pre-wrap">
                  {q.requirement}
                </p>
              ) : null}
              {q.enquiry_id ? (
                <Link href="/admin/enquiries" className="text-accent font-semibold">
                  Open enquiries
                </Link>
              ) : null}
              {q.client_id ? (
                <Link href={`/admin/clients/${q.client_id}`} className="text-accent font-semibold">
                  Open the client
                </Link>
              ) : null}
            </dl>
          </Panel>

          <Panel title="Status">
            <div className="flex flex-wrap gap-2 px-6 py-5">
              {q.status !== 'accepted' ? (
                <form action={setQuoteStatus}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="status" value="accepted" />
                  <SubmitButton
                    tone="quiet"
                    confirm="Record that the client has agreed? This creates their client record."
                    pendingText="…"
                  >
                    Client agreed (by phone)
                  </SubmitButton>
                </form>
              ) : null}
              {q.status !== 'void' ? (
                <form action={setQuoteStatus}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="status" value="void" />
                  <SubmitButton
                    tone="quiet"
                    confirm="Withdraw this quotation? The link stops working."
                    pendingText="…"
                  >
                    Withdraw
                  </SubmitButton>
                </form>
              ) : null}
              <form action={deleteQuote}>
                <input type="hidden" name="id" value={q.id} />
                <SubmitButton
                  tone="danger"
                  confirm="Delete this quotation and its add-ons permanently?"
                  pendingText="…"
                >
                  Delete
                </SubmitButton>
              </form>
            </div>
          </Panel>

          <Panel title="Opens" description="Addresses are stored only as one-way hashes.">
            {viewRows.length ? (
              <ul className="divide-y divide-[var(--hairline)]">
                {viewRows.map((v) => (
                  <li
                    key={v.id}
                    className="text-ink-2 flex justify-between gap-4 px-6 py-2.5 text-[0.8125rem]"
                  >
                    <span>{when.format(new Date(v.at))}</span>
                    <span className="text-ink-3 truncate">{(v.user_agent ?? '').slice(0, 40)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-3 px-6 py-5 text-[0.875rem]">Not opened yet.</p>
            )}
          </Panel>
        </div>
      </div>

      <details className="bg-surface mt-6 rounded-[var(--radius-md)] border">
        <summary className="text-ink cursor-pointer px-6 py-4 text-[0.9375rem] font-semibold">
          What the client sees
        </summary>
        <div className="bg-ground border-t border-[var(--hairline)] p-6">
          <div className="mx-auto max-w-3xl">
            <QuoteView
              admin
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
          </div>
        </div>
      </details>
    </>
  );
}
