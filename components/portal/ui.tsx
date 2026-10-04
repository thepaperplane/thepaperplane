import { cn } from '@/lib/utils';

export function PortalCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('bg-surface rounded-[1.1rem] border border-[var(--hairline)]', className)}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] px-5 py-3.5">
          <h2 className="text-ink font-[family-name:var(--font-sans)] text-[0.9375rem] font-semibold tracking-normal">
            {title}
          </h2>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

const TONE: Record<string, string> = {
  paid: 'bg-positive/10 text-positive',
  overdue: 'bg-critical/10 text-critical',
  partially_paid: 'bg-caution/10 text-caution',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-[0.6875rem] font-semibold capitalize',
        TONE[status] ?? 'bg-sunken text-ink-2',
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
