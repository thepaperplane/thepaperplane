import type { Metadata } from 'next';
import { AuthScreen } from '@/components/admin/auth-screen';
import { VerifyFactor } from '@/components/admin/two-factor';

export const metadata: Metadata = {
  title: 'Verify',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function VerifyPage() {
  return (
    <AuthScreen
      title="Two-factor sign-in"
      subtitle="One more step"
      footnote="Lost your phone? Ask whoever manages the Supabase project to reset the factor."
    >
      <VerifyFactor />
    </AuthScreen>
  );
}
