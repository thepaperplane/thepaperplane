import type { MetadataRoute } from 'next';
import { ARTICLES } from '@/content/knowledge';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url;
  const now = new Date();

  const staticRoutes: {
    path: string;
    priority: number;
    frequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  }[] = [
    { path: '', priority: 1, frequency: 'weekly' },
    { path: '/services', priority: 0.9, frequency: 'monthly' },
    { path: '/knowledge', priority: 0.9, frequency: 'weekly' },
    { path: '/calendar', priority: 0.9, frequency: 'weekly' },
    { path: '/work', priority: 0.8, frequency: 'monthly' },
    { path: '/news', priority: 0.7, frequency: 'daily' },
    { path: '/about', priority: 0.7, frequency: 'monthly' },
    { path: '/careers', priority: 0.6, frequency: 'weekly' },
    { path: '/contact', priority: 0.8, frequency: 'monthly' },
    { path: '/privacy', priority: 0.3, frequency: 'yearly' },
    { path: '/terms', priority: 0.3, frequency: 'yearly' },
    { path: '/cookies', priority: 0.3, frequency: 'yearly' },
    { path: '/accessibility', priority: 0.3, frequency: 'yearly' },
    { path: '/security', priority: 0.3, frequency: 'yearly' },
    { path: '/copyright', priority: 0.3, frequency: 'yearly' },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route.path}`,
      lastModified: now,
      changeFrequency: route.frequency,
      priority: route.priority,
    })),
    ...ARTICLES.map((article) => ({
      url: `${base}/knowledge/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}
