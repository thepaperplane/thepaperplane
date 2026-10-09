import 'server-only';
import { serviceClient } from '@/lib/supabase';
import { open, seal } from './secret-box';
import type { IntegrationRow } from '@/lib/database.types';

/**
 * Zoho CRM and Zoho Books, through one OAuth connection.
 *
 * Both products sit behind the same Zoho account, so a single consent screen
 * grants both scopes and one refresh token serves both APIs. The data centre
 * matters: an Indian Zoho account lives at accounts.zoho.in and its APIs at
 * zohoapis.in — calling the .com hosts with an .in token fails with an
 * unhelpful "invalid token". ZOHO_DC selects it (default: in).
 *
 * Tokens are encrypted before they reach the database (./secret-box.ts) and
 * never leave the server.
 */

const DC = (process.env.ZOHO_DC || 'in').replace(/[^a-z.]/gi, '');
const ACCOUNTS = `https://accounts.zoho.${DC}`;
const API = `https://www.zohoapis.${DC}`;

export const ZOHO_SCOPES = [
  'ZohoCRM.modules.leads.CREATE',
  'ZohoCRM.modules.leads.READ',
  'ZohoCRM.modules.contacts.READ',
  'ZohoCRM.org.READ',
  'ZohoBooks.contacts.CREATE',
  'ZohoBooks.contacts.READ',
  // Enabling Zoho's own customer portal for a contact ("Invite to Zoho portal").
  'ZohoBooks.contacts.UPDATE',
  'ZohoBooks.invoices.READ',
  'ZohoBooks.settings.READ',
].join(',');

export function zohoConfigured(): boolean {
  return Boolean(process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET);
}

export function zohoRedirectUri(origin: string): string {
  return `${process.env.ZOHO_REDIRECT_ORIGIN || origin}/api/admin/integrations/zoho/callback`;
}

