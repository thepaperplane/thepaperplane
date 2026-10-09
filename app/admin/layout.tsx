import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';
import { currentProfile } from '@/lib/auth';
import { ZohoAutoSync } from '@/components/admin/zoho-auto-sync';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await currentProfile();

  // The login page renders its own full-screen layout; middleware guarantees
  // that any other /admin route already has a session by the time we get here.
  if (!profile) return <>{children}</>;

  return (
    <AdminShell profile={profile}>
      <ZohoAutoSync />
      {children}
    </AdminShell>
  );
}
