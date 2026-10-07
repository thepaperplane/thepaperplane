'use client';

import { useMemo, useState } from 'react';
import { Check, Loader2, MailCheck, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FormService = {
  id: string;
  cat: string;
  name: string;
  line: string;
  ask: 'variant' | 'qty' | null;
  askLabel: string;
  variants: { id: string; label: string }[];
  defaultVariant: string;
};

type Pick = { variant?: string; qty?: number };

const FIELD =
  'w-full rounded-[var(--radius-md)] bg-surface px-4 text-[0.9375rem] text-ink ring-1 ring-inset ring-[var(--hairline-strong)] outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-accent';

const TIMELINES = [
  ['', 'Not decided'],
  ['urgent', 'As soon as possible'],
  ['month', 'This month'],
  ['quarter', 'In the next few months'],
  ['exploring', 'Just exploring'],
];

/**
 * Pick services, answer the one or two questions each really depends on, say
 * who you are. No prices are on this page, or anywhere on the public site:
 * the quotation is built on the server and sent to the address entered.
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
  const [picked, setPicked] = useState<Record<string, Pick>>(() =>
    Object.fromEntries(preselected.map((id) => [id, {}])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { status: 'sent' | 'review'; email: string }>(null);

  const chosen = useMemo(() => services.filter((s) => picked[s.id]), [services, picked]);
  const asking = chosen.filter((s) => s.ask);

  const toggle = (s: FormService) =>
    setPicked((p) => {
      const next = { ...p };
      if (next[s.id]) delete next[s.id];
      else
        next[s.id] =
          s.ask === 'variant' ? { variant: s.defaultVariant } : s.ask === 'qty' ? { qty: 1 } : {};
      return next;
    });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!chosen.length) {
      setError('Please choose at least one service.');
      return;
    }
    setBusy(true);
    setError('');
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const res = await fetch('/api/quotes/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name,
          email: f.email,
          phone: f.phone,
          company: f.company,
          message: f.message,
          timeline: f.timeline,
          website: f.website,
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
      setDone({ status: body.status ?? 'sent', email: body.email ?? f.email! });
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div
        className="bg-surface mt-12 rounded-[1.1rem] border border-[var(--hairline)] p-8"
        role="status"
      >
        <span className="bg-positive text-ground grid h-12 w-12 place-items-center rounded-full">
          <MailCheck className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-[1.5rem]">
          {done.status === 'sent'
            ? 'Your quotation is on its way'
            : 'We are preparing your quotation'}
        </h2>
        <p className="text-ink-2 mt-3 max-w-xl text-[0.9375rem] leading-relaxed">
          {done.status === 'sent'
            ? `We have emailed a private link to ${done.email}. If you do not see it within a few minutes, check your spam folder.`
            : `A member of the team will look over your request and send your quotation to ${done.email} shortly — usually within the working day.`}
        </p>
        <p className="text-ink-2 mt-3 max-w-xl text-[0.9375rem] leading-relaxed">
          Every business is different, so what you receive is our starting estimate. We confirm the
          final figure after a short conversation to understand you fully.
        </p>
        <a
          href="/book"
          className="bg-accent text-accent-ink mt-6 inline-flex h-11 items-center rounded-full px-5 text-[0.9375rem] font-semibold"
        >
          Book a free call
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-12 grid gap-12" noValidate>
      <div className="bg-sunken flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] px-5 py-4">
        <p className="text-ink-2 text-[0.9375rem]">
          Not sure what applies to you? Describe your business — our assistant explains it in plain
          words.
        </p>
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
          <MessageCircleQuestion className="h-4 w-4" /> Ask the assistant
        </button>
      </div>

      <fieldset>
        <legend className="text-ink text-[1.125rem] font-semibold">1. What do you need?</legend>
        <p className="text-ink-3 mt-1 text-[0.875rem]">Choose as many as you like.</p>
        <div className="mt-6 grid gap-8">
          {categories.map((c) => {
            const list = services.filter((s) => s.cat === c.id);
            if (!list.length) return null;
            return (
              <div key={c.id}>
                <h2 className="text-ink-2 text-[0.8125rem] font-semibold tracking-[0.06em] uppercase">
                  {c.label}
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {list.map((s) => {
                    const on = Boolean(picked[s.id]);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(s)}
                        className={cn(
                          'flex items-start gap-3 rounded-[var(--radius-md)] p-4 text-left ring-1 transition-colors ring-inset',
                          on
                            ? 'bg-accent-wash ring-accent ring-2'
                            : 'bg-surface ring-[var(--hairline-strong)] hover:ring-[var(--accent)]',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-1 ring-inset',
                            on
                              ? 'bg-accent text-accent-ink ring-accent'
                              : 'ring-[var(--hairline-strong)]',
                          )}
                        >
                          {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                        <span>
                          <span className="text-ink block text-[0.9375rem] font-semibold">
                            {s.name}
                          </span>
                          <span className="text-ink-3 mt-0.5 block text-[0.8125rem] leading-snug">
                            {s.line}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      {asking.length ? (
        <fieldset>
          <legend className="text-ink text-[1.125rem] font-semibold">
            2. A little more about it
          </legend>
          <div className="mt-5 grid gap-5">
            {asking.map((s) => (
              <div key={s.id}>
                <label
                  htmlFor={`ask-${s.id}`}
                  className="text-ink block text-[0.875rem] font-semibold"
                >
                  {s.name}: <span className="text-ink-2 font-normal">{s.askLabel}</span>
                </label>
                {s.ask === 'variant' ? (
                  <select
                    id={`ask-${s.id}`}
                    value={picked[s.id]?.variant}
                    onChange={(e) =>
                      setPicked((p) => ({ ...p, [s.id]: { variant: e.target.value } }))
                    }
                    className={cn(FIELD, 'mt-2 h-12')}
                  >
                    {s.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`ask-${s.id}`}
                    type="number"
                    min={1}
                    max={20}
                    value={picked[s.id]?.qty ?? 1}
                    onChange={(e) =>
                      setPicked((p) => ({
                        ...p,
                        [s.id]: { qty: Math.max(1, Number(e.target.value) || 1) },
                      }))
                    }
                    className={cn(FIELD, 'mt-2 h-12 max-w-[8rem]')}
                  />
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="text-ink text-[1.125rem] font-semibold">
          {asking.length ? '3' : '2'}. About you
        </legend>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="q-name" className="text-ink text-[0.875rem] font-semibold">
              Your name
            </label>
            <input
              id="q-name"
              name="name"
              required
              autoComplete="name"
              className={cn(FIELD, 'mt-2 h-12')}
            />
          </div>
          <div>
            <label htmlFor="q-email" className="text-ink text-[0.875rem] font-semibold">
              Email — your quotation is sent here
            </label>
            <input
              id="q-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={cn(FIELD, 'mt-2 h-12')}
            />
          </div>
          <div>
            <label htmlFor="q-phone" className="text-ink text-[0.875rem] font-semibold">
              Mobile / WhatsApp <span className="text-ink-3 font-normal">(optional)</span>
            </label>
            <input
              id="q-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={cn(FIELD, 'mt-2 h-12')}
            />
          </div>
          <div>
            <label htmlFor="q-company" className="text-ink text-[0.875rem] font-semibold">
              Business name <span className="text-ink-3 font-normal">(optional)</span>
            </label>
            <input
              id="q-company"
              name="company"
              autoComplete="organization"
              className={cn(FIELD, 'mt-2 h-12')}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="q-timeline" className="text-ink text-[0.875rem] font-semibold">
              When do you need this?
            </label>
            <select id="q-timeline" name="timeline" className={cn(FIELD, 'mt-2 h-12')}>
              {TIMELINES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="q-message" className="text-ink text-[0.875rem] font-semibold">
              Anything we should know? <span className="text-ink-3 font-normal">(optional)</span>
            </label>
            <textarea
              id="q-message"
              name="message"
              rows={4}
              placeholder="For example: a shop selling goods, about ₹10 lakh a year, selling only in Tamil Nadu."
              className={cn(FIELD, 'mt-2 h-auto py-3')}
            />
          </div>
          {/* Honeypot: people never see or fill this. */}
          <div aria-hidden="true" className="absolute -left-[9999px]">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="text-critical text-[0.9375rem] font-medium">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={busy}
          className="bg-accent text-accent-ink inline-flex h-12 items-center gap-2 rounded-full px-7 text-[1rem] font-semibold disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'Preparing…' : 'Send me my quotation'}
        </button>
        <p className="text-ink-3 mt-3 max-w-xl text-[0.8125rem] leading-relaxed">
          We use your details only to prepare and send this quotation and to follow up on it. See
          our{' '}
          <a href="/privacy" className="underline">
            privacy notice
          </a>
          .
        </p>
      </div>
    </form>
  );
}
