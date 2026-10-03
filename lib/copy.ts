import 'server-only';
import { unstable_cache } from 'next/cache';
import { serviceClient } from './supabase';

/**
 * Editable copy, for the visual editor.
 *
 * Every piece of text on the site that can be edited by clicking on it is
 * rendered through <Editable k="home.hero.lede">default</Editable>. The default
 * lives in the code, beside the markup it belongs to; the database holds only
 * overrides. So the site is complete and correct with an empty table, no
 * database at all, or a failed query — an override can only ever replace a
 * string, never leave a hole where one was.
 *
 * Overrides are read in a single cached query per revalidation, tagged so a
 * save from the editor invalidates exactly this and nothing else.
 *
 * Keys are `page.slot` with the slot free to contain dots: `home.hero.lede`
 * is page "home", slot "hero.lede". The same table backs lib/content.ts, so
 * a key edited here and a key edited from the console form are one record.
 */

export const COPY_TAG = 'site-copy';

/** What a key may look like. Anything else is refused before it reaches SQL. */
export const COPY_KEY = /^[a-z][a-z0-9-]{0,30}(\.[a-zA-Z0-9-]{1,40}){1,4}$/;

export type CopyValue = { text?: string; url?: string; alt?: string };
export type CopyMap = Record<string, CopyValue>;

async function load(): Promise<CopyMap> {
  const supabase = serviceClient();
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('content_blocks')
      .select('page, slot, kind, value')
      .eq('is_published', true);
    if (error || !data) return {};
    const map: CopyMap = {};
    for (const row of data) {
      const key = `${row.page}.${row.slot}`;
      const v = row.value as unknown;
      if (typeof v === 'string') map[key] = { text: v };
      else if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        map[key] = {
          text: typeof o.text === 'string' ? o.text : undefined,
          url: typeof o.url === 'string' ? o.url : undefined,
          alt: typeof o.alt === 'string' ? o.alt : undefined,
        };
      }
    }
    return map;
  } catch {
    return {};
  }
}

export const getCopy = unstable_cache(load, ['site-copy-v1'], {
  tags: [COPY_TAG],
  revalidate: 3600,
});

export function splitKey(key: string): { page: string; slot: string } {
  const [page, ...rest] = key.split('.');
  return { page: page!, slot: rest.join('.') };
}

/** A readable label for the console, derived from the key itself. */
export function labelFor(key: string): string {
  const { page, slot } = splitKey(key);
  const words = slot
    .split(/[.-]/)
    .filter(Boolean)
    .map((w) => w.replace(/([a-z])([A-Z])/g, '$1 $2'))
    .join(' › ');
  return `${page.charAt(0).toUpperCase()}${page.slice(1)} — ${words}`;
}