export function zohoAuthUrl(origin: string, state: string): string {
  const q = new URLSearchParams({
    scope: ZOHO_SCOPES,
    client_id: process.env.ZOHO_CLIENT_ID ?? '',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    redirect_uri: zohoRedirectUri(origin),
    state,
  });
  return `${ACCOUNTS}/oauth/v2/auth?${q.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  api_domain?: string;
  error?: string;
};

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${ACCOUNTS}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.ZOHO_CLIENT_ID ?? '',
      client_secret: process.env.ZOHO_CLIENT_SECRET ?? '',
      ...params,
    }),
    cache: 'no-store',
  });
  return (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as TokenResponse;
}

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

export async function logZoho(action: string, ok: boolean, detail?: string) {
  await db()
    .from('integration_log')
    .insert({ provider: 'zoho', action, ok, detail: detail?.slice(0, 1000) ?? null })
    .then(
      () => undefined,
      () => undefined,
    );
}

export async function getZoho(): Promise<IntegrationRow | null> {
  const supabase = serviceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'zoho')
    .maybeSingle();
  return data ?? null;
}

/** Completes the OAuth handshake and stores the connection. */
export async function connectWithCode(code: string, origin: string): Promise<void> {
  const t = await tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: zohoRedirectUri(origin),
  });
  if (!t.access_token || !t.refresh_token) {
    throw new Error(
      t.error ? `Zoho refused the connection: ${t.error}` : 'Zoho returned no token.',
    );
  }
  const now = Date.now();
  await db()
    .from('integrations')
    .upsert({
      provider: 'zoho',
      status: 'connected',
      data_center: DC,
      scopes: ZOHO_SCOPES,
      refresh_token_enc: seal(t.refresh_token),
      access_token_enc: seal(t.access_token),
      access_expires_at: new Date(now + (t.expires_in ?? 3600) * 1000 - 60_000).toISOString(),
      connected_at: new Date(now).toISOString(),
      last_error: null,
      updated_at: new Date(now).toISOString(),
    });

  // Describe what was connected: the CRM organisation and the Books org.
  const settings: Record<string, unknown> = {};
  let label = '';
  try {
    const org = await zohoFetch<{ org?: { company_name?: string; primary_email?: string }[] }>(
      '/crm/v6/org',
    );
    const o = org.org?.[0];
    if (o) {
      label = o.company_name ?? '';
      settings.crm_email = o.primary_email ?? null;
    }
  } catch (e) {
    await logZoho('crm.org', false, e instanceof Error ? e.message : String(e));
  }
  try {
    const books = await zohoFetch<{
      organizations?: { organization_id: string; name: string; is_default_org?: boolean }[];
    }>('/books/v3/organizations');
    const org = books.organizations?.find((o) => o.is_default_org) ?? books.organizations?.[0];
    if (org) {
      settings.books_org_id = org.organization_id;
      settings.books_org_name = org.name;
      label ||= org.name;
    }
  } catch (e) {
    await logZoho('books.organizations', false, e instanceof Error ? e.message : String(e));
  }
  await db()
    .from('integrations')
    .update({ account_label: label || 'Zoho', settings: settings as never })
    .eq('provider', 'zoho');
  await logZoho('connect', true, label);
}

async function accessToken(): Promise<string> {
  const row = await getZoho();
  if (!row || row.status === 'disconnected') throw new Error('Zoho is not connected.');
  const cached = open(row.access_token_enc);
  if (cached && row.access_expires_at && new Date(row.access_expires_at).getTime() > Date.now()) {
    return cached;
  }
  const refresh = open(row.refresh_token_enc);
  if (!refresh) throw new Error('The stored Zoho token could not be read. Reconnect Zoho.');
  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: refresh });
  if (!t.access_token) {
    await db()
      .from('integrations')
      .update({ status: 'error', last_error: t.error ?? 'Refresh failed' })
      .eq('provider', 'zoho');
    throw new Error(`Zoho token refresh failed: ${t.error ?? 'unknown error'}. Reconnect Zoho.`);
  }
  await db()
    .from('integrations')
    .update({
      status: 'connected',
      access_token_enc: seal(t.access_token),
      access_expires_at: new Date(
        Date.now() + (t.expires_in ?? 3600) * 1000 - 60_000,
      ).toISOString(),
      last_error: null,
    })
    .eq('provider', 'zoho');
  return t.access_token;
}

export async function zohoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as T & { message?: string; code?: unknown };
  if (!res.ok) {
    throw new Error(
      `Zoho ${res.status}: ${(body as { message?: string }).message ?? 'request failed'}`,
    );
  }
  return body;
}

export async function revokeZoho(): Promise<void> {
  const row = await getZoho();
  const refresh = open(row?.refresh_token_enc);
  if (refresh) {
    await fetch(`${ACCOUNTS}/oauth/v2/token/revoke?token=${encodeURIComponent(refresh)}`, {
      method: 'POST',
      cache: 'no-store',
    }).catch(() => undefined);
  }
  await db()
    .from('integrations')
    .update({
      status: 'disconnected',
      refresh_token_enc: null,
      access_token_enc: null,
      access_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('provider', 'zoho');
  await logZoho('disconnect', true);
}

/* ------------------------------------------------------------- operations */

type Linkable = { id: string };

async function linked(table: string, module: string): Promise<Set<string>> {
  const { data } = await db()
    .from('integration_links')
    .select('local_id')
    .eq('provider', 'zoho')
    .eq('local_table', table)
    .eq('remote_module', module);
  return new Set((data ?? []).map((r) => r.local_id));
}

async function link(table: string, localId: string, module: string, remoteId: string) {
  await db().from('integration_links').upsert(
    {
      provider: 'zoho',
      local_table: table,
      local_id: localId,
      remote_module: module,
      remote_id: remoteId,
      synced_at: new Date().toISOString(),
    },
    { onConflict: 'provider,local_table,local_id,remote_module' },
  );
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: '', last: parts[0]! };
  return { first: parts.slice(0, -1).join(' '), last: parts.at(-1)! };
}

export type EnquiryForCrm = Linkable & {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  service_id: string | null;
};

/** One enquiry → one CRM Lead. Skips anything already linked. */
export async function pushLead(e: EnquiryForCrm): Promise<string | null> {
  const already = await linked('enquiries', 'Leads');
  if (already.has(e.id)) return null;
  const { first, last } = splitName(e.name || 'Website visitor');
  const res = await zohoFetch<{
    data?: { code: string; details?: { id?: string }; message?: string }[];
  }>('/crm/v6/Leads', {
    method: 'POST',
    body: JSON.stringify({
      data: [
        {
          First_Name: first || undefined,
          Last_Name: last,
          Email: e.email && !e.email.endsWith('.invalid') ? e.email : undefined,
          Phone: e.phone ?? undefined,
          Company: e.company || e.name,
          Lead_Source: 'Website',
          Description: [e.service_id ? `Service: ${e.service_id}` : '', e.message ?? '']
            .filter(Boolean)
            .join('\n\n')
            .slice(0, 30000),
        },
      ],
      trigger: ['workflow'],
    }),
  });
  const row = res.data?.[0];
  const id = row?.details?.id;
  if (row?.code !== 'SUCCESS' || !id) throw new Error(row?.message ?? 'Lead not created.');
  await link('enquiries', e.id, 'Leads', id);
  return id;
}

export type ClientForBooks = Linkable & {
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
};

/** One client → one Books customer contact. */
export async function pushContact(c: ClientForBooks, orgId: string): Promise<string | null> {
  const already = await linked('clients', 'books_contacts');
  if (already.has(c.id)) return null;
  const res = await zohoFetch<{ contact?: { contact_id: string }; message?: string }>(
    `/books/v3/contacts?organization_id=${encodeURIComponent(orgId)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        contact_name: c.name,
        company_name: c.name,
        contact_type: 'customer',
        ...(c.gstin ? { gst_no: c.gstin, gst_treatment: 'business_gst' } : {}),
        contact_persons: [
          {
            first_name: c.name.slice(0, 100),
            email: c.email ?? undefined,
            phone: c.phone ?? undefined,
            is_primary_contact: true,
          },
        ],
      }),
    },
  );
  const id = res.contact?.contact_id;
  if (!id) throw new Error(res.message ?? 'Contact not created.');
  await link('clients', c.id, 'books_contacts', id);
  return id;
}

