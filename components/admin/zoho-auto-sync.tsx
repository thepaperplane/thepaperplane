'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { autoSyncZoho } from '@/app/admin/_actions/integrations';

/**
 * Keeps the console in step with Zoho: when a console page is opened (and
 * every few minutes while it stays open) a quiet sync runs if the last one is
 * stale, and the page refreshes itself if anything came in.
 */
export function ZohoAutoSync() {
  const router = useRouter();
  useEffect(() => {
    let live = true;
    const run = () => {
      if (document.visibilityState !== 'visible') return;
      autoSyncZoho().then(
        (changed) => {
          if (live && changed) router.refresh();
        },
        () => undefined,
      );
    };
    run();
    const t = setInterval(run, 5 * 60_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [router]);
  return null;
}
