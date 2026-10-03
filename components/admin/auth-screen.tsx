import { LogoMark } from '@/components/brand/logo';

/** The full-screen frame shared by sign-in and both two-factor steps. */
export function AuthScreen({
  title,
  subtitle,
  children,
  footnote,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <div className="bg-sunken relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_30rem_at_20%_10%,rgb(53_165_213/0.16),transparent_70%),radial-gradient(36rem_28rem_at_85%_90%,rgb(27_110_146/0.14),transparent_70%)]"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="h-14 w-20" />
          <h1 className="text-ink mt-5 text-[1.375rem] font-semibold tracking-[-0.02em]">
            {title}
          </h1>
          <p className="text-ink-3 mt-1.5 text-[0.9375rem]">{subtitle}</p>
        </div>
        <div className="bg-surface rounded-[var(--radius-lg)] p-7 shadow-[var(--shadow-lift)] ring-1 ring-[var(--hairline)]">
          {children}
        </div>
        {footnote ? (
          <p className="text-ink-3 mt-6 text-center text-[0.8125rem]">{footnote}</p>
        ) : null}
      </div>
    </div>
  );
}