export type BooksInvoice = {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  status: string;
};

export async function listBooksInvoices(orgId: string): Promise<BooksInvoice[]> {
  const res = await zohoFetch<{ invoices?: BooksInvoice[] }>(
    `/books/v3/invoices?organization_id=${encodeURIComponent(orgId)}&sort_column=date&sort_order=D&per_page=100`,
  );
  return res.invoices ?? [];
}

/**
 * Sends a new enquiry to Zoho CRM if the owner has switched on automatic
 * leads. Called after the visitor already has their answer, and never throws:
 * a CRM outage must not cost a lead, which is safe in the database regardless.
 */
export async function autoPushLead(enquiryId: string): Promise<void> {
  try {
    const row = await getZoho();
    const settings = (row?.settings ?? {}) as Record<string, unknown>;
    if (!row || row.status !== 'connected' || settings.auto_leads !== true) return;
    const { data: e } = await db()
      .from('enquiries')
      .select('id, name, email, phone, company, message, service_id')
      .eq('id', enquiryId)
      .maybeSingle();
    if (!e) return;
    const id = await pushLead(e);
    await logZoho('crm.lead.auto', true, id ? `Lead ${id}` : 'Already linked');
  } catch (err) {
    await logZoho('crm.lead.auto', false, err instanceof Error ? err.message : String(err));
  }
}

/* ------------------------------------------------------ Books → website ---- */

type BooksCustomer = {
  contact_id: string;
  contact_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  gst_no?: string;
  pan_no?: string;
  status?: string;
  customer_sub_type?: string;
  last_modified_time?: string;
};

type BooksPerson = {
  contact_person_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary_contact?: boolean;
  designation?: string;
};

export async function listBooksCustomers(orgId: string): Promise<BooksCustomer[]> {
  const out: BooksCustomer[] = [];
  for (let page = 1; page <= 25; page++) {
    const res = await zohoFetch<{
      contacts?: BooksCustomer[];
      page_context?: { has_more_page?: boolean };
    }>(
      `/books/v3/contacts?organization_id=${encodeURIComponent(orgId)}&contact_type=customer&per_page=200&page=${page}`,
    );
    out.push(...(res.contacts ?? []));
    if (!res.page_context?.has_more_page) break;
  }
  return out;
}

async function listBooksPersons(orgId: string, contactId: string): Promise<BooksPerson[]> {
  const res = await zohoFetch<{ contact_persons?: BooksPerson[] }>(
    `/books/v3/contacts/${encodeURIComponent(contactId)}/contactpersons?organization_id=${encodeURIComponent(orgId)}`,
  );
  return res.contact_persons ?? [];
}

const clean = (v?: string | null) => (v && v.trim() ? v.trim() : null);
const digits = (v?: string | null) => (v ?? '').replace(/\D/g, '');

export type ImportSummary = { created: number; updated: number; persons: number; seen: number };

