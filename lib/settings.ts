import 'server-only';
import { unstable_cache } from 'next/cache';
import { SITE } from './site';
import { serviceClient } from './supabase';

/**
 * Settings the owner changes from the console without a deploy: contact
 * channels, the announcement bar, social profiles, and whether the careers
 * section is advertised. Every field has a default from lib/site.ts, so an
 * empty table renders exactly the site as it ships.
 */

export type SiteSettings = {
  contact: {
    phone: string;
    phoneIntl: string;
    email: string;
    whatsapp: string;
    hours: string;
  };
  announcement: {
    enabled: boolean;
    text: string;
    href: string;
    cta: string;
  };
  social: {
    linkedin: string;
    instagram: string;
    x: string;
    youtube: string;
  };
  hiring: {
    /** Advertise "We're hiring" in the header and homepage. */
    banner: boolean;
  };
};

export const SETTINGS_TAG = 'site-settings';

export const DEFAULT_SETTINGS: SiteSettings = {
  contact: {
    phone: SITE.phone,
    phoneIntl: SITE.phoneIntl,
    email: SITE.email,
    whatsapp: SITE.whatsapp,
    hours: SITE.hours,
  },
  announcement: { enabled: false, text: '', href: '/contact', cta: 'Find out more' },
  social: { linkedin: '', instagram: '', x: '', youtube: '' },
  hiring: { banner: false },
};

type Section = keyof SiteSettings;

function merge(stored: Record<string, unknown>): SiteSettings {
  const out = structuredClone(DEFAULT_SETTINGS);
  (Object.keys(out) as Section[]).forEach((section) => {
    const value = stored[section];
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
        const target = out[section] as Record<string, unknown>;
        if (k in target && typeof v === typeof target[k]) target[k] = v;
      });
    }
  });
  return out;
}

async function load(): Promise<SiteSettings> {
  const supabase = serviceClient();
  if (!supabase) return DEFAULT_SETTINGS;
  try {
    const { data, error } = await supabase.from('site_settings').select('key, value');
    if (error || !data) return DEFAULT_SETTINGS;
    return merge(Object.fromEntries(data.map((row) => [row.key, row.value])));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const getSettings = unstable_cache(load, ['site-settings-v1'], {
  tags: [SETTINGS_TAG],
  revalidate: 3600,
});

export function whatsappHref(number: string, message?: string): string {
  const text = message ?? `Hello ${SITE.name}, I would like to discuss your services.`;
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
