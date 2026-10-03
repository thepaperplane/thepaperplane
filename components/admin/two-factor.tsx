'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Loader2, LogOut } from 'lucide-react';
import { browserClient } from '@/lib/supabase-browser';
import { EDITOR_COOKIE } from '@/lib/console';

/**
 * Two-factor sign-in, both halves: enrolling an authenticator app the first
 * time, and entering its six-digit code on every sign-in after that.
 *
 * Uses Supabase's TOTP factors. Once a verified factor exists, the database
 * itself stops honouring a password-only session (see is_console_owner()), so
 * this is not a screen that can be skipped by typing a URL.
 */

const CODE =
  'h-14 w-full rounded-[var(--radius-md)] bg-surface text-center text-[1.5rem] font-semibold tracking-[0.5em] text-ink tabular-nums ' +
  'ring-1 ring-inset ring-[var(--hairline)] outline-none focus:ring-2 focus:ring-accent';

function useSignOut() {
  const router = useRouter();
  return async () => {
    try {
      await browserClient().auth.signOut();
    } finally {
      document.cookie = `${EDITOR_COOKIE}=; Max-Age=0; path=/`;
      router.push('/admin/login');
      router.refresh();
    }
  };
}

function CodeInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <input
      ref={ref}
      id="totp"
      name="totp"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      required
      aria-label="Six-digit code"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      className={CODE}
      placeholder="••••••"
    />
  );
}

export function VerifyFactor() {
  const router = useRouter();
  const signOut = useSignOut();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    setError('');
    try {
      const supabase = browserClient();
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      const factor = factors.totp.find((f) => f.status === 'verified');
      if (!factor) {
        router.push('/admin/setup-2fa');
        return;
      }
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code,
      });
      if (verifyError) {
        setError('That code did not match. Codes change every 30 seconds — try the current one.');
        setCode('');
        setBusy(false);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Could not verify the code. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-ink-2 text-[0.9375rem] leading-relaxed">
        Open your authenticator app and enter the six-digit code for{' '}
        <strong className="text-ink font-semibold">The Paper Plane</strong>.
      </p>
      <CodeInput value={code} onChange={setCode} autoFocus />
      {error ? (
        <p role="alert" className="text-critical text-[0.875rem]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || code.length !== 6}
        className="bg-accent hover:bg-accent-hover text-accent-ink inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] text-[0.9375rem] font-semibold transition-colors disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Verifying…' : 'Verify and continue'}
      </button>
      <button
        type="button"
        onClick={signOut}
        className="text-ink-3 hover:text-ink mx-auto flex h-10 items-center gap-1.5 text-[0.8125rem]"
      >
        <LogOut className="h-3.5 w-3.5" />
        Use a different account
      </button>
    </form>
  );
}

type Enrolment = { factorId: string; qr: string; secret: string };

export function EnrolFactor() {
  const router = useRouter();
  const signOut = useSignOut();
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const supabase = browserClient();
        // Clear out any half-finished enrolment from an earlier attempt —
        // Supabase refuses a second factor with the same name.
        const { data: existing } = await supabase.auth.mfa.listFactors();
        for (const f of existing?.all ?? []) {
          if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
        const { data, error: enrolError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: `Paper Plane console ${new Date().toISOString().slice(0, 10)}`,
          issuer: 'The Paper Plane',
        });
        if (enrolError || !data) throw enrolError ?? new Error('No enrolment returned');
        setEnrolment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
      } catch (e) {
        const message = e instanceof Error ? e.message : '';
        setError(
          /disabled|not enabled/i.test(message)
            ? 'Two-factor sign-in is switched off for this Supabase project. Turn on TOTP under Authentication → Multi-Factor, then reload.'
            : 'Could not start two-factor setup. Reload the page to try again.',
        );
      }
    })();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!enrolment || code.length !== 6) return;
    setBusy(true);
    setError('');
    try {
      const { error: verifyError } = await browserClient().auth.mfa.challengeAndVerify({
        factorId: enrolment.factorId,
        code,
      });
      if (verifyError) {
        setError('That code did not match. Check the time on your phone is set automatically.');
        setCode('');
        setBusy(false);
        return;
      }
      router.push('/admin?secured=1');
      router.refresh();
    } catch {
      setError('Could not verify the code. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <ol className="text-ink-2 list-decimal space-y-1.5 pl-5 text-[0.875rem] leading-relaxed">
        <li>
          Install an authenticator app — Google Authenticator, Microsoft Authenticator or 1Password.
        </li>
        <li>Scan this code with it.</li>
        <li>Type the six digits it shows.</li>
      </ol>

      <div className="bg-sunken flex min-h-[13.5rem] items-center justify-center rounded-[var(--radius-md)] p-4">
        {enrolment ? (
          // The QR arrives as an SVG data URI from Supabase.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={enrolment.qr}
            alt="QR code to add The Paper Plane console to an authenticator app"
            width={192}
            height={192}
            className="h-48 w-48 rounded-[var(--radius-sm)] bg-white p-2"
          />
        ) : error ? null : (
          <Loader2 className="text-ink-3 h-6 w-6 animate-spin" aria-label="Preparing" />
        )}
      </div>

      {enrolment ? (
        <div>
          <p className="text-ink-3 text-[0.75rem]">Can’t scan? Enter this key instead:</p>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(enrolment.secret).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="bg-sunken text-ink mt-1.5 flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 font-[family-name:var(--font-mono)] text-[0.75rem] break-all"
          >
            <span>{enrolment.secret}</span>
            {copied ? (
              <Check className="text-positive h-4 w-4 shrink-0" />
            ) : (
              <Copy className="text-ink-3 h-4 w-4 shrink-0" />
            )}
          </button>
        </div>
      ) : null}

      <CodeInput value={code} onChange={setCode} />

      {error ? (
        <p role="alert" className="text-critical text-[0.875rem] leading-relaxed">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !enrolment || code.length !== 6}
        className="bg-accent hover:bg-accent-hover text-accent-ink inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] text-[0.9375rem] font-semibold transition-colors disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Securing…' : 'Turn on two-factor sign-in'}
      </button>
      <button
        type="button"
        onClick={signOut}
        className="text-ink-3 hover:text-ink mx-auto flex h-10 items-center gap-1.5 text-[0.8125rem]"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </form>
  );
}
