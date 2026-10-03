'use client';

import { useMemo, useState } from 'react';
import { ADMIN_FIELD } from '@/components/admin/ui';
import { CopyButton } from '@/components/admin/form-bits';

const PRESETS = [
  { label: 'WhatsApp status / broadcast', source: 'whatsapp', medium: 'social' },
  { label: 'Instagram bio or post', source: 'instagram', medium: 'social' },
  { label: 'LinkedIn post', source: 'linkedin', medium: 'social' },
  { label: 'Google Business Profile', source: 'google', medium: 'business-profile' },
  { label: 'Email signature', source: 'email', medium: 'signature' },
  { label: 'Printed QR code', source: 'print', medium: 'qr' },
];

const PAGES = ['/', '/services', '/work', '/contact', '/calendar', '/knowledge', '/careers'];

const slug = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

/**
 * Builds a tracked link in three choices. Every enquiry that arrives through
 * it is attributed to the campaign in Leads and Analytics.
 */
export function UtmBuilder({ base }: { base: string }) {
  const [page, setPage] = useState('/');
  const [preset, setPreset] = useState(0);
  const [campaign, setCampaign] = useState('');

  const url = useMemo(() => {
    const p = PRESETS[preset]!;
    const u = new URL(page, base);
    u.searchParams.set('utm_source', p.source);
    u.searchParams.set('utm_medium', p.medium);
    if (campaign) u.searchParams.set('utm_campaign', slug(campaign));
    return u.toString();
  }, [base, page, preset, campaign]);

  return (
    <div className="grid gap-4 px-6 py-5 md:grid-cols-3">
      <label className="block">
        <span className="text-ink mb-1.5 block text-[0.8125rem] font-medium">
          Where will you share it?
        </span>
        <select
          value={preset}
          onChange={(e) => setPreset(Number(e.target.value))}
          className={ADMIN_FIELD}
        >
          {PRESETS.map((p, i) => (
            <option key={p.label} value={i}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-ink mb-1.5 block text-[0.8125rem] font-medium">Which page?</span>
        <select value={page} onChange={(e) => setPage(e.target.value)} className={ADMIN_FIELD}>
          {PAGES.map((p) => (
            <option key={p} value={p}>
              {p === '/' ? 'Homepage' : p}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-ink mb-1.5 block text-[0.8125rem] font-medium">Campaign name</span>
        <input
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          placeholder="e.g. Diwali website offer"
          className={ADMIN_FIELD}
        />
      </label>
      <div className="bg-sunken flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] px-4 py-3 md:col-span-3">
        <code className="text-ink min-w-0 flex-1 text-[0.8125rem] break-all">{url}</code>
        <CopyButton value={url} label="Copy link" />
      </div>
    </div>
  );
}
