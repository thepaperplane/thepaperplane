import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The console and every API surface stay out of the index.
        // The lab is an internal review surface, not a destination.
        disallow: ['/admin', '/admin/', '/api/', '/lab', '/portal', '/q/', '/get-quote'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
