export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://shortlynk.store'
).replace(/\/$/, '');

const DEFAULT_OG_IMAGE = '/og-default.png';

interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export default function Seo({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd,
}: SeoProps) {
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
