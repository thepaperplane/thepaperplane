import { Cable, CheckCircle2, CircleAlert, MessageCircle } from 'lucide-react';
import { PageHeader, Panel, Pill } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import {
  disconnectZoho,
  importBooksInvoices,
  importClientsFromBooks,
  setAutoLeads,
  syncClientsToBooks,
  syncLeadsToCrm,
} from '@/app/admin/_actions/integrations';
import { requireRole } from '@/lib/auth';
import { getZoho, ZOHO_SCOPES, zohoConfigured } from '@/lib/integrations/zoho';
import { whatsappConfigured } from '@/lib/integrations/whatsapp';
import { serviceClient } from '@/lib/supabase';
import type { IntegrationLogRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export const metadata = { title: 'Integrations' };

const fmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

const NOTICE: Record<string, { tone: 'positive' | 'critical'; text: string }> = {
  connected: { tone: 'positive', text: 'Zoho is connected.' },
  denied: { tone: 'critical', text: 'Zoho access was not granted.' },
  failed: { tone: 'critical', text: 'Zoho could not be connected — see the log below.' },
  'state-mismatch': {
    tone: 'critical',
    text: 'That sign-in did not start from this console, so it was refused. Try again.',
  },
  'not-configured': {
    tone: 'critical',
    text: 'Add ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET to the environment first.',
  },
  'no-code': { tone: 'critical', text: 'Zoho did not return an authorisation code.' },
};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="bg-accent-wash text-accent grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.75rem] font-semibold">
        {n}
      </span>
      <span className="text-ink-2 text-[0.875rem] leading-relaxed">{children}</span>
    </li>
  );
}

/**
 * Where the website meets the rest of the business: Zoho CRM for the sales
 * pipeline, Zoho Books for customers and invoices, and WhatsApp Business for
 * conversations. Everything here runs on the server; tokens are encrypted at
 * rest and never shown.
 */
