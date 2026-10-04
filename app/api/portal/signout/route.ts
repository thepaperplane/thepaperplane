import { NextResponse } from 'next/server';
import { signOut } from '@/lib/portal/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  await signOut();
  return NextResponse.redirect(new URL('/portal?signed-out=1', request.url), 303);
}
