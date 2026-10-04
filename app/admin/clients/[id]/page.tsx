import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { ClientForm } from '@/components/admin/client-form';
import { OnboardingChecklist } from '@/components/admin/onboarding-checklist';
import { EngagementManager } from '@/components/admin/engagement-manager';
import { ClientOps } from '@/components/admin/client-ops';
import { PortalAccess } from '@/components/admin/portal-access';
import { PageHeader, Panel, Pill } from '@/components/admin/ui';
import { requireProfile, canEdit } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { EngagementRow, OnboardingTaskRow } from '@/lib/database.types';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STATUS_TONE = {
  lead: 'accent',
  onboarding: 'caution',
  active: 'positive',
  dormant: 'neutral',
  closed: 'neutral',
} as const;

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const editable = canEdit(profile.role);

  const supabase = serviceClient();
  if (!supabase) notFound();

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  if (!client) notFound();

  const [{ data: tasks }, { data: engagements }] = await Promise.all([
    supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('client_id', id)
      .order('position', { ascending: true }),
    supabase
      .from('engagements')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <>
      <Link
        href="/admin/clients"
        className="text-ink-tertiary hover:text-ink mb-5 inline-flex items-center gap-1.5 text-[0.875rem] font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
        Clients
      </Link>

      <PageHeader
        title={client.name}
        description={client.legal_name ?? undefined}
        action={<Pill tone={STATUS_TONE[client.status]}>{client.status}</Pill>}
      />

      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
        {client.email ? (
          <a
            href={`mailto:${client.email}`}
            className="text-ink-tertiary hover:text-brand-700 inline-flex items-center gap-2 text-[0.875rem]"
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={2} />
            {client.email}
          </a>
        ) : null}
        {client.phone ? (
          <a
            href={`tel:${client.phone}`}
            className="text-ink-tertiary hover:text-brand-700 inline-flex items-center gap-2 text-[0.875rem]"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={2} />
            {client.phone}
          </a>
        ) : null}
        <span className="text-ink-quaternary text-[0.875rem]">
          Client since {formatDate(client.created_at)}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Details">
          <ClientForm client={client} />
        </Panel>

        <div className="space-y-6">
          <Panel title="Onboarding" description="The standard first-month sequence.">
            <OnboardingChecklist
              clientId={id}
              tasks={(tasks ?? []) as OnboardingTaskRow[]}
              editable={editable}
            />
          </Panel>

          <Panel title="Engagements" description="Services this client has bought.">
            <EngagementManager
              clientId={id}
              engagements={(engagements ?? []) as EngagementRow[]}
              editable={editable}
            />
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <PortalAccess clientId={id} editable={editable} />
      </div>

      <ClientOps clientId={id} editable={editable} />
    </>
  );
}
