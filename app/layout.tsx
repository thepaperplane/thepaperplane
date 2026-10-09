import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google';
import { SITE, organizationJsonLd } from '@/lib/site';
import { expertiseJsonLd, jsonLdScript, websiteJsonLd } from '@/lib/schema';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { THEME_SCRIPT } from '@/components/site/theme';
import { LOADER_SCRIPT, Loader } from '@/components/site/loader';
import { Reveal } from '@/components/site/reveal';
import { AmbientField } from '@/components/glass';
import { Interactions } from '@/components/fx/interactions';
import { ScrollProgress } from '@/components/fx';
import { EditBridge } from '@/components/editable/edit-bridge';
import { Analytics } from '@/components/site/analytics';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { Announcement } from '@/components/site/announcement';
import { getSettings, whatsappHref } from '@/lib/settings';
import { PublicOnly } from '@/components/site/public-only';
import { Assistant } from '@/components/assistant/assistant';
import './globals.css';

/* --------------------------------------------------------------------------
   Type pairing — IBM Plex, one superfamily across all three roles.

   Plex was drawn for the meeting point of engineering and humanism, which is
   this practice's dual offering almost literally. Using Serif, Sans and Mono
   from the same family means the advisory and technology halves share a
   skeleton rather than being pushed together, and the Mono is a genuine
   sibling of the display face rather than a borrowed monospace.

   Serif Medium carries display: sturdier stems than a high-contrast editorial
   serif, so it reads as a working document rather than a magazine masthead.

   All self-hosted by next/font — no external request, no layout shift.
   -------------------------------------------------------------------------- */

const plexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-plex-serif',
  adjustFontFallback: true,
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-plex-sans',
  adjustFontFallback: true,
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-plex-mono',
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Websites, Software & Tax Compliance`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  keywords: [
    'website development India',
    'web design agency',
    'GST compliance India',
    'GST compliance',
    'income tax scrutiny defence',
    'company incorporation',
    'book-keeping services',
    'internal audit',
    'compliance calendar',
    'web application development',
    'UI UX design',
    'workflow automation',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [
      { url: '/og/default.png', width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ['/og/default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  category: 'business',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Matches each theme's ground colour so the browser chrome agrees with the page.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0b0d' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const { contact, announcement } = settings;

  return (
    <html
      lang="en-IN"
      className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the stored theme before first paint. Without this, anyone
            who chose dark gets a white flash on every navigation. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Decides whether the opening plays, before anything is painted. */}
        <script dangerouslySetInnerHTML={{ __html: LOADER_SCRIPT }} />
      </head>
      <body className="bg-ground text-ink min-h-dvh antialiased">
        {/* Behind everything: the light the glass refracts. */}
        <AmbientField />
        <Loader />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(organizationJsonLd(), websiteJsonLd(), expertiseJsonLd()),
          }}
        />

        <a
          href="#main"
          className="sr-only-focusable bg-accent text-accent-ink fixed top-4 left-4 z-[100] rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium"
        >
          Skip to content
        </a>

        <PublicOnly>
          <ScrollProgress />
          <SiteHeader
            contact={{
              phone: contact.phone,
              phoneIntl: contact.phoneIntl,
              whatsappHref: whatsappHref(contact.whatsapp),
            }}
          />
        </PublicOnly>
        <main id="main">{children}</main>
        <PublicOnly>
          <SiteFooter />
        </PublicOnly>

        {announcement.enabled && announcement.text ? (
          <PublicOnly>
            <Announcement
              text={announcement.text}
              href={announcement.href}
              cta={announcement.cta}
            />
          </PublicOnly>
        ) : null}

        {/* Single observer that drives every .reveal on the page. */}
        <Reveal />
        {/* The site assistant, when switched on in the console and keyed. */}
        {settings.assistant.enabled && process.env.ANTHROPIC_API_KEY ? (
          <PublicOnly>
            <Assistant
              greeting={settings.assistant.greeting}
              whatsapp={contact.whatsapp}
              botNumber={settings.whatsappBot.enabled ? settings.whatsappBot.number : ''}
            />
          </PublicOnly>
        ) : null}
        {/* Magnetic controls, tilt and pointer parallax. */}
        <PublicOnly>
          <Interactions />
        </PublicOnly>
        <Analytics />
        <VercelAnalytics />
        <EditBridge />
      </body>
    </html>
  );
}
