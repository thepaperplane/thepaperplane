import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/portal/auth';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A one-minute signed link to a document shared with the signed-in client. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPortalSession();
  if (!session) return NextResponse.redirect(new URL('/portal', request.url));
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Not found', { status: 404 });
  const supabase = serviceClient();
  if (!supabase) return new Response('Unavailable', { status: 503 });
  const { data: doc } = await supabase
    .from('client_documents')
    .select('file_path, client_id, visible_to_client')
    .eq('id', id)
    .maybeSingle();
  if (!doc || doc.client_id !== session.active.id || !doc.visible_to_client) {
    return new Response('Not found', { status: 404 });
  }
  const { data } = await supabase.storage.from('vault').createSignedUrl(doc.file_path, 60);
  if (!data?.signedUrl) return new Response('Unavailable', { status: 502 });
  return NextResponse.redirect(data.signedUrl);
}
