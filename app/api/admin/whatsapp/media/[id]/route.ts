import { requireConsoleApi } from '@/lib/auth';
import { fetchMedia } from '@/lib/integrations/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Opens a photo or document a customer sent to the assistant number. Fetched
 * from Meta on demand (Meta keeps media for 30 days) — never made public.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireConsoleApi();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!/^\d{5,40}$/.test(id)) return new Response('Not found', { status: 404 });
  const media = await fetchMedia(id);
  if (!media)
    return new Response('This file is no longer available from WhatsApp.', { status: 404 });
  return new Response(media.bytes, {
    headers: {
      'Content-Type': media.mime,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
