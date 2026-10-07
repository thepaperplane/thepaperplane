import 'server-only';
import { serviceClient } from './supabase';
import { getSettings } from './settings';
import { SITE } from './site';
import { sendNotice } from './email';
import { zohoDailySync } from './integrations/zoho';
import { quoteUrl } from './quotes/engine';
import {
  normaliseWaId,
  sendTemplate,
  sendText,
  WINDOW_MS,
  whatsappConfigured,
} from './integrations/whatsapp';

/**
 * Autopilot: the jobs a front office does every morning, done every morning.
 *
 *   1. Zoho Books → website: new and changed customers, invoices mirrored.
 *   2. Invoices past due are marked overdue; each client is reminded (email,
 *      and WhatsApp if a template is approved) at most once a week.
 *   3. Today's consultations: a reminder with the Meet link.
 *   4. Client deadlines in the next three days: one nudge each.
 *   5. A digest to the owner: what came in, what is today, what needs a person.
 *
 * Every step checks its own switch in the console, logs what it did in
 * automation_log, and is idempotent — running it twice sends nothing twice.
 * Runs from the daily cron (07:00 IST) and from "Run now" in the console.
 */

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

const IST = 5.5 * 3600_000;
function istDay(offsetDays = 0): { start: string; end: string; date: string } {
  const ist = new Date(Date.now() + IST);
  const startUtc =
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) -
    IST +
    offsetDays * 86400_000;
  return {
    start: new Date(startUtc).toISOString(),
    end: new Date(startUtc + 86400_000).toISOString(),
    date: new Date(startUtc + IST).toISOString().slice(0, 10),
  };
}

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
const dateIN = (d: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(
    new Date(d),
  );
const timeIN = (d: string) =>
  new Intl.DateTimeFormat('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(
    new Date(d),
  );

async function log(
  kind: string,
  ref: string | null,
  channel: string | null,
  ok: boolean,
  detail?: string,
) {
  await db()
    .from('automation_log')
    .insert({ kind, ref, channel, ok, detail: detail?.slice(0, 1000) ?? null })
    .then(
      () => undefined,
      () => undefined,
    );
}

async function sentRecently(kind: string, ref: string, days: number): Promise<boolean> {
  const { count } = await db()
    .from('automation_log')
    .select('id', { count: 'exact', head: true })
    .eq('kind', kind)
    .eq('ref', ref)
    .eq('ok', true)
    .gte('at', new Date(Date.now() - days * 86400_000).toISOString());
  return (count ?? 0) > 0;
}

/**
 * WhatsApp to a number: free text if they wrote to the assistant in the last
 * 24 hours, otherwise the approved template (if one is configured).
 */
async function whatsapp(
  phone: string | null | undefined,
  text: string,
  template: { name: string; language: string; params: string[] } | null,
): Promise<'text' | 'template' | null> {
  if (!phone || !whatsappConfigured()) return null;
  const to = normaliseWaId(phone);
  if (!to) return null;
  const { data: c } = await db()
    .from('wa_contacts')
    .select('last_inbound_at')
    .eq('wa_id', to)
    .maybeSingle();
  if (c?.last_inbound_at && Date.now() - new Date(c.last_inbound_at).getTime() < WINDOW_MS) {
    await sendText(to, text);
    return 'text';
  }
  if (template?.name) {
    await sendTemplate(to, template.name, template.language, template.params);
    return 'template';
  }
  return null;
}

async function clientEmails(
  clientId: string,
): Promise<{ name: string; emails: string[]; phone: string | null }> {
  const [{ data: client }, { data: contacts }] = await Promise.all([
    db().from('clients').select('name, email, phone').eq('id', clientId).maybeSingle(),
    db().from('client_contacts').select('email, is_primary').eq('client_id', clientId),
  ]);
  const emails = new Set<string>();
  if (client?.email) emails.add(client.email.toLowerCase());
  (contacts ?? [])
    .filter((c) => c.is_primary && c.email)
    .forEach((c) => emails.add(c.email!.toLowerCase()));
  return {
    name: client?.name ?? 'there',
    emails: [...emails].filter((e) => !e.endsWith('.invalid')),
    phone: client?.phone ?? null,
  };
}

export async function runDailyAutomations(opts: { manual?: boolean } = {}): Promise<string[]> {
  const settings = await getSettings();
  const a = settings.automations;
  const lang = a.templateLanguage || 'en';
  const out: string[] = [];
  const today = istDay(0);

  /* 1. Zoho ------------------------------------------------------------- */
  try {
    const z = await zohoDailySync();
    out.push(`Zoho: ${z}`);
  } catch (e) {
    out.push(`Zoho: ${e instanceof Error ? e.message : 'failed'}`);
  }

  /* 2. Invoices ---------------------------------------------------------- */
  let overdueTotal = 0;
  let overdueCount = 0;
  {
    await db()
      .from('invoices')
      .update({ status: 'overdue', updated_at: new Date().toISOString() })
      .eq('status', 'sent')
      .lt('due_on', today.date);
    const { data: overdue } = await db()
      .from('invoices')
      .select('id, client_id, number, amount, tax_amount, due_on')
      .eq('status', 'overdue')
      .limit(300);
    overdueCount = overdue?.length ?? 0;
    overdueTotal = (overdue ?? []).reduce(
      (n, i) => n + Number(i.amount) + Number(i.tax_amount ?? 0),
      0,
    );
    let reminded = 0;
    if (a.invoiceReminders) {
      for (const inv of overdue ?? []) {
        if (await sentRecently('invoice_reminder', inv.id, 7)) continue;
        const who = await clientEmails(inv.client_id);
        const amount = inr(Number(inv.amount) + Number(inv.tax_amount ?? 0));
        let ok = false;
        for (const to of who.emails) {
          const r = await sendNotice({
            to,
            subject: `Reminder: invoice ${inv.number} is due`,
            eyebrow: 'Payment reminder',
            heading: `Invoice ${inv.number} — ${amount}`,
            paragraphs: [
              `Hello ${who.name},`,
              `This is a gentle reminder that invoice ${inv.number} for ${amount}${inv.due_on ? `, due on ${dateIN(inv.due_on)},` : ''} is still open.`,
              'You can view it, download it and pay online from your client portal. If you have already paid, thank you — please ignore this note.',
            ],
            cta: { label: 'Open my invoices', href: `${SITE.url}/portal/invoices` },
          });
          ok ||= r.sent;
        }
        try {
          const via = await whatsapp(
            who.phone,
            `Hello ${who.name}, a gentle reminder that invoice ${inv.number} for ${amount} is open. View and pay: ${SITE.url}/portal/invoices`,
            a.invoiceTemplate
              ? { name: a.invoiceTemplate, language: lang, params: [who.name, inv.number, amount] }
              : null,
          );
          ok ||= Boolean(via);
        } catch {
          /* email may still have gone */
        }
        await log('invoice_reminder', inv.id, 'email/whatsapp', ok, `${inv.number} ${amount}`);
        if (ok) reminded++;
      }
    }
    out.push(`Invoices: ${overdueCount} overdue (${inr(overdueTotal)}), ${reminded} reminded`);
  }

  /* 3. Today's meetings -------------------------------------------------- */
  const { data: meetings } = await db()
    .from('meetings')
    .select('*')
    .eq('status', 'booked')
    .gte('starts_at', today.start)
    .lt('starts_at', today.end)
    .order('starts_at');
  {
    let reminded = 0;
    if (a.meetingReminders) {
      for (const m of meetings ?? []) {
        if (m.reminder_sent_at) continue;
        const when = timeIN(m.starts_at);
        let ok = false;
        if (m.email && !m.email.endsWith('.invalid')) {
          const r = await sendNotice({
            to: m.email,
            subject: `Today at ${when}: your call with ${SITE.name}`,
            eyebrow: 'Reminder',
            heading: `See you today at ${when}`,
            paragraphs: [
              `Hello ${m.name}, this is a reminder of your consultation today at ${when} (India time).`,
              'Please keep the notice, brief or documents you want to discuss to hand.',
            ],
            cta: m.meet_link ? { label: 'Join on Google Meet', href: m.meet_link } : undefined,
          });
          ok ||= r.sent;
        }
        try {
          const via = await whatsapp(
            m.wa_id ?? m.phone,
            `Hello ${m.name}, a reminder of your call with The Paper Plane today at ${when}.${m.meet_link ? ` Join: ${m.meet_link}` : ''}`,
            a.reminderTemplate
              ? {
                  name: a.reminderTemplate,
                  language: lang,
                  params: [m.name, when, m.meet_link ?? `${SITE.url}/portal`],
                }
              : null,
          );
          ok ||= Boolean(via);
        } catch {
          /* email may still have gone */
        }
        if (ok) {
          await db()
            .from('meetings')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', m.id);
          reminded++;
        }
        await log('meeting_reminder', m.id, 'email/whatsapp', ok, `${m.name} ${when}`);
      }
    }
    out.push(`Meetings today: ${meetings?.length ?? 0}, ${reminded} reminded`);
  }

  /* 4. Client deadlines in the next three days -------------------------- */
  const { data: soon } = await db()
    .from('tasks')
    .select('id, client_id, title, due_on')
    .not('client_id', 'is', null)
    .in('state', ['pending', 'blocked'])
    .gte('due_on', today.date)
    .lte('due_on', istDay(3).date)
    .limit(200);
  {
    let nudged = 0;
    if (a.deadlineNudges) {
      for (const t of soon ?? []) {
        if (!t.client_id || (await sentRecently('deadline_nudge', t.id, 30))) continue;
        const who = await clientEmails(t.client_id);
        let ok = false;
        for (const to of who.emails) {
          const r = await sendNotice({
            to,
            subject: `Coming up: ${t.title}`,
            eyebrow: 'Deadline',
            heading: `${t.title} — ${t.due_on ? dateIN(t.due_on) : 'soon'}`,
            paragraphs: [
              `Hello ${who.name}, we are tracking this deadline for you.`,
              'If we are waiting on anything from you, you can send it securely from your client portal, or simply reply to this email.',
            ],
            cta: { label: 'Send a document', href: `${SITE.url}/portal/documents` },
          });
          ok ||= r.sent;
        }
        await log('deadline_nudge', t.id, 'email', ok, t.title);
        if (ok) nudged++;
      }
    }
    out.push(`Deadlines (3 days): ${soon?.length ?? 0}, ${nudged} clients nudged`);
  }

  /* 4b. Quotations: nudge the unopened, the unanswered and the expiring ---- */
  let quotesHeld = 0;
  {
    const { data: held } = await db()
      .from('quotes')
      .select('id', { count: 'exact', head: false })
      .eq('status', 'pending_review');
    quotesHeld = held?.length ?? 0;
    let nudged = 0;
    if (a.quoteFollowUps) {
      const now = Date.now();
      const DAY = 86_400_000;
      const { data: open } = await db()
        .from('quotes')
        .select('*')
        .in('status', ['sent', 'viewed'])
        .limit(200);
      for (const q of open ?? []) {
        if (!q.email || q.email.endsWith('.invalid')) continue;
        const sentAt = new Date(q.sent_at ?? q.created_at).getTime();
        const lastView = q.last_viewed_at ? new Date(q.last_viewed_at).getTime() : null;
        const left = new Date(q.valid_until).getTime() - now;
        const kind =
          left > 0 && left < 2 * DAY
            ? 'expiring'
            : !lastView && now - sentAt > 2 * DAY
              ? 'unopened'
              : lastView && now - lastView > 3 * DAY
                ? 'unanswered'
                : null;
        if (!kind || (await sentRecently('quote_followup', `${q.id}:${kind}`, 60))) continue;
        const first = q.name.split(' ')[0];
        const copy = {
          unopened: {
            subject: `Your quotation is waiting — ${SITE.name}`,
            heading: `${first}, in case it got lost in your inbox`,
            body: [
              'We prepared a personalised quotation for you, and it has not been opened yet.',
              'If your plans have changed, no problem at all. If you would like to talk it through first, you can book a free call from the quotation page.',
            ],
          },
          unanswered: {
            subject: `Any questions about your quotation?`,
            heading: `${first}, shall we talk it through?`,
            body: [
              'Every business is different, so the best next step is usually a short conversation where we understand you fully and confirm the final figure.',
              'Your quotation is still open — you can ask us a question, add or remove a service, or book a free call from the page.',
            ],
          },
          expiring: {
            subject: `Your quotation closes on ${dateIN(q.valid_until)}`,
            heading: `${first}, your quotation closes soon`,
            body: [
              `Your quotation stays open until ${dateIN(q.valid_until)}.`,
              'If you need more time, just reply to this email and we will extend it.',
            ],
          },
        }[kind];
        const r = await sendNotice({
          to: q.email,
          subject: copy.subject,
          eyebrow: 'Your quotation',
          heading: copy.heading,
          paragraphs: copy.body,
          cta: { label: 'Open my quotation', href: quoteUrl(q.token) },
        });
        await log('quote_followup', `${q.id}:${kind}`, 'email', r.sent, `${q.number} ${kind}`);
        if (r.sent) nudged++;
      }
    }
    out.push(`Quotations: ${quotesHeld} waiting for review, ${nudged} followed up`);
  }

  /* 5. The owner's digest (once a day, from the scheduled run) ------------ */
  if (a.dailyDigest && !opts.manual) {
    const since = new Date(Date.now() - 86400_000).toISOString();
    const [{ data: enquiries }, { data: waiting }, { count: chats }] = await Promise.all([
      db()
        .from('enquiries')
        .select('name, service_id, referrer, created_at')
        .gte('created_at', since)
        .order('created_at'),
      db().from('wa_contacts').select('wa_id, name').eq('needs_human', true).limit(20),
      db()
        .from('assistant_conversations')
        .select('id', { count: 'exact', head: true })
        .gte('started_at', since),
    ]);
    const lines = [
      `New enquiries (24h): ${enquiries?.length ?? 0}${
        enquiries?.length
          ? ` — ${enquiries.map((e) => `${e.name}${e.service_id ? ` (${e.service_id})` : ''}${e.referrer === 'whatsapp' ? ' via WhatsApp' : ''}`).join(', ')}`
          : ''
      }`,
      `Calls today: ${(meetings ?? []).map((m) => `${timeIN(m.starts_at)} ${m.name}`).join(', ') || 'none'}`,
      `Waiting for you on WhatsApp: ${(waiting ?? []).map((w) => w.name ?? `+${w.wa_id}`).join(', ') || 'nobody'}`,
      `Website assistant conversations (24h): ${chats ?? 0}`,
      `Quotations waiting for your review: ${quotesHeld}`,
      `Overdue invoices: ${overdueCount} (${inr(overdueTotal)})`,
      `Client deadlines in the next 3 days: ${(soon ?? []).map((t) => t.title).join(', ') || 'none'}`,
      '',
      'Autopilot ran:',
      ...out.map((o) => `• ${o}`),
    ];
    const r = await sendNotice({
      to: process.env.ENQUIRY_NOTIFY_TO ?? SITE.email,
      subject: `Today at ${SITE.name}: ${enquiries?.length ?? 0} new, ${meetings?.length ?? 0} calls, ${waiting?.length ?? 0} waiting`,
      eyebrow: 'Morning digest',
      heading: 'Your morning at a glance',
      paragraphs: [lines.join('\n')],
      cta: { label: 'Open the console', href: `${SITE.url}/admin` },
    });
    await log('daily_digest', today.date, 'email', r.sent);
  }

  await log(
    opts.manual ? 'autopilot_manual' : 'autopilot_run',
    today.date,
    null,
    true,
    out.join(' | '),
  );
  return out;
}

/** Sent the moment someone submits the contact form. */
export async function acknowledgeEnquiry(e: { name: string; email: string }): Promise<void> {
  const { automations } = await getSettings();
  if (!automations.enquiryAcknowledgement || e.email.endsWith('.invalid')) return;
  const r = await sendNotice({
    to: e.email,
    subject: `We have your message — ${SITE.name}`,
    eyebrow: 'Thank you',
    heading: `Thank you, ${e.name.split(' ')[0]}`,
    paragraphs: [
      'Your message is with us. Someone will read it properly and reply within one working day.',
      'If it is time-sensitive — a notice with a deadline, say — you can book a free call straight into our calendar.',
    ],
    cta: { label: 'Book a free call', href: `${SITE.url}/book` },
  });
  await log('enquiry_ack', e.email, 'email', r.sent);
}
