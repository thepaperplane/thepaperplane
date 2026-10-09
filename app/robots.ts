import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // Always the canonical host (the bare domain redirects to www), so Search Console
  // sees one consistent set of URLs.
  const base = SITE.url;

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
