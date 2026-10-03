import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarClock,
  Inbox,
  PenLine,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { DataTable, EmptyState, PageHeader, Panel, Pill, Stat } from '@/components/admin/ui';
import { requireProfile } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import { formatDate, formatINR, formatRelative, todayIST } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ENQUIRY_TONE = {
  new: 'accent',
  contacted: 'neutral',
  qualified: 'positive',
  converted: 'positive',
  archived: 'neutral',
  spam: 'critical',
} as const;

/**
 * The founder's morning view: what came in, what is owed, what is due, and
 * whether the website is doing its job — in that order.
 */
export default async function AdminOverview({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; secured?: string }>;
}) {
  const profile = await requireProfile();
  const { denied, secured } = await searchParams;
  const supabase = serviceClient();
  const today = todayIST();
  const weekAhead = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);

  const stats = {
    newEnquiries: 0,
    enquiries30: 0,
    activeClients: 0,
    leads: 0,
    receivable: 0,
    overdue: 0,
    views7: 0,
    views30: 0,
    applications: 0,
    subscribers: 0,
  };
  let recent: {
    id: string;
    name: string;
    email: string;
    state: keyof typeof ENQUIRY_TONE;
    created_at: string;
  }[] = [];
  let due: {
    id: string;
    title: string;
    due_on: string | null;
    client_id: string | null;
    priority: number;
  }[] = [];
  let daily: { day: string; views: number }[] = [];

  if (supabase) {
    const [ne, e30, ac, ld, inv, pv, apps, subs, rec, tasks] = await Promise.all([
      supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('state', 'new'),
      supabase
        .from('enquiries')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthAgo),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'lead'),
      supabase
        .from('invoices')
        .select('amount, tax_amount, status, due_on')
        .in('status', ['sent', 'overdue']),
      supabase.rpc('analytics_daily', { p_from: monthAgo }),
      supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
      supabase
        .from('subscribers')
        .select('id', { count: 'exact', head: true })
        .eq('state', 'confirmed'),
      supabase
        .from('enquiries')
        .select('id, name, email, state, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('tasks')
        .select('id, title, due_on, client_id, priority')
        .neq('state', 'done')
        .neq('state', 'not_applicable')
        .lte('due_on', weekAhead)
        .order('due_on', { ascending: true })
        .limit(8),
    ]);

    stats.newEnquiries = ne.count ?? 0;
    stats.enquiries30 = e30.count ?? 0;
    stats.activeClients = ac.count ?? 0;
    stats.leads = ld.count ?? 0;
    for (const i of inv.data ?? []) {
      const total = Number(i.amount) + Number(i.tax_amount);
      stats.receivable += total;
      if (i.status === 'overdue' || (i.due_on && i.due_on < today)) stats.overdue += total;
    }
    const byDay = new Map<string, number>();
    for (const row of pv.data ?? []) {
      const views = Number(row.views);
      byDay.set(row.day, views);
      stats.views30 += views;
      if (row.day >= weekAgo) stats.views7 += views;
    }
    daily = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10);
      return { day: d, views: byDay.get(d) ?? 0 };
    });
    stats.applications = apps.count ?? 0;
    stats.subscribers = subs.count ?? 0;
    recent = (rec.data ?? []) as typeof recent;
    due = tasks.data ?? [];
  }

  const max = Math.max(1, ...daily.map((d) => d.views));
  const conversion = stats.views30 ? ((stats.enquiries30 / stats.views30) * 100).toFixed(1) : '—';
  const firstName = (profile.full_name ?? profile.email).split(/[\s@]/)[0];

  return (
    <>
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description="What came in, what is owed, what is due, and how the website is performing."
        action={
          <Link
            href="/"
            className="bg-ink text-ground inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.875rem] font-semibold"
          >
            <PenLine className="h-4 w-4" /> Edit website
          </Link>
        }
      />

      {secured ? (
        <div className="bg-positive/10 ring-positive/20 mb-6 flex items-start gap-3 rounded-[var(--radius-md)] p-4 ring-1 ring-inset">
          <ShieldCheck className="text-positive mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-ink text-[0.875rem]">
            Two-factor sign-in is on. From now on a password alone cannot open this console.
          </p>
        </div>
      ) : null}

      {denied ? (
        <div className="bg-caution/10 ring-caution/20 mb-6 flex items-start gap-3 rounded-[var(--radius-md)] p-4 ring-1 ring-inset">
          <TriangleAlert className="text-caution mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          <p className="text-ink-2 text-[0.875rem]">
            You do not have permission to open that section.
          </p>
        </div>
      ) : null}

      {!supabase ? (
        <div className="bg-caution/10 ring-caution/20 mb-6 rounded-[var(--radius-md)] p-4 ring-1 ring-inset">
          <p className="text-ink text-[0.875rem] font-medium">Service key not configured</p>
          <p className="text-ink-2 mt-1 text-[0.8125rem] leading-relaxed">
            Counts stay empty until <code>SUPABASE_SERVICE_ROLE_KEY</code> is set.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="New enquiries"
          value={stats.newEnquiries}
          tone={stats.newEnquiries ? 'caution' : 'neutral'}
          hint={stats.newEnquiries ? 'Awaiting a first reply' : 'Nothing waiting'}
        />
        <Stat
          label="Money owed to you"
          value={formatINR(stats.receivable)}
          tone={stats.overdue ? 'critical' : 'accent'}
          hint={stats.overdue ? `${formatINR(stats.overdue)} overdue` : 'Nothing overdue'}
        />
        <Stat
          label="Active clients"
          value={stats.activeClients}
          tone="positive"
          hint={`${stats.leads} open leads`}
        />
        <Stat
          label="Website visits, 7 days"
          value={stats.views7.toLocaleString('en-IN')}
          hint={`${conversion}% of visits became enquiries (30 days)`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel
          title="Traffic, last 30 days"
          description="Page views counted without cookies. Hover a bar for the day."
          action={
            <Link
              href="/admin/analytics"
              className="text-accent inline-flex items-center gap-1 text-[0.8125rem] font-semibold"
            >
              Details <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="px-6 pt-6 pb-5">
            <div
              className="flex h-36 items-end gap-[3px]"
              role="img"
              aria-label={`${stats.views30} views in 30 days`}
            >
              {daily.map((d) => (
                <span
                  key={d.day}
                  title={`${formatDate(d.day)}: ${d.views} views`}
                  className="bg-accent/80 hover:bg-accent flex-1 rounded-t-[3px] transition-colors"
                  style={{ height: `${Math.max(2, (d.views / max) * 100)}%` }}
                />
              ))}
            </div>
            <div className="text-ink-3 mt-2 flex justify-between text-[0.6875rem]">
              <span>{daily[0] ? formatDate(daily[0].day) : ''}</span>
              <span>Today</span>
            </div>
          </div>
        </Panel>

        <Panel
          title="Due this week"
          description="Open tasks and deadlines up to seven days out."
          action={
            <Link
              href="/admin/tasks"
              className="text-accent inline-flex items-center gap-1 text-[0.8125rem] font-semibold"
            >
              All tasks <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {due.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nothing due"
              description="Add deadlines under Tasks."
            />
          ) : (
            <ul className="divide-y divide-[var(--hairline)]">
              {due.map((t) => {
                const late = t.due_on !== null && t.due_on < today;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-6 py-3">
                    <span className="text-ink min-w-0 truncate text-[0.875rem] font-medium">
                      {t.title}
                    </span>
                    <Pill tone={late ? 'critical' : t.due_on === today ? 'caution' : 'neutral'}>
                      {late
                        ? 'Overdue'
                        : t.due_on === today
                          ? 'Today'
                          : t.due_on
                            ? formatDate(t.due_on)
                            : 'No date'}
                    </Pill>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel
          title="Recent enquiries"
          description="Straight from the website contact form."
          action={
            <Link
              href="/admin/enquiries"
              className="text-accent inline-flex items-center gap-1 text-[0.8125rem] font-semibold"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No enquiries yet"
              description="Messages sent through the contact form land here."
            />
          ) : (
            <DataTable head={['Name', 'Email', 'Status', 'Received']} caption="Recent enquiries">
              {recent.map((enquiry) => (
                <tr key={enquiry.id} className="hover:bg-sunken/60 transition-colors">
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/admin/enquiries#${enquiry.id}`}
                      className="text-ink hover:text-accent text-[0.875rem] font-medium"
                    >
                      {enquiry.name}
                    </Link>
                  </td>
                  <td className="text-ink-3 px-6 py-3.5 text-[0.875rem]">{enquiry.email}</td>
                  <td className="px-6 py-3.5">
                    <Pill tone={ENQUIRY_TONE[enquiry.state] ?? 'neutral'}>{enquiry.state}</Pill>
                  </td>
                  <td className="text-ink-3 px-6 py-3.5 text-[0.8125rem]">
                    {formatRelative(enquiry.created_at)}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>

        <Panel title="At a glance">
          <dl className="divide-y divide-[var(--hairline)]">
            {[
              ['Enquiries, 30 days', String(stats.enquiries30), '/admin/enquiries'],
              ['New job applications', String(stats.applications), '/admin/careers/applications'],
              ['Calendar subscribers', String(stats.subscribers), '/admin/subscribers'],
              ['Visits, 30 days', stats.views30.toLocaleString('en-IN'), '/admin/analytics'],
            ].map(([label, value, href]) => (
              <div key={label} className="flex items-center justify-between px-6 py-3.5">
                <dt className="text-ink-2 text-[0.875rem]">
                  <Link href={href!} className="hover:text-accent">
                    {label}
                  </Link>
                </dt>
                <dd className="text-ink text-[0.9375rem] font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
}
