import { serviceClient } from './supabase';

/**
 * CMS-backed copy.
 *
 * Every editable string has a hard-coded default here. The database only ever
 * overrides — so the site renders correctly with no database, no seeded rows,
 * and no network call succeeding. The console edits the override, never the
 * fallback.
 */

export type ContentKey =
  | 'home.hero.eyebrow'
  | 'home.hero.lede'
  | 'home.pillars.title'
  | 'home.pillars.lede'
  | 'home.knowledge.title'
  | 'home.knowledge.lede'
  | 'home.cta.title'
  | 'home.cta.lede'
  | 'knowledge.hero.title'
  | 'knowledge.hero.lede'
  | 'calendar.hero.title'
  | 'calendar.hero.lede'
  | 'calendar.subscribe.title'
  | 'calendar.subscribe.lede'
  | 'work.hero.title'
  | 'work.hero.lede'
  | 'about.hero.title'
  | 'about.hero.lede'
  | 'contact.hero.title'
  | 'contact.hero.lede';

export const CONTENT_DEFAULTS: Record<ContentKey, { label: string; page: string; value: string }> =
  {
    'home.hero.eyebrow': {
      page: 'home',
      label: 'Masthead — standfirst (unused in v3 layout)',
      value: 'Advisory and engineering, held to one standard',
    },
    /* The masthead headline is the brand tagline, and it is deliberately NOT
       editable here. It is read from SITE.tagline, the same constant that sets
       the logo lockup, the OG image, the footer and the organisation schema, so
       a console edit can never leave the homepage saying one thing and every
       share card saying another. */
    'home.hero.lede': {
      page: 'home',
      label: 'Hero — supporting text',
      value:
        'Bring us the idea. We build the website, the portal and the systems that carry it, and we keep the filings, books and compliance underneath it airtight. One accountable team, from first sketch to takeoff.',
    },
    'home.pillars.title': {
      page: 'home',
      label: 'Pillars — heading',
      value: 'Six disciplines, one accountable team',
    },
    'home.pillars.lede': {
      page: 'home',
      label: 'Pillars — supporting text',
      value:
        'Most firms hand you off between a filing agent, a lawyer and an agency. These six sit under one roof, which is why the handoffs stop costing you.',
    },
    'home.knowledge.title': {
      page: 'home',
      label: 'Knowledge teaser — heading',
      value: 'What you are actually paying for',
    },
    'home.knowledge.lede': {
      page: 'home',
      label: 'Knowledge teaser — supporting text',
      value:
        'Compliance work is mostly invisible, which is why it is so easy to under-price and so expensive to get wrong. Here is the part you do not see.',
    },
    'home.cta.title': {
      page: 'home',
      label: 'Closing — heading',
      value: 'Start with a conversation, not a quote.',
    },
    'home.cta.lede': {
      page: 'home',
      label: 'Closing CTA — supporting text',
      value:
        'Tell us what you are filing, defending or building. You will get a straight account of what it actually involves, and what it should cost, before anyone signs anything.',
    },
    'knowledge.hero.title': {
      page: 'knowledge',
      label: 'Hero — headline',
      value: 'An informed client is a better client',
    },
    'knowledge.hero.lede': {
      page: 'knowledge',
      label: 'Hero — supporting text',
      value:
        'Most of what you pay a compliance practice for happens where you cannot see it. This section makes it visible — the work inside each service, the cost of getting it wrong, and what the language on your notices actually means.',
    },
    'calendar.hero.title': {
      page: 'calendar',
      label: 'Hero — headline',
      value: 'Every date that carries a penalty',
    },
    'calendar.hero.lede': {
      page: 'calendar',
      label: 'Hero — supporting text',
      value:
        'Monthly filings recur on the same days all year. Annual filings land once and are easy to miss. Both are here, with the statute and the cost of being late.',
    },
    'calendar.subscribe.title': {
      page: 'calendar',
      label: 'Subscribe — heading',
      value: 'The month ahead, in your inbox',
    },
    'calendar.subscribe.lede': {
      page: 'calendar',
      label: 'Subscribe — supporting text',
      value:
        'On the first working day of each month we send one email listing exactly what is due, when, and what it costs to miss. Open to everyone — you do not need to be a client.',
    },
    'work.hero.title': {
      page: 'work',
      label: 'Hero — headline',
      value: 'Sites and platforms we have shipped',
    },
    'work.hero.lede': {
      page: 'work',
      label: 'Hero — supporting text',
      value:
        'The same practice that handles compliance also builds software. That is unusual, and it is the reason these projects were specified correctly the first time.',
    },
    'about.hero.title': {
      page: 'about',
      label: 'Hero — headline',
      value: 'A compliance practice that also writes the software',
    },
    'about.hero.lede': {
      page: 'about',
      label: 'Hero — supporting text',
      value:
        'Accountants who cannot build systems, and agencies that do not understand filings, are both half an answer. The Paper Plane exists because most businesses need the whole one.',
    },
    'contact.hero.title': {
      page: 'contact',
      label: 'Hero — headline',
      value: 'Tell us what you are dealing with',
    },
    'contact.hero.lede': {
      page: 'contact',
      label: 'Hero — supporting text',
      value:
        'A notice, a deadline, an incorporation, or a system that needs building. Send the specifics and you will get a straight answer — not a brochure.',
    },
  };

export const CONTENT_PAGES = [...new Set(Object.values(CONTENT_DEFAULTS).map((d) => d.page))];

type Overrides = Partial<Record<ContentKey, string>>;

/**
 * Load every published override in one query. Callers pass the result to
 * `pick`, so a page makes exactly one database round trip regardless of how
 * many strings it renders.
 */
export async function loadContent(page?: string): Promise<Overrides> {
  const supabase = serviceClient();
  if (!supabase) return {};

  try {
    let query = supabase
      .from('content_blocks')
      .select('page, slot, value')
      .eq('is_published', true);

    if (page) query = query.eq('page', page);

    const { data, error } = await query;
    if (error || !data) return {};

    const overrides: Overrides = {};
    for (const row of data) {
      const key = `${row.page}.${row.slot}` as ContentKey;
      const value =
        typeof row.value === 'string' ? row.value : (row.value as { text?: string })?.text;
      if (typeof value === 'string' && value.trim()) overrides[key] = value;
    }
    return overrides;
  } catch {
    return {};
  }
}

/** Override if present and non-empty, otherwise the hard-coded default. */
export function pick(overrides: Overrides, key: ContentKey): string {
  return overrides[key] ?? CONTENT_DEFAULTS[key].value;
}
