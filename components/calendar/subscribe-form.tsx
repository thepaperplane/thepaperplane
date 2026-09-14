'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const SEGMENTS = [
  { value: 'business', label: 'I run a business' },
  { value: 'professional', label: 'I am a finance professional' },
  { value: 'individual', label: 'Individual taxpayer' },
] as const;

/**
 * Monthly compliance calendar subscription.
 *
 * Open to clients and non-clients alike — `relationship` is captured so the
 * send can be segmented, not to gate access.
 */
export function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [segment, setSegment] = useState<string>('business');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/calendar/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          segment,
          // Honeypot — real users never fill this.
          website: '',
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(data.message ?? 'You are subscribed.');
      setEmail('');
      setName('');
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Please try again in a moment.');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-positive/10 ring-positive/20 flex items-start gap-4 rounded-[var(--radius-lg)] p-6 ring-1 ring-inset">
        <span className="bg-positive flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <Check className="text-ground h-5 w-5" strokeWidth={2.6} />
        </span>
        <div>
          <p className="text-ink text-[1.0625rem] font-semibold">You are on the list</p>
          <p className="text-ink-2 mt-1.5 text-[0.9375rem] leading-relaxed">{message}</p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="text-accent hover:text-ink mt-3 text-[0.875rem] font-semibold underline underline-offset-4"
          >
            Subscribe another address
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn('w-full', compact ? '' : 'max-w-xl')} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={compact ? 'sm:col-span-2' : ''}>
          <label htmlFor="sub-name" className="text-ink mb-1.5 block text-[0.875rem] font-medium">
            Name <span className="text-ink-3 font-normal">(optional)</span>
          </label>
          <input
            id="sub-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-ink placeholder:text-ink-3 glass glass-static h-12 w-full rounded-[var(--radius-md)] px-4 text-[0.9375rem] transition-[box-shadow,background-color] duration-[var(--dur-control)] ease-[var(--ease-standard)] outline-none focus:shadow-[var(--glass-shadow-lifted),0_0_0_2px_var(--accent)] motion-reduce:transition-none"
            placeholder="Your name"
          />
        </div>

        <div className={compact ? 'sm:col-span-2' : ''}>
          <label htmlFor="sub-email" className="text-ink mb-1.5 block text-[0.875rem] font-medium">
            Email address
          </label>
          <input
            id="sub-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby="sub-help"
            className="text-ink placeholder:text-ink-3 glass glass-static h-12 w-full rounded-[var(--radius-md)] px-4 text-[0.9375rem] transition-[box-shadow,background-color] duration-[var(--dur-control)] ease-[var(--ease-standard)] outline-none focus:shadow-[var(--glass-shadow-lifted),0_0_0_2px_var(--accent)] motion-reduce:transition-none"
            placeholder="you@company.com"
          />
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-ink mb-2 text-[0.875rem] font-medium">
          So we send you the right dates
        </legend>
        <div className="flex flex-wrap gap-2">
          {SEGMENTS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'cursor-pointer rounded-full px-4 py-2 text-[0.875rem] font-medium transition-all',
                segment === option.value
                  ? 'bg-accent text-accent-ink shadow-[var(--shadow-soft)]'
                  : 'text-ink-2 hover:text-ink bg-surface ring-1 ring-[var(--hairline)] ring-inset',
              )}
            >
              <input
                type="radio"
                name="segment"
                value={option.value}
                checked={segment === option.value}
                onChange={(e) => setSegment(e.target.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Honeypot — visually hidden, not display:none, so bots still fill it. */}
      <div aria-hidden="true" className="sr-only-focusable absolute h-px w-px overflow-hidden">
        <label htmlFor="sub-website">Website</label>
        <input id="sub-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bg-accent hover:bg-accent-hover text-accent-ink mt-6 inline-flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] px-7 text-base font-semibold shadow-[var(--shadow-soft)] transition-all duration-300 active:scale-[0.98] disabled:opacity-60 sm:w-auto"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Subscribing…
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" strokeWidth={2} />
            Send me the monthly calendar
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </>
        )}
      </button>

      {status === 'error' && message ? (
        <p role="alert" className="text-critical mt-3 text-[0.875rem]">
          {message}
        </p>
      ) : null}

      <p id="sub-help" className="text-ink-3 mt-4 max-w-[52ch] text-[0.8125rem] leading-relaxed">
        One email a month, at the start of the month, listing what is due and when. No sales
        sequences. Unsubscribe from any email in one click — withdrawing consent is as easy as
        giving it, which is what the DPDP Act asks for. Subscribing stores your email address, and
        your name if you gave one, for nothing but sending that email. See the{' '}
        <a href="/privacy" className="link-underline text-accent font-medium">
          privacy notice
        </a>
        .
      </p>
    </form>
  );
}
