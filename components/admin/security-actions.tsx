'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { browserClient } from '@/lib/supabase-browser';
import { EDITOR_COOKIE } from '@/lib/console';

/** Ends every session for this account, on every device. */
export function SignOutEverywhere() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm('Sign out of the console on every device, including this one?')) return;
        setBusy(true);
        try {
          await browserClient().auth.signOut({ scope: 'global' });
        } finally {
          document.cookie = `${EDITOR_COOKIE}=; Max-Age=0; path=/`;
          router.push('/admin/login');
          router.refresh();
        }
      }}
      className="text-critical hover:bg-critical/10 ring-critical/30 inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.875rem] font-semibold ring-1 ring-inset disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Sign out everywhere
    </button>
  );
}
