import Link from 'next/link';
import { FileText, FolderLock, ReceiptIndianRupee } from 'lucide-react';
import { ADMIN_FIELD, EmptyState, Field, Panel, Pill } from '@/components/admin/ui';
import { AutoSubmitSelect, SubmitButton } from '@/components/admin/form-bits';
import {
  createTask,
  deleteDocument,
  setDocumentVisibility,
  setTaskState,
  uploadDocument,
} from '@/app/admin/_actions/ops';
import { serviceClient } from '@/lib/supabase';
import { formatDate, formatINR, todayIST } from '@/lib/utils';

const CATEGORIES = [
  'KYC',
  'Returns & filings',
  'Notices',
  'Agreements',
  'Financials',
  'Design & build',
  'General',
];

function size(bytes: number | null) {
  if (!bytes) return '';
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

/**
 * The working file for one client: their documents (private, opened through
 * ten-minute links), their open tasks, and what they have been billed.
 */
export async function ClientOps({ clientId, editable }: { clientId: string; editable: boolean }) {
  const supabase = serviceClient();
  if (!supabase) return null;
  const today = todayIST();

  const [{ data: docs }, { data: tasks }, { data: invoices }] = await Promise.all([
    supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('due_on', { ascending: true, nullsFirst: false }),
    supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('issued_on', { ascending: false }),
  ]);

  let links = new Map<string, string>();
  if (docs?.length) {
    const { data: signed } = await supabase.storage.from('vault').createSignedUrls(
      docs.map((d) => d.file_path),
      600,
    );
    links = new Map(
      (signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path ?? '', s.signedUrl as string]),
    );
  }

  const owed = (invoices ?? [])
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + Number(i.amount) + Number(i.tax_amount), 0);

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <Panel title="Document vault" description="Private. Links expire after ten minutes.">
        {editable ? (
          <form
            action={uploadDocument}
            className="grid gap-3 border-b border-[var(--hairline)] px-6 py-4"
          >
            <input type="hidden" name="client_id" value={clientId} />
            <Field label="Title" htmlFor="d-title">
              <input
                id="d-title"
                name="title"
                className={ADMIN_FIELD}
                placeholder="PAN card, ITR 2025-26…"
              />
            </Field>
            <Field label="Category" htmlFor="d-cat">
              <select id="d-cat" name="category" className={ADMIN_FIELD} defaultValue="General">
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field
              label="File"
              htmlFor="d-file"
              hint="PDF, image, Word, Excel, CSV or ZIP — up to 25 MB."
            >
              <input
                id="d-file"
                name="file"
                type="file"
                required
                className="text-ink-2 text-[0.8125rem]"
              />
            </Field>
            <label className="text-ink-2 flex items-center gap-2 text-[0.8125rem]">
              <input
                type="checkbox"
                name="visible_to_client"
                defaultChecked
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Show in the client’s portal
            </label>
            <SubmitButton pendingText="Uploading…">Upload</SubmitButton>
          </form>
        ) : null}
        {docs?.length ? (
          <ul className="divide-y divide-[var(--hairline)]">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-6 py-3">
                <FileText className="text-accent h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  {links.get(d.file_path) ? (
                    <a
                      href={links.get(d.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:text-accent block truncate text-[0.875rem] font-medium"
                    >
                      {d.title}
                    </a>
                  ) : (
                    <span className="text-ink block truncate text-[0.875rem] font-medium">
                      {d.title}
                    </span>
                  )}
                  <span className="text-ink-3 text-[0.75rem]">
                    {d.uploaded_by === 'client' ? 'From client · ' : ''}
                    {d.category} · {formatDate(d.created_at)}{' '}
                    {size(d.size_bytes) ? `· ${size(d.size_bytes)}` : ''}
                  </span>
                </div>
                {editable ? (
                  <form action={setDocumentVisibility}>
                    <input type="hidden" name="id" value={d.id} />
                    <input
                      type="hidden"
                      name="visible"
                      value={d.visible_to_client ? 'false' : 'true'}
                    />
                    <SubmitButton tone="quiet" pendingText="…" className="h-9 px-3">
                      {d.visible_to_client ? 'In portal' : 'Hidden'}
                    </SubmitButton>
                  </form>
                ) : null}
                {editable ? (
                  <form action={deleteDocument}>
                    <input type="hidden" name="id" value={d.id} />
                    <SubmitButton
                      tone="danger"
                      pendingText="…"
                      confirm={`Delete “${d.title}” permanently?`}
                    >
                      Delete
                    </SubmitButton>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={FolderLock} title="No documents yet" />
        )}
      </Panel>

      <Panel title="Tasks & deadlines">
        {editable ? (
          <form
            action={createTask}
            className="grid gap-3 border-b border-[var(--hairline)] px-6 py-4"
          >
            <input type="hidden" name="client_id" value={clientId} />
            <input
              name="title"
              required
              aria-label="New task"
              className={ADMIN_FIELD}
              placeholder="e.g. TDS return Q2"
            />
            <div className="flex gap-3">
              <input name="due_on" type="date" aria-label="Due date" className={ADMIN_FIELD} />
              <SubmitButton pendingText="…">Add</SubmitButton>
            </div>
          </form>
        ) : null}
        {tasks?.length ? (
          <ul className="divide-y divide-[var(--hairline)]">
            {tasks.map((t) => {
              const late = t.due_on !== null && t.due_on < today && t.state !== 'done';
              return (
                <li key={t.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        'truncate text-[0.875rem] font-medium ' +
                        (t.state === 'done' ? 'text-ink-3 line-through' : 'text-ink')
                      }
                    >
                      {t.title}
                    </p>
                    <p
                      className={
                        'text-[0.75rem] ' + (late ? 'text-critical font-semibold' : 'text-ink-3')
                      }
                    >
                      {t.due_on ? formatDate(t.due_on) : 'No date'}
                    </p>
                  </div>
                  <form action={setTaskState}>
                    <input type="hidden" name="id" value={t.id} />
                    <AutoSubmitSelect
                      name="state"
                      defaultValue={t.state}
                      label={`Status of ${t.title}`}
                      options={[
                        { value: 'pending', label: 'To do' },
                        { value: 'in_progress', label: 'Doing' },
                        { value: 'blocked', label: 'Blocked' },
                        { value: 'done', label: 'Done' },
                      ]}
                    />
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-ink-3 px-6 py-5 text-[0.875rem]">No tasks for this client.</p>
        )}
      </Panel>

      <Panel
        title="Invoices"
        description={owed ? `${formatINR(owed)} outstanding` : 'Nothing outstanding'}
        action={
          <Link href="/admin/invoices" className="text-accent text-[0.8125rem] font-semibold">
            Record
          </Link>
        }
      >
        {invoices?.length ? (
          <ul className="divide-y divide-[var(--hairline)]">
            {invoices.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-6 py-3">
                <div>
                  <p className="text-ink text-[0.875rem] font-medium">{i.number}</p>
                  <p className="text-ink-3 text-[0.75rem]">{formatDate(i.issued_on)}</p>
                </div>
                <div className="text-right">
                  <p className="text-ink text-[0.875rem] font-semibold tabular-nums">
                    {formatINR(Number(i.amount) + Number(i.tax_amount))}
                  </p>
                  <Pill
                    tone={
                      i.status === 'paid'
                        ? 'positive'
                        : i.status === 'overdue'
                          ? 'critical'
                          : 'neutral'
                    }
                  >
                    {i.status}
                  </Pill>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={ReceiptIndianRupee} title="No invoices recorded" />
        )}
      </Panel>
    </div>
  );
}
