// Single source of truth for prerendering, the sitemap, and page metadata.
//
// Consumed by:
//   - scripts/prerender.js  (which routes to render, and the sitemap)
//   - src/pages/*.tsx       (title/description passed to <Seo>)
//
// Descriptions must be 120-158 characters; titles at most 60.
// Both rules are enforced by src/__tests__/routes.test.ts.

interface MarketingRoute {
  path: string;
  title: string;
  description: string;
  priority: number;
  changefreq: string;
}

export const marketingRoutes: MarketingRoute[] = [
  {
    path: '/',
    title: 'Shortlynk — Free URL Shortener with Click Analytics',
    description:
      'Shorten any link in seconds and track every click by country, device and referrer. Free to use, with no account needed to try it out.',
    priority: 1.0,
    changefreq: 'weekly',
  },
];

// Never prerendered, never in the sitemap, always noindex.
export const appRoutes: string[] = [
  '/dashboard',
  '/login',
  '/register',
  '/urls',
  '/oauth/callback',
];

export function getAllPrerenderRoutes(): MarketingRoute[] {
  return [...marketingRoutes];
}
