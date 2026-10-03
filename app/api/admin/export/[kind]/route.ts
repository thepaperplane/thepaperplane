import { requireConsoleApi } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * CSV exports for the console. Owner-only, never cached, and every cell is
 * neutralised against spreadsheet formula injection — a lead who types
 * `=HYPERLINK(...)` into the contact form does not get to run it in Excel.
 */

function cell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function csv(head: string[], rows: unknown[][]): string {
  return [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const gate = await requireConsoleApi();
  if (!gate.ok) return gate.response;
  const { kind } = await params;
  const supabase = serviceClient();
  if (!supabase) return new Response('Not configured', { status: 503 });

  let body = '';
  if (kind === 'subscribers') {
    const { data } = await supabase
      .from('subscribers')
      .select('email, name, segment, state, source, confirmed_at, created_at')
      .eq('state', 'confirmed')
      .order('created_at', { ascending: false });
    body = csv(
      ['Email', 'Name', 'Segment', 'State', 'Source', 'Confirmed', 'Joined'],
      (data ?? []).map((r) => [
        r.email,
        r.name,
        r.segment,
        r.state,
        r.source,
        r.confirmed_at,
        r.created_at,
      ]),
    );
  } else if (kind === 'enquiries') {
    const [{ data }, { data: meta }] = await Promise.all([
      supabase
        .from('enquiries')
        .select('id, name, email, phone, company, service_id, state, message, created_at')
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase.from('enquiry_meta').select('*').limit(5000),
    ]);
    const m = new Map((meta ?? []).map((r) => [r.enquiry_id, r]));
    body = csv(
      [
        'Received',
        'Name',
        'Email',
        'Phone',
        'Company',
        'Service',
        'Status',
        'Source',
        'Medium',
        'Campaign',
        'Landing page',
        'Budget',
        'Timeline',
        'Message',
      ],
      (data ?? []).map((r) => {
        const x = m.get(r.id);
        return [
          r.created_at,
          r.name,
          r.email,
          r.phone,
          r.company,
          r.service_id,
          r.state,
          x?.utm_source,
          x?.utm_medium,
          x?.utm_campaign,
          x?.landing_path,
          x?.budget,
          x?.timeline,
          r.message,
        ];
      }),
    );
  } else if (kind === 'clients') {
    const { data } = await supabase
      .from('clients')
      .select(
        'name, legal_name, entity_type, status, email, phone, gstin, pan, website, source, created_at',
      )
      .order('name');
    body = csv(
      [
        'Name',
        'Legal name',
        'Entity',
        'Status',
        'Email',
        'Phone',
        'GSTIN',
        'PAN',
        'Website',
        'Source',
        'Added',
      ],
      (data ?? []).map((r) => [
        r.name,
        r.legal_name,
        r.entity_type,
        r.status,
        r.email,
        r.phone,
        r.gstin,
        r.pan,
        r.website,
        r.source,
        r.created_at,
      ]),
    );
  } else {
    return new Response('Unknown export', { status: 404 });
  }

  await audit(gate.email, 'export', kind);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response('﻿' + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="paper-plane-${kind}-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
