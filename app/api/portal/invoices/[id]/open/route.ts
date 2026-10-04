import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/portal/auth';
import { booksContactFor, booksOrgId, invoiceDetail } from '@/lib/integrations/zoho';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Opens the invoice in Zoho Books' own customer view, where it can be paid
 * online if payment gateways are set up in Books.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPortalSession();
  if (!session) return NextResponse.redirect(new URL('/portal', request.url));
  const { id } = await params;
  if (!/^\d{5,30}$/.test(id)) return new Response('Not found', { status: 404 });
  const [orgId, customerId] = await Promise.all([booksOrgId(), booksContactFor(session.active.id)]);
  if (!orgId || !customerId) return new Response('Not found', { status: 404 });
  const inv = await invoiceDetail(orgId, id).catch(() => null);
  if (!inv || inv.customer_id !== customerId) return new Response('Not found', { status: 404 });
  if (!inv.invoice_url || !/^https:\/\/[\w.-]*zoho\.[\w.]+\//.test(inv.invoice_url)) {
    return NextResponse.redirect(new URL(`/api/portal/invoices/${id}/pdf`, request.url));
  }
  return NextResponse.redirect(inv.invoice_url);
}
