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
  assistant: {
    /** Show the site assistant to visitors (also needs ANTHROPIC_API_KEY). */
    enabled: boolean;
    /** First line the assistant shows when opened. */
    greeting: string;
    /** Standing notes from the owner the assistant may use — holidays, offers. */
    notes: string;
    /** Most visitor messages answered per day across the whole site. */
    dailyCap: number;
    /** economy | balanced | best — see lib/ai/claude.ts. */
    tier: string;
  };
  whatsappBot: {
    /** Answer the bot number automatically. */
    enabled: boolean;
    /** The bot number, digits only — used for "Chat on WhatsApp" links. Never shown as text. */
    number: string;
    /** Most replies the WhatsApp assistant sends per day, in total. */
    dailyCap: number;
  };
  scheduling: {
    enabled: boolean;
    /** Days meetings can be booked on, 0 = Sunday. */
    days: number[];
    start: string;
    end: string;
    slotMinutes: number;
    bufferMinutes: number;
    /** Earliest booking, in hours from now. */
    leadHours: number;
    /** How far ahead slots are offered, in days. */
    horizonDays: number;
    title: string;
  };
  automations: {
    meetingReminders: boolean;
    invoiceReminders: boolean;
    enquiryAcknowledgement: boolean;
    deadlineNudges: boolean;
    dailyDigest: boolean;
    /** Approved WhatsApp template names (bot number), blank to use email only. */
    reminderTemplate: string;
    invoiceTemplate: string;
    otpTemplate: string;
    templateLanguage: string;
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
  assistant: {
    enabled: true,
    greeting:
      'Hello — I can answer questions about our services, deadlines and how we work, straight from this website. What can I help with?',
    notes: '',
    dailyCap: 400,
    tier: 'economy',
  },
  whatsappBot: { enabled: true, number: '', dailyCap: 300 },
  scheduling: {
    enabled: true,
    days: [1, 2, 3, 4, 5, 6],
    start: '10:00',
    end: '18:00',
    slotMinutes: 30,
    bufferMinutes: 15,
    leadHours: 3,
    horizonDays: 10,
    title: 'The Paper Plane — consultation',
  },
  automations: {
    meetingReminders: true,
    invoiceReminders: true,
    enquiryAcknowledgement: true,
    deadlineNudges: true,
    dailyDigest: true,
    reminderTemplate: '',
    invoiceTemplate: '',
    otpTemplate: '',
    templateLanguage: 'en',
  },
};

type Section = keyof SiteSettings;

function merge(stored: Record<string, unknown>): SiteSettings {
  const out = structuredClone(DEFAULT_SETTINGS);
  (Object.keys(out) as Section[]).forEach((section) => {
    const value = stored[section];
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
        const target = out[section] as Record<string, unknown>;
        if (
          k in target &&
          typeof v === typeof target[k] &&
          Array.isArray(v) === Array.isArray(target[k])
        ) {
          target[k] = v;
        }
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

export const getSettings = unstable_cache(load, ['site-settings-v3'], {
  tags: [SETTINGS_TAG],
  revalidate: 3600,
});

export function whatsappHref(number: string, message?: string): string {
  const text = message ?? `Hello ${SITE.name}, I would like to discuss your services.`;
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
