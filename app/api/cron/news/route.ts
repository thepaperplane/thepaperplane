import { runDailyAutomations } from '@/lib/automations';
import { apiError, apiOk, authorizeCron } from '@/lib/api';
import { fetchFeed, toRow } from '@/lib/news';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Daily news refresh. Scheduled by Vercel Cron (see vercel.json).
 *
 * Each source is fetched independently: one failing publisher never stops
 * the others, and its error is recorded against the source so the admin
 * console can show which feeds are unhealthy.
 */
export async function GET(request: Request) {
  const auth = authorizeCron(request);
  if (!auth.ok) return auth.response;

  const supabase = serviceClient();
  if (!supabase) return apiError('Supabase service key is not configured.', 503);

  // Daily housekeeping, riding on this job: assistant conversations are kept
  // for twelve months (privacy notice, "When you use the site assistant").
  await purgeOldConversations(supabase).catch((e) =>
    console.error('[cron/news] assistant purge failed', e),
  );
  // The morning round of automations: Zoho sync, reminders, follow-ups and
  // the owner's digest (lib/automations.ts). Never blocks the news fetch.
  await runDailyAutomations().catch((e) => console.error('[cron/news] automations failed', e));

  const { data: sources, error: sourcesError } = await supabase
    .from('news_sources')
    .select('id, name, category, feed_url, fetch_count, error_count')
    .eq('is_active', true);

  if (sourcesError) {
    console.error('[cron/news] could not load sources', sourcesError);
    return apiError('Could not load news sources.', 500);
  }
  if (!sources?.length) return apiOk({ message: 'No active sources.', inserted: 0 });

  const now = new Date().toISOString();

  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const items = await fetchFeed(source.feed_url, { limit: 25 });

        if (items.length === 0) {
          throw new Error('Feed returned no usable items');
        }

        const rows = items.map((item) => toRow(item, source));

        // `ignoreDuplicates` makes this idempotent: re-running the job never
        // creates a second copy of a story we already have.
        const { error: upsertError, count } = await supabase
          .from('news_items')
          .upsert(rows, { onConflict: 'fingerprint', ignoreDuplicates: true, count: 'exact' });

        if (upsertError) throw new Error(upsertError.message);

        await supabase
          .from('news_sources')
          .update({
            last_fetched_at: now,
            fetch_count: source.fetch_count + 1,
            last_error: null,
          })
          .eq('id', source.id);

        return {
          source: source.name,
          ok: true as const,
          parsed: items.length,
          inserted: count ?? 0,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[cron/news] ${source.name} failed:`, message);

        await supabase
          .from('news_sources')
          .update({
            last_fetched_at: now,
            error_count: source.error_count + 1,
            last_error: message.slice(0, 500),
          })
          .eq('id', source.id);

        return { source: source.name, ok: false as const, error: message };
      }
    }),
  );

  // Retention: keep 90 days. Prevents unbounded growth on a free-tier database.
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('news_items').delete().lt('published_at', cutoff);

  const inserted = results.reduce((sum, r) => sum + (r.ok ? r.inserted : 0), 0);
  const failed = results.filter((r) => !r.ok);

  return apiOk({
    message: `Refreshed ${results.length - failed.length}/${results.length} sources.`,
    inserted,
    results,
  });
}

async function purgeOldConversations(supabase: NonNullable<ReturnType<typeof serviceClient>>) {
  const cutoff = new Date(Date.now() - 365 * 86400_000).toISOString();
  const { data: old } = await supabase
    .from('assistant_conversations')
    .select('id')
    .lt('last_at', cutoff)
    .limit(500);
  const ids = (old ?? []).map((r) => r.id);
  if (!ids.length) return;
  await supabase.from('assistant_messages').delete().in('conversation_id', ids);
  await supabase.from('assistant_conversations').delete().in('id', ids);
}
