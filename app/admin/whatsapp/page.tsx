import Link from 'next/link';
import { MessageCircle, Send } from 'lucide-react';
import { ADMIN_FIELD, EmptyState, Field, PageHeader, Panel, Pill } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import { AutoRefresh } from '@/components/admin/auto-refresh';
import {
  renameWhatsAppContact,
  sendWhatsAppTemplate,
  sendWhatsAppText,
} from '@/app/admin/_actions/whatsapp';
import { requireRole } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import {
  listTemplates,
  markRead,
  WINDOW_MS,
  whatsappConfigured,
} from '@/lib/integrations/whatsapp';
import { cn } from '@/lib/utils';
import type { WaContactRow, WaMessageRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'WhatsApp inbox' };

const time = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

const pretty = (waId: string) =>
  waId.startsWith('91') && waId.length === 12
    ? `+91 ${waId.slice(2, 7)} ${waId.slice(7)}`
    : `+${waId}`;

function Setup() {
  const steps = [
    <>
      In <strong>Meta for Developers</strong> (developers.facebook.com) create an app of type{' '}
      <strong>Business</strong> and add the <strong>WhatsApp</strong> product. Add your business
      phone number and verify it.
    </>,
    <>
      In <strong>Business Settings → System users</strong>, create a system user with admin access,
      assign it the app and the WhatsApp account, and generate a permanent token with{' '}
      <code className="ref">whatsapp_business_messaging</code> and{' '}
      <code className="ref">whatsapp_business_management</code>.
    </>,
    <>
      In Vercel → Settings → Environment Variables add <code className="ref">WHATSAPP_TOKEN</code>,{' '}
      <code className="ref">WHATSAPP_PHONE_NUMBER_ID</code>,{' '}
      <code className="ref">WHATSAPP_WABA_ID</code>,{' '}
      <code className="ref">WHATSAPP_APP_SECRET</code> (App settings → Basic) and a long random{' '}
      <code className="ref">WHATSAPP_VERIFY_TOKEN</code> of your choosing. Redeploy.
    </>,
    <>
      In the app’s WhatsApp → Configuration, set the callback URL to{' '}
      <code className="ref">https://www.thepaperplane.co.in/api/whatsapp/webhook</code>, paste the
      same verify token, and subscribe to the <strong>messages</strong> field.
    </>,
  ];
  return (
    <Panel title="Connect your WhatsApp Business number" description="About fifteen minutes, once.">
      <ol className="grid gap-3 px-6 py-5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="bg-accent-wash text-accent grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.75rem] font-semibold">
              {i + 1}
            </span>
            <span className="text-ink-2 text-[0.875rem] leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/**
 * The business WhatsApp number, answered from the console. Conversations
 * arrive through the webhook; replies go out through Meta's Cloud API.
 */
export default async function WhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  await requireRole('editor');
  const { c } = await searchParams;
  const ready = whatsappConfigured();
  const supabase = serviceClient();

  if (!ready || !supabase) {
    return (
      <>
        <PageHeader
          title="WhatsApp inbox"
          description="Reply to customers on your business WhatsApp number without leaving the console."
        />
        <Setup />
      </>
    );
  }

  const { data: contacts } = await supabase
    .from('wa_contacts')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(100);
  const list: WaContactRow[] = contacts ?? [];
  const selected = list.find((x) => x.wa_id === c) ?? (c && /^\d{8,15}$/.test(c) ? null : list[0]);
  const waId = selected?.wa_id ?? (c && /^\d{8,15}$/.test(c) ? c : null);

  let thread: WaMessageRow[] = [];
  if (waId) {
    const { data } = await supabase
      .from('wa_messages')
      .select('*')
      .eq('wa_id', waId)
      .order('created_at', { ascending: true })
      .limit(300);
    thread = data ?? [];
    if (selected?.unread) {
      await supabase.from('wa_contacts').update({ unread: 0 }).eq('wa_id', waId);
      const lastIn = [...thread].reverse().find((m) => m.direction === 'in' && m.wa_message_id);
      if (lastIn?.wa_message_id) await markRead(lastIn.wa_message_id);
    }
  }

  const lastInbound = selected?.last_inbound_at ? new Date(selected.last_inbound_at).getTime() : 0;
  const windowOpen = lastInbound > 0 && Date.now() - lastInbound < WINDOW_MS;
  const templates = await listTemplates();

  const TemplateForm = ({ to, compact }: { to?: string; compact?: boolean }) => (
    <form action={sendWhatsAppTemplate} className="grid gap-3">
      {to ? (
        <input type="hidden" name="wa_id" value={to} />
      ) : (
        <Field
          label="Phone number"
          htmlFor="wa-new"
          hint="With country code. Indian numbers can be ten digits."
        >
          <input
            id="wa-new"
            name="wa_id"
            required
            inputMode="tel"
            placeholder="+91 98765 43210"
            className={ADMIN_FIELD}
          />
        </Field>
      )}
      <Field label="Approved template" htmlFor={`tpl-${to ?? 'new'}`}>
        <select id={`tpl-${to ?? 'new'}`} name="template" required className={ADMIN_FIELD}>
          {templates.length ? (
            templates.map((t) => (
              <option key={`${t.name}-${t.language}`} value={`${t.name}|${t.language}`}>
                {t.name} ({t.language})
                {t.params ? ` · ${t.params} value${t.params === 1 ? '' : 's'}` : ''}
              </option>
            ))
          ) : (
            <option value="hello_world|en_US">hello_world (en_US)</option>
          )}
        </select>
      </Field>
      {!compact ? (
        <Field
          label="Values for the template"
          htmlFor={`tp-${to ?? 'new'}`}
          hint="One per line, in order ({{1}}, {{2}}…). Leave empty if the template has none."
        >
          <textarea
            id={`tp-${to ?? 'new'}`}
            name="params"
            rows={2}
            className={`${ADMIN_FIELD} h-auto py-2.5`}
          />
        </Field>
      ) : (
        <input type="hidden" name="params" value="" />
      )}
      <div>
        <SubmitButton pendingText="Sending…">Send template</SubmitButton>
      </div>
    </form>
  );

  return (
    <>
      <AutoRefresh every={8000} />
      <PageHeader
        title="WhatsApp inbox"
        description="Customers' messages to your business number. Free replies within 24 hours of their last message; after that, Meta allows approved templates only."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <Panel title="Conversations">
            {list.length ? (
              <ul className="divide-y divide-[var(--hairline)]">
                {list.map((x) => (
                  <li key={x.wa_id}>
                    <Link
                      href={`/admin/whatsapp?c=${x.wa_id}`}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3.5 transition-colors',
                        x.wa_id === waId ? 'bg-accent-wash' : 'hover:bg-sunken',
                      )}
                    >
                      <span className="bg-sunken text-ink-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.75rem] font-semibold">
                        {(x.name ?? x.wa_id).slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-ink block truncate text-[0.875rem] font-medium">
                          {x.name ?? pretty(x.wa_id)}
                        </span>
                        <span className="text-ink-3 block text-[0.75rem]">
                          {x.last_message_at ? time.format(new Date(x.last_message_at)) : '—'}
                        </span>
                      </span>
                      {x.unread ? <Pill tone="accent">{x.unread}</Pill> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="No messages yet"
                description="When a customer messages your business number, the conversation appears here."
              />
            )}
          </Panel>
          <Panel
            title="Start a conversation"
            description="Meta requires an approved template to message someone first."
          >
            <div className="px-5 py-4">
              <TemplateForm />
            </div>
          </Panel>
        </div>

        <Panel
          title={
            selected
              ? (selected.name ?? pretty(selected.wa_id))
              : waId
                ? pretty(waId)
                : 'No conversation selected'
          }
          description={
            waId
              ? `${pretty(waId)} · ${windowOpen ? 'Reply window open' : 'Reply window closed — templates only'}`
              : undefined
          }
          action={
            selected ? (
              <form action={renameWhatsAppContact} className="flex items-center gap-2">
                <input type="hidden" name="wa_id" value={selected.wa_id} />
                <label htmlFor="wa-name" className="sr-only">
                  Name
                </label>
                <input
                  id="wa-name"
                  name="name"
                  defaultValue={selected.name ?? ''}
                  placeholder="Add a name"
                  className={`${ADMIN_FIELD} h-9 w-40`}
                />
                <SubmitButton tone="quiet" className="h-9">
                  Save
                </SubmitButton>
              </form>
            ) : null
          }
        >
          {waId ? (
            <>
              <ol className="flex max-h-[60vh] flex-col gap-2.5 overflow-y-auto px-6 py-5">
                {thread.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      'max-w-[70ch] rounded-2xl px-4 py-2.5 text-[0.875rem] leading-relaxed whitespace-pre-wrap',
                      m.direction === 'in'
                        ? 'bg-sunken text-ink self-start'
                        : 'bg-accent text-accent-ink self-end',
                    )}
                  >
                    {m.body}
                    <span className="mt-1 block text-[0.6875rem] opacity-80">
                      {time.format(new Date(m.created_at))}
                      {m.direction === 'out'
                        ? ` · ${m.error ? `failed: ${m.error}` : (m.status ?? 'sent')}`
                        : ''}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="border-t border-[var(--hairline)] px-6 py-4">
                {windowOpen ? (
                  <form action={sendWhatsAppText} className="flex items-end gap-3">
                    <input type="hidden" name="wa_id" value={waId} />
                    <label htmlFor="wa-body" className="sr-only">
                      Message
                    </label>
                    <textarea
                      id="wa-body"
                      name="body"
                      required
                      rows={2}
                      placeholder="Write a reply…"
                      className={`${ADMIN_FIELD} h-auto flex-1 py-2.5`}
                    />
                    <SubmitButton pendingText="Sending…">
                      <Send className="h-4 w-4" /> Send
                    </SubmitButton>
                  </form>
                ) : (
                  <TemplateForm to={waId} />
                )}
              </div>
            </>
          ) : (
            <EmptyState icon={MessageCircle} title="Pick a conversation" />
          )}
        </Panel>
      </div>
    </>
  );
}
