'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download, Loader2, Plus, Send } from 'lucide-react';

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
        I have read this final quotation and agree to its scope and amounts. Work beyond it is
        priced and approved by me first, and added to my statement.
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
          Accept this quotation
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

/**
 * An automated quotation cannot be accepted: it only has starting prices. The
 * client asks for the final quotation instead; the team reviews, confirms the
 * amounts and sends it for approval.
 */
export function RequestFinalPanel({
  token,
  requested,
  hasAdditions,
}: {
  token: string;
  requested: boolean;
  hasAdditions: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<'ask' | 'decline' | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  if (requested)
    return (
      <div role="status" className="bg-accent-wash text-ink rounded-[var(--radius-md)] px-5 py-4">
        <p className="text-[0.9375rem] font-semibold">We have your request.</p>
        <p className="text-ink-2 mt-1 text-[0.875rem] leading-relaxed">
          Our team is reviewing what you chose and will confirm the actual amounts with you, then
          send your final quotation for approval — usually within one working day. The prices above
          stay starting prices until then.
        </p>
      </div>
    );

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy('ask');
    const err = await act(token, { action: 'request_final', note: note || undefined });
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
    <form onSubmit={ask} className="grid gap-4">
      <p className="text-ink-2 text-[0.9375rem] leading-relaxed">
        This is an automated quotation, so every price is a starting price. To go ahead, ask for
        your <strong className="text-ink">final quotation</strong>
        {hasAdditions ? ', including the services you added' : ''}. We confirm the actual amounts
        with you, approve it, and send it to you to accept. You pay nothing until then.
      </p>
      <div>
        <label htmlFor="qf-note" className="text-ink text-[0.875rem] font-semibold">
          Anything we should know? <span className="text-ink-3 font-normal">(optional)</span>
        </label>
        <textarea
          id="qf-note"
          rows={2}
          maxLength={600}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Your timeline, number of partners, a question about price…"
          className={`${FIELD} mt-2 h-auto py-3`}
        />
      </div>
      {error ? (
        <p role="alert" className="text-critical text-[0.875rem] font-medium">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy !== null}
          className="bg-accent text-accent-ink inline-flex h-12 items-center gap-2 rounded-full px-7 text-[1rem] font-semibold disabled:opacity-50"
        >
          {busy === 'ask' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Request my final quotation
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

/**
 * Opens every folded section while the page is printed or saved as a PDF —
 * from the button or from Ctrl/Cmd+P — and puts each back as it was after, so
 * the PDF carries what you get, what we need and how it works in full.
 */
export function PrintPrep() {
  useEffect(() => {
    let closed: HTMLDetailsElement[] = [];
    const before = () => {
      closed = [...document.querySelectorAll<HTMLDetailsElement>('details:not([open])')];
      closed.forEach((d) => (d.open = true));
    };
    const after = () => {
      closed.forEach((d) => (d.open = false));
      closed = [];
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);
  return null;
}

/** Saves the page as a PDF through the browser's print dialog, with every section opened first. */
export function PrintButton({ fileName }: { fileName: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const prev = document.title;
        document.title = fileName;
        window.print();
        // The title is read when the dialog opens; put the page's own back after.
        setTimeout(() => {
          document.title = prev;
        }, 1500);
      }}
      className="text-accent hover:bg-accent-wash inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.875rem] font-semibold ring-1 ring-[var(--hairline-strong)] ring-inset"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Download as PDF
    </button>
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
