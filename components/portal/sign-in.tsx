'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Mail, MessageCircle } from 'lucide-react';

const FIELD =
  'h-12 w-full rounded-[var(--radius-md)] bg-surface px-4 text-[1rem] text-ink ring-1 ring-inset ring-[var(--hairline-strong)] outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-accent';

/** Email or phone, then the six-digit code. Nothing else to remember. */
export function PortalSignIn() {
  const router = useRouter();
  const [step, setStep] = useState<'who' | 'code'>('who');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function call(path: string, body: Record<string, string>) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, string | null> & {
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? 'Something went wrong.');
    return data;
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await call('/api/portal/start', { identifier });
      setChannel(d.channel === 'whatsapp' ? 'whatsapp' : 'email');
      setHint(d.hint ?? null);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await call('/api/portal/verify', { identifier, code });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return step === 'who' ? (
    <form onSubmit={start} className="grid gap-4" noValidate>
      <div>
        <label htmlFor="pt-id" className="text-ink mb-1.5 block text-[0.875rem] font-medium">
          Email or mobile number
        </label>
        <input
          id="pt-id"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          inputMode="email"
          placeholder="you@company.com or 98765 43210"
          className={FIELD}
          required
        />
        <p className="text-ink-3 mt-2 text-[0.8125rem]">
          Use the one we have on file for you. We will send a one-time code.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-critical text-[0.875rem]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || identifier.trim().length < 5}
        className="bg-accent hover:bg-accent-hover text-accent-ink inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[0.9375rem] font-semibold disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send my code <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  ) : (
    <form onSubmit={verify} className="grid gap-4" noValidate>
      <p className="text-ink-2 flex items-start gap-2.5 text-[0.9375rem] leading-relaxed">
        {channel === 'whatsapp' ? (
          <MessageCircle className="text-accent mt-1 h-4 w-4 shrink-0" />
        ) : (
          <Mail className="text-accent mt-1 h-4 w-4 shrink-0" />
        )}
        <span>
          If <strong className="text-ink">{identifier}</strong> is registered with us, a six-digit
          code is on its way{' '}
          {channel === 'whatsapp' ? 'on WhatsApp' : hint ? `to ${hint}` : 'by email'}. It expires in
          10 minutes.
        </span>
      </p>
      <div>
        <label htmlFor="pt-code" className="text-ink mb-1.5 block text-[0.875rem] font-medium">
          Code
        </label>
        <input
          id="pt-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoComplete="one-time-code"
          inputMode="numeric"
          placeholder="••••••"
          className={`${FIELD} tracking-[0.4em] tabular-nums`}
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-critical text-[0.875rem]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || code.length !== 6}
        className="bg-accent hover:bg-accent-hover text-accent-ink inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[0.9375rem] font-semibold disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Open my portal
      </button>
      <button
        type="button"
        onClick={() => {
          setStep('who');
          setCode('');
          setError('');
        }}
        className="text-accent h-10 text-[0.875rem] font-semibold"
      >
        Use a different email or number
      </button>
    </form>
  );
}
