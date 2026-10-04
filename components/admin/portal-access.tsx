import { KeyRound } from 'lucide-react';
import { Panel, Pill } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import {
  inviteToZohoPortal,
  sendPortalInvite,
  setPortalEnabled,
} from '@/app/admin/_actions/portal';
import { serviceClient } from '@/lib/supabase';
import { booksContactFor, booksOrgId } from '@/lib/integrations/zoho';
import { formatDate } from '@/lib/utils';

/**
 * Who can sign in to this client's portal, and with what. Access follows the
 * record: the client's own email and phone, and every contact person's — so
 * adding a contact (or importing one from Zoho Books) is how you give someone
 * access, and removing them takes it away.
 */
export async function PortalAccess({
  clientId,
  editable,
}: {
  clientId: string;
  editable: boolean;
}) {
  const supabase = serviceClient();
  if (!supabase) return null;
  const [{ data: client }, { data: contacts }, { data: portal }, orgId, customerId] =
    await Promise.all([
      supabase.from('clients').select('email, phone').eq('id', clientId).maybeSingle(),
      supabase.from('client_contacts').select('name, email, phone').eq('client_id', clientId),
      supabase.from('client_portal').select('*').eq('client_id', clientId).maybeSingle(),
      booksOrgId(),
      booksContactFor(clientId),
    ]);
  const enabled = portal?.enabled ?? true;
  const logins = [
    client?.email,
    client?.phone,
    ...(contacts ?? []).flatMap((c) => [c.email, c.phone]),
  ].filter((v): v is string => Boolean(v) && !String(v).endsWith('.invalid'));
  const unique = [...new Set(logins)];

  return (
    <Panel
      title="Client portal"
      description="They sign in at /portal with any of these, using a one-time code."
      action={<Pill tone={enabled ? 'positive' : 'neutral'}>{enabled ? 'On' : 'Off'}</Pill>}
    >
      <div className="px-6 py-4">
        {unique.length ? (
          <ul className="flex flex-wrap gap-2">
            {unique.map((v) => (
              <li
                key={v}
                className="bg-sunken text-ink-2 inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[0.75rem]"
              >
                <KeyRound className="h-3 w-3" /> {v}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-3 text-[0.8125rem]">
            No email or phone on file yet — add one to the client or a contact person.
          </p>
        )}
        <p className="text-ink-3 mt-3 text-[0.75rem]">
          {portal?.last_login_at
            ? `Last signed in ${formatDate(portal.last_login_at)} · ${portal.logins} sign-in${portal.logins === 1 ? '' : 's'}`
            : 'Has not signed in yet.'}
          {customerId ? ' · Invoices come live from Zoho Books.' : ''}
        </p>
        {editable ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {enabled && unique.length ? (
              <form action={sendPortalInvite}>
                <input type="hidden" name="client_id" value={clientId} />
                <SubmitButton pendingText="Sending…">Email the invitation</SubmitButton>
              </form>
            ) : null}
            {orgId && customerId ? (
              <form action={inviteToZohoPortal}>
                <input type="hidden" name="client_id" value={clientId} />
                <SubmitButton tone="quiet" pendingText="Inviting…">
                  {portal?.zoho_portal_invited_at
                    ? 'Re-invite to Zoho portal'
                    : 'Invite to Zoho Books portal'}
                </SubmitButton>
              </form>
            ) : null}
            <form action={setPortalEnabled}>
              <input type="hidden" name="client_id" value={clientId} />
              <input type="hidden" name="enabled" value={enabled ? 'false' : 'true'} />
              <SubmitButton
                tone={enabled ? 'danger' : 'quiet'}
                confirm={
                  enabled ? 'Switch off portal access and sign them out everywhere?' : undefined
                }
                pendingText="…"
              >
                {enabled ? 'Switch off' : 'Switch on'}
              </SubmitButton>
            </form>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
