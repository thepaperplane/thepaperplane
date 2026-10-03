'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EDITOR_COOKIE } from '@/lib/console';

/**
 * Loads the visual editor for the signed-in owner, and for nobody else.
 *
 * The check here is only whether to download the editor's code at all: the
 * console sets a hint cookie after a fully verified sign-in. Every save the
 * editor makes is authorised again on the server, so a visitor who forges the
 * cookie gets a toolbar that cannot change anything. Visitors who have never
 * signed in download none of it.
 */
const VisualEditor = dynamic(() => import('./visual-editor').then((m) => m.VisualEditor), {
  ssr: false,
});

export function EditBridge() {
  const pathname = usePathname();
  const [owner, setOwner] = useState(false);

  useEffect(() => {
    setOwner(document.cookie.split('; ').some((c) => c === `${EDITOR_COOKIE}=1`));
  }, [pathname]);

  if (!owner || pathname.startsWith('/admin')) return null;
  return <VisualEditor />;
}
