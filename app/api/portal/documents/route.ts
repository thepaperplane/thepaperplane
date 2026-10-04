import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/portal/auth';
import { serviceClient } from '@/lib/supabase';
import { VAULT_TYPES, checkUpload } from '@/lib/uploads';
import { sendNotice } from '@/lib/email';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A client sends the practice a document from the portal. It lands in the
 * private vault against their client record and the practice is told.
 */
export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) return NextResponse.redirect(new URL('/portal', request.url), 303);
  const form = await request.formData();
  const file = form.get('file');
  const title = String(form.get('title') ?? '')
    .trim()
    .slice(0, 160);
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.redirect(new URL('/portal/documents?upload=empty', request.url), 303);
  }
  const checked = await checkUpload(file, VAULT_TYPES, 20 * 1048576);
  if (!checked.ok) {
    return NextResponse.redirect(new URL('/portal/documents?upload=type', request.url), 303);
  }
  const supabase = serviceClient();
  if (!supabase) return new Response('Unavailable', { status: 503 });
  const path = `${session.active.id}/from-client/${crypto.randomUUID()}.${checked.file.ext}`;
  const { error } = await supabase.storage
    .from('vault')
    .upload(path, checked.file.bytes, { contentType: checked.file.type });
  if (error)
    return NextResponse.redirect(new URL('/portal/documents?upload=failed', request.url), 303);
  await supabase.from('client_documents').insert({
    client_id: session.active.id,
    title: title || file.name.slice(0, 160),
    category: 'From client',
    file_path: path,
    mime_type: checked.file.type,
    size_bytes: file.size,
    uploaded_by: 'client',
    visible_to_client: true,
  });
  await sendNotice({
    to: process.env.ENQUIRY_NOTIFY_TO ?? SITE.email,
    subject: `New document from ${session.active.name}`,
    eyebrow: 'Client portal',
    heading: `${session.active.name} sent a document`,
    paragraphs: [`“${title || file.name}” is in their document vault in the console.`],
    cta: { label: 'Open the client', href: `${SITE.url}/admin/clients/${session.active.id}` },
  }).catch(() => undefined);
  return NextResponse.redirect(new URL('/portal/documents?upload=ok', request.url), 303);
}
