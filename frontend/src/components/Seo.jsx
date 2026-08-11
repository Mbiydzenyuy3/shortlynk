// Per-page metadata.
//
// React 19 hoists <title>, <meta> and <link> into <head> natively — on the
// client it moves them into document.head, and in renderToString it emits
// them at the front of the output, where scripts/prerender.js lifts them
// into the <head> of the generated file. No helmet library is involved.
//
// <script type="application/ld+json"> is NOT hoisted and renders inline.
// That is fine: search engines read JSON-LD anywhere in the document.

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://shortlynk.store'
).replace(/\/$/, '');

const DEFAULT_OG_IMAGE = '/og-default.png';

export default function Seo({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd,
}) {
  const absoluteImage = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;
  const absoluteCanonical = canonical ? `${SITE_URL}${canonical}` : null;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />

      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {!noindex && absoluteCanonical && <link rel="canonical" href={absoluteCanonical} />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Shortlynk" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      {absoluteCanonical && <meta property="og:url" content={absoluteCanonical} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </>
  );
}
