'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Check, Loader2, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

type Slot = { start: string; end: string; label: string; day: string; time: string };
type State =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'ready'; slots: Slot[] }
  | { kind: 'booked'; label: string; meetLink: string | null };

const FIELD =
  'w-full rounded-[var(--radius-md)] bg-surface px-4 text-[0.9375rem] text-ink ring-1 ring-inset ring-[var(--hairline-strong)] outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-accent';

/**
 * Pick a day, pick a time, say who you are. Times come live from the
 * owner's calendar, so anything shown is genuinely free.
 */
export function SlotPicker({ whatsappHref }: { whatsappHref: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setState({ kind: 'loading' });
    fetch('/api/meetings/slots', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { ready: boolean; slots: Slot[] }) => {
        if (!d.ready || !d.slots.length) setState({ kind: 'unavailable' });
        else {
          setState({ kind: 'ready', slots: d.slots });
          setDay(d.slots[0]!.day);
        }
      })
      .catch(() => setState({ kind: 'unavailable' }));
  };
  useEffect(load, []);

  const days = useMemo(
    () => (state.kind === 'ready' ? [...new Set(state.slots.map((s) => s.day))] : []),
    [state],
  );
  const times = state.kind === 'ready' ? state.slots.filter((s) => s.day === day) : [];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slot || busy) return;
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch('/api/meetings/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, start: slot.start }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        label?: string;
        meetLink?: string | null;
      };
      if (!res.ok) {
        setError(body.error ?? 'That time could not be booked.');
        if (res.status === 409) load();
        return;
      }
      setState({
        kind: 'booked',
        label: body.label ?? slot.label,
        meetLink: body.meetLink ?? null,
      });
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === 'loading') {
    return (
      <div className="text-ink-3 flex items-center gap-2 py-16 text-[0.9375rem]" role="status">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking the calendar…
      </div>
    );
  }

  if (state.kind === 'unavailable') {
    return (
      <div className="py-6">
        <p className="text-ink text-[1.0625rem] font-semibold">
          Online booking is paused right now.
        </p>
        <p className="text-ink-2 mt-2 text-[0.9375rem] leading-relaxed">
          Message us and we will find a time with you directly.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-accent-ink inline-flex h-11 items-center rounded-full px-5 text-[0.9375rem] font-semibold"
          >
            Message on WhatsApp
          </a>
          <a
            href="/contact"
            className="text-accent inline-flex h-11 items-center rounded-full px-5 text-[0.9375rem] font-semibold ring-1 ring-[var(--hairline-strong)] ring-inset"
          >
            Use the contact form
          </a>
        </div>
      </div>
    );
  }

  if (state.kind === 'booked') {
    return (
      <div className="py-4" role="status">
        <span className="bg-positive text-ground grid h-12 w-12 place-items-center rounded-full">
          <Check className="h-6 w-6" strokeWidth={2.6} />
        </span>
        <p className="text-ink mt-5 text-[1.25rem] font-semibold">
          You are booked for {state.label}.
        </p>
        <p className="text-ink-2 mt-2 text-[0.9375rem] leading-relaxed">
          A calendar invitation is on its way to your email. Bring the notice, brief or question you
          want to discuss — we will have read nothing else.
        </p>
        {state.meetLink ? (
          <a
            href={state.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent mt-5 inline-flex h-11 items-center gap-2 text-[0.9375rem] font-semibold"
          >
            <Video className="h-4 w-4" /> Google Meet link
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <p className="text-ink mb-3 text-[0.875rem] font-semibold">1. Choose a day</p>
      <div
        className="scroll-lane no-scrollbar -mx-1 flex gap-2 px-1 pb-1"
        role="group"
        aria-label="Day"
      >
        {days.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={d === day}
            onClick={() => {
              setDay(d);
              setSlot(null);
            }}
            className={cn(
              'h-11 shrink-0 rounded-full px-4 text-[0.875rem] font-medium transition-colors',
              d === day
                ? 'bg-accent text-accent-ink'
                : 'text-ink-2 hover:text-ink ring-1 ring-[var(--hairline-strong)] ring-inset',
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="text-ink mt-6 mb-3 text-[0.875rem] font-semibold">2. Choose a time (IST)</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Time">
        {times.map((t) => (
          <button
            key={t.start}
            type="button"
            aria-pressed={slot?.start === t.start}
            onClick={() => setSlot(t)}
            className={cn(
              'h-11 rounded-[var(--radius-md)] text-[0.875rem] font-medium tabular-nums transition-colors',
              slot?.start === t.start
                ? 'bg-accent text-accent-ink'
                : 'text-ink hover:bg-sunken ring-1 ring-[var(--hairline-strong)] ring-inset',
            )}
          >
            {t.time}
          </button>
        ))}
      </div>

      {slot ? (
        <form onSubmit={submit} className="mt-7 grid gap-4" noValidate>
          <p className="text-ink flex items-center gap-2 text-[0.875rem] font-semibold">
            <CalendarCheck2 className="text-accent h-4 w-4" /> 3. {slot.label} — your details
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="bk-name"
                className="text-ink mb-1.5 block text-[0.8125rem] font-medium"
              >
                Name
              </label>
              <input
                id="bk-name"
                name="name"
                required
                autoComplete="name"
                className={`${FIELD} h-12`}
              />
            </div>
            <div>
              <label
                htmlFor="bk-email"
                className="text-ink mb-1.5 block text-[0.8125rem] font-medium"
              >
                Email (for the invitation)
              </label>
              <input
                id="bk-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={`${FIELD} h-12`}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="bk-phone"
                className="text-ink mb-1.5 block text-[0.8125rem] font-medium"
              >
                Phone or WhatsApp (optional)
              </label>
              <input
                id="bk-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className={`${FIELD} h-12`}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="bk-topic"
                className="text-ink mb-1.5 block text-[0.8125rem] font-medium"
              >
                What would you like to discuss?
              </label>
              <textarea id="bk-topic" name="topic" required rows={3} className={`${FIELD} py-3`} />
            </div>
          </div>
          <div aria-hidden="true" className="absolute h-px w-px overflow-hidden">
            <label htmlFor="bk-website">Website</label>
            <input id="bk-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          {error ? (
            <p role="alert" className="text-critical text-[0.875rem]">
              {error}
            </p>
          ) : null}
          <div>
            <button
              type="submit"
              disabled={busy}
              className="bg-accent hover:bg-accent-hover text-accent-ink inline-flex h-12 items-center gap-2 rounded-full px-6 text-[0.9375rem] font-semibold disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Booking…' : 'Confirm the call'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
