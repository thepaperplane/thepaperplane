import { PageHeader } from '@/components/admin/ui';
import { QuoteBuilder, type BuilderInitial } from '@/components/admin/quote-builder';
import { saveQuote } from '@/app/admin/_actions/quotes';
import { requireRole } from '@/lib/auth';
import { getCatalog } from '@/lib/quotes/engine';
import { CATEGORIES } from '@/lib/quotes/types';
import { getSettings } from '@/lib/settings';
import { serviceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New quotation' };

/**
 * A quotation for one client and the services they asked about — and only
 * those. Start from an enquiry or a client and their details are filled in.
 */
export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ enquiry?: string; client?: string; services?: string }>;
}) {
  await requireRole('editor');
  const sp = await searchParams;
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  const initial: BuilderInitial = {
    name: '',
    email: '',
    phone: '',
    company: '',
    enquiry_id: '',
    client_id: '',
    requirement: '',
    note_to_client: '',
    kind: 'indicative',
    validDays: settings.quotes.validDays,
    discount: '',
    items: [],
    preselect: (sp.services ?? '').split(',').filter(Boolean),
  };
  const supabase = serviceClient();
  if (supabase && sp.enquiry && /^[0-9a-f-]{36}$/.test(sp.enquiry)) {
    const { data: e } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', sp.enquiry)
      .maybeSingle();
    if (e) {
      Object.assign(initial, {
        name: e.name,
        email: e.email.endsWith('.invalid') ? '' : e.email,
        phone: e.phone ?? '',
        company: e.company ?? '',
        enquiry_id: e.id,
        client_id: e.client_id ?? '',
        requirement: e.message,
      });
    }
  }
  if (supabase && sp.client && /^[0-9a-f-]{36}$/.test(sp.client)) {
    const { data: c } = await supabase
      .from('clients')
      .select('*')
      .eq('id', sp.client)
      .maybeSingle();
    if (c) {
      Object.assign(initial, {
        name: c.name,
        email: c.email ?? '',
        phone: c.phone ?? '',
        client_id: c.id,
      });
    }
  }
  return (
    <>
      <PageHeader
        title="New quotation"
        description="Pick only what this client asked about. If they came for GST registration alone, quote that — the page will suggest returns and bookkeeping on its own, with the price, and they can add them with one tap."
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
        initial={initial}
        action={saveQuote}
      />
    </>
  );
}
