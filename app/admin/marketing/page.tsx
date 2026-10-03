import Link from 'next/link';
import { Download, Megaphone, MessageCircle, Quote, Users } from 'lucide-react';
import { PageHeader, Panel, Stat } from '@/components/admin/ui';
import { UtmBuilder } from '@/components/admin/utm-builder';
import { CopyButton } from '@/components/admin/form-bits';
import { requireProfile } from '@/lib/auth';
import { getSettings, whatsappHref } from '@/lib/settings';
import { SITE } from '@/lib/site';
import { serviceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Campaigns' };

/**
 * The marketing desk: tracked links for every channel, ready-made share
 * links, the audience you already have, and the proof you can publish.
 */
export default async function MarketingPage() {
  await requireProfile();
  const supabase = serviceClient();
  const settings = await getSettings();

  const counts = { subscribers: 0, testimonials: 0, published: 0, tagged: 0 };
  if (supabase) {
    const [s, t, p, m] = await Promise.all([
      supabase
        .from('subscribers')
        .select('id', { count: 'exact', head: true })
        .eq('state', 'confirmed'),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }),
      supabase
        .from('testimonials')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),
      supabase
        .from('enquiry_meta')
        .select('enquiry_id', { count: 'exact', head: true })
        .not('utm_source', 'is', null),
    ]);
    counts.subscribers = s.count ?? 0;
    counts.testimonials = t.count ?? 0;
    counts.published = p.count ?? 0;
    counts.tagged = m.count ?? 0;
  }

  const waIntro = whatsappHref(
    settings.contact.whatsapp,
    `Hello ${SITE.name}, I saw your website and would like to talk about a project.`,
  );
  const shares = [
    { label: 'WhatsApp “start a chat” link', value: waIntro },
    { label: 'Book-a-call page', value: `${SITE.url}/contact?utm_source=share&utm_medium=direct` },
    {
      label: 'Portfolio to send a prospect',
      value: `${SITE.url}/work?utm_source=share&utm_medium=direct`,
    },
    {
      label: 'Compliance calendar (lead magnet)',
      value: `${SITE.url}/calendar?utm_source=share&utm_medium=direct`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Tracked links for every place you promote the business, so you can see which channel actually brings work."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Enquiries from tracked links" value={counts.tagged} tone="accent" />
        <Stat
          label="Calendar subscribers"
          value={counts.subscribers}
          tone="positive"
          hint="Your owned email audience"
        />
        <Stat
          label="Testimonials published"
          value={`${counts.published} / ${counts.testimonials}`}
        />
        <Stat
          label="Announcement bar"
          value={settings.announcement.enabled ? 'On' : 'Off'}
          hint="Change under Site settings"
        />
      </div>

      <Panel
        title="Build a tracked link"
        description="Share this instead of the plain address. Visits and enquiries from it show up under Analytics and Leads."
        className="mb-6"
      >
        <UtmBuilder base={SITE.url} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Ready-to-share links">
          <ul className="divide-y divide-[var(--hairline)]">
            {shares.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 px-6 py-3.5">
                <div className="min-w-0">
                  <p className="text-ink text-[0.875rem] font-medium">{s.label}</p>
                  <p className="text-ink-3 truncate text-[0.75rem]">{s.value}</p>
                </div>
                <CopyButton value={s.value} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Your audience and proof">
          <nav className="divide-y divide-[var(--hairline)]">
            {[
              {
                href: '/admin/subscribers',
                label: 'Subscribers — export for a newsletter',
                icon: Users,
              },
              {
                href: '/api/admin/export/subscribers',
                label: 'Download confirmed subscribers (CSV)',
                icon: Download,
              },
              {
                href: '/api/admin/export/enquiries',
                label: 'Download enquiries with sources (CSV)',
                icon: Download,
              },
              { href: '/admin/testimonials', label: 'Add or publish testimonials', icon: Quote },
              { href: '/admin/settings', label: 'Switch on the announcement bar', icon: Megaphone },
              { href: waIntro, label: 'Open WhatsApp chat link', icon: MessageCircle },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className="hover:bg-sunken flex items-center gap-3 px-6 py-3.5 text-[0.875rem] font-medium transition-colors"
              >
                <Icon className="text-accent h-4 w-4 shrink-0" />
                <span className="text-ink">{label}</span>
              </Link>
            ))}
          </nav>
        </Panel>
      </div>
    </>
  );
}
