'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { browserClient } from '@/lib/supabase-browser';
import { isConsoleEmail } from '@/lib/console';

/**
 * Sign-in, step one: email and password.
 *
 * Only the console owner's address can get past this. Any other account that
 * authenticates is signed straight back out, and the message is the same one
 * a wrong password gets — the form never confirms which addresses exist.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    params.get('denied') ? 'That account does not have access to this console.' : '',
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const supabase = browserClient();

      // Refuse before a request is even made for any other address.
      if (!isConsoleEmail(email)) {
        await new Promise((r) => setTimeout(r, 600));
        setError('Those credentials were not recognised.');
        setBusy(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !isConsoleEmail(data.user?.email)) {
        if (data?.user) await supabase.auth.signOut();
        setError('Those credentials were not recognised.');
        setBusy(false);
        return;
      }

      // Middleware sends this on to the second-factor step it needs.
      const next = params.get('next');
      const safeNext =
        next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
      router.push(safeNext);
      router.refresh();
    } catch {
      setError('Could not sign in. Please try again.');
      setBusy(false);
    }
  }

  const field =
    'h-12 w-full rounded-[var(--radius-md)] bg-surface px-4 text-[0.9375rem] text-ink ' +
    'ring-1 ring-inset ring-[var(--hairline)] outline-none transition-shadow ' +
    'focus:ring-2 focus:ring-accent';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-ink mb-1.5 block text-[0.875rem] font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="password" className="text-ink mb-1.5 block text-[0.875rem] font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </div>

      {error ? (
        <p role="alert" className="text-critical text-[0.875rem]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="bg-accent hover:bg-accent-hover text-accent-ink inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] text-[0.9375rem] font-semibold transition-colors disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </>
        )}
      </button>

      <p className="text-ink-3 flex items-center justify-center gap-1.5 pt-1 text-[0.75rem]">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
        Protected by two-factor sign-in
      </p>
    </form>
  );
}
