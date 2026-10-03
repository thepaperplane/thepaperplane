import Link from 'next/link';
import { ReceiptIndianRupee } from 'lucide-react';
import {
  ADMIN_FIELD,
  DataTable,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  Pill,
  Stat,
} from '@/components/admin/ui';
import { AutoSubmitSelect, SubmitButton } from '@/components/admin/form-bits';
import { createInvoice, setInvoiceStatus } from '@/app/admin/_actions/ops';
import { requireProfile } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import { formatDate, formatINR, todayIST } from '@/lib/utils';
import type { InvoiceRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Invoices' };

const STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
];

/**
 * A ledger of what has been billed and what has been paid — not an invoicing
 * system. Raise the invoice wherever you raise it; record it here so the
 * console can tell you who owes what and since when.
 */
export default async function InvoicesPage() {
  await requireProfile();
  const supabase = serviceClient();
  const today = todayIST();

  let invoices: InvoiceRow[] = [];
  let clients: { id: string; name: string }[] = [];
  if (supabase) {
    const [{ data }, { data: c }] = await Promise.all([
      supabase.from('invoices').select('*').order('issued_on', { ascending: false }).limit(300),
      supabase.from('clients').select('id, name').order('name'),
    ]);
    invoices = data ?? [];
    clients = c ?? [];
  }
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  const total = (i: InvoiceRow) => Number(i.amount) + Number(i.tax_amount);
  const outstanding = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  const overdue = outstanding.filter(
    (i) => i.status === 'overdue' || (i.due_on && i.due_on < today),
  );
  const fy = (() => {
    const d = new Date();
    const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return `${start}-04-01`;
  })();
  const paidThisFy = invoices.filter(
    (i) => i.status === 'paid' && (i.paid_on ?? i.issued_on) >= fy,
  );

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Record what you bill and mark it paid. The console keeps the running totals."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Outstanding"
          value={formatINR(outstanding.reduce((s, i) => s + total(i), 0))}
          tone="accent"
          hint={`${outstanding.length} invoices`}
        />
        <Stat
          label="Overdue"
          value={formatINR(overdue.reduce((s, i) => s + total(i), 0))}
          tone={overdue.length ? 'critical' : 'neutral'}
          hint={overdue.length ? `${overdue.length} past due date` : 'Nothing overdue'}
        />
        <Stat
          label="Collected this financial year"
          value={formatINR(paidThisFy.reduce((s, i) => s + total(i), 0))}
          tone="positive"
        />
      </div>

      <Panel title="Record an invoice" className="mb-6">
        {clients.length === 0 ? (
          <p className="text-ink-3 px-6 py-5 text-[0.875rem]">
            Add a{' '}
            <Link href="/admin/clients/new" className="text-accent font-semibold">
              client
            </Link>{' '}
            first.
          </p>
        ) : (
          <form
            action={createInvoice}
            className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Field label="Client" htmlFor="i-client" required>
              <select
                id="i-client"
                name="client_id"
                required
                className={ADMIN_FIELD}
                defaultValue=""
              >
                <option value="" disabled>
                  Choose…
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Invoice number" htmlFor="i-number" required>
              <input
                id="i-number"
                name="number"
                required
                className={ADMIN_FIELD}
                placeholder="TPP/26-27/001"
              />
            </Field>
            <Field label="Amount (before GST)" htmlFor="i-amount" required>
              <input
                id="i-amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                className={ADMIN_FIELD}
              />
            </Field>
            <Field label="GST" htmlFor="i-tax">
              <input
                id="i-tax"
                name="tax_amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                className={ADMIN_FIELD}
              />
            </Field>
            <Field label="Issued on" htmlFor="i-issued" required>
              <input
                id="i-issued"
                name="issued_on"
                type="date"
                required
                defaultValue={today}
                className={ADMIN_FIELD}
              />
            </Field>
            <Field label="Due on" htmlFor="i-due">
              <input id="i-due" name="due_on" type="date" className={ADMIN_FIELD} />
            </Field>
            <Field label="Status" htmlFor="i-status">
              <select id="i-status" name="status" defaultValue="sent" className={ADMIN_FIELD}>
                {STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description" htmlFor="i-desc">
              <input
                id="i-desc"
                name="description"
                className={ADMIN_FIELD}
                placeholder="Website build, phase 1"
              />
            </Field>
            <div className="sm:col-span-2 lg:col-span-4">
              <SubmitButton>Record invoice</SubmitButton>
            </div>
          </form>
        )}
      </Panel>

      <Panel title="Ledger">
        {invoices.length === 0 ? (
          <EmptyState
            icon={ReceiptIndianRupee}
            title="No invoices recorded"
            description="Record one above to start tracking receivables."
          />
        ) : (
          <DataTable
            head={['Number', 'Client', 'Issued', 'Due', 'Total', 'Status']}
            caption="Invoices"
          >
            {invoices.map((i) => {
              const late =
                (i.status === 'sent' || i.status === 'overdue') &&
                i.due_on !== null &&
                i.due_on < today;
              return (
                <tr key={i.id}>
                  <td className="text-ink px-6 py-3 text-[0.875rem] font-medium">{i.number}</td>
                  <td className="px-6 py-3 text-[0.875rem]">
                    <Link
                      href={`/admin/clients/${i.client_id}`}
                      className="text-ink-2 hover:text-accent"
                    >
                      {clientName.get(i.client_id) ?? '—'}
                    </Link>
                  </td>
                  <td className="text-ink-3 px-6 py-3 text-[0.8125rem]">
                    {formatDate(i.issued_on)}
                  </td>
                  <td className="px-6 py-3 text-[0.8125rem]">
                    {i.due_on ? (
                      <span className={late ? 'text-critical font-semibold' : 'text-ink-3'}>
                        {formatDate(i.due_on)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-ink px-6 py-3 text-[0.875rem] font-semibold tabular-nums">
                    {formatINR(total(i))}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {late ? <Pill tone="critical">Late</Pill> : null}
                      <form action={setInvoiceStatus}>
                        <input type="hidden" name="id" value={i.id} />
                        <AutoSubmitSelect
                          name="status"
                          defaultValue={i.status}
                          options={STATUS}
                          label={`Status of invoice ${i.number}`}
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Panel>
    </>
  );
}
