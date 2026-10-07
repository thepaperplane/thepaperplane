import Link from 'next/link';
import {
  CalendarClock,
  Check,
  Clock,
  FileText,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  AcceptPanel,
  AddButton,
  AddonDecision,
  MessageBox,
} from '@/components/quote/quote-actions';
import { PaymentPanel } from '@/components/quote/payment-panel';
import { Checklist } from '@/components/quote/checklist';
import { ProcessFlow } from '@/components/quote/process-flow';
import { checklistFor } from '@/lib/quotes/checklists';
import { dateIN, govTotals, inr, statement } from '@/lib/quotes/engine';
import type { PricedService, QuoteAddonRow, QuoteItem, QuoteRow } from '@/lib/quotes/types';
import { SITE, whatsappLink } from '@/lib/site';
import { cn } from '@/lib/utils';

export type QuoteWork = {
  name: string;
  displayUrl: string;
  url: string;
  sector: string;
  summary: string;
};
export type QuoteStory = {
  id: string;
  author_name: string;
  company: string | null;
  quote: string;
  video_url: string;
};

const PER: Record<string, string> = { once: '', month: ' / month', year: ' / year' };

function priceText(i: QuoteItem): string {
  const base = `${i.from ? 'from ' : ''}${inr(i.unitPrice)}${PER[i.period]}`;
  return i.qty > 1 ? `${inr(i.unitPrice)} × ${i.qty} = ${inr(i.amount)}${PER[i.period]}` : base;
}

const perDay = (amount: number, period: string) =>
  period === 'month' ? amount / 30 : period === 'year' ? amount / 365 : 0;

function Leader({
  left,
  right,
  strong,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        className={cn('text-ink', strong ? 'text-[1.0625rem] font-semibold' : 'text-[0.9375rem]')}
      >
        {left}
      </span>
      <span
        aria-hidden="true"
        className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-[var(--hairline-strong)]"
      />
      <span
        className={cn(
          'text-ink text-right tabular-nums',
          strong ? 'text-[1.0625rem] font-semibold' : 'text-[0.9375rem] font-medium',
        )}
      >
        {right}
      </span>
    </div>
  );
}

