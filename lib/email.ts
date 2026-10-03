import { Resend } from 'resend';
import { SITE } from './site';
import { MONTHS, eventsForMonth, type ComplianceEvent } from '@/content/calendar';
import { ordinal } from './utils';

/**
 * Email delivery.
 *
 * Every function here is a no-op that logs and returns `{ sent: false }` when
 * RESEND_API_KEY is absent, so local development and preview deployments do
 * not fail — and never accidentally send real mail.
 */

const FROM = process.env.EMAIL_FROM ?? `${SITE.name} <onboarding@resend.dev>`;
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? SITE.email;

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/** Escape untrusted values before they go into an HTML email. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type SendResult = { sent: boolean; id?: string; error?: string };

/* ------------------------------------------------------------------ */
/* Internal notification when someone submits the contact form         */
/* ------------------------------------------------------------------ */

export async function sendEnquiryNotification(enquiry: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  serviceId?: string;
  message: string;
}): Promise<SendResult> {
  const resend = client();
  const to = process.env.ENQUIRY_NOTIFY_TO ?? SITE.email;

  if (!resend) {
    console.info('[email] RESEND_API_KEY not set — skipping enquiry notification');
    return { sent: false };
  }

  const rows = [
    ['Name', enquiry.name],
    ['Email', enquiry.email],
    ['Phone', enquiry.phone || '—'],
    ['Company', enquiry.company || '—'],
    ['Service', enquiry.serviceId || '—'],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#6e6e73;font-size:13px;">${esc(label)}</td>` +
        `<td style="padding:6px 0;color:#1d1d1f;font-size:14px;font-weight:500;">${esc(value)}</td></tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1d1d1f;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#1c75c8;">New website enquiry</p>
      <h1 style="margin:0 0 24px;font-size:22px;font-weight:600;letter-spacing:-.02em;">${esc(enquiry.name)}</h1>
      <table style="border-collapse:collapse;margin-bottom:24px;">${rows}</table>
      <div style="background:#f5f5f7;border-radius:14px;padding:20px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6e6e73;">Message</p>
        <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(enquiry.message)}</p>
      </div>
      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">
        Reply directly to this email to respond to ${esc(enquiry.name)}.
      </p>
    </div>`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: enquiry.email,
      subject: `New enquiry — ${enquiry.name}${enquiry.company ? ` (${enquiry.company})` : ''}`,
      html,
    });

    if (error) return { sent: false, error: error.message };
    return { sent: true, id: data?.id };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/* ------------------------------------------------------------------ */
/* Monthly compliance calendar                                         */
/* ------------------------------------------------------------------ */

