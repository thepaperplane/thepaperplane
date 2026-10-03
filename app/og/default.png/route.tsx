import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';
import { LOGO_MARK_DATA_URI } from '@/lib/brand-mark';

export const runtime = 'edge';

// Route handlers may only export the reserved config keys and HTTP verbs, so
// the card dimensions stay local rather than being exported.
const SIZE = { width: 1200, height: 630 };

/**
 * Social sharing card, generated at the edge and cached.
 *
 * Kept to system fonts and flat vector shapes so it renders without fetching
 * a font binary on every cold start — the card must never be the slow part
 * of a link unfurl.
 */
export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f7 55%, #eef7fc 100%)',
        padding: '72px 80px',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Brand wash */}
      <div
        style={{
          position: 'absolute',
          top: -220,
          right: -160,
          width: 680,
          height: 680,
          borderRadius: 680,
          background: 'radial-gradient(circle, rgba(53,165,213,0.22) 0%, rgba(53,165,213,0) 70%)',
          display: 'flex',
        }}
      />

      {/* Mark + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders
              plain <img>; next/image does not exist in this context. */}
        <img src={LOGO_MARK_DATA_URI} width={92} height={64} alt="" />
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: '#1c3252' }}>
          {SITE.name}
        </div>
      </div>

      {/* Headline */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 700,
            color: '#1c3252',
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
          }}
        >
          Your Vision,
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 700,
            color: '#35a5d5',
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
          }}
        >
          Our Wings
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          paddingTop: 28,
        }}
      >
        <div style={{ display: 'flex', fontSize: 24, color: '#6e6e73' }}>
          Websites · Software · Tax · GST · Incorporation · Books
        </div>
        <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: '#1c3252' }}>
          thepaperplane.co.in
        </div>
      </div>
    </div>,
    {
      ...SIZE,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}