/**
 * Brings Zoho Books customers into the website's client list.
 *
 * Books is the record for billing details, so on a linked client its name,
 * legal name, email, phone, GSTIN and PAN follow Books. A customer not yet
 * linked is matched to an existing client by GSTIN, then email, before a new
 * client is created — so a client entered in both places is joined, not
 * duplicated. Contact persons come across too: they are the people who can
 * sign in to the client portal with their own email or phone.
 *
 * `since` limits the contact-person fetch (one request per customer, and
 * Zoho rate-limits) to customers changed after it; the customer list itself
 * is always read in full.
 */
export async function importBooksCustomers(
  orgId: string,
  since?: string | null,
): Promise<ImportSummary> {
  const supabase = db();
  const summary: ImportSummary = { created: 0, updated: 0, persons: 0, seen: 0 };
  const customers = await listBooksCustomers(orgId);
  summary.seen = customers.length;

  const [{ data: links }, { data: clients }, { data: personLinks }] = await Promise.all([
    supabase
      .from('integration_links')
      .select('local_id, remote_id')
      .eq('provider', 'zoho')
      .eq('local_table', 'clients')
      .eq('remote_module', 'books_contacts'),
    supabase.from('clients').select('id, name, legal_name, email, phone, gstin, pan').limit(10000),
    supabase
      .from('integration_links')
      .select('local_id, remote_id')
      .eq('provider', 'zoho')
      .eq('local_table', 'client_contacts')
      .eq('remote_module', 'books_contact_persons'),
  ]);
  const byRemote = new Map((links ?? []).map((l) => [l.remote_id, l.local_id]));
  const linkedLocal = new Set((links ?? []).map((l) => l.local_id));
  const local = new Map((clients ?? []).map((c) => [c.id, c]));
  const personByRemote = new Map((personLinks ?? []).map((l) => [l.remote_id, l.local_id]));
  const sinceMs = since ? new Date(since).getTime() : 0;
  let personBudget = 80;

  for (const cust of customers) {
    const fields = {
      name: clean(cust.contact_name) ?? 'Unnamed customer',
      legal_name: clean(cust.company_name),
      email: clean(cust.email)?.toLowerCase() ?? null,
      phone: clean(cust.mobile) ?? clean(cust.phone),
      gstin: clean(cust.gst_no)?.toUpperCase() ?? null,
      pan: clean(cust.pan_no)?.toUpperCase() ?? null,
    };

    let clientId = byRemote.get(cust.contact_id) ?? null;
    if (!clientId) {
      const match = [...local.values()].find(
        (c) =>
          !linkedLocal.has(c.id) &&
          ((fields.gstin && c.gstin?.toUpperCase() === fields.gstin) ||
            (fields.email && c.email?.toLowerCase() === fields.email)),
      );
      clientId = match?.id ?? null;
    }

    if (clientId) {
      const current = local.get(clientId);
      const patch: Record<string, string | null> = {};
      (Object.keys(fields) as (keyof typeof fields)[]).forEach((k) => {
        const next = fields[k];
        if (next && next !== (current as Record<string, unknown> | undefined)?.[k]) patch[k] = next;
      });
      if (Object.keys(patch).length) {
        await supabase
          .from('clients')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', clientId);
        summary.updated++;
      }
    } else {
      const { data: created } = await supabase
        .from('clients')
        .insert({
          ...fields,
          entity_type: cust.customer_sub_type === 'individual' ? 'individual' : 'other',
          status: cust.status === 'inactive' ? 'dormant' : 'active',
          source: 'zoho_books',
        })
        .select('id')
        .single();
      if (!created) continue;
      clientId = created.id;
      summary.created++;
    }

    if (!byRemote.has(cust.contact_id)) {
      await link('clients', clientId, 'books_contacts', cust.contact_id);
      byRemote.set(cust.contact_id, clientId);
      linkedLocal.add(clientId);
    }

    // Contact persons, for those changed since the last run.
    const changed =
      !sinceMs || !cust.last_modified_time || new Date(cust.last_modified_time).getTime() > sinceMs;
    if (!changed || personBudget <= 0) continue;
    personBudget--;
    let persons: BooksPerson[] = [];
    try {
      persons = await listBooksPersons(orgId, cust.contact_id);
    } catch {
      continue;
    }
    for (const p of persons) {
      const row = {
        client_id: clientId,
        name: [clean(p.first_name), clean(p.last_name)].filter(Boolean).join(' ') || fields.name,
        role: clean(p.designation),
        email: clean(p.email)?.toLowerCase() ?? null,
        phone: clean(p.mobile) ?? clean(p.phone),
        is_primary: Boolean(p.is_primary_contact),
      };
      if (!row.email && !digits(row.phone)) continue;
      const existing = personByRemote.get(p.contact_person_id);
      if (existing) {
        await supabase.from('client_contacts').update(row).eq('id', existing);
      } else {
        const { data: made } = await supabase
          .from('client_contacts')
          .insert(row)
          .select('id')
          .single();
        if (made) {
          await link('client_contacts', made.id, 'books_contact_persons', p.contact_person_id);
          personByRemote.set(p.contact_person_id, made.id);
        }
      }
      summary.persons++;
    }
  }
  return summary;
}

