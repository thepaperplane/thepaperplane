import { PageHeader, Panel } from '@/components/admin/ui';
import { SettingsForm } from '@/components/admin/settings-form';
import { requireRole } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Site settings' };

export default async function SettingsPage() {
  await requireRole('admin');
  const settings = await getSettings();
  return (
    <>
      <PageHeader
        title="Site settings"
        description="Details used across every page. Changes are live on the website as soon as you save."
      />
      <Panel>
        <div className="px-6 py-6">
          <SettingsForm settings={settings} />
        </div>
      </Panel>
    </>
  );
}
