'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MailCheck,
  MessageCircleQuestion,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import './quote.css';

export type FormService = {
  id: string;
  cat: string;
  name: string;
  line: string;
  ask: 'variant' | 'qty' | null;
  askLabel: string;
  variants: { id: string; label: string }[];
  defaultVariant: string;
  includes: string[];
};

type Pick = { variant?: string; qty?: number };

const FIELD =
  'w-full rounded-[var(--radius-md)] bg-surface px-4 text-[1rem] text-ink ring-1 ring-inset ring-[var(--hairline-strong)] outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-accent';

const TIMELINES: [string, string][] = [
  ['urgent', 'As soon as possible'],
  ['month', 'This month'],
  ['quarter', 'In a few months'],
  ['exploring', 'Just exploring'],
];

const STEPS = ['What you need', 'A few questions', 'Where to send it'];

/**
 * A quotation request in three short screens instead of one long form:
 * choose, answer a tap or two, say where to send it. Nothing is asked that
 * the quotation does not need, each screen has one job, and the choices made
 * on the way stay visible. No prices appear anywhere: the quotation is built
 * on the server and emailed to the address given.
 */
export function RequestForm({
  services,
  categories,
  preselected,
  src,
}: {
  services: FormService[];
  categories: { id: string; label: string; line: string }[];
  preselected: string[];
  src: { source: string; medium: string; campaign: string };
}) {
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState(
    () => services.find((s) => preselected.includes(s.id))?.cat ?? categories[0]!.id,
  );
  const [picked, setPicked] = useState<Record<string, Pick>>(() =>
    Object.fromEntries(preselected.map((id) => [id, {}])),
  );
  const [timeline, setTimeline] = useState('');
  const [f, setF] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    website: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { status: 'sent' | 'review'; email: string }>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // Defaults for anything preselected from a link.
  useEffect(() => {
    setPicked((p) =>
      Object.fromEntries(
        Object.keys(p).map((id) => {
          const s = services.find((x) => x.id === id)!;
          return [
            id,
            s.ask === 'variant' ? { variant: s.defaultVariant } : s.ask === 'qty' ? { qty: 1 } : {},
          ];
        }),
      ),
    );
  }, [services]);

  // Move to the new screen's heading, for keyboards and screen readers.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    head.current?.focus({ preventScroll: true });
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step, done]);

  const byId = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const chosen = services.filter((s) => picked[s.id]);
  const includedBy = (id: string) => chosen.find((s) => s.includes.includes(id));
  const asking = chosen.filter((s) => s.ask);

  const toggle = (s: FormService) => {
    if (includedBy(s.id)) return;
    setError('');
    setPicked((p) => {
      const next = { ...p };
      if (next[s.id]) delete next[s.id];
      else {
        next[s.id] =
          s.ask === 'variant' ? { variant: s.defaultVariant } : s.ask === 'qty' ? { qty: 1 } : {};
        s.includes.forEach((id) => delete next[id]); // already inside this one
      }
      return next;
    });
  };

  const goNext = () => {
    setError('');
    if (step === 0 && !chosen.length) {
      setError('Choose at least one service to continue.');
      return;
    }
    setStep((n) => Math.min(2, n + 1));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (f.name.trim().length < 2) return setError('Please enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim()))
      return setError('Please enter a valid email address.');
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/quotes/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...f,
          timeline,
          src,
          services: chosen.map((s) => ({
            id: s.id,
            variant: picked[s.id]?.variant,
            qty: picked[s.id]?.qty,
          })),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: 'sent' | 'review';
        email?: string;
      };
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setDone({ status: body.status ?? 'sent', email: body.email ?? f.email });
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------------------------------------- done ---- */
  if (done) {
    return (
      <div
        ref={top}
        className="wiz-in bg-surface mt-10 rounded-[1.25rem] border border-[var(--hairline)] p-6 sm:p-10"
        role="status"
      >
        <span className="bg-positive text-ground grid h-14 w-14 place-items-center rounded-full">
          <MailCheck className="h-7 w-7" />
        </span>
        <h2 ref={head} tabIndex={-1} className="mt-6 text-[1.625rem] outline-none">
          {done.status === 'sent'
            ? 'Your quotation is on its way'
            : 'We are preparing your quotation'}
        </h2>
        <p className="text-ink-2 mt-3 max-w-xl text-[1rem] leading-relaxed">
          {done.status === 'sent'
            ? `A private link has been emailed to ${done.email}. If you do not see it in a few minutes, check your spam folder.`
            : `A member of the team will look over your request and email your quotation to ${done.email} shortly — usually within the working day.`}
        </p>
        <p className="text-ink-3 mt-3 max-w-xl text-[0.9375rem] leading-relaxed">
          Every business is different, so it is our starting estimate. We confirm the final figure
          after a short conversation to understand you fully.
        </p>
        <a
          href="/book"
          className="bg-accent text-accent-ink mt-7 inline-flex h-12 items-center rounded-full px-6 text-[1rem] font-semibold"
        >
          Book a free call
        </a>
      </div>
    );
  }

  const list = services.filter((s) => s.cat === cat);
  const countIn = (id: string) => chosen.filter((s) => s.cat === id).length;

  return (
    <form onSubmit={submit} noValidate className="mt-8" aria-label="Request a quotation">
      <div ref={top} className="scroll-mt-24" />

      {/* Progress */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map((label, i) => (
            <li key={label}>
              <span
                className={cn(
                  'block h-1.5 rounded-full transition-colors duration-300',
                  i <= step ? 'bg-accent' : 'bg-[var(--hairline-strong)]',
                )}
              />
              <span
                aria-current={i === step ? 'step' : undefined}
                className={cn(
                  'mt-2 flex items-center gap-2 text-[0.8125rem]',
                  i === step ? 'text-ink font-semibold' : 'text-ink-3',
                )}
              >
                <span
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold',
                    i < step
                      ? 'bg-positive text-ground'
                      : i === step
                        ? 'bg-accent text-accent-ink'
                        : 'bg-sunken text-ink-3',
                  )}
                >
                  {i < step ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{i === step ? label : ''}</span>
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <div key={step} className="wiz-in">
        {/* ---------------------------------------------------- step 1 ---- */}
        {step === 0 ? (
          <section aria-labelledby="w-h">
            <h2 id="w-h" ref={head} tabIndex={-1} className="text-[1.5rem] outline-none">
              What do you need?
            </h2>
            <p className="text-ink-2 mt-2 text-[1rem]">
              Pick as many as you like — you can add more later.
            </p>

            <div
              role="tablist"
              aria-label="Kinds of service"
              className="no-scrollbar -mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1"
            >
              {categories.map((c) => {
                const n = countIn(c.id);
                const on = c.id === cat;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setCat(c.id)}
                    className={cn(
                      'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-semibold ring-1 transition-colors ring-inset',
                      on
                        ? 'bg-accent text-accent-ink ring-accent'
                        : 'bg-surface text-ink-2 ring-[var(--hairline-strong)] hover:ring-[var(--accent)]',
                    )}
                  >
                    {c.label}
                    {n ? (
                      <span
                        className={cn(
                          'grid h-5 min-w-5 place-items-center rounded-full px-1 text-[0.6875rem] font-bold',
                          on ? 'bg-accent-ink text-accent' : 'bg-accent text-accent-ink',
                        )}
                      >
                        {n}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="text-ink-3 mt-3 text-[0.875rem]">
              {categories.find((c) => c.id === cat)?.line}
            </p>

            <div role="tabpanel" className="mt-4 grid gap-3 sm:grid-cols-2">
              {list.map((s) => {
                const parent = includedBy(s.id);
                const on = Boolean(picked[s.id]) || Boolean(parent);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    disabled={Boolean(parent)}
                    onClick={() => toggle(s)}
                    className={cn(
                      'flex min-h-[4.75rem] items-start gap-3 rounded-[var(--radius-md)] p-4 text-left ring-1 transition-all ring-inset',
                      parent
                        ? 'bg-positive/5 ring-positive/30 cursor-default'
                        : on
                          ? 'bg-accent-wash ring-accent ring-2'
                          : 'bg-surface ring-[var(--hairline-strong)] hover:-translate-y-0.5 hover:ring-[var(--accent)]',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-inset',
                        parent
                          ? 'bg-positive text-ground ring-positive'
                          : on
                            ? 'bg-accent text-accent-ink ring-accent'
                            : 'ring-[var(--hairline-strong)]',
                      )}
                    >
                      {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="text-ink block text-[1rem] leading-snug font-semibold">
                        {s.name}
                      </span>
                      <span className="text-ink-3 mt-0.5 block text-[0.875rem] leading-snug">
                        {s.line}
                      </span>
                      {parent ? (
                        <span className="text-positive mt-1.5 block text-[0.8125rem] font-semibold">
                          Included with {parent.name}
                        </span>
                      ) : s.includes.length && on ? (
                        <span className="text-positive mt-1.5 block text-[0.8125rem] font-semibold">
                          Includes{' '}
                          {s.includes
                            .map((id) => byId.get(id)?.name)
                            .filter(Boolean)
                            .join(' and ')}
                        </span>
                      ) : s.includes.length ? (
                        <span className="text-ink-3 mt-1.5 block text-[0.8125rem]">
                          Includes{' '}
                          {s.includes
                            .map((id) => byId.get(id)?.name)
                            .filter(Boolean)
                            .join(' and ')}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-sunken mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] px-4 py-3">
              <p className="text-ink-2 text-[0.9375rem]">Not sure what applies to you?</p>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('pp:assistant', {
                      detail: { prompt: 'Which services and registrations does my business need?' },
                    }),
                  )
                }
                className="text-accent inline-flex h-10 items-center gap-2 text-[0.9375rem] font-semibold"
              >
                <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" /> Ask our assistant —
                it explains in plain words
              </button>
            </div>
          </section>
        ) : null}

        {/* ---------------------------------------------------- step 2 ---- */}
        {step === 1 ? (
          <section aria-labelledby="w-h">
            <h2 id="w-h" ref={head} tabIndex={-1} className="text-[1.5rem] outline-none">
              {asking.length ? 'A few quick questions' : 'Just one thing'}
            </h2>
            <p className="text-ink-2 mt-2 text-[1rem]">
              {asking.length
                ? 'One tap each — this helps us size your quotation correctly.'
                : 'There is nothing more to ask about these services.'}
            </p>

            <div className="mt-6 grid gap-4">
              {asking.map((s) => (
                <fieldset
                  key={s.id}
                  className="bg-surface rounded-[var(--radius-md)] border border-[var(--hairline)] p-4 sm:p-5"
                >
                  <legend className="sr-only">{s.name}</legend>
                  <p className="text-ink text-[0.8125rem] font-semibold tracking-[0.06em] uppercase">
                    {s.name}
                  </p>
                  <p className="text-ink mt-1 text-[1rem] font-medium">{s.askLabel}</p>
                  {s.ask === 'variant' && s.variants.length <= 4 ? (
                    <div
                      role="radiogroup"
                      aria-label={s.askLabel}
                      className="mt-3 grid gap-2 sm:grid-cols-2"
                    >
                      {s.variants.map((v) => {
                        const on = picked[s.id]?.variant === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setPicked((p) => ({ ...p, [s.id]: { variant: v.id } }))}
                            className={cn(
                              'flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] px-4 text-left text-[0.9375rem] ring-1 ring-inset',
                              on
                                ? 'bg-accent-wash ring-accent font-semibold ring-2'
                                : 'ring-[var(--hairline-strong)] hover:ring-[var(--accent)]',
                            )}
                          >
                            <span
                              className={cn(
                                'grid h-5 w-5 shrink-0 place-items-center rounded-full ring-1 ring-inset',
                                on ? 'ring-accent' : 'ring-[var(--hairline-strong)]',
                              )}
                            >
                              {on ? <span className="bg-accent h-2.5 w-2.5 rounded-full" /> : null}
                            </span>
                            {v.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : s.ask === 'variant' ? (
                    <select
                      aria-label={s.askLabel}
                      value={picked[s.id]?.variant}
                      onChange={(e) =>
                        setPicked((p) => ({ ...p, [s.id]: { variant: e.target.value } }))
                      }
                      className={cn(FIELD, 'mt-3 h-12')}
                    >
                      {s.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full ring-1 ring-[var(--hairline-strong)] ring-inset">
                      <button
                        type="button"
                        aria-label="One fewer"
                        onClick={() =>
                          setPicked((p) => ({
                            ...p,
                            [s.id]: { qty: Math.max(1, (p[s.id]?.qty ?? 1) - 1) },
                          }))
                        }
                        className="grid h-11 w-11 place-items-center rounded-full"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span
                        className="min-w-8 text-center text-[1.0625rem] font-semibold tabular-nums"
                        aria-live="polite"
                      >
                        {picked[s.id]?.qty ?? 1}
                      </span>
                      <button
                        type="button"
                        aria-label="One more"
                        onClick={() =>
                          setPicked((p) => ({
                            ...p,
                            [s.id]: { qty: Math.min(20, (p[s.id]?.qty ?? 1) + 1) },
                          }))
                        }
                        className="grid h-11 w-11 place-items-center rounded-full"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </fieldset>
              ))}

              <fieldset className="bg-surface rounded-[var(--radius-md)] border border-[var(--hairline)] p-4 sm:p-5">
                <legend className="sr-only">When do you need this</legend>
                <p className="text-ink text-[1rem] font-medium">When do you need this?</p>
                <div
                  role="radiogroup"
                  aria-label="When do you need this"
                  className="mt-3 flex flex-wrap gap-2"
                >
                  {TIMELINES.map(([v, l]) => {
                    const on = timeline === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setTimeline(on ? '' : v)}
                        className={cn(
                          'inline-flex h-11 items-center rounded-full px-4 text-[0.9375rem] ring-1 ring-inset',
                          on
                            ? 'bg-accent text-accent-ink ring-accent font-semibold'
                            : 'ring-[var(--hairline-strong)] hover:ring-[var(--accent)]',
                        )}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label htmlFor="q-message" className="text-ink text-[1rem] font-medium">
                  Anything we should know?{' '}
                  <span className="text-ink-3 text-[0.875rem] font-normal">(optional)</span>
                </label>
                <textarea
                  id="q-message"
                  rows={3}
                  value={f.message}
                  onChange={(e) => setF({ ...f, message: e.target.value })}
                  placeholder="For example: a shop selling goods, about ₹10 lakh a year, selling only in Tamil Nadu."
                  className={cn(FIELD, 'mt-2 h-auto py-3')}
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* ---------------------------------------------------- step 3 ---- */}
        {step === 2 ? (
          <section aria-labelledby="w-h">
            <h2 id="w-h" ref={head} tabIndex={-1} className="text-[1.5rem] outline-none">
              Where shall we send it?
            </h2>
            <p className="text-ink-2 mt-2 text-[1rem]">
              Your quotation arrives as a private link in your inbox.
            </p>

            <div className="bg-sunken mt-5 rounded-[var(--radius-md)] px-4 py-3">
              <p className="text-ink-3 text-[0.75rem] font-semibold tracking-[0.06em] uppercase">
                Your quotation covers
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {chosen.map((s) => (
                  <li
                    key={s.id}
                    className="bg-surface text-ink inline-flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3 text-[0.8125rem] font-medium ring-1 ring-[var(--hairline)] ring-inset"
                  >
                    {s.name}
                    <button
                      type="button"
                      aria-label={`Remove ${s.name}`}
                      onClick={() => toggle(s)}
                      className="text-ink-3 hover:text-critical grid h-6 w-6 place-items-center rounded-full"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="q-name" className="text-ink text-[0.9375rem] font-semibold">
                  Your name
                </label>
                <input
                  id="q-name"
                  required
                  autoComplete="name"
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                  className={cn(FIELD, 'mt-2 h-12')}
                />
              </div>
              <div>
                <label htmlFor="q-email" className="text-ink text-[0.9375rem] font-semibold">
                  Email
                </label>
                <input
                  id="q-email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  className={cn(FIELD, 'mt-2 h-12')}
                />
              </div>
              <div>
                <label htmlFor="q-phone" className="text-ink text-[0.9375rem] font-semibold">
                  Mobile / WhatsApp <span className="text-ink-3 font-normal">(optional)</span>
                </label>
                <input
                  id="q-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                  className={cn(FIELD, 'mt-2 h-12')}
                />
              </div>
              <div>
                <label htmlFor="q-company" className="text-ink text-[0.9375rem] font-semibold">
                  Business name <span className="text-ink-3 font-normal">(optional)</span>
                </label>
                <input
                  id="q-company"
                  autoComplete="organization"
                  value={f.company}
                  onChange={(e) => setF({ ...f, company: e.target.value })}
                  className={cn(FIELD, 'mt-2 h-12')}
                />
              </div>
              {/* Honeypot: people never see or fill this. */}
              <div aria-hidden="true" className="absolute -left-[9999px]">
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={f.website}
                    onChange={(e) => setF({ ...f, website: e.target.value })}
                  />
                </label>
              </div>
            </div>
            <p className="text-ink-3 mt-4 max-w-xl text-[0.8125rem] leading-relaxed">
              We use your details only to prepare and send this quotation and to follow up on it.
              See our{' '}
              <a href="/privacy" className="underline">
                privacy notice
              </a>
              .
            </p>
          </section>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-critical mt-5 text-[0.9375rem] font-medium">
          {error}
        </p>
      ) : null}

      {/* Navigation: stays within thumb reach on a phone. */}
      <div className="bg-ground/90 sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-[var(--hairline)] px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setError('');
              setStep((n) => n - 1);
            }}
            className="text-ink-2 inline-flex h-12 items-center gap-2 rounded-full px-4 text-[1rem] font-semibold"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
        ) : (
          <span className="text-ink-3 text-[0.875rem]">
            {chosen.length ? `${chosen.length} selected` : 'Nothing selected yet'}
          </span>
        )}
        {step < 2 ? (
          <button
            key="next"
            type="button"
            onClick={goNext}
            className="bg-accent text-accent-ink inline-flex h-12 items-center gap-2 rounded-full px-7 text-[1rem] font-semibold disabled:opacity-50"
          >
            Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            key="send"
            type="submit"
            disabled={busy}
            className="bg-accent text-accent-ink inline-flex h-12 items-center gap-2 rounded-full px-7 text-[1rem] font-semibold disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MailCheck className="h-4 w-4" aria-hidden="true" />
            )}
            {busy ? 'Preparing…' : 'Send me my quotation'}
          </button>
        )}
      </div>
    </form>
  );
}