/**
 * Mirrors Books invoices into the console's invoice list for linked clients.
 * Existing rows (same number) are updated in place.
 */
export async function syncBooksInvoices(
  orgId: string,
): Promise<{ imported: number; skipped: number }> {
  const supabase = db();
  const invoices = await listBooksInvoices(orgId);
  const { data: links } = await supabase
    .from('integration_links')
    .select('local_id, remote_id')
    .eq('provider', 'zoho')
    .eq('local_table', 'clients')
    .eq('remote_module', 'books_contacts');
  const clientFor = new Map((links ?? []).map((l) => [l.remote_id, l.local_id]));
  const statusMap: Record<string, 'draft' | 'sent' | 'paid' | 'overdue' | 'void'> = {
    draft: 'draft',
    sent: 'sent',
    viewed: 'sent',
    partially_paid: 'sent',
    unpaid: 'sent',
    overdue: 'overdue',
    paid: 'paid',
    void: 'void',
  };
  let imported = 0;
  let skipped = 0;
  for (const inv of invoices) {
    const clientId = clientFor.get(inv.customer_id);
    if (!clientId) {
      skipped++;
      continue;
    }
    await supabase.from('invoices').upsert(
      {
        client_id: clientId,
        number: inv.invoice_number,
        description: 'Imported from Zoho Books',
        issued_on: inv.date,
        due_on: inv.due_date || null,
        amount: inv.total,
        status: statusMap[inv.status] ?? 'sent',
        paid_on: inv.status === 'paid' ? inv.due_date || inv.date : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'number' },
    );
    imported++;
  }
  return { imported, skipped };
}

/** Books customer id for a website client, if the two are linked. */
export async function booksContactFor(clientId: string): Promise<string | null> {
  const { data } = await db()
    .from('integration_links')
    .select('remote_id')
    .eq('provider', 'zoho')
    .eq('local_table', 'clients')
    .eq('local_id', clientId)
    .eq('remote_module', 'books_contacts')
    .maybeSingle();
  return data?.remote_id ?? null;
}

export async function booksOrgId(): Promise<string | null> {
  const row = await getZoho();
  if (!row || row.status !== 'connected') return null;
  const s = (row.settings ?? {}) as Record<string, unknown>;
  return typeof s.books_org_id === 'string' ? s.books_org_id : null;
}

export type PortalInvoice = BooksInvoice & { currency_code?: string; invoice_url?: string };

/** One customer's invoices, live from Books, newest first. */
export async function customerInvoices(
  orgId: string,
  customerId: string,
): Promise<PortalInvoice[]> {
  const res = await zohoFetch<{ invoices?: PortalInvoice[] }>(
    `/books/v3/invoices?organization_id=${encodeURIComponent(orgId)}&customer_id=${encodeURIComponent(customerId)}&sort_column=date&sort_order=D&per_page=100`,
  );
  return (res.invoices ?? []).filter((i) => i.status !== 'draft' && i.status !== 'void');
}

export async function invoiceDetail(
  orgId: string,
  invoiceId: string,
): Promise<(PortalInvoice & { customer_id: string }) | null> {
  const res = await zohoFetch<{ invoice?: PortalInvoice }>(
    `/books/v3/invoices/${encodeURIComponent(invoiceId)}?organization_id=${encodeURIComponent(orgId)}`,
  );
  return res.invoice ?? null;
}

/** The invoice as Books renders it, for download. */
export async function invoicePdf(orgId: string, invoiceId: string): Promise<ArrayBuffer> {
  const token = await accessToken();
  const res = await fetch(
    `${API}/books/v3/invoices/${encodeURIComponent(invoiceId)}?organization_id=${encodeURIComponent(orgId)}&accept=pdf`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` }, cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Zoho ${res.status}: PDF not available`);
  return res.arrayBuffer();
}

