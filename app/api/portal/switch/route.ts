import { NextResponse } from 'next/server';
import { getPortalSession, switchClient } from '@/lib/portal/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Moves between the businesses one person can see (e.g. a director of two companies). */
export async function POST(request: Request) {
  const session = await getPortalSession();
  const form = await request.formData();
  const clientId = String(form.get('client') ?? '');
  if (session && session.clients.some((c) => c.id === clientId)) {
    await switchClient(session.id, clientId);
  }
  return NextResponse.redirect(new URL('/portal', request.url), 303);
}
