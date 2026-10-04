import 'server-only';
import { serviceClient } from '@/lib/supabase';
import { booksContactFor, booksOrgId, customerInvoices } from '@/lib/integrations/zoho';

/**
 * What a signed-in client sees. Invoices come live from Zoho Books when the
 * client is linked to a Books customer (with PDF and online view); otherwise
 * from the console's own invoice list.
 */

export type PortalInvoiceView = {
  id: string;
  number: string;
  date: string;
  due: string | null;
  total: number;
  balance: number;
  status: string;
  source: 'books' | 'local';
};

export async function invoicesFor(clientId: string): Promise<PortalInvoiceView[]> {
  const [orgId, customerId] = await Promise.all([booksOrgId(), booksContactFor(clientId)]);
  if (orgId && customerId) {
    try {
      const list = await customerInvoices(orgId, customerId);
      return list.map((i) => ({
        id: i.invoice_id,
        number: i.invoice_number,
        date: i.date,
        due: i.due_date || null,
        total: Number(i.total) || 0,
        balance: Number(i.balance) || 0,
        status: i.status,
        source: 'books',
      }));
    } catch (e) {
      console.error('[portal] books invoices failed', e instanceof Error ? e.message : e);
    }
  }
  const supabase = serviceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('invoices')
    .select('id, number, issued_on, due_on, amount, tax_amount, status')
    .eq('client_id', clientId)
    .not('status', 'in', '(draft,void)')
    .order('issued_on', { ascending: false })
    .limit(100);
  return (data ?? []).map((i) => {
    const total = Number(i.amount) + Number(i.tax_amount ?? 0);
    return {
      id: i.id,
      number: i.number,
      date: i.issued_on,
      due: i.due_on,
      total,
      balance: i.status === 'paid' ? 0 : total,
      status: i.status,
      source: 'local' as const,
    };
  });
}

export async function documentsFor(clientId: string) {
  const supabase = serviceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('client_documents')
    .select('id, title, category, mime_type, size_bytes, created_at, uploaded_by')
    .eq('client_id', clientId)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function deadlinesFor(clientId: string) {
  const supabase = serviceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('tasks')
    .select('id, title, due_on, state')
    .eq('client_id', clientId)
    .not('state', 'in', '(done,not_applicable)')
    .order('due_on', { ascending: true, nullsFirst: false })
    .limit(10);
  return data ?? [];
}

export async function meetingsFor(clientId: string) {
  const supabase = serviceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('meetings')
    .select('id, starts_at, meet_link, topic')
    .eq('client_id', clientId)
    .eq('status', 'booked')
    .gte('ends_at', new Date().toISOString())
    .order('starts_at')
    .limit(5);
  return data ?? [];
}

export async function clientProfile(clientId: string) {
  const supabase = serviceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('clients')
    .select('name, legal_name, gstin, pan, email, phone')
    .eq('id', clientId)
    .maybeSingle();
  return data;
}

export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

export const dateIN = (d: string | null) =>
  d
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      }).format(new Date(d))
    : '—';
