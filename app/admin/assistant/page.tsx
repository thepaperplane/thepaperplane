import Link from 'next/link';
import { Bot, MessagesSquare } from 'lucide-react';
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
import { SubmitButton } from '@/components/admin/form-bits';
import {
  deleteKnowledge,
  saveAssistantSettings,
  saveKnowledge,
} from '@/app/admin/_actions/assistant';
import { requireRole } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { TIER_LABEL, type Tier } from '@/lib/ai/claude';
import { serviceClient } from '@/lib/supabase';
import type { AssistantConversationRow, AssistantKnowledgeRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Site assistant' };

const fmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

function KnowledgeForm({ k }: { k?: AssistantKnowledgeRow }) {
  const id = k?.id ?? 'new';
  return (
    <form action={saveKnowledge} className="grid gap-4 px-6 py-5">
      {k ? <input type="hidden" name="id" value={k.id} /> : null}
      <Field label="Question or topic" htmlFor={`kt-${id}`} required>
        <input
          id={`kt-${id}`}
          name="title"
          required
          defaultValue={k?.title}
          placeholder="Do you work with clients outside India?"
          className={ADMIN_FIELD}
        />
      </Field>
      <Field
        label="The answer the assistant may give"
        htmlFor={`kb-${id}`}
        required
        hint="Facts only, in your own words. The assistant uses these alongside the website."
      >
        <textarea
          id={`kb-${id}`}
          name="body"
          required
          rows={3}
          defaultValue={k?.body}
          className={`${ADMIN_FIELD} h-auto py-3`}
        />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-ink flex items-center gap-2.5 text-[0.875rem] font-medium">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={k?.is_active ?? true}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          In use
        </label>
        <SubmitButton>{k ? 'Save answer' : 'Add answer'}</SubmitButton>
      </div>
    </form>
  );
}

/**
 * The assistant answers visitors from the website's own content. This is
 * where the owner switches it on or off, adds answers the site does not
 * cover, and reads what visitors actually asked — which is the best list of
 * what the site should say next.
 */
export default async function AssistantPage() {
  await requireRole('admin');
  const settings = await getSettings();
  const keyed = Boolean(process.env.ANTHROPIC_API_KEY);
  const supabase = serviceClient();

  let conversations: AssistantConversationRow[] = [];
  let knowledge: AssistantKnowledgeRow[] = [];
  let questionsToday = 0;
  let week = 0;
  let leads = 0;

  if (supabase) {
    const since7 = new Date(Date.now() - 7 * 86400_000).toISOString();
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const [c, k, q, w, l] = await Promise.all([
      supabase
        .from('assistant_conversations')
        .select('*')
        .order('last_at', { ascending: false })
        .limit(60),
      supabase.from('assistant_knowledge').select('*').order('created_at', { ascending: true }),
      supabase
        .from('assistant_messages')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', dayStart.toISOString()),
      supabase
        .from('assistant_conversations')
        .select('id', { count: 'exact', head: true })
        .gte('started_at', since7),
      supabase
        .from('assistant_conversations')
        .select('id', { count: 'exact', head: true })
        .not('enquiry_id', 'is', null)
        .gte('started_at', since30),
    ]);
    conversations = c.data ?? [];
    knowledge = k.data ?? [];
    questionsToday = q.count ?? 0;
    week = w.count ?? 0;
    leads = l.count ?? 0;
  }

  const status = !keyed ? 'Needs API key' : settings.assistant.enabled ? 'Live' : 'Switched off';

  return (
    <>
      <PageHeader
        title="Site assistant"
        description="Answers visitors' questions from the website itself — services, deadlines, notices, how you work — and turns a ready visitor into an enquiry. It never gives advice on someone's own situation; it offers the free first read instead."
        action={
          <Pill tone={status === 'Live' ? 'positive' : 'caution'}>
            <Bot className="h-3.5 w-3.5" /> {status}
          </Pill>
        }
      />

      {!keyed ? (
        <Panel className="mb-6 p-6">
          <p className="text-ink text-[0.9375rem] font-semibold">One step left: the API key</p>
          <p className="text-ink-2 mt-2 text-[0.875rem] leading-relaxed">
            In Vercel → this project → Settings → Environment Variables, add{' '}
            <code className="ref">ANTHROPIC_API_KEY</code> (from console.anthropic.com → API keys),
            then redeploy. The assistant appears on the site as soon as the key is there and it is
            switched on below.
          </p>
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Questions today"
          value={questionsToday}
          hint={`Daily limit ${settings.assistant.dailyCap}`}
        />
        <Stat label="Conversations · 7 days" value={week} tone="accent" />
        <Stat label="Enquiries captured · 30 days" value={leads} tone="positive" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Settings" description="Changes reach the site within a minute.">
          <form action={saveAssistantSettings} className="grid gap-4 px-6 py-5">
            <label className="text-ink flex items-center gap-2.5 text-[0.875rem] font-medium">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={settings.assistant.enabled}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Show the assistant on the website
            </label>
            <Field label="Opening line" htmlFor="as-greeting" required>
              <textarea
                id="as-greeting"
                name="greeting"
                required
                rows={2}
                defaultValue={settings.assistant.greeting}
                className={`${ADMIN_FIELD} h-auto py-3`}
              />
            </Field>
            <Field
              label="Standing notes"
              htmlFor="as-notes"
              hint="Anything current it should know: holiday closures, a limited-time offer, a new service. Facts, not instructions."
            >
              <textarea
                id="as-notes"
                name="notes"
                rows={3}
                defaultValue={settings.assistant.notes}
                className={`${ADMIN_FIELD} h-auto py-3`}
              />
            </Field>
            <Field
              label="Quality and cost"
              htmlFor="as-tier"
              hint="Used by the website assistant and the WhatsApp assistant. Economy answers well from your reference material at the lowest price; move up only if answers fall short."
            >
              <select
                id="as-tier"
                name="tier"
                defaultValue={settings.assistant.tier}
                className={ADMIN_FIELD}
              >
                {(Object.keys(TIER_LABEL) as Tier[]).map((t) => (
                  <option key={t} value={t}>
                    {TIER_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Most questions per day"
              htmlFor="as-cap"
              hint="A ceiling on cost. When reached, visitors are pointed to WhatsApp and the form."
            >
              <input
                id="as-cap"
                name="dailyCap"
                type="number"
                min={10}
                max={5000}
                defaultValue={settings.assistant.dailyCap}
                className={ADMIN_FIELD}
              />
            </Field>
            <div>
              <SubmitButton>Save settings</SubmitButton>
            </div>
          </form>
        </Panel>

        <Panel
          title="Extra answers"
          description="For questions the website does not answer yet. Read the transcripts below to see what people ask."
        >
          <KnowledgeForm />
          {knowledge.length ? (
            <ul className="divide-y divide-[var(--hairline)] border-t border-[var(--hairline)]">
              {knowledge.map((k) => (
                <li key={k.id}>
                  <details>
                    <summary className="flex cursor-pointer items-center justify-between gap-3 px-6 py-3.5">
                      <span className="text-ink min-w-0 truncate text-[0.875rem] font-medium">
                        {k.title}
                      </span>
                      <Pill tone={k.is_active ? 'positive' : 'neutral'}>
                        {k.is_active ? 'In use' : 'Paused'}
                      </Pill>
                    </summary>
                    <KnowledgeForm k={k} />
                    <form action={deleteKnowledge} className="px-6 pb-5">
                      <input type="hidden" name="id" value={k.id} />
                      <SubmitButton
                        tone="danger"
                        confirm="Delete this answer?"
                        pendingText="Deleting…"
                      >
                        Delete
                      </SubmitButton>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>
      </div>

      <Panel
        className="mt-6"
        title="Conversations"
        description="Most recent first. Visitors are anonymous unless they leave their details."
      >
        {conversations.length ? (
          <DataTable head={['Last message', 'Started on', 'Messages', 'Outcome', '']}>
            {conversations.map((c) => (
              <tr key={c.id}>
                <td className="text-ink-2 px-6 py-3 text-[0.8125rem] whitespace-nowrap">
                  {fmt.format(new Date(c.last_at))}
                </td>
                <td className="text-ink-3 px-6 py-3 font-[family-name:var(--font-mono)] text-[0.75rem]">
                  {c.first_page ?? '—'}
                </td>
                <td className="text-ink px-6 py-3 text-[0.8125rem] tabular-nums">
                  {Math.ceil(c.message_count / 2)}
                </td>
                <td className="px-6 py-3">
                  {c.enquiry_id ? (
                    <Pill tone="positive">Enquiry</Pill>
                  ) : c.flagged ? (
                    <Pill tone="caution">Flagged</Pill>
                  ) : (
                    <span className="text-ink-3 text-[0.8125rem]">—</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  <Link
                    href={`/admin/assistant/${c.id}`}
                    className="text-accent inline-flex h-9 items-center text-[0.8125rem] font-semibold"
                  >
                    Read
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState
            icon={MessagesSquare}
            title="No conversations yet"
            description="Once visitors start asking, every conversation appears here."
          />
        )}
      </Panel>
    </>
  );
}
