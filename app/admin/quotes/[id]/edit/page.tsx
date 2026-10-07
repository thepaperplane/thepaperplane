import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import { QuoteBuilder } from '@/components/admin/quote-builder';
import { saveQuote } from '@/app/admin/_actions/quotes';
import { requireRole } from '@/lib/auth';
import { getCatalog } from '@/lib/quotes/engine';
import { CATEGORIES } from '@/lib/quotes/types';
import { serviceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit quotation' };

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('editor');
  const { id } = await params;
  const supabase = serviceClient();
  if (!supabase || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data: q } = await supabase.from('quotes').select('*').eq('id', id).maybeSingle();
  if (!q) notFound();
  const catalog = await getCatalog();
  const days = Math.max(
    1,
    Math.ceil((new Date(q.valid_until).getTime() - Date.now()) / 86_400_000),
  );
  return (
    <>
      <PageHeader
        title={`Edit ${q.number}`}
        description="Changes apply to the same private link. Saving does not email the client again unless you choose to send."
      />
      <QuoteBuilder
        services={catalog.map((s) => ({
          id: s.id,
          cat: s.cat,
          name: s.name,
          active: s.active,
          from: s.from,
          defaultVariant: s.defaultVariant,
          variants: s.variants,
        }))}
        categories={CATEGORIES}
        action={saveQuote}
        initial={{
          id: q.id,
          name: q.name,
          email: q.email ?? '',
          phone: q.phone ?? '',
          company: q.company ?? '',
          enquiry_id: q.enquiry_id ?? '',
          client_id: q.client_id ?? '',
          requirement: q.requirement ?? '',
          note_to_client: q.note_to_client ?? '',
          kind: q.kind,
          validDays: days,
          discount: String(q.discount ?? ''),
          items: q.items.map((i) => ({
            serviceId: i.serviceId,
            variantId: i.variantId,
            qty: i.qty,
            unitPrice: i.unitPrice,
            name: i.name,
            unit: i.unit,
            period: i.period,
          })),
        }}
      />
    </>
  );
}