export function renderCalendarEmail(opts: {
  month: number;
  year: number;
  name?: string | null;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } {
  const { month, year, name, unsubscribeUrl } = opts;
  const monthName = MONTHS[month - 1];
  const events = eventsForMonth(month);

  const row = (event: ComplianceEvent) => `
    <tr>
      <td style="padding:14px 16px 14px 0;vertical-align:top;width:56px;">
        <div style="background:#eff8ff;border-radius:10px;padding:8px 0;text-align:center;">
          <div style="font-size:17px;font-weight:600;color:#1a427f;line-height:1;">${event.day}</div>
          <div style="font-size:10px;color:#1c75c8;margin-top:2px;">${esc(monthName.slice(0, 3))}</div>
        </div>
      </td>
      <td style="padding:14px 0;vertical-align:top;border-bottom:1px solid #ececed;">
        <div style="font-size:15px;font-weight:600;color:#1d1d1f;">${esc(event.title)}</div>
        <div style="font-size:13px;color:#6e6e73;margin-top:4px;line-height:1.5;">${esc(event.description)}</div>
        <div style="font-size:12px;color:#86868b;margin-top:6px;">${esc(event.statute)}</div>
        ${event.penalty ? `<div style="font-size:12px;color:#c8342a;margin-top:4px;">If missed: ${esc(event.penalty)}</div>` : ''}
      </td>
    </tr>`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;padding:32px 16px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;">
        <div style="padding:32px 28px 24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#1c75c8;">Compliance calendar</p>
          <h1 style="margin:0;font-size:26px;font-weight:600;letter-spacing:-.03em;color:#1d1d1f;">${esc(monthName)} ${year}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#6e6e73;">
            ${name ? `${esc(name)}, here` : 'Here'} is what falls due this month — ${events.length} ${events.length === 1 ? 'deadline' : 'deadlines'}, with the statute and the cost of being late.
          </p>
        </div>

        <div style="padding:0 28px 8px;">
          <table style="width:100%;border-collapse:collapse;">${events.map(row).join('')}</table>
        </div>

        <div style="padding:24px 28px 32px;">
          <a href="${SITE.url}/calendar" style="display:inline-block;background:#1c75c8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 24px;border-radius:14px;">
            See the full calendar
          </a>
          <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#86868b;">
            Dates reflect the standard statutory position. Authorities extend deadlines by
            notification from time to time and we will tell you when that happens. This is
            general guidance, not advice on your specific circumstances.
          </p>
        </div>

        <div style="background:#f5f5f7;padding:20px 28px;">
          <p style="margin:0;font-size:12px;color:#86868b;">
            ${esc(SITE.name)} · <a href="mailto:${SITE.email}" style="color:#1c75c8;text-decoration:none;">${SITE.email}</a><br>
            <a href="${unsubscribeUrl}" style="color:#86868b;text-decoration:underline;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </div>`;

  const text = [
    `${SITE.name} — Compliance calendar, ${monthName} ${year}`,
    '',
    ...events.map(
      (e) =>
        `${ordinal(e.day)} ${monthName} — ${e.title} (${e.category})\n  ${e.statute}${e.penalty ? `\n  If missed: ${e.penalty}` : ''}`,
    ),
    '',
    `Full calendar: ${SITE.url}/calendar`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');

  return { subject: `${monthName} ${year} compliance calendar`, html, text };
}

export async function sendCalendarEmail(opts: {
  to: string;
  name?: string | null;
  month: number;
  year: number;
  unsubscribeUrl: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) {
    console.info('[email] RESEND_API_KEY not set — skipping calendar send');
    return { sent: false };
  }

  const { subject, html, text } = renderCalendarEmail(opts);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      replyTo: REPLY_TO,
      subject,
      html,
      text,
      headers: {
        // RFC 8058 — makes the mail client's own unsubscribe button work.
        'List-Unsubscribe': `<${opts.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) return { sent: false, error: error.message };
    return { sent: true, id: data?.id };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/* ------------------------------------------------------------------ */
/* Internal notification when someone applies for a role              */
/* ------------------------------------------------------------------ */

export async function sendApplicationNotification(application: {
  name: string;
  email: string;
  phone?: string;
  role: string;
  portfolio?: string;
  note?: string;
  hasResume: boolean;
}): Promise<SendResult> {
  const resend = client();
  const to = process.env.ENQUIRY_NOTIFY_TO ?? SITE.email;
  if (!resend) {
    console.info('[email] RESEND_API_KEY not set — skipping application notification');
    return { sent: false };
  }

  const rows = [
    ['Role', application.role],
    ['Name', application.name],
    ['Email', application.email],
    ['Phone', application.phone || '—'],
    ['Portfolio', application.portfolio || '—'],
    ['CV', application.hasResume ? 'Attached in the console' : 'Not supplied'],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#6e6e73;font-size:13px;">${esc(label)}</td>` +
        `<td style="padding:6px 0;color:#1d1d1f;font-size:14px;font-weight:500;">${esc(value)}</td></tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1d1d1f;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#1c75c8;">New job application</p>
      <h1 style="margin:0 0 24px;font-size:22px;font-weight:600;letter-spacing:-.02em;">${esc(application.name)} — ${esc(application.role)}</h1>
      <table style="border-collapse:collapse;margin-bottom:24px;">${rows}</table>
      ${
        application.note
          ? `<div style="background:#f5f5f7;border-radius:14px;padding:20px;"><p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6e6e73;">Note</p><p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(application.note)}</p></div>`
          : ''
      }
      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">Review it under Careers in the admin console.</p>
    </div>`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: application.email,
      subject: `Application: ${application.role} — ${application.name}`,
      html,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true, id: data?.id };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : 'Send failed' };
  }
}
