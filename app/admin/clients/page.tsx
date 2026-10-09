import Link from 'next/link';
import { Building2, Plus, Search } from 'lucide-react';
import { DataTable, EmptyState, PageHeader, Panel, Pill } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import { syncEverything } from '@/app/admin/_actions/integrations';
import { requireProfile, canEdit } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { ClientRow, ClientStatus } from '@/lib/database.types';
import { formatRelative } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Clients' };

const STATUS_TONE = {
  lead: 'accent',
  onboarding: 'caution',
  active: 'positive',
  dormant: 'neutral',
  closed: 'neutral',
} as const;

const CLIENT_STATUSES: ClientStatus[] = ['lead', 'onboarding', 'active', 'dormant', 'closed'];

/** Search params are untrusted input; only a known enum value reaches the query. */
function asClientStatus(value: string | undefined): ClientStatus | null {
  return value && (CLIENT_STATUSES as string[]).includes(value) ? (value as ClientStatus) : null;
}

const ENTITY_LABEL: Record<string, string> = {
  individual: 'Individual',
  proprietorship: 'Proprietorship',
  partnership: 'Partnership',
  llp: 'LLP',
  private_limited: 'Pvt Ltd',
  public_limited: 'Public Ltd',
  trust: 'Trust',
  society: 'Society',
  other: 'Other',
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const profile = await requireProfile();
  const { q, status } = await searchParams;
  const supabase = serviceClient();

  let clients: ClientRow[] = [];

  if (supabase) {
    let query = supabase.from('clients').select('*').order('updated_at', { ascending: false });
    const validStatus = asClientStatus(status);
    if (validStatus) query = query.eq('status', validStatus);
    if (q) query = query.ilike('name', `%${q}%`);
    const { data } = await query.limit(200);
    clients = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Clients"
        description="Every relationship the practice holds, from first enquiry through to active engagement."
        action={
          canEdit(profile.role) ? (
            <div className="flex flex-wrap items-center gap-2">
              <form action={syncEverything}>
                <SubmitButton tone="quiet" pendingText="Syncing with Zoho…">
                  Sync with Zoho
                </SubmitButton>
              </form>
              <Link
                href="/admin/clients/new"
                className="bg-brand-600 hover:bg-brand-700 text-accent-ink inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.9375rem] font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" strokeWidth={2.2} />
                Add client
              </Link>
            </div>
          ) : null
        }
      />

      <form method="get" className="mb-5 flex flex-wrap gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            className="text-ink-quaternary pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2"
            strokeWidth={2}
          />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search by name"
            aria-label="Search clients"
            className="text-ink placeholder:text-ink-quaternary focus:ring-brand-500 h-11 w-full rounded-[var(--radius-md)] bg-white pr-4 pl-10 text-[0.9375rem] ring-1 ring-[var(--color-hairline)] outline-none ring-inset focus:ring-2"
          />
        </div>

        <select
          name="status"
          defaultValue={status ?? ''}
          aria-label="Filter by status"
          className="text-ink-secondary h-11 rounded-[var(--radius-md)] bg-white px-3 text-[0.9375rem] ring-1 ring-[var(--color-hairline)] outline-none ring-inset"
        >
          <option value="">All statuses</option>
          <option value="lead">Lead</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="dormant">Dormant</option>
          <option value="closed">Closed</option>
        </select>

        <button
          type="submit"
          className="text-ink h-11 rounded-[var(--radius-md)] bg-white px-4 text-[0.9375rem] font-medium ring-1 ring-[var(--color-hairline)] ring-inset"
        >
          Filter
        </button>
      </form>

      <Panel>
        {clients.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={q || status ? 'No clients match that filter' : 'No clients yet'}
            description={
              supabase
                ? 'Add a client to start tracking engagements and onboarding.'
                : 'Set SUPABASE_SERVICE_ROLE_KEY to load clients.'
            }
          />
        ) : (
          <DataTable head={['Client', 'Type', 'Status', 'GSTIN', 'Updated']} caption="Clients">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-sunken/60 transition-colors">
                <td className="px-6 py-3.5">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="text-ink hover:text-brand-700 block text-[0.875rem] font-medium"
                  >
                    {client.name}
                  </Link>
                  {client.email ? (
                    <span className="text-ink-quaternary text-[0.75rem]">{client.email}</span>
                  ) : null}
                </td>
                <td className="text-ink-tertiary px-6 py-3.5 text-[0.8125rem]">
                  {ENTITY_LABEL[client.entity_type] ?? client.entity_type}
                </td>
                <td className="px-6 py-3.5">
                  <Pill tone={STATUS_TONE[client.status]}>{client.status}</Pill>
                </td>
                <td className="text-ink-tertiary px-6 py-3.5 font-[family-name:var(--font-mono)] text-[0.75rem]">
                  {client.gstin ?? '—'}
                </td>
                <td className="text-ink-quaternary px-6 py-3.5 text-[0.8125rem]">
                  {formatRelative(client.updated_at)}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}
