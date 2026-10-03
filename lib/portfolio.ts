import 'server-only';
import { PROJECTS as STATIC_PROJECTS, type Project } from '@/content/portfolio';
import { serviceClient, isSupabaseConfigured } from './supabase';
import { isFrameable } from './embed';

/**
 * The portfolio as the public site sees it.
 *
 * The database is the source of truth once provisioned; content/portfolio.ts
 * is the fallback that keeps /work and the homepage correct before any data
 * exists, or if the query fails.
 *
 * `full` captures are full-length page screenshots. They are what make the
 * browser frame on /work scrollable — a visitor can read the whole client
 * site inside it. Where only a viewport capture exists the frame still shows
 * it, just without anything below the fold to scroll to.
 */

export type PortfolioProject = Project & {
  full: { desktop: string | null; mobile: string | null };
  featured: boolean;
  outcome: string | null;
  /** The site allows itself to be framed, so /work can show it live. */
  frameable: boolean;
};

const storage = (path: string | null | undefined) =>
  path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${
        path.startsWith('site-media/') ? path : `previews/${path}`
      }`
    : null;

function fromStatic(): PortfolioProject[] {
  return STATIC_PROJECTS.map((p, i) => ({
    ...p,
    full: { desktop: null, mobile: null },
    featured: p.status === 'live' && i < 3,
    outcome: null,
    frameable: false,
  }));
}

/** Asks each live site whether it may be framed; cached for six hours. */
async function withFraming(list: PortfolioProject[]): Promise<PortfolioProject[]> {
  const flags = await Promise.all(
    list.map((p) => (p.status === 'live' ? isFrameable(p.url) : Promise.resolve(false))),
  );
  return list.map((p, i) => ({ ...p, frameable: flags[i] ?? false }));
}

export async function loadPortfolio(): Promise<PortfolioProject[]> {
  return withFraming(await loadRows());
}

async function loadRows(): Promise<PortfolioProject[]> {
  if (!isSupabaseConfigured) return fromStatic();
  const supabase = serviceClient();
  if (!supabase) return fromStatic();

  const [{ data, error }, { data: media }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .in('status', ['live', 'staged'])
      .order('position', { ascending: true }),
    supabase.from('project_media').select('*'),
  ]);

  if (error || !data?.length) {
    if (error) console.error('[portfolio] query failed', error);
    return fromStatic();
  }

  const extras = new Map((media ?? []).map((m) => [m.project_id, m]));

  return data.map((row) => {
    const m = extras.get(row.id);
    return {
      slug: row.slug,
      name: row.name,
      url: row.url,
      displayUrl: row.display_url,
      sector: row.sector ?? '',
      year: row.year ?? new Date().getFullYear(),
      summary: row.summary ?? '',
      brief: row.brief ?? '',
      stack: row.stack,
      highlights: Array.isArray(row.highlights)
        ? (row.highlights as { label: string; value: string }[])
        : [],
      status: row.status === 'live' ? 'live' : 'staged',
      statusNote: row.status_note ?? undefined,
      shots: {
        desktop: storage(row.desktop_shot_path),
        mobile: storage(row.mobile_shot_path),
        capturedAt: row.captured_at,
      },
      full: {
        desktop: storage(m?.desktop_full_path),
        mobile: storage(m?.mobile_full_path),
      },
      // Until the owner marks favourites, every live project is featured.
      featured: m ? m.is_featured : row.status === 'live',
      outcome: m?.outcome ?? null,
      frameable: false,
    } satisfies PortfolioProject;
  });
}
