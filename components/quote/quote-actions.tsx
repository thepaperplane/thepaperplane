'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Plus } from 'lucide-react';

async function act(token: string, body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(`/api/quotes/${token}/act`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    return d.error ?? 'Something went wrong. Please try again.';
  } catch {
    return 'Could not reach the server. Please try again.';
  }
}

const FIELD =
  'w-full rounded-[var(--radius-md)] bg-surface px-4 text-[0.9375rem] text-ink ring-1 ring-inset ring-[var(--hairline-strong)] outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-accent';

export function AcceptPanel({ token, defaultName }: { token: string; defaultName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState(defaultName);

  async function accept(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy('accept');
    const err = await act(token, { action: 'accept', name });
    setBusy(null);
    if (err) setError(err);
    else router.refresh();
  }
  async function decline() {
    if (busy || !window.confirm('Close this quotation? You can always ask us for a fresh one.'))
      return;
    setBusy('decline');
    const err = await act(token, { action: 'decline' });
    setBusy(null);
    if (err) setError(err);
    else router.refresh();
  }

  return (
    <form onSubmit={accept} className="grid gap-4">
      <div>
        <label htmlFor="qa-name" className="text-ink text-[0.875rem] font-semibold">
          Your name
        </label>
        <input
          id="qa-name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${FIELD} mt-2 h-12`}
        />
      </div>
      <label className="text-ink-2 flex items-start gap-3 text-[0.875rem] leading-relaxed">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
        />
        I understand this is a starting estimate. The final fee is confirmed in writing after we
        understand my needs, and work beyond the agreed scope is priced and approved by me first.
      </label>
      {error ? (
        <p role="alert" className="text-critical text-[0.875rem] font-medium">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={!agree || busy !== null}
          className="bg-accent text-accent-ink inline-flex h-12 items-center gap-2 rounded-full px-7 text-[1rem] font-semibold disabled:opacity-50"
        >
          {busy === 'accept' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Yes, let’s go ahead
        </button>
        <button
          type="button"
          onClick={decline}
          disabled={busy !== null}
          className="text-ink-3 hover:text-ink h-12 px-2 text-[0.875rem] underline"
        >
          Not for me
        </button>
      </div>
    </form>
  );
}

export function AddButton({
  token,
  serviceId,
  label,
}: {
  token: string;
  serviceId: string;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const err = await act(token, { action: 'upsell', serviceId });
          setBusy(false);
          if (err) setError(err);
          else router.refresh();
        }}
        className="text-accent hover:bg-accent-wash inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[0.875rem] font-semibold ring-1 ring-[var(--hairline-strong)] ring-inset disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        {label}
      </button>
      {error ? <p className="text-critical mt-1 text-[0.75rem]">{error}</p> : null}
    </div>
  );
}

export function AddonDecision({ token, id }: { token: string; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const go = async (decision: 'approve' | 'decline') => {
    setBusy(decision);
    const err = await act(token, { action: 'addon', id, decision });
    setBusy(null);
    if (err) setError(err);
    else router.refresh();
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => go('approve')}
        className="bg-accent text-accent-ink inline-flex h-10 items-center rounded-full px-5 text-[0.875rem] font-semibold disabled:opacity-60"
      >
        {busy === 'approve' ? 'Approving…' : 'Approve'}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => go('decline')}
        className="text-ink-2 inline-flex h-10 items-center rounded-full px-4 text-[0.875rem] font-semibold ring-1 ring-[var(--hairline-strong)] ring-inset disabled:opacity-60"
      >
        No thanks
      </button>
      {error ? <span className="text-critical text-[0.75rem]">{error}</span> : null}
    </div>
  );
}

export function MessageBox({ token }: { token: string }) {
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [error, setError] = useState('');
  if (state === 'sent')
    return (
      <p role="status" className="text-positive text-[0.9375rem] font-medium">
        Thank you — we have your message and will reply shortly.
      </p>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setState('busy');
        const err = await act(token, { action: 'message', text });
        if (err) {
          setError(err);
          setState('idle');
        } else setState('sent');
      }}
      className="grid gap-3"
    >
      <label htmlFor="qm-text" className="text-ink text-[0.875rem] font-semibold">
        A question, or something you would like changed?
      </label>
      <textarea
        id="qm-text"
        required
        minLength={2}
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`${FIELD} h-auto py-3`}
      />
      {error ? (
        <p role="alert" className="text-critical text-[0.8125rem]">
          {error}
        </p>
      ) : null}
      <div>
        <button
          type="submit"
          disabled={state === 'busy'}
          className="text-accent inline-flex h-11 items-center rounded-full px-5 text-[0.9375rem] font-semibold ring-1 ring-[var(--hairline-strong)] ring-inset disabled:opacity-60"
        >
          {state === 'busy' ? 'Sending…' : 'Send to the team'}
        </button>
      </div>
    </form>
  );
}
