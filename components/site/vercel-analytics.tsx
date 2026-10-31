'use client';

import { Analytics } from '@vercel/analytics/react';

/**
 * Vercel's page-view counter, with one rule added: a quotation link is a
 * private credential, so the address of a quotation page is never reported —
 * not even to the dashboard only the owner sees.
 */
export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          if (new URL(event.url).pathname.startsWith('/q/')) return null;
        } catch {
          /* an unreadable URL is not a quotation link */
        }
        return event;
      }}
    />
  );
}
