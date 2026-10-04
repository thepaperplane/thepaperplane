import { CalendarClock, Video } from 'lucide-react';
import {
  ADMIN_FIELD,
  DataTable,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  Pill,
} from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import {
  disconnectGoogleCalendar,
  saveScheduling,
  setMeetingStatus,
} from '@/app/admin/_actions/meetings';
import { requireRole } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { getGoogle, googleConfigured } from '@/lib/integrations/google';
import { serviceClient } from '@/lib/supabase';
import type { MeetingRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Meetings' };

const when = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const NOTICE: Record<string, string> = {
  connected: 'Google Calendar is connected.',
  denied: 'Google access was not granted.',
  failed: 'Google Calendar could not be connected — see Integrations for the log.',
  'state-mismatch': 'That sign-in did not start from this console, so it was refused.',
  'not-configured': 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the environment first.',
  'no-code': 'Google did not return an authorisation code.',
};

/**
 * Every consultation booked on the website or by the WhatsApp assistant, in
 * the owner's own Google Calendar, with a Meet link on each. The hours set
 * here are the only hours either channel will ever offer.
 */
export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  await requireRole('editor');
  const { google: notice } = await searchParams;
  const settings = await getSettings();
  const cfg = settings.scheduling;
  const google = await getGoogle();
  const connected = google?.status === 'connected';

  let upcoming: MeetingRow[] = [];
  let past: MeetingRow[] = [];
  const supabase = serviceClient();
  if (supabase) {
    const now = new Date().toISOString();
    const [u, p] = await Promise.all([
      supabase.from('meetings').select('*').gte('ends_at', now).order('starts_at').limit(100),
      supabase
        .from('meetings')
        .select('*')
        .lt('ends_at', now)
        .order('starts_at', { ascending: false })
        .limit(30),
    ]);
    upcoming = u.data ?? [];
    past = p.data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Meetings"
        description="Consultations booked on the website (/book) and by the WhatsApp assistant land in your Google Calendar with a Meet link, and remind the client on the morning of the call."
        action={
          <Pill tone={connected ? 'positive' : 'caution'}>
            <CalendarClock className="h-3.5 w-3.5" />
            {connected
              ? `Calendar: ${google?.account_label ?? 'connected'}`
              : 'Calendar not connected'}
          </Pill>
        }
      />
      {notice && NOTICE[notice] ? (
        <p
          role="status"
          className="bg-sunken text-ink mb-5 rounded-[var(--radius-md)] px-4 py-3 text-[0.875rem] font-medium"
        >
          {NOTICE[notice]}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel
          title="Coming up"
          description="Cancelling here also cancels the calendar event and tells the client."
        >
          {upcoming.length ? (
            <DataTable head={['When', 'Who', 'About', 'Status', '']}>
              {upcoming.map((m) => (
                <tr key={m.id}>
                  <td className="text-ink px-6 py-3 text-[0.8125rem] whitespace-nowrap">
                    {when.format(new Date(m.starts_at))}
                  </td>
                  <td className="px-6 py-3 text-[0.8125rem]">
                    <span className="text-ink block font-medium">{m.name}</span>
                    <span className="text-ink-3 block">{m.email ?? m.phone ?? '—'}</span>
                  </td>
                  <td className="text-ink-2 max-w-[18rem] px-6 py-3 text-[0.8125rem]">
                    <span className="line-clamp-2">{m.topic}</span>
                    <span className="text-ink-3 mt-0.5 block text-[0.75rem]">via {m.source}</span>
                  </td>
                  <td className="px-6 py-3">
                    <Pill tone={m.status === 'booked' ? 'accent' : 'neutral'}>{m.status}</Pill>
                  </td>
                  <td className="px-6 py-3 text-right whitespace-nowrap">
                    {m.meet_link ? (
                      <a
                        href={m.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent mr-3 inline-flex h-9 items-center gap-1 text-[0.8125rem] font-semibold"
                      >
                        <Video className="h-3.5 w-3.5" /> Meet
                      </a>
                    ) : null}
                    {m.status === 'booked' ? (
                      <form action={setMeetingStatus} className="inline">
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <SubmitButton
                          tone="danger"
                          className="h-9"
                          confirm="Cancel this meeting and notify the client?"
                          pendingText="…"
                        >
                          Cancel
                        </SubmitButton>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="Nothing booked yet"
              description="Share /book, or let the WhatsApp assistant offer times."
            />
          )}
        </Panel>

        <div className="grid content-start gap-6">
          <Panel title="Google Calendar">
            <div className="px-6 py-5">
              {connected ? (
                <>
                  <p className="text-ink-2 text-[0.875rem] leading-relaxed">
                    Reading busy times from and adding meetings to{' '}
                    <strong>{google?.account_label}</strong>.
                  </p>
                  <form action={disconnectGoogleCalendar} className="mt-4">
                    <SubmitButton
                      tone="danger"
                      confirm="Disconnect Google Calendar? Booking stops until you reconnect."
                      pendingText="…"
                    >
                      Disconnect
                    </SubmitButton>
                  </form>
                </>
              ) : (
                <>
                  <ol className="text-ink-2 grid list-decimal gap-2 pl-5 text-[0.875rem] leading-relaxed">
                    <li>
                      In Google Cloud Console create a project, enable the{' '}
                      <strong>Google Calendar API</strong>, and set up the OAuth consent screen
                      (External, add your email as a test user or publish it).
                    </li>
                    <li>
                      Create an OAuth client ID of type <strong>Web application</strong> with the
                      redirect URI{' '}
                      <code className="ref">
                        https://www.thepaperplane.co.in/api/admin/integrations/google/callback
                      </code>
                    </li>
                    <li>
                      Add <code className="ref">GOOGLE_CLIENT_ID</code> and{' '}
                      <code className="ref">GOOGLE_CLIENT_SECRET</code> in Vercel and redeploy.
                    </li>
                  </ol>
                  <div className="mt-5">
                    {googleConfigured() ? (
                      <a
                        href="/api/admin/integrations/google/connect"
                        className="bg-accent text-accent-ink hover:bg-accent-hover inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.875rem] font-semibold"
                      >
                        <CalendarClock className="h-4 w-4" /> Connect Google Calendar
                      </a>
                    ) : (
                      <Pill tone="caution">
                        Waiting for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
                      </Pill>
                    )}
                  </div>
                </>
              )}
            </div>
          </Panel>

          <Panel
            title="Hours you can be booked"
            description="India time. Both /book and the WhatsApp assistant use these."
          >
            <form action={saveScheduling} className="grid gap-4 px-6 py-5">
              <label className="text-ink flex items-center gap-2.5 text-[0.875rem] font-medium">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={cfg.enabled}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Accept bookings
              </label>
              <fieldset>
                <legend className="text-ink mb-1.5 text-[0.8125rem] font-medium">Days</legend>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d, i) => (
                    <label
                      key={d}
                      className="text-ink-2 flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] ring-1 ring-[var(--hairline-strong)] ring-inset"
                    >
                      <input
                        type="checkbox"
                        name="days"
                        value={i}
                        defaultChecked={cfg.days.includes(i)}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid grid-cols-2 gap-4">
                <Field label="From" htmlFor="sc-start">
                  <input
                    id="sc-start"
                    name="start"
                    type="time"
                    defaultValue={cfg.start}
                    className={ADMIN_FIELD}
                  />
                </Field>
                <Field label="Until" htmlFor="sc-end">
                  <input
                    id="sc-end"
                    name="end"
                    type="time"
                    defaultValue={cfg.end}
                    className={ADMIN_FIELD}
                  />
                </Field>
                <Field label="Meeting length (min)" htmlFor="sc-len">
                  <input
                    id="sc-len"
                    name="slotMinutes"
                    type="number"
                    min={15}
                    max={120}
                    defaultValue={cfg.slotMinutes}
                    className={ADMIN_FIELD}
                  />
                </Field>
                <Field label="Gap around meetings (min)" htmlFor="sc-buf">
                  <input
                    id="sc-buf"
                    name="bufferMinutes"
                    type="number"
                    min={0}
                    max={60}
                    defaultValue={cfg.bufferMinutes}
                    className={ADMIN_FIELD}
                  />
                </Field>
                <Field label="Earliest, hours from now" htmlFor="sc-lead">
                  <input
                    id="sc-lead"
                    name="leadHours"
                    type="number"
                    min={0}
                    max={72}
                    defaultValue={cfg.leadHours}
                    className={ADMIN_FIELD}
                  />
                </Field>
                <Field label="Offer up to, days ahead" htmlFor="sc-hor">
                  <input
                    id="sc-hor"
                    name="horizonDays"
                    type="number"
                    min={1}
                    max={60}
                    defaultValue={cfg.horizonDays}
                    className={ADMIN_FIELD}
                  />
                </Field>
              </div>
              <Field label="Calendar event title" htmlFor="sc-title">
                <input
                  id="sc-title"
                  name="title"
                  defaultValue={cfg.title}
                  className={ADMIN_FIELD}
                />
              </Field>
              <div>
                <SubmitButton>Save hours</SubmitButton>
              </div>
            </form>
          </Panel>
        </div>
      </div>

      {past.length ? (
        <Panel className="mt-6" title="Recent">
          <DataTable head={['When', 'Who', 'Status', '']}>
            {past.map((m) => (
              <tr key={m.id}>
                <td className="text-ink-2 px-6 py-3 text-[0.8125rem] whitespace-nowrap">
                  {when.format(new Date(m.starts_at))}
                </td>
                <td className="text-ink px-6 py-3 text-[0.8125rem]">{m.name}</td>
                <td className="px-6 py-3">
                  <Pill>{m.status}</Pill>
                </td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  {m.status === 'booked' ? (
                    <>
                      <form action={setMeetingStatus} className="inline">
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="status" value="done" />
                        <SubmitButton tone="quiet" className="mr-2 h-9" pendingText="…">
                          Held
                        </SubmitButton>
                      </form>
                      <form action={setMeetingStatus} className="inline">
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="status" value="no_show" />
                        <SubmitButton tone="quiet" className="h-9" pendingText="…">
                          No-show
                        </SubmitButton>
                      </form>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}
    </>
  );
}
