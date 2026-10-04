import Link from 'next/link';
import { CheckCircle2, CircleDashed, Play, Workflow } from 'lucide-react';
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
import { runAutopilotNow, saveAutomations } from '@/app/admin/_actions/automations';
import { requireRole } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { getGoogle } from '@/lib/integrations/google';
import { getZoho } from '@/lib/integrations/zoho';
import { listTemplates, whatsappConfigured } from '@/lib/integrations/whatsapp';
import { serviceClient } from '@/lib/supabase';
import type { AutomationLogRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
// "Run now" does the whole morning round, Zoho sync included.
export const maxDuration = 300;
export const metadata = { title: 'Autopilot' };

const fmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

const KIND: Record<string, string> = {
  autopilot_run: 'Morning round',
  autopilot_manual: 'Run from console',
  invoice_reminder: 'Invoice reminder',
  meeting_reminder: 'Call reminder',
  deadline_nudge: 'Deadline nudge',
  daily_digest: 'Digest to you',
  enquiry_ack: 'Enquiry acknowledged',
};

const JOBS: { key: string; label: string; detail: string }[] = [
  {
    key: 'enquiryAcknowledgement',
    label: 'Acknowledge every enquiry',
    detail:
      'The moment someone sends the contact form, they get a thank-you email with a link to book a call.',
  },
  {
    key: 'meetingReminders',
    label: 'Remind clients of their call',
    detail:
      'On the morning of each booked call: email, and WhatsApp from the assistant number, with the Meet link.',
  },
  {
    key: 'invoiceReminders',
    label: 'Chase overdue invoices',
    detail:
      'Invoices past their due date are marked overdue, and the client is reminded at most once a week.',
  },
  {
    key: 'deadlineNudges',
    label: 'Nudge clients before deadlines',
    detail:
      'Client tasks due in the next three days get one email asking for anything still outstanding.',
  },
  {
    key: 'dailyDigest',
    label: 'Morning digest to you',
    detail:
      'At 7 am: new enquiries, today’s calls, who is waiting on WhatsApp, overdue invoices and deadlines.',
  },
];

/**
 * The front office on autopilot. What runs, whether everything it depends on
 * is connected, and a log of every message it sent — so the owner only ever
 * has to look at the exceptions.
 */
export default async function AutomationsPage() {
  await requireRole('admin');
  const settings = await getSettings();
  const a = settings.automations as unknown as Record<string, string | boolean>;
  const [google, zoho, templates] = await Promise.all([
    getGoogle().catch(() => null),
    getZoho().catch(() => null),
    listTemplates(),
  ]);

  let log: AutomationLogRow[] = [];
  let handledWeek = 0;
  let waiting = 0;
  let newEnquiries = 0;
  let upcomingCalls = 0;
  const supabase = serviceClient();
  if (supabase) {
    const week = new Date(Date.now() - 7 * 86400_000).toISOString();
    const [l, h, w, e, m] = await Promise.all([
      supabase.from('automation_log').select('*').order('at', { ascending: false }).limit(60),
      supabase
        .from('automation_log')
        .select('id', { count: 'exact', head: true })
        .eq('ok', true)
        .not('kind', 'in', '(autopilot_run,autopilot_manual)')
        .gte('at', week),
      supabase
        .from('wa_contacts')
        .select('wa_id', { count: 'exact', head: true })
        .eq('needs_human', true),
      supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('state', 'new'),
      supabase
        .from('meetings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'booked')
        .gte('starts_at', new Date().toISOString()),
    ]);
    log = l.data ?? [];
    handledWeek = h.count ?? 0;
    waiting = w.count ?? 0;
    newEnquiries = e.count ?? 0;
    upcomingCalls = m.count ?? 0;
  }
  const lastRun = log.find((r) => r.kind === 'autopilot_run' || r.kind === 'autopilot_manual');

  const ready: { label: string; ok: boolean; fix: string; href?: string }[] = [
    {
      label: 'Database',
      ok: Boolean(supabase),
      fix: 'Add SUPABASE_SERVICE_ROLE_KEY in Vercel.',
    },
    {
      label: 'Morning schedule',
      ok: Boolean(process.env.CRON_SECRET),
      fix: 'Add CRON_SECRET in Vercel so the 7 am round can run.',
    },
    {
      label: 'Email sending',
      ok: Boolean(process.env.RESEND_API_KEY),
      fix: 'Add RESEND_API_KEY (and EMAIL_FROM on your own domain) in Vercel.',
    },
    {
      label: 'AI replies (Claude)',
      ok: Boolean(process.env.ANTHROPIC_API_KEY),
      fix: 'Add ANTHROPIC_API_KEY in Vercel.',
      href: '/admin/assistant',
    },
    {
      label: 'WhatsApp assistant number',
      ok: whatsappConfigured() && Boolean(settings.whatsappBot.number),
      fix: 'Connect the new assistant number (never 9025565526).',
      href: '/admin/whatsapp',
    },
    {
      label: 'Google Calendar',
      ok: google?.status === 'connected',
      fix: 'Connect your calendar so calls can be booked.',
      href: '/admin/meetings',
    },
    {
      label: 'Zoho Books',
      ok: zoho?.status === 'connected',
      fix: 'Connect Zoho so clients and invoices stay in sync.',
      href: '/admin/integrations',
    },
  ];
  const readyCount = ready.filter((r) => r.ok).length;

  return (
    <>
      <PageHeader
        title="Autopilot"
        description="The front office, running itself. Every morning at 7 am (India time) it syncs Zoho, chases invoices, reminds clients of calls and deadlines, and sends you one digest. The website and WhatsApp assistants answer, onboard and book around the clock."
        action={
          <form action={runAutopilotNow}>
            <SubmitButton pendingText="Running…">
              <Play className="h-4 w-4" />
              Run now
            </SubmitButton>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Handled automatically · 7 days"
          value={handledWeek}
          tone="positive"
          hint="Reminders, nudges and replies sent"
        />
        <Stat
          label="Waiting for you"
          value={waiting + newEnquiries}
          tone={waiting + newEnquiries ? 'caution' : 'neutral'}
          hint={`${waiting} on WhatsApp · ${newEnquiries} new enquiries`}
        />
        <Stat label="Calls booked ahead" value={upcomingCalls} tone="accent" />
        <Stat
          label="Last round"
          value={lastRun ? fmt.format(new Date(lastRun.at)) : '—'}
          hint={lastRun ? KIND[lastRun.kind] : 'Has not run yet'}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title="Ready to run"
          description={`${readyCount} of ${ready.length} connected. Anything not connected is skipped quietly — nothing breaks.`}
        >
          <ul className="divide-y divide-[var(--hairline)]">
            {ready.map((r) => (
              <li key={r.label} className="flex items-start gap-3 px-6 py-3.5">
                {r.ok ? (
                  <CheckCircle2 className="text-positive mt-0.5 h-4.5 w-4.5 shrink-0" />
                ) : (
                  <CircleDashed className="text-caution mt-0.5 h-4.5 w-4.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-[0.875rem] font-medium">{r.label}</p>
                  {!r.ok ? <p className="text-ink-3 mt-0.5 text-[0.8125rem]">{r.fix}</p> : null}
                </div>
                {r.href ? (
                  <Link
                    href={r.href}
                    className="text-accent shrink-0 text-[0.8125rem] font-semibold hover:underline"
                  >
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="What runs on its own"
          description="Switch any job off and it stops at once. Every message it sends is logged below."
        >
          <form action={saveAutomations} className="grid gap-4 px-6 py-5">
            {JOBS.map((j) => (
              <label key={j.key} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name={j.key}
                  defaultChecked={Boolean(a[j.key])}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  <span className="text-ink block text-[0.875rem] font-medium">{j.label}</span>
                  <span className="text-ink-3 block text-[0.8125rem] leading-relaxed">
                    {j.detail}
                  </span>
                </span>
              </label>
            ))}

            <details className="rounded-[var(--radius-md)] border border-[var(--hairline)]">
              <summary className="text-ink cursor-pointer px-4 py-3 text-[0.875rem] font-medium">
                WhatsApp templates
              </summary>
              <div className="grid gap-4 border-t border-[var(--hairline)] px-4 py-4">
                <p className="text-ink-3 text-[0.8125rem] leading-relaxed">
                  WhatsApp only lets a business start a conversation with a template Meta has
                  approved. Inside 24 hours of the client’s last message, plain replies are used
                  instead. Leave a name blank to use email only.
                  {templates.length
                    ? ` Approved on your account: ${templates.map((t) => t.name).join(', ')}.`
                    : ''}
                </p>
                <datalist id="wa-templates">
                  {templates.map((t) => (
                    <option key={`${t.name}-${t.language}`} value={t.name}>
                      {t.body.slice(0, 80)}
                    </option>
                  ))}
                </datalist>
                <Field
                  label="Call reminder"
                  htmlFor="au-rem"
                  hint="Body with three variables: {{1}} name, {{2}} time, {{3}} Meet link."
                >
                  <input
                    id="au-rem"
                    name="reminderTemplate"
                    list="wa-templates"
                    defaultValue={String(a.reminderTemplate ?? '')}
                    placeholder="call_reminder"
                    className={ADMIN_FIELD}
                  />
                </Field>
                <Field
                  label="Invoice reminder"
                  htmlFor="au-inv"
                  hint="Body with three variables: {{1}} name, {{2}} invoice number, {{3}} amount."
                >
                  <input
                    id="au-inv"
                    name="invoiceTemplate"
                    list="wa-templates"
                    defaultValue={String(a.invoiceTemplate ?? '')}
                    placeholder="invoice_reminder"
                    className={ADMIN_FIELD}
                  />
                </Field>
                <Field
                  label="Client portal sign-in code"
                  htmlFor="au-otp"
                  hint="An Authentication template with a copy-code button. Without it, codes go by email only."
                >
                  <input
                    id="au-otp"
                    name="otpTemplate"
                    list="wa-templates"
                    defaultValue={String(a.otpTemplate ?? '')}
                    placeholder="portal_code"
                    className={ADMIN_FIELD}
                  />
                </Field>
                <Field
                  label="Template language code"
                  htmlFor="au-lang"
                  hint="As set in Meta, e.g. en or en_US."
                >
                  <input
                    id="au-lang"
                    name="templateLanguage"
                    defaultValue={String(a.templateLanguage ?? 'en')}
                    className={ADMIN_FIELD}
                  />
                </Field>
              </div>
            </details>
            <div>
              <SubmitButton>Save</SubmitButton>
            </div>
          </form>
        </Panel>
      </div>

      <Panel
        className="mt-6"
        title="Still needs a person"
        description="Autopilot never does the professional work itself, never promises an outcome, and never moves money. These come to you."
      >
        <ul className="text-ink-2 grid gap-2 px-6 py-5 text-[0.875rem] leading-relaxed sm:grid-cols-2">
          <li>• Preparing and filing returns, replies to notices, audits and opinions.</li>
          <li>• Fee quotes beyond the published starting prices.</li>
          <li>
            • WhatsApp chats the assistant hands over —{' '}
            <Link href="/admin/whatsapp" className="text-accent font-semibold hover:underline">
              {waiting} waiting
            </Link>
            .
          </li>
          <li>
            • New enquiries to qualify —{' '}
            <Link href="/admin/enquiries" className="text-accent font-semibold hover:underline">
              {newEnquiries} new
            </Link>
            .
          </li>
        </ul>
      </Panel>

      <Panel className="mt-6" title="Activity" description="The last 60 things Autopilot did.">
        {log.length ? (
          <DataTable head={['When', 'What', 'Detail', 'Result']}>
            {log.map((r) => (
              <tr key={r.id}>
                <td className="text-ink-3 px-6 py-3 text-[0.8125rem] whitespace-nowrap">
                  {fmt.format(new Date(r.at))}
                </td>
                <td className="text-ink px-6 py-3 text-[0.8125rem] font-medium whitespace-nowrap">
                  {KIND[r.kind] ?? r.kind}
                  {r.channel ? (
                    <span className="text-ink-3 ml-1.5 font-normal">· {r.channel}</span>
                  ) : null}
                </td>
                <td className="text-ink-2 max-w-[32rem] px-6 py-3 text-[0.8125rem]">
                  <span className="line-clamp-2">{r.detail ?? '—'}</span>
                </td>
                <td className="px-6 py-3">
                  <Pill tone={r.ok ? 'positive' : 'critical'}>{r.ok ? 'Done' : 'Not sent'}</Pill>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState
            icon={Workflow}
            title="Nothing yet"
            description="The first round runs tomorrow at 7 am — or press Run now."
          />
        )}
      </Panel>
    </>
  );
}
