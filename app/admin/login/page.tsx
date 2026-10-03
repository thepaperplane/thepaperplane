import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/login-form';
import { AuthScreen } from '@/components/admin/auth-screen';
import { isSupabaseConfigured } from '@/lib/supabase-browser';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <AuthScreen
      title="Admin console"
      subtitle="The Paper Plane — internal access only"
      footnote="There is no public sign-up. Access is limited to the practice’s own account."
    >
      {isSupabaseConfigured ? (
        // LoginForm reads ?next= via useSearchParams, which opts this subtree
        // out of prerendering — the boundary keeps the shell static.
        <Suspense
          fallback={
            <div className="bg-sunken h-[17rem] animate-pulse rounded-[var(--radius-md)]" />
          }
        >
          <LoginForm />
        </Suspense>
      ) : (
        <div className="text-center">
          <p className="text-ink text-[0.9375rem] font-medium">Not configured</p>
          <p className="text-ink-3 mt-2 text-[0.875rem] leading-relaxed">
            Set{' '}
            <code className="bg-sunken rounded px-1 py-0.5 text-[0.8125rem]">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{' '}
            and{' '}
            <code className="bg-sunken rounded px-1 py-0.5 text-[0.8125rem]">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{' '}
            to enable the console.
          </p>
        </div>
      )}
    </AuthScreen>
  );
}
