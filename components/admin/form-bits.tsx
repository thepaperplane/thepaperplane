'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Small client pieces for server-action forms in the console. */

export function SubmitButton({
  children,
  pendingText = 'Saving…',
  tone = 'accent',
  className,
  confirm,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  tone?: 'accent' | 'quiet' | 'danger';
  className?: string;
  /** Ask before submitting — for anything destructive. */
  confirm?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.875rem] font-semibold whitespace-nowrap transition-colors disabled:opacity-60',
        tone === 'accent' && 'bg-accent text-accent-ink hover:bg-accent-hover',
        tone === 'quiet' &&
          'text-ink-2 hover:bg-sunken hover:text-ink ring-1 ring-[var(--hairline)] ring-inset',
        tone === 'danger' &&
          'text-critical hover:bg-critical/10 ring-critical/30 ring-1 ring-inset',
        className,
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingText : children}
    </button>
  );
}

/** Submits its form as soon as the value changes — for status pickers. */
export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  label,
  className,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      aria-label={label}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={cn(
        'bg-surface text-ink h-9 rounded-[var(--radius-sm)] px-2.5 text-[0.8125rem] font-medium ring-1 ring-[var(--hairline)] ring-inset',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Copy a value to the clipboard, with feedback. */
export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={async (e) => {
        const btn = e.currentTarget;
        await navigator.clipboard.writeText(value).catch(() => {});
        const prev = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = prev), 1500);
      }}
      className="text-accent hover:bg-accent-wash inline-flex h-9 items-center rounded-[var(--radius-sm)] px-3 text-[0.8125rem] font-semibold"
    >
      {label}
    </button>
  );
}