export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ zoho?: string }>;
}) {
  await requireRole('admin');
  const { zoho: notice } = await searchParams;
  const zoho = await getZoho();
  const configured = zohoConfigured();
  const connected = zoho?.status === 'connected';
  const granted = new Set((zoho?.scopes ?? '').split(/[\s,]+/).filter(Boolean));
  const missingScopes = ZOHO_SCOPES.split(',').some((sc) => !granted.has(sc));
  const settings = (zoho?.settings ?? {}) as Record<string, unknown>;
  const wa = whatsappConfigured();

  let log: IntegrationLogRow[] = [];
  const supabase = serviceClient();
  if (supabase) {
    const { data } = await supabase
      .from('integration_log')
      .select('*')
      .order('at', { ascending: false })
      .limit(15);
    log = data ?? [];
  }

  const flash = notice ? NOTICE[notice] : null;

  return (
    <>
      <PageHeader
        title="Zoho & integrations"
        description="Connect the website to Zoho CRM and Zoho Books, so every enquiry becomes a lead and every client a customer without retyping. WhatsApp Business lives in its own inbox."
      />

      {flash ? (
        <p
          role="status"
          className={`mb-5 rounded-[var(--radius-md)] px-4 py-3 text-[0.875rem] font-medium ${
            flash.tone === 'positive'
              ? 'bg-positive/10 text-positive'
              : 'bg-critical/10 text-critical'
          }`}
        >
          {flash.text}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel
          title="Zoho CRM + Zoho Books"
          description="One connection covers both. Uses your Zoho India account."
          action={
            <Pill tone={connected ? 'positive' : zoho?.status === 'error' ? 'critical' : 'neutral'}>
              {connected
                ? 'Connected'
                : zoho?.status === 'error'
                  ? 'Needs reconnecting'
                  : 'Not connected'}
            </Pill>
          }
        >
          <div className="px-6 py-5">
            {connected ? (
              <>
                {missingScopes ? (
                  <p className="bg-caution/10 text-ink mb-5 rounded-[var(--radius-md)] px-4 py-3 text-[0.8125rem] leading-relaxed">
                    New features need one more Zoho permission.{' '}
                    <a
                      href="/api/admin/integrations/zoho/connect"
                      className="text-accent font-semibold hover:underline"
                    >
                      Reconnect Zoho
                    </a>{' '}
                    once to grant it — nothing already synced is lost.
                  </p>
                ) : null}
                <dl className="grid gap-3 text-[0.875rem] sm:grid-cols-2">
                  <div>
                    <dt className="text-ink-3 text-[0.75rem]">Account</dt>
                    <dd className="text-ink font-medium">{zoho?.account_label ?? 'Zoho'}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3 text-[0.75rem]">Books organisation</dt>
                    <dd className="text-ink font-medium">
                      {String(settings.books_org_name ?? 'Not found on this account')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-3 text-[0.75rem]">Connected</dt>
                    <dd className="text-ink">
                      {zoho?.connected_at ? fmt.format(new Date(zoho.connected_at)) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-3 text-[0.75rem]">Last sync</dt>
                    <dd className="text-ink">
                      {zoho?.last_sync_at ? fmt.format(new Date(zoho.last_sync_at)) : 'Never'}
                    </dd>
                  </div>
                </dl>

                <form
                  action={setAutoLeads}
                  className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--sunken)] px-4 py-3"
                >
                  <label className="text-ink flex items-center gap-2.5 text-[0.875rem] font-medium">
                    <input
                      type="checkbox"
                      name="auto_leads"
                      defaultChecked={settings.auto_leads === true}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    Send every new enquiry to Zoho CRM automatically
                  </label>
                  <SubmitButton tone="quiet">Save</SubmitButton>
                </form>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <form action={importClientsFromBooks}>
                    <SubmitButton className="w-full" pendingText="Importing…">
                      Books customers → website clients
                    </SubmitButton>
                  </form>
                  <form action={syncLeadsToCrm}>
                    <SubmitButton className="w-full" pendingText="Sending…">
                      Enquiries → CRM leads
                    </SubmitButton>
                  </form>
                  <form action={syncClientsToBooks}>
                    <SubmitButton className="w-full" pendingText="Sending…">
                      Clients → Books
                    </SubmitButton>
                  </form>
                  <form action={importBooksInvoices}>
                    <SubmitButton className="w-full" tone="quiet" pendingText="Importing…">
                      Import Books invoices
                    </SubmitButton>
                  </form>
                </div>
                <p className="text-ink-3 mt-3 text-[0.8125rem] leading-relaxed">
                  Safe to press more than once: anything already sent is remembered and skipped.
                  Every morning the site also brings in new and changed Books customers and mirrors
                  their invoices on its own — Books stays the record for billing details.
                </p>

                <form
                  action={disconnectZoho}
                  className="mt-6 border-t border-[var(--hairline)] pt-5"
                >
                  <SubmitButton
                    tone="danger"
                    confirm="Disconnect Zoho? Syncing stops until you reconnect."
                    pendingText="Disconnecting…"
                  >
                    Disconnect Zoho
                  </SubmitButton>
                </form>
              </>
            ) : (
              <>
                <ol className="grid gap-3">
                  <Step n={1}>
                    At <strong>api-console.zoho.in</strong>, add a client of type{' '}
                    <strong>Server-based Applications</strong>. Homepage:{' '}
                    <code className="ref">https://www.thepaperplane.co.in</code>. Authorised
                    redirect URI:{' '}
                    <code className="ref">
                      https://www.thepaperplane.co.in/api/admin/integrations/zoho/callback
                    </code>
                  </Step>
                  <Step n={2}>
                    In Vercel → Settings → Environment Variables, add{' '}
                    <code className="ref">ZOHO_CLIENT_ID</code> and{' '}
                    <code className="ref">ZOHO_CLIENT_SECRET</code> from that client, then redeploy.
                  </Step>
                  <Step n={3}>
                    Come back here and press Connect. Approve CRM and Books on Zoho’s screen.
                  </Step>
                </ol>
                <div className="mt-6">
                  {configured ? (
                    <a
                      href="/api/admin/integrations/zoho/connect"
                      className="bg-accent text-accent-ink hover:bg-accent-hover inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.875rem] font-semibold"
                    >
                      <Cable className="h-4 w-4" />{' '}
                      {zoho?.status === 'error' ? 'Reconnect Zoho' : 'Connect Zoho'}
                    </a>
                  ) : (
                    <Pill tone="caution">Waiting for ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET</Pill>
                  )}
                </div>
              </>
            )}
          </div>
        </Panel>

        <div className="grid content-start gap-6">
          <Panel
            title="WhatsApp Business"
            description="Messages from your business number, answered from the console."
            action={<Pill tone={wa ? 'positive' : 'neutral'}>{wa ? 'Ready' : 'Not set up'}</Pill>}
          >
            <div className="px-6 py-5">
              <p className="text-ink-2 text-[0.875rem] leading-relaxed">
                {wa
                  ? 'Your number is connected. Conversations appear in the WhatsApp inbox.'
                  : 'Set up through Meta’s WhatsApp Cloud API — the steps are on the inbox page.'}
              </p>
              <a
                href="/admin/whatsapp"
                className="text-accent mt-3 inline-flex h-9 items-center gap-1.5 text-[0.875rem] font-semibold"
              >
                <MessageCircle className="h-4 w-4" /> Open the WhatsApp inbox
              </a>
            </div>
          </Panel>

          <Panel title="Activity" description="The last fifteen integration events.">
            {log.length ? (
              <ul className="divide-y divide-[var(--hairline)]">
                {log.map((l) => (
                  <li key={l.id} className="flex items-start gap-3 px-6 py-3">
                    {l.ok ? (
                      <CheckCircle2 className="text-positive mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <CircleAlert className="text-critical mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-ink text-[0.8125rem] font-medium">
                        {l.provider} · {l.action}
                      </p>
                      {l.detail ? (
                        <p className="text-ink-3 mt-0.5 text-[0.75rem] break-words">{l.detail}</p>
                      ) : null}
                    </div>
                    <span className="text-ink-3 ml-auto shrink-0 text-[0.75rem]">
                      {fmt.format(new Date(l.at))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-3 px-6 py-5 text-[0.875rem]">Nothing yet.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
