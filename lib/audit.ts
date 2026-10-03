import 'server-only';
import { serviceClient } from './supabase';

/**
 * Append-only record of what was changed from the console, and by whom.
 * Best-effort by design: a failed log write never blocks the change itself,
 * but it is reported to the server log so a gap is visible.
 */
export async function audit(
  actor: string | null,
  action: string,
  entity?: string,
  entityId?: string | null,
  detail?: Record<string, unknown>,
): Promise<void> {
  const supabase = serviceClient();
  if (!supabase) return;
  const { error } = await supabase.from('audit_log').insert({
    actor,
    action,
    entity: entity ?? null,
    entity_id: entityId ?? null,
    detail: (detail ?? {}) as never,
  });
  if (error) console.error('[audit] write failed', action, error.message);
}
