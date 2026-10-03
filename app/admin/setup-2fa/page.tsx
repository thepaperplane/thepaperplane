import type { Metadata } from 'next';
import { AuthScreen } from '@/components/admin/auth-screen';
import { EnrolFactor } from '@/components/admin/two-factor';

export const metadata: Metadata = {
  title: 'Secure your account',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function SetupTwoFactorPage() {
  return (
    <AuthScreen
      title="Secure the console"
      subtitle="Client records need more than a password"
      footnote="Once this is on, a stolen password alone cannot open the console or read any data."
    >
      <EnrolFactor />
    </AuthScreen>
  );
}
