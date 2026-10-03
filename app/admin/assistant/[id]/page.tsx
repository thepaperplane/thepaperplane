import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader, Panel, Pill } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import { deleteConversation, flagConversation } from '@/app/admin/_actions/assistant';
import { requireRole } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Conversation' };

const fmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = serviceClient();
  if (!supabase) notFound();

  const [{ data: conv }, { data: messages }] = await Promise.all([
    supabase.from('assistant_conversations').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('assistant_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('id', { ascending: true }),
  ]);
  if (!conv) notFound();

  const tokens = (messages ?? []).reduce(
    (n, m) => ({
      in: n.in + (m.input_tokens ?? 0),
      out: n.out + (m.output_tokens ?? 0),
      cached: n.cached + (m.cached_tokens ?? 0),
    }),
    { in: 0, out: 0, cached: 0 },
  );

  return (
    <>
      <Link
        href="/admin/assistant"
        className="text-ink-3 hover:text-ink mb-5 inline-flex h-9 items-center gap-1.5 text-[0.8125rem] font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> All conversations
      </Link>
      <PageHeader
        title="Conversation"
        description={`Started ${fmt.format(new Date(conv.started_at))} on ${conv.first_page ?? 'an unknown page'}.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {conv.enquiry_id ? (
              <Link href="/admin/enquiries" className="inline-flex h-9 items-center">
                <Pill tone="positive">Became an enquiry</Pill>
              </Link>
            ) : null}
            <form action={flagConversation}>
              <input type="hidden" name="id" value={conv.id} />
              <input type="hidden" name="flagged" value={conv.flagged ? 'false' : 'true'} />
              <SubmitButton tone="quiet" pendingText="Saving…">
                {conv.flagged ? 'Unflag' : 'Flag for review'}
              </SubmitButton>
            </form>
            <form action={deleteConversation}>
              <input type="hidden" name="id" value={conv.id} />
              <SubmitButton
                tone="danger"
                confirm="Delete this conversation for good?"
                pendingText="Deleting…"
              >
                Delete
              </SubmitButton>
            </form>
          </div>
        }
      />
      <Panel>
        <ol className="flex flex-col gap-3 px-6 py-6">
          {(messages ?? []).map((m) => (
            <li
              key={m.id}
              className={cn(
                'max-w-[75ch] rounded-2xl px-4 py-3 text-[0.875rem] leading-relaxed whitespace-pre-wrap',
                m.role === 'user'
                  ? 'bg-accent text-accent-ink self-end'
                  : 'bg-sunken text-ink self-start',
              )}
            >
              <span className="mb-1 block text-[0.6875rem] font-semibold tracking-[0.04em] uppercase opacity-80">
                {m.role === 'user' ? 'Visitor' : 'Assistant'} · {fmt.format(new Date(m.created_at))}
              </span>
              {m.content}
            </li>
          ))}
        </ol>
        <p className="text-ink-3 border-t border-[var(--hairline)] px-6 py-3 text-[0.75rem]">
          Tokens — input {tokens.in.toLocaleString('en-IN')} (of which cached{' '}
          {tokens.cached.toLocaleString('en-IN')}), output {tokens.out.toLocaleString('en-IN')}.
        </p>
      </Panel>
    </>
  );
}
