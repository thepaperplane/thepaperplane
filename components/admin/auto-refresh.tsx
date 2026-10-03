'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Re-renders the current server page every few seconds while it is visible. */
export function AutoRefresh({ every = 10000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const id = window.setInterval(tick, every);
    return () => window.clearInterval(id);
  }, [router, every]);
  return null;
}
