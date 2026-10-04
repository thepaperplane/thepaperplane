import Link from 'next/link';
import { CalendarClock, FileText, MessageCircle, ReceiptIndianRupee, Video } from 'lucide-react';
import { PortalSignIn } from '@/components/portal/sign-in';
import { PortalCard, StatusPill } from '@/components/portal/ui';
import { getPortalSession } from '@/lib/portal/auth';
import {
  dateIN,
  deadlinesFor,
  documentsFor,
  inr,
  invoicesFor,
  meetingsFor,
} from '@/lib/portal/data';
import { getSettings, whatsappHref } from '@/lib/settings';

export const metadata = { title: 'Overview' };

export default async function PortalHome({
  searchParams,
}: {
  searchParams: Promise<{ 'signed-out'?: string }>;
}) {
  const session = await getPortalSession();
  if (!session) {
    const { 'signed-out': out } = await searchParams;
    return (
      <div className="mx-auto grid max-w-4xl gap-10 py-6 md:grid-cols-2 md:gap-16">
        <div>
          <p className="label">Client portal</p>
          <h1 className="mt-4 text-[length:var(--text-title-1)] leading-[1.1]">
            Your invoices, documents and deadlines, in one place.
          </h1>
          <p className="text-ink-2 mt-5 text-[1rem] leading-relaxed">
            Sign in with the email address or mobile number The Paper Plane has for you. No password
            — a one-time code each time.
          </p>
          {out ? (
            <p role="status" className="text-positive mt-5 text-[0.875rem] font-medium">
              You are signed out.
            </p>
          ) : null}
        </div>
        <div className="bg-surface rounded-[1.25rem] border border-[var(--hairline)] p-6 sm:p-8">
          <PortalSignIn />
        </div>
      </div>
    );
  }

  const clientId = session.active.id;
  const [invoices, docs, deadlines, meetings, settings] = await Promise.all([
    invoicesFor(clientId),
    documentsFor(clientId),
    deadlinesFor(clientId),
    meetingsFor(clientId),
    getSettings(),
  ]);
  const due = invoices.filter((i) => i.balance > 0);
  const outstanding = due.reduce((n, i) => n + i.balance, 0);
  const zohoPortal = process.env.ZOHO_PORTAL_URL;

  return (
    <>
      <h1 className="text-[length:var(--text-title-1)] leading-[1.1]">{session.active.name}</h1>
      <p className="text-ink-2 mt-2 text-[0.9375rem]">
        Everything we hold for you, kept up to date.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="bg-surface rounded-[1.1rem] border border-[var(--hairline)] p-5">
          <p className="text-ink-3 text-[0.8125rem]">Outstanding</p>
          <p className="text-ink mt-1 text-[1.75rem] font-semibold tabular-nums">
            {inr(outstanding)}
          </p>
          <p className="text-ink-3 mt-1 text-[0.8125rem]">
            {due.length
              ? `${due.length} invoice${due.length === 1 ? '' : 's'} open`
              : 'All settled'}
          </p>
        </div>
        <div className="bg-surface rounded-[1.1rem] border border-[var(--hairline)] p-5">
          <p className="text-ink-3 text-[0.8125rem]">Next deadline</p>
          <p className="text-ink mt-1 text-[1.125rem] font-semibold">
            {deadlines[0]?.title ?? 'Nothing pending'}
          </p>
          <p className="text-ink-3 mt-1 text-[0.8125rem]">
            {deadlines[0] ? dateIN(deadlines[0].due_on) : '—'}
          </p>
        </div>
        <div className="bg-surface rounded-[1.1rem] border border-[var(--hairline)] p-5">
          <p className="text-ink-3 text-[0.8125rem]">Next call</p>
          <p className="text-ink mt-1 text-[1.125rem] font-semibold">
            {meetings[0]
              ? new Date(meetings[0].starts_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'Asia/Kolkata',
                })
              : 'None booked'}
          </p>
          {meetings[0]?.meet_link ? (
            <a
              href={meetings[0].meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent mt-1 inline-flex h-7 items-center gap-1 text-[0.8125rem] font-semibold"
            >
              <Video className="h-3.5 w-3.5" /> Join on Meet
            </a>
          ) : (
            <Link
              href="/book"
              className="text-accent mt-1 inline-flex h-7 items-center text-[0.8125rem] font-semibold"
            >
              Book a call
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PortalCard
          title="Recent invoices"
          action={
            <Link
              href="/portal/invoices"
              className="text-accent inline-flex h-8 items-center text-[0.8125rem] font-semibold"
            >
              All invoices
            </Link>
          }
        >
          {invoices.length ? (
            <ul className="divide-y divide-[var(--hairline)]">
              {invoices.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                  <ReceiptIndianRupee className="text-ink-3 h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="text-ink block text-[0.875rem] font-medium">{i.number}</span>
                    <span className="text-ink-3 block text-[0.75rem]">{dateIN(i.date)}</span>
                  </span>
                  <span className="text-ink text-[0.875rem] font-semibold tabular-nums">
                    {inr(i.total)}
                  </span>
                  <StatusPill status={i.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-3 px-5 py-6 text-[0.875rem]">No invoices yet.</p>
          )}
        </PortalCard>

        <div className="grid content-start gap-6">
          <PortalCard title="Deadlines we are tracking for you">
            {deadlines.length ? (
              <ul className="divide-y divide-[var(--hairline)]">
                {deadlines.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <CalendarClock className="text-accent h-4 w-4 shrink-0" />
                    <span className="text-ink min-w-0 flex-1 text-[0.875rem]">{d.title}</span>
                    <span className="text-ink-3 text-[0.75rem] whitespace-nowrap">
                      {dateIN(d.due_on)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-3 px-5 py-6 text-[0.875rem]">Nothing pending right now.</p>
            )}
          </PortalCard>
          <PortalCard
            title="Latest documents"
            action={
              <Link
                href="/portal/documents"
                className="text-accent inline-flex h-8 items-center text-[0.8125rem] font-semibold"
              >
                All documents
              </Link>
            }
          >
            {docs.length ? (
              <ul className="divide-y divide-[var(--hairline)]">
                {docs.slice(0, 4).map((d) => (
                  <li key={d.id}>
                    <a
                      href={`/api/portal/documents/${d.id}`}
                      className="hover:bg-sunken flex items-center gap-3 px-5 py-3"
                    >
                      <FileText className="text-ink-3 h-4 w-4 shrink-0" />
                      <span className="text-ink min-w-0 flex-1 truncate text-[0.875rem]">
                        {d.title}
                      </span>
                      <span className="text-ink-3 text-[0.75rem]">{dateIN(d.created_at)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-3 px-5 py-6 text-[0.875rem]">No documents shared yet.</p>
            )}
          </PortalCard>
        </div>
      </div>

      <div className="text-ink-2 mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.875rem]">
        <span>Need something?</span>
        <a
          href={whatsappHref(settings.contact.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent inline-flex h-9 items-center gap-1.5 font-semibold"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp the team
        </a>
        <a
          href={`mailto:${settings.contact.email}`}
          className="text-accent inline-flex h-9 items-center font-semibold"
        >
          {settings.contact.email}
        </a>
        {zohoPortal ? (
          <a
            href={zohoPortal}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent inline-flex h-9 items-center font-semibold"
          >
            Zoho Books portal
          </a>
        ) : null}
      </div>
    </>
  );
}
