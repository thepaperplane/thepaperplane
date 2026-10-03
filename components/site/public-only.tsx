'use client';

import { usePathname } from 'next/navigation';

/**
 * Renders its children on the public site only. The root layout wraps every
 * route, the console included, and the console has its own chrome — without
 * this the public header floated over the admin sidebar and the custom cursor
 * followed the owner through every form.
 */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;
  return <>{children}</>;
}
