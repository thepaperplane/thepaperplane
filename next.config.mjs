/**
 * Security headers.
 *
 * The Content Security Policy is the one that matters most: even if someone
 * found a way to inject markup, the browser would refuse to load a script,
 * a stylesheet, a frame or a form target from anywhere but this site and the
 * project's own Supabase storage.
 *
 * `script-src` keeps 'unsafe-inline' because Next.js streams its own inline
 * bootstrap scripts, and the alternative — a per-request nonce — would make
 * every page dynamic and throw away static rendering. What the policy still
 * guarantees is that no script can come from a third-party origin, nothing can
 * frame the site, forms cannot post off-site and plugins cannot load.
 * Development keeps 'unsafe-eval' for React's dev tooling only.
 */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').host;
  } catch {
    return '';
  }
})();

const isProd = process.env.NODE_ENV === 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.supabase.co${supabaseHost ? ` https://${supabaseHost}` : ''}`,
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${isProd ? '' : ' ws:'}`,
  "media-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next dev` and `next start` share .next by default, so a dev server left
  // running on another port rewrites the production build underneath it and
  // every built asset starts 404ing. Pointing the audit build at its own
  // directory keeps the two from colliding. Unset in normal use.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Cached portfolio screenshots served from Supabase Storage.
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  experimental: {
    serverActions: {
      // Uploads (CVs, client documents, captures) go through server actions.
      bodySizeLimit: '26mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()',
          },
        ],
      },
      {
        // The console is never framed, cached by a shared cache, or indexed.
        source: '/admin/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        source: '/api/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },
};

export default nextConfig;
