'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { EDITOR_COOKIE } from '@/lib/console';

/**
 * Sends one anonymous beacon per page view to /api/track — see that route for
 * exactly what is recorded, which is nothing that identifies anyone.
 *
 * Also remembers, for the length of the tab only, which campaign brought the
 * visitor and where they landed, so an enquiry sent from the contact form can
 * be attributed to the campaign that earned it. sessionStorage, not a cookie:
 * it never leaves the browser except inside an enquiry the visitor chooses to
 * send, and it is gone when the tab closes.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === '1' || nav.globalPrivacyControl) return;
    if (document.cookie.split('; ').some((c) => c === `${EDITOR_COOKIE}=1`)) return;

    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
    };

    let ref = '';
    try {
      if (!sessionStorage.getItem('pp.landing')) {
        sessionStorage.setItem('pp.landing', pathname);
        ref = document.referrer ? new URL(document.referrer).host : '';
      }
      if (utm.source && !sessionStorage.getItem('pp.utm')) {
        sessionStorage.setItem('pp.utm', JSON.stringify({ ...utm, landing: pathname }));
      }
    } catch {
      /* storage blocked — count the view, skip attribution */
    }

    const body = JSON.stringify({ path: pathname, ref, ...utm });
    try {
      const sent = navigator.sendBeacon?.(
        '/api/track',
        new Blob([body], { type: 'application/json' }),
      );
      if (!sent) {
        void fetch('/api/track', {
          method: 'POST',
          body,
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => {});
      }
    } catch {
      /* never let counting break a page */
    }
  }, [pathname]);

  return null;
}