function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('bg-surface rounded-[1.1rem] border border-[var(--hairline)]', className)}
    >
      {title ? (
        <h2 className="text-ink border-b border-[var(--hairline)] px-6 py-4 font-[family-name:var(--font-sans)] text-[0.9375rem] font-semibold tracking-normal">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

const esc = (s: string) => s.replace(/[<>&"']/g, '');

/**
 * The quotation, laid out like a menu card: each service a line with a dotted
 * leader to its price, what is included and what we will need folded beneath,
 * the government's charges kept apart from ours, and — once accepted — a
 * running statement that carries every add-on asked for afterwards.
 *
 * Rendered for the client at /q/<token> and, with `admin`, as a preview in
 * the console (no actions, no view counted).
 */
export function QuoteView({
  quote: q,
  addons,
  catalog,
  taxNote,
  payment,
  work,
  stories,
  admin = false,
}: {
  quote: QuoteRow;
  addons: QuoteAddonRow[];
  catalog: PricedService[];
  taxNote: string;
  /** UPI details; shown only on an accepted final quotation. */
  payment?: { upiId: string; upiName: string };
  work: QuoteWork[];
  stories: QuoteStory[];
  admin?: boolean;
}) {
  const st = statement(q, addons);
  const gov = govTotals(q.items);
  const t = st.base;
  const accepted = q.status === 'accepted';
  const open = (q.status === 'sent' || q.status === 'viewed') && !admin;
  const byId = new Map(catalog.map((s) => [s.id, s]));
  const hasWeb = q.items.some((i) => i.serviceId && byId.get(i.serviceId)?.cat === 'web');
  const have = new Set<string | undefined>(q.items.map((i) => i.serviceId));
  q.items.forEach((i) =>
    (i.serviceId ? byId.get(i.serviceId)?.includes : [])?.forEach((x) => have.add(x)),
  );
  const suggestions = [
    ...new Set(q.items.flatMap((i) => (i.serviceId ? (byId.get(i.serviceId)?.related ?? []) : []))),
  ]
    .filter((id) => !have.has(id))
    .map((id) => byId.get(id))
    .filter((s): s is PricedService => Boolean(s?.active))
    .slice(0, 4);
  const first = q.name.split(' ')[0];
  const mark = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='240'><text x='20' y='150' transform='rotate(-22 210 120)' font-family='sans-serif' font-size='15' fill='#7a7f8a'>${esc(`Prepared for ${q.name} · ${q.number}`)}</text></svg>`,
  );
  const recurringLines = q.items.filter((i) => i.period !== 'once');

  return (
    <div className="relative">
      {/* A quiet watermark: if a quotation is shared, whose it is shows. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.07]"
        style={{ backgroundImage: `url("data:image/svg+xml,${mark}")` }}
      />
      <div className="relative z-10 grid gap-6">
        {/* Heading */}
        <header>
          <p className="text-accent text-[0.75rem] font-semibold tracking-[0.1em] uppercase">
            {q.kind === 'final' ? 'Final quotation' : 'Your quotation · starting estimate'}
          </p>
          <h1 className="mt-2 text-[length:var(--text-title-1)] leading-[1.08]">
            {first}, here is what we propose
          </h1>
          <p className="text-ink-2 mt-3 text-[0.9375rem] leading-relaxed">
            Prepared for <strong className="text-ink">{q.name}</strong>
            {q.company ? ` · ${q.company}` : ''} · {q.number} ·{' '}
            {accepted
              ? `accepted ${dateIN(q.accepted_at ?? q.updated_at)}`
              : `open until ${dateIN(q.valid_until)}`}
          </p>
          {q.note_to_client ? (
            <p className="bg-accent-wash text-ink mt-5 rounded-[var(--radius-md)] px-5 py-4 text-[0.9375rem] leading-relaxed">
              {q.note_to_client}
            </p>
          ) : null}
        </header>

        {/* The menu card */}
        <Card title="Your services">
          <ul className="divide-y divide-[var(--hairline)]">
            {q.items.map((i, idx) => {
              const svc = i.serviceId ? byId.get(i.serviceId) : undefined;
              const day = perDay(i.amount, i.period);
              return (
                <li key={i.key} className="px-6 py-5">
                  <Leader
                    strong
                    left={
                      <>
                        {i.name}
                        {i.label ? (
                          <span className="text-ink-2 font-normal"> — {i.label}</span>
                        ) : null}
                        {i.addedByClient ? (
                          <span className="bg-accent-wash text-accent ml-2 rounded-full px-2 py-0.5 align-middle text-[0.6875rem] font-semibold">
                            added by you
                          </span>
                        ) : null}
                      </>
                    }
                    right={priceText(i)}
                  />
                  {day > 0 ? (
                    <p className="text-ink-3 mt-1 text-right text-[0.8125rem]">
                      about {inr(day)} a day
                    </p>
                  ) : null}
                  {i.value ? (
                    <p className="text-ink-2 mt-2 text-[0.9375rem] leading-relaxed italic">
                      {i.value}
                    </p>
                  ) : null}
                  {i.note ? (
                    <p className="text-ink-3 mt-2 text-[0.8125rem] leading-relaxed">{i.note}</p>
                  ) : null}

                  {i.includes?.length ? (
                    <p className="text-ink-2 mt-3 flex flex-wrap items-center gap-2 text-[0.8125rem]">
                      <span className="text-positive font-semibold">
                        Also included in this fee:
                      </span>
                      {i.includes.map((x) => (
                        <span
                          key={x}
                          className="bg-positive/10 text-positive rounded-full px-2.5 py-0.5 font-semibold"
                        >
                          {x}
                        </span>
                      ))}
                    </p>
                  ) : null}

                  {svc ? (
                    <div className="mt-3 grid gap-2">
                      <details className="group">
                        <summary className="text-accent cursor-pointer text-[0.875rem] font-semibold">
                          What you get
                        </summary>
                        <ul className="text-ink-2 mt-2 grid gap-1.5 text-[0.875rem]">
                          {svc.what.map((w) => (
                            <li key={w} className="flex gap-2">
                              <Check
                                className="text-positive mt-0.5 h-4 w-4 shrink-0"
                                aria-hidden="true"
                              />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </details>
                      {(() => {
                        const cl = i.serviceId ? checklistFor(i.serviceId, i.variantId) : null;
                        return (
                          <details open={idx === 0}>
                            <summary className="text-accent cursor-pointer text-[0.875rem] font-semibold">
                              What we need from you, and how it works
                              <span className="text-ink-3 ml-2 font-normal">
                                {cl ? `${cl.count} items · ` : ''}
                                {svc.steps.length} steps
                              </span>
                            </summary>
                            <div className="mt-4 grid gap-6">
                              {svc.steps.length ? (
                                <div>
                                  <h4 className="text-ink mb-3 font-[family-name:var(--font-sans)] text-[1rem] font-semibold tracking-normal">
                                    How it works
                                  </h4>
                                  <ProcessFlow steps={svc.steps} label={`How ${svc.name} works`} />
                                </div>
                              ) : null}
                              {cl ? (
                                <>
                                  <p className="bg-accent-wash text-ink flex gap-2.5 rounded-[var(--radius-md)] px-4 py-3 text-[0.875rem] leading-relaxed">
                                    <Clock
                                      className="text-accent mt-0.5 h-4 w-4 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span>
                                      <strong>Processing time.</strong> {cl.timeline}
                                    </span>
                                  </p>
                                  <Checklist
                                    groups={cl.groups}
                                    title={`${svc.name}${i.label ? ` – ${i.label}` : ''}: please share`}
                                  />
                                </>
                              ) : svc.docs.length ? (
                                <ul className="text-ink-2 ml-5 list-disc text-[0.875rem]">
                                  {svc.docs.map((d) => (
                                    <li key={d}>{d}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          </details>
                        );
                      })()}
                    </div>
                  ) : null}

                  {i.gov && i.gov.length ? (
                    <div className="bg-sunken mt-4 rounded-[var(--radius-md)] px-4 py-3">
                      <p className="text-ink-3 text-[0.75rem] font-semibold tracking-[0.05em] uppercase">
                        Government charges — separate from our fee, at actual cost
                      </p>
                      <ul className="mt-1.5 grid gap-1 text-[0.8125rem]">
                        {i.gov.map((g) => (
                          <li key={g.label} className="text-ink-2">
                            <strong className="text-ink">{g.label}:</strong>{' '}
                            {g.amount === null
                              ? 'confirmed before we file'
                              : g.amount === 0
                                ? 'none'
                                : `about ${inr(g.amount)}${g.per === 'year' ? ' a year' : ''}`}
                            {g.note ? <span className="text-ink-3"> — {g.note}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {/* Totals */}
          <div className="bg-sunken grid gap-2.5 rounded-b-[1.1rem] border-t border-[var(--hairline)] px-6 py-5">
            {t.once > 0 ? <Leader left="Our fees, one-time" right={inr(t.once)} /> : null}
            {t.discount > 0 ? (
              <Leader left="Combination saving" right={`− ${inr(t.discount)}`} />
            ) : null}
            {t.once > 0 ? <Leader strong left="To begin" right={inr(t.dueNow)} /> : null}
            {t.month > 0 ? <Leader strong left="Every month" right={inr(t.month)} /> : null}
            {t.year > 0 ? <Leader strong left="Every year" right={inr(t.year)} /> : null}
            {gov.lines.length ? (
              <p className="text-ink-3 mt-1 text-[0.8125rem] leading-relaxed">
                Government charges are paid at actual cost and are not in the figures above
                {gov.once > 0 || gov.year > 0
                  ? `; the known ones come to about ${[gov.once > 0 ? inr(gov.once) : '', gov.year > 0 ? `${inr(gov.year)} a year` : ''].filter(Boolean).join(' plus ')}`
                  : ''}
                {gov.atActual
                  ? `, and ${gov.atActual === 1 ? 'one more depends' : `${gov.atActual} more depend`} on your state or case and will be confirmed before we file`
                  : ''}
                .
              </p>
            ) : null}
            <p className="text-ink-3 text-[0.8125rem] leading-relaxed">{taxNote}</p>
            {recurringLines.length ? (
              <p className="text-ink-3 text-[0.8125rem] leading-relaxed">
                Monthly and yearly services continue until you ask us to stop.
              </p>
            ) : null}
          </div>
        </Card>

        {/* Why an estimate */}
        <Card title="Why this is an estimate, not a flat rate">
          <div className="text-ink-2 grid gap-3 px-6 py-5 text-[0.9375rem] leading-relaxed">
            <p>
              Two businesses asking for the same service are rarely the same: different papers,
              different choices, different plans. A flat rate would overcharge one of you or cut a
              corner for the other. So this is our starting estimate from what you told us.
            </p>
            <p>
              After a short conversation — where we understand your business, your papers and what
              you prefer — we confirm your final quotation in writing. Once you agree it, that is
              the fee for that scope.
            </p>
            <p className="flex gap-2.5">
              <ShieldCheck className="text-accent mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                If you ask for something beyond the agreed scope while we work, we tell you the
                price first and begin only with your approval. Every add-on is recorded and appears
                on your final invoice beside this quotation, so you can always see what you asked
                for and what it cost.
              </span>
            </p>
          </div>
        </Card>

        {/* Suggestions */}
        {suggestions.length && (open || admin) ? (
          <Card title="People who ask for this often add">
            <ul className="divide-y divide-[var(--hairline)]">
              {suggestions.map((s) => {
                const v = s.variants[0]!;
                return (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="max-w-xl min-w-0">
                      <p className="text-ink text-[0.9375rem] font-semibold">{s.name}</p>
                      <p className="text-ink-2 mt-0.5 text-[0.875rem]">{s.value || s.line}</p>
                      <p className="text-ink-3 mt-1 text-[0.8125rem]">
                        {s.from || s.variants.length > 1 ? 'from ' : ''}
                        {inr(Math.min(...s.variants.map((x) => x.price)))}
                        {PER[v.period]}
                      </p>
                    </div>
                    {open ? (
                      <AddButton token={q.token} serviceId={s.id} label="Add to my quotation" />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : null}

        {/* Web: proof */}
        {hasWeb && (work.length || stories.length) ? (
          <Card title="Websites we have built">
            <div className="grid gap-4 px-6 py-5">
              {work.map((w) => (
                <div key={w.url} className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-xl min-w-0">
                    <p className="text-ink text-[0.9375rem] font-semibold">{w.name}</p>
                    <p className="text-ink-3 text-[0.8125rem]">{w.sector}</p>
                    <p className="text-ink-2 mt-1 text-[0.875rem] leading-relaxed">{w.summary}</p>
                  </div>
                  <a
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent text-[0.875rem] font-semibold"
                  >
                    Visit {w.displayUrl}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              ))}
              {stories.map((s) => (
                <div key={s.id} className="border-t border-[var(--hairline)] pt-4">
                  <p className="text-ink-2 text-[0.9375rem] leading-relaxed">“{s.quote}”</p>
                  <p className="text-ink mt-2 text-[0.875rem] font-semibold">
                    {s.author_name}
                    {s.company ? (
                      <span className="text-ink-3 font-normal"> · {s.company}</span>
                    ) : null}
                  </p>
                  <a
                    href={s.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent mt-1 inline-flex h-10 items-center gap-2 text-[0.875rem] font-semibold"
                  >
                    <PlayCircle className="h-5 w-5" aria-hidden="true" /> Watch the video
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              ))}
              <Link href="/work" className="text-accent text-[0.875rem] font-semibold">
                See all our work
              </Link>
            </div>
          </Card>
        ) : null}

        {/* Add-ons and the running statement */}
        {accepted || addons.length ? (
          <Card title="Statement of charges">
            <div className="grid gap-2.5 px-6 py-5">
              <p className="text-ink-3 text-[0.8125rem] leading-relaxed">
                This is the running record of what has been agreed. Anything asked for beyond the
                quotation is added here with its price, only after you approve it, and carries onto
                your final invoice.
              </p>
              <Leader left={`Quotation ${q.number}`} right={inr(t.dueNow)} />
              {st.approved.map((a) => (
                <Leader
                  key={a.id}
                  left={
                    <>
                      Add-on · {a.title}
                      <span className="text-ink-3 ml-2 text-[0.75rem]">
                        {dateIN(a.decided_at ?? a.created_at)}
                      </span>
                    </>
                  }
                  right={inr(Number(a.amount))}
                />
              ))}
              <Leader strong left="Agreed so far (one-time)" right={inr(st.grand)} />
              {t.month > 0 || t.year > 0 ? (
                <p className="text-ink-3 text-[0.8125rem]">
                  Plus {t.month > 0 ? `${inr(t.month)} a month` : ''}
                  {t.month > 0 && t.year > 0 ? ' and ' : ''}
                  {t.year > 0 ? `${inr(t.year)} a year` : ''} for ongoing services.
                </p>
              ) : null}
            </div>
            {st.proposed.length ? (
              <div className="border-t border-[var(--hairline)] px-6 py-5">
                <h3 className="text-ink font-[family-name:var(--font-sans)] text-[0.9375rem] font-semibold tracking-normal">
                  Waiting for your approval
                </h3>
                <ul className="mt-3 grid gap-4">
                  {st.proposed.map((a) => (
                    <li key={a.id} className="grid gap-2">
                      <Leader left={a.title} right={inr(Number(a.amount))} />
                      {a.details ? <p className="text-ink-2 text-[0.875rem]">{a.details}</p> : null}
                      {!admin ? (
                        <AddonDecision token={q.token} id={a.id} />
                      ) : (
                        <p className="text-ink-3 text-[0.8125rem]">Awaiting the client.</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        ) : null}

        {accepted && q.kind === 'final' && payment?.upiId && st.grand > 0 ? (
          <PaymentPanel
            upiId={payment.upiId}
            upiName={payment.upiName}
            amount={st.grand}
            reference={q.number}
          />
        ) : null}

        {/* Next steps */}
        {open ? (
          <Card title="Ready to go ahead?">
            <div className="grid gap-8 px-6 py-6">
              <AcceptPanel token={q.token} defaultName={q.name} />
              <div className="grid gap-3 border-t border-[var(--hairline)] pt-6 sm:grid-cols-2">
                <Link
                  href="/book"
                  className="text-ink inline-flex items-center gap-3 rounded-[var(--radius-md)] p-4 ring-1 ring-[var(--hairline-strong)] ring-inset"
                >
                  <CalendarClock className="text-accent h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-[0.9375rem] font-semibold">Talk first</span>
                    <span className="text-ink-3 block text-[0.8125rem]">
                      A free call to confirm your final figure
                    </span>
                  </span>
                </Link>
                <a
                  href={whatsappLink(`Hello, I have a question about quotation ${q.number}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink inline-flex items-center gap-3 rounded-[var(--radius-md)] p-4 ring-1 ring-[var(--hairline-strong)] ring-inset"
                >
                  <MessageCircle className="text-accent h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-[0.9375rem] font-semibold">Ask on WhatsApp</span>
                    <span className="text-ink-3 block text-[0.8125rem]">
                      We reply during working hours
                    </span>
                  </span>
                </a>
              </div>
              <MessageBox token={q.token} />
            </div>
          </Card>
        ) : accepted && !admin ? (
          <Card title="What happens next">
            <div className="text-ink-2 grid gap-3 px-6 py-5 text-[0.9375rem] leading-relaxed">
              <p className="flex gap-2.5">
                <FileText className="text-accent mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                <span>
                  Thank you. We will call you to understand your needs fully and confirm the final
                  scope and fee in writing before any work begins. Your documents, invoices and
                  deadlines will be in your{' '}
                  <Link href="/portal" className="text-accent font-semibold underline">
                    client portal
                  </Link>
                  .
                </span>
              </p>
            </div>
          </Card>
        ) : null}

        <footer className="text-ink-3 pb-4 text-[0.8125rem] leading-relaxed">
          <p>
            {SITE.name} · {SITE.email} · {SITE.phone}. This quotation is private to {q.name} and
            stays open until {dateIN(q.valid_until)}.
          </p>
        </footer>
      </div>
    </div>
  );
}
