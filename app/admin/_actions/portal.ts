'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { serviceClient } from '@/lib/supabase';
import { sendNotice } from '@/lib/email';
import { SITE } from '@/lib/site';
import { booksContactFor, booksOrgId, enableZohoPortal, logZoho } from '@/lib/integrations/zoho';

/** Portal access for one client, from the console. */

const uuid = z.string().uuid();

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

export async function setPortalEnabled(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('client_id'));
  if (!id.success) return;
  const enabled = formData.get('enabled') === 'true';
  await db()
    .from('client_portal')
    .upsert({ client_id: id.data, enabled, updated_at: new Date().toISOString() });
  if (!enabled) {
    // Close every open session that includes this client.
    await db()
      .from('portal_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .contains('client_ids', [id.data])
      .is('revoked_at', null);
  }
  await audit(profile.email, enabled ? 'portal.enable' : 'portal.disable', 'clients', id.data);
  revalidatePath(`/admin/clients/${id.data}`);
}

/** Emails every address on file for this client an invitation to the portal. */
export async function sendPortalInvite(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('client_id'));
  if (!id.success) return;
  const [{ data: client }, { data: contacts }] = await Promise.all([
    db().from('clients').select('name, email').eq('id', id.data).maybeSingle(),
    db().from('client_contacts').select('name, email').eq('client_id', id.data),
  ]);
  if (!client) return;
  const recipients = new Map<string, string>();
  if (client.email) recipients.set(client.email.toLowerCase(), client.name);
  (contacts ?? []).forEach((c) => c.email && recipients.set(c.email.toLowerCase(), c.name));
  for (const [email, name] of recipients) {
    if (email.endsWith('.invalid')) continue;
    await sendNotice({
      to: email,
      subject: `Your client portal with ${SITE.name}`,
      eyebrow: 'Client portal',
      heading: `${name.split(' ')[0]}, your portal is ready`,
      paragraphs: [
        `Invoices, documents and the deadlines we are tracking for ${client.name} are now in one place.`,
        'Sign in with this email address (or your registered mobile number). There is no password — you get a one-time code each time.',
      ],
      cta: { label: 'Open the client portal', href: `${SITE.url}/portal` },
    });
  }
  await audit(profile.email, 'portal.invite', 'clients', id.data, { count: recipients.size });
  revalidatePath(`/admin/clients/${id.data}`);
}

/** Also invites the client to Zoho Books' own customer portal. */
export async function inviteToZohoPortal(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const id = uuid.safeParse(formData.get('client_id'));
  if (!id.success) return;
  const [orgId, customerId] = await Promise.all([booksOrgId(), booksContactFor(id.data)]);
  if (!orgId || !customerId) return;
  try {
    await enableZohoPortal(orgId, customerId);
    await db().from('client_portal').upsert({
      client_id: id.data,
      zoho_portal_invited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await logZoho('books.portal.invite', true, customerId);
    await audit(profile.email, 'portal.zoho.invite', 'clients', id.data);
  } catch (e) {
    await logZoho('books.portal.invite', false, e instanceof Error ? e.message : String(e));
  }
  revalidatePath(`/admin/clients/${id.data}`);
}