/**
 * Invites a client's primary contact to Zoho Books' own customer portal, for
 * anyone who prefers it to ours. Zoho sends the invitation email itself.
 */
export async function enableZohoPortal(orgId: string, customerId: string): Promise<void> {
  const persons = await listBooksPersons(orgId, customerId);
  const ids = persons
    .filter((p) => p.email)
    .map((p) => ({ contact_person_id: p.contact_person_id }));
  if (!ids.length) throw new Error('This customer has no contact person with an email in Books.');
  await zohoFetch(
    `/books/v3/contacts/${encodeURIComponent(customerId)}/portal/enable?organization_id=${encodeURIComponent(orgId)}`,
    { method: 'POST', body: JSON.stringify({ contact_persons: ids }) },
  );
}

export type FullSyncResult = {
  ran: boolean;
  detail: string;
  changed: boolean;
};

let syncing = false;

/**
 * Everything, both ways, in one pass: Books customers in (new clients are
 * created, existing ones kept in step), website clients not yet in Books sent
 * across, Books invoices mirrored, and new enquiries sent to the CRM.
 *
 * `force` is the owner pressing the button. Without it (the automatic run
 * when the console is opened, and the daily cron) a pass is skipped if one
 * finished within `minGapMs`, so browsing the console never hammers Zoho.
 */
export async function zohoSyncAll(opts: {
  force?: boolean;
  minGapMs?: number;
}): Promise<FullSyncResult> {
  const row = await getZoho();
  if (!row || row.status !== 'connected')
    return { ran: false, detail: 'Zoho not connected', changed: false };
  const orgId = await booksOrgId();
  if (!orgId) return { ran: false, detail: 'No Books organisation', changed: false };
  const gap = opts.minGapMs ?? 5 * 60_000;
  if (!opts.force && row.last_sync_at && Date.now() - new Date(row.last_sync_at).getTime() < gap) {
    return { ran: false, detail: 'Recently synced', changed: false };
  }
  if (syncing) return { ran: false, detail: 'Sync already running', changed: false };
  syncing = true;
  const supabase = db();
  const parts: string[] = [];
  const errors: string[] = [];
  let changed = false;
  try {
    try {
      const c = await importBooksCustomers(orgId, opts.force ? null : row.last_sync_at);
      parts.push(`${c.created} new / ${c.updated} updated clients`);
      if (c.created || c.updated) changed = true;
    } catch (e) {
      errors.push(`customers: ${e instanceof Error ? e.message : e}`);
    }
    try {
      const done = await linked('clients', 'books_contacts');
      const { data } = await supabase
        .from('clients')
        .select('id, name, legal_name, email, phone, gstin')
        .order('created_at', { ascending: true })
        .limit(500);
      let sent = 0;
      for (const c of (data ?? []).filter((x) => !done.has(x.id))) {
        if (await pushContact({ ...c, name: c.legal_name || c.name }, orgId)) sent++;
      }
      if (sent) {
        parts.push(`${sent} clients sent to Books`);
        changed = true;
      }
    } catch (e) {
      errors.push(`clients→Books: ${e instanceof Error ? e.message : e}`);
    }
    try {
      const i = await syncBooksInvoices(orgId);
      parts.push(`${i.imported} invoices`);
      if (i.imported) changed = true;
    } catch (e) {
      errors.push(`invoices: ${e instanceof Error ? e.message : e}`);
    }
    try {
      const done = await linked('enquiries', 'Leads');
      const { data } = await supabase
        .from('enquiries')
        .select('id, name, email, phone, company, message, service_id')
        .order('created_at', { ascending: false })
        .limit(100);
      let sent = 0;
      for (const e of (data ?? []).filter((x) => !done.has(x.id))) {
        if (await pushLead(e)) sent++;
      }
      if (sent) parts.push(`${sent} leads sent to CRM`);
    } catch (e) {
      errors.push(`leads: ${e instanceof Error ? e.message : e}`);
    }
    const ok = errors.length === 0;
    const detail = [...parts, ...errors].join('; ');
    await logZoho(opts.force ? 'sync.manual' : 'sync.auto', ok, detail);
    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString(), last_error: ok ? null : detail })
      .eq('provider', 'zoho');
    return { ran: true, detail, changed };
  } finally {
    syncing = false;
  }
}

/** The daily round, run by the cron. */
export async function zohoDailySync(): Promise<string> {
  return (await zohoSyncAll({ force: true })).detail;
}
