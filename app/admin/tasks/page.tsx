import Link from 'next/link';
import { CheckSquare } from 'lucide-react';
import { ADMIN_FIELD, EmptyState, Field, PageHeader, Panel, Pill } from '@/components/admin/ui';
import { AutoSubmitSelect, SubmitButton } from '@/components/admin/form-bits';
import { createTask, deleteTask, setTaskState } from '@/app/admin/_actions/ops';
import { requireProfile } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import { formatDate, todayIST } from '@/lib/utils';
import type { TaskRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tasks & deadlines' };

const STATES = [
  { value: 'pending', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'not_applicable', label: 'Not needed' },
];

const PRIORITY = { 1: 'High', 2: 'Normal', 3: 'Low' } as const;

/**
 * Everything with a date on it: filings, follow-ups, launches. Overdue rises
 * to the top in red; done drops out of the default view.
 */
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  await requireProfile();
  const { show } = await searchParams;
  const supabase = serviceClient();
  const today = todayIST();

  let tasks: TaskRow[] = [];
  let clients: { id: string; name: string }[] = [];
  if (supabase) {
    let q = supabase
      .from('tasks')
      .select('*')
      .order('due_on', { ascending: true, nullsFirst: false });
    if (show !== 'all') q = q.not('state', 'in', '("done","not_applicable")');
    const [{ data }, { data: c }] = await Promise.all([
      q.limit(300),
      supabase.from('clients').select('id, name').order('name'),
    ]);
    tasks = data ?? [];
    clients = c ?? [];
  }
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        title="Tasks & deadlines"
        description="Filing dates, follow-ups and launches in one list. Anything overdue is marked in red."
      />

      <Panel title="Add a task" className="mb-6">
        <form
          action={createTask}
          className="grid gap-4 px-6 py-5 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end"
        >
          <Field label="Task" htmlFor="t-title" required>
            <input
              id="t-title"
              name="title"
              required
              className={ADMIN_FIELD}
              placeholder="e.g. File GSTR-3B for Acme"
            />
          </Field>
          <Field label="Client" htmlFor="t-client">
            <select id="t-client" name="client_id" className={ADMIN_FIELD} defaultValue="">
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due" htmlFor="t-due">
            <input id="t-due" name="due_on" type="date" className={ADMIN_FIELD} />
          </Field>
          <Field label="Priority" htmlFor="t-pri">
            <select id="t-pri" name="priority" defaultValue="2" className={ADMIN_FIELD}>
              <option value="1">High</option>
              <option value="2">Normal</option>
              <option value="3">Low</option>
            </select>
          </Field>
          <SubmitButton pendingText="Adding…">Add task</SubmitButton>
        </form>
      </Panel>

      <div className="mb-4 flex gap-2">
        <Link
          href="/admin/tasks"
          className={
            show === 'all'
              ? 'text-ink-2 rounded-full px-3.5 py-1.5 text-[0.8125rem] ring-1 ring-[var(--hairline)]'
              : 'bg-ink text-ground rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium'
          }
        >
          Open
        </Link>
        <Link
          href="/admin/tasks?show=all"
          className={
            show === 'all'
              ? 'bg-ink text-ground rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium'
              : 'text-ink-2 rounded-full px-3.5 py-1.5 text-[0.8125rem] ring-1 ring-[var(--hairline)]'
          }
        >
          Everything
        </Link>
      </div>

      <Panel title={`${tasks.length} ${show === 'all' ? 'tasks' : 'open tasks'}`}>
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="Nothing on the list"
            description="Add a filing date or a follow-up above."
          />
        ) : (
          <ul className="divide-y divide-[var(--hairline)]">
            {tasks.map((t) => {
              const late = t.due_on !== null && t.due_on < today && t.state !== 'done';
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        'text-[0.9375rem] font-medium ' +
                        (t.state === 'done' ? 'text-ink-3 line-through' : 'text-ink')
                      }
                    >
                      {t.title}
                    </p>
                    <p className="text-ink-3 mt-0.5 text-[0.75rem]">
                      {t.client_id ? (
                        <Link href={`/admin/clients/${t.client_id}`} className="hover:text-accent">
                          {clientName.get(t.client_id) ?? 'Client'}
                        </Link>
                      ) : (
                        'General'
                      )}{' '}
                      · {PRIORITY[t.priority as 1 | 2 | 3] ?? 'Normal'} priority
                    </p>
                  </div>
                  <Pill tone={late ? 'critical' : t.due_on === today ? 'caution' : 'neutral'}>
                    {late
                      ? `Overdue · ${formatDate(t.due_on!)}`
                      : t.due_on
                        ? formatDate(t.due_on)
                        : 'No date'}
                  </Pill>
                  <form action={setTaskState}>
                    <input type="hidden" name="id" value={t.id} />
                    <AutoSubmitSelect
                      name="state"
                      defaultValue={t.state}
                      options={STATES}
                      label={`Status of ${t.title}`}
                    />
                  </form>
                  <form action={deleteTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <SubmitButton tone="danger" pendingText="…" confirm="Delete this task?">
                      Delete
                    </SubmitButton>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
