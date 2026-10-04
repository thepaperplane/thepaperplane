import { getPortalSession } from '@/lib/portal/auth';
import { booksContactFor, booksOrgId, invoiceDetail, invoicePdf } from '@/lib/integrations/zoho';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The invoice PDF from Zoho Books — only if it belongs to the signed-in client. */
export async function GET(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPortalSession();
  if (!session) return new Response('Sign in first.', { status: 401 });
  const { id } = await params;
  if (!/^\d{5,30}$/.test(id)) return new Response('Not found', { status: 404 });
  const [orgId, customerId] = await Promise.all([booksOrgId(), booksContactFor(session.active.id)]);
  if (!orgId || !customerId) return new Response('Not found', { status: 404 });
  const inv = await invoiceDetail(orgId, id).catch(() => null);
  if (!inv || inv.customer_id !== customerId) return new Response('Not found', { status: 404 });
  const pdf = await invoicePdf(orgId, id).catch(() => null);
  if (!pdf) return new Response('This invoice could not be fetched right now.', { status: 502 });
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${inv.invoice_number.replace(/[^\w.-]/g, '_')}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
