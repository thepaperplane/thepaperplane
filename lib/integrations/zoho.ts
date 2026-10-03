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
