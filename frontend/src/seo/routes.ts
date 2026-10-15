// Single source of truth for prerendering, the sitemap, and page metadata.
//
// Consumed by:
//   - scripts/prerender.js  (which routes to render, and the sitemap)
//   - src/pages/*.jsx       (title/description passed to <Seo>)
//
// Descriptions must be 120-158 characters; titles at most 60.
// Both rules are enforced by src/__tests__/routes.test.js.

export const marketingRoutes = [
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
export const appRoutes = [
  '/dashboard',
  '/login',
  '/register',
  '/urls',
  '/oauth/callback',
];

export function getAllPrerenderRoutes() {
  return [...marketingRoutes];
}
