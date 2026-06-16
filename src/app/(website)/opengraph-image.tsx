import { ImageResponse } from 'next/og';

/**
 * Default Open Graph / social share image for the website surface (homepage and
 * the five audience doorways inherit it). Deep-linkable, shareable documentation
 * is a trust feature for the auditor/researcher audience (foundation §13.4), so
 * shared links should render a branded card rather than a bare URL. Rendered in
 * the light "website" palette; no external font fetch keeps generation robust.
 */
export const alt = 'UmojaHub — verification infrastructure for Kenyan farmers and CS students';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#fafaf8',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color: '#6b6f76',
          }}
        >
          Documentation
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 128, fontWeight: 700, color: '#1c1e21' }}>
            Umoja<span style={{ color: '#007f4e' }}>Hub</span>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 38,
              lineHeight: 1.3,
              color: '#565a61',
              maxWidth: 900,
            }}
          >
            Verification infrastructure for Kenyan farmers and computer-science students.
          </div>
        </div>
        <div style={{ display: 'flex', height: 10, width: 200, backgroundColor: '#007f4e' }} />
      </div>
    ),
    { ...size }
  );
}
