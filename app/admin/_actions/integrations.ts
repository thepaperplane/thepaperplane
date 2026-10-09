'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { serviceClient } from '@/lib/supabase';
import {
  getZoho,
  importBooksCustomers,
  logZoho,
  pushContact,
  pushLead,
  revokeZoho,
  syncBooksInvoices,
  zohoSyncAll,
} from '@/lib/integrations/zoho';

/**
 * Zoho operations the owner runs from the console. Each one is idempotent —
 * integration_links remembers what has already been sent — so pressing a
 * button twice never creates a duplicate in Zoho.
 */

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

async function settings(): Promise<Record<string, unknown>> {
  const row = await getZoho();
  return (row?.settings as Record<string, unknown>) ?? {};
}

async function done(action: string, ok: boolean, detail: string) {
  await logZoho(action, ok, detail);
  await db()
    .from('integrations')
    .update({
      last_sync_at: new Date().toISOString(),
      ...(ok ? { last_error: null } : { last_error: detail }),
    })
    .eq('provider', 'zoho');
  revalidatePath('/admin/integrations');
}

export async function syncLeadsToCrm(): Promise<void> {
  const profile = await requireRole('admin');
  const { data } = await db()
    .from('enquiries')
    .select('id, name, email, phone, company, message, service_id')
    .order('created_at', { ascending: false })
    .limit(200);
  let sent = 0;
  let failed = 0;
  let lastError = '';
  for (const e of data ?? []) {
    try {
      if (await pushLead(e)) sent++;
    } catch (err) {
      failed++;
      lastError = err instanceof Error ? err.message : String(err);
      if (/not connected|Reconnect/i.test(lastError)) break;
    }
  }
  await audit(profile.email, 'integrations.zoho.leads', 'integrations', 'zoho', { sent, failed });
  await done(
    'crm.leads',
    failed === 0,
    failed
      ? `${sent} sent, ${failed} failed — ${lastError}`
      : `${sent} new lead${sent === 1 ? '' : 's'} sent to CRM`,
  );
}

export async function syncClientsToBooks(): Promise<void> {
  const profile = await requireRole('admin');
  const orgId = String((await settings()).books_org_id ?? '');
  if (!orgId) {
    await done('books.contacts', false, 'No Zoho Books organisation found on this account.');
    return;
  }
  const { data } = await db()
    .from('clients')
    .select('id, name, legal_name, email, phone, gstin')
    .order('created_at', { ascending: true })
    .limit(500);
  let sent = 0;
  let failed = 0;
  let lastError = '';
  for (const c of data ?? []) {
    try {
      if (await pushContact({ ...c, name: c.legal_name || c.name }, orgId)) sent++;
    } catch (err) {
      failed++;
      lastError = err instanceof Error ? err.message : String(err);
      if (/not connected|Reconnect/i.test(lastError)) break;
    }
  }
  await audit(profile.email, 'integrations.zoho.contacts', 'integrations', 'zoho', {
    sent,
    failed,
  });
  await done(
    'books.contacts',
    failed === 0,
    failed
      ? `${sent} sent, ${failed} failed — ${lastError}`
      : `${sent} client${sent === 1 ? '' : 's'} added to Books`,
  );
}

/**
 * Pulls invoices from Books into the console's invoice list, for clients that
 * are linked to a Books customer. Existing rows (same number) are updated in
 * place, so the console mirrors what Books says about status and balance.
 */
export async function importBooksInvoices(): Promise<void> {
  const profile = await requireRole('admin');
  const orgId = String((await settings()).books_org_id ?? '');
  if (!orgId) {
    await done('books.invoices', false, 'No Zoho Books organisation found on this account.');
    return;
  }
  try {
    const { imported, skipped } = await syncBooksInvoices(orgId);
    await audit(profile.email, 'integrations.zoho.invoices', 'integrations', 'zoho', {
      imported,
      skipped,
    });
    await done(
      'books.invoices',
      true,
      `${imported} invoice${imported === 1 ? '' : 's'} imported${skipped ? `, ${skipped} skipped (customer not linked to a client here)` : ''}`,
    );
    revalidatePath('/admin/invoices');
  } catch (err) {
    await done('books.invoices', false, err instanceof Error ? err.message : String(err));
  }
}

/**
 * Brings every Zoho Books customer (and their contact people) into the
 * website's client list — new ones created, existing ones matched and kept in
 * step. The same runs automatically every morning.
 */
export async function importClientsFromBooks(): Promise<void> {
  const profile = await requireRole('admin');
  const orgId = String((await settings()).books_org_id ?? '');
  if (!orgId) {
    await done('books.import', false, 'No Zoho Books organisation found on this account.');
    return;
  }
  try {
    const r = await importBooksCustomers(orgId, null);
    await audit(profile.email, 'integrations.zoho.import', 'integrations', 'zoho', r);
    await done(
      'books.import',
      true,
      `${r.seen} customers read: ${r.created} new clients, ${r.updated} updated, ${r.persons} contact people`,
    );
    revalidatePath('/admin/clients');
  } catch (err) {
    await done('books.import', false, err instanceof Error ? err.message : String(err));
  }
}

export async function setAutoLeads(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const current = await settings();
  const next = { ...current, auto_leads: formData.get('auto_leads') === 'on' };
  await db()
    .from('integrations')
    .update({ settings: next as never })
    .eq('provider', 'zoho');
  await audit(profile.email, 'integrations.zoho.auto', 'integrations', 'zoho', {
    auto_leads: next.auto_leads,
  });
  revalidatePath('/admin/integrations');
}

export async function disconnectZoho(): Promise<void> {
  const profile = await requireRole('admin');
  await revokeZoho();
  await audit(profile.email, 'integrations.zoho.disconnect', 'integrations', 'zoho');
  revalidatePath('/admin/integrations');
}

/** The one button: everything, both ways. */
export async function syncEverything(): Promise<void> {
  const profile = await requireRole('editor');
  const r = await zohoSyncAll({ force: true });
  await audit(profile.email, 'integrations.zoho.sync_all', 'integrations', 'zoho', {
    detail: r.detail,
  });
  revalidatePath('/admin', 'layout');
}

/**
 * Runs when the console is opened: a quiet sync if the last one is stale.
 * Returns whether anything changed so the page can refresh itself.
 */
export async function autoSyncZoho(): Promise<boolean> {
  await requireRole('editor');
  const r = await zohoSyncAll({ minGapMs: 5 * 60_000 });
  if (r.changed) revalidatePath('/admin', 'layout');
  return r.changed;
}
