# SEO Foundation + Landing/Footer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every shortlynk page crawlable and shareable with correct per-route metadata, and rebuild the landing page and footer so a first-time visitor understands the product immediately.

**Architecture:** Stay on Vite + React. Add `react-helmet-async` for per-route head tags, a single route manifest that drives both the sitemap and the prerender step, and a post-build script that renders marketing routes to static HTML. App routes stay client-rendered and `noindex`. The landing page and footer are restyled using existing design tokens — no new design system.

**Tech Stack:** Vite 6, React 19, react-router-dom 7, react-helmet-async, Vitest + Testing Library, Express 5 (backend), Vercel (hosting)

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-11-seo-foundation-design.md`
- Site origin is `https://shortlynk.store`, read from `import.meta.env.VITE_SITE_URL`, defaulting to that literal. Unrelated to backend `BASE_URL`.
- App routes — `/dashboard`, `/login`, `/register`, `/urls`, `/oauth/callback` — are always `noindex` and never in the sitemap.
- All styling uses existing CSS custom properties from `frontend/src/styles/tokens.css`. Do not introduce new colors.
- Titles ≤ 60 characters. Meta descriptions 120–158 characters.
- No fabricated metrics, claims, or testimonials in any user-facing copy.
- Run frontend tests with `cd frontend && npm test`. Run backend tests with `npm test` from the repo root.
- This plan covers spec sections §1–§4 and §8, plus the footer and landing redesign. Spec §5 (tool pages) and §6 (use-case pages) are deferred to a follow-up plan.

---

### Task 1: Seo component

**Files:**
- Create: `frontend/src/components/Seo.jsx`
- Create: `frontend/src/__tests__/Seo.test.jsx`
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/package.json` (add dependency)

**Interfaces:**
- Consumes: nothing
- Produces: `<Seo title description canonical ogImage noindex jsonLd />` — default export from `../components/Seo`. `title` and `description` are required strings; `canonical` is a root-relative path string; `ogImage` is a root-relative path string; `noindex` is a boolean; `jsonLd` is an object or array of objects. Also exports named `SITE_URL` constant.

- [ ] **Step 1: Install the dependency**

```bash
cd frontend && npm install react-helmet-async
```

- [ ] **Step 2: Write the failing test**

Create `frontend/src/__tests__/Seo.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import Seo, { SITE_URL } from '../components/Seo';

// Render on the "server" so tags land in context instead of document.head.
function renderSeo(props) {
  HelmetProvider.canUseDOM = false;
  const context = {};
  render(
    <HelmetProvider context={context}>
      <Seo {...props} />
    </HelmetProvider>
  );
  return context.helmet;
}

describe('Seo', () => {
  beforeEach(() => {
    HelmetProvider.canUseDOM = false;
  });

  it('renders title and description', () => {
    const helmet = renderSeo({ title: 'Test Title', description: 'Test description.' });
    expect(helmet.title.toString()).toContain('Test Title');
    expect(helmet.meta.toString()).toContain('Test description.');
  });

  it('renders an absolute canonical from a relative path', () => {
    const helmet = renderSeo({
      title: 'T', description: 'D', canonical: '/tools/qr-code',
    });
    expect(helmet.link.toString()).toContain(`${SITE_URL}/tools/qr-code`);
  });

  it('renders Open Graph and Twitter tags', () => {
    const helmet = renderSeo({ title: 'OG Title', description: 'OG description.' });
    const meta = helmet.meta.toString();
    expect(meta).toContain('og:title');
    expect(meta).toContain('og:description');
    expect(meta).toContain('og:image');
    expect(meta).toContain('twitter:card');
    expect(meta).toContain('summary_large_image');
  });

  it('emits robots noindex and omits canonical when noindex is set', () => {
    const helmet = renderSeo({ title: 'T', description: 'D', canonical: '/dashboard', noindex: true });
    expect(helmet.meta.toString()).toContain('noindex');
    expect(helmet.link.toString()).not.toContain('canonical');
  });

  it('serializes jsonLd into a ld+json script tag', () => {
    const helmet = renderSeo({
      title: 'T', description: 'D',
      jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: 'Shortlynk' },
    });
    expect(helmet.script.toString()).toContain('application/ld+json');
    expect(helmet.script.toString()).toContain('Shortlynk');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/Seo.test.jsx`
Expected: FAIL — cannot resolve `../components/Seo`

- [ ] **Step 4: Write the implementation**

Create `frontend/src/components/Seo.jsx`:

```jsx
import { Helmet } from 'react-helmet-async';

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
    <Helmet>
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
    </Helmet>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/__tests__/Seo.test.jsx`
Expected: PASS — 5 tests

- [ ] **Step 6: Wire HelmetProvider into the app root**

Modify `frontend/src/main.jsx`:

```jsx
//main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
```

- [ ] **Step 7: Run the full suite to check for regressions**

Run: `cd frontend && npm test`
Expected: PASS — all pre-existing tests still green

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/Seo.jsx frontend/src/__tests__/Seo.test.jsx frontend/src/main.jsx frontend/package.json frontend/package-lock.json
git commit -m "feat(seo): add Seo component with OG, Twitter, canonical and JSON-LD"
```

---

### Task 2: Route manifest

**Files:**
- Create: `frontend/src/seo/routes.js`
- Create: `frontend/src/__tests__/routes.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `marketingRoutes` (array of `{ path, title, description, priority, changefreq }`), `appRoutes` (array of path strings), `getAllPrerenderRoutes()` (returns the marketing route array). Imported by the prerender script and the footer.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/__tests__/routes.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { marketingRoutes, appRoutes, getAllPrerenderRoutes } from '../seo/routes';

describe('route manifest', () => {
  it('gives every marketing route a title within 60 characters', () => {
    for (const route of marketingRoutes) {
      expect(route.title, `${route.path} title`).toBeTruthy();
      expect(route.title.length, `${route.path} title length`).toBeLessThanOrEqual(60);
    }
  });

  it('gives every marketing route a description of 120-158 characters', () => {
    for (const route of marketingRoutes) {
      expect(route.description.length, `${route.path} description length`).toBeGreaterThanOrEqual(120);
      expect(route.description.length, `${route.path} description length`).toBeLessThanOrEqual(158);
    }
  });

  it('never lists a path as both marketing and app', () => {
    const overlap = marketingRoutes.filter(r => appRoutes.includes(r.path));
    expect(overlap).toEqual([]);
  });

  it('starts every path with a slash and has no duplicates', () => {
    const paths = getAllPrerenderRoutes().map(r => r.path);
    for (const p of paths) expect(p.startsWith('/')).toBe(true);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('excludes app routes from prerendering', () => {
    const paths = getAllPrerenderRoutes().map(r => r.path);
    for (const app of appRoutes) expect(paths).not.toContain(app);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/routes.test.js`
Expected: FAIL — cannot resolve `../seo/routes`

- [ ] **Step 3: Write the implementation**

Create `frontend/src/seo/routes.js`:

```js
// Single source of truth for prerendering, the sitemap, and footer links.
// Descriptions must be 120-158 characters (enforced by routes.test.js).

export const marketingRoutes = [
  {
    path: '/',
    title: 'Shortlynk — Free URL Shortener with Click Analytics',
    description:
      'Shorten any link in seconds and track every click by country, device and referrer. Free to use, no account needed to try it out today.',
    priority: 1.0,
    changefreq: 'weekly',
  },
];

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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/__tests__/routes.test.js`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/seo/routes.js frontend/src/__tests__/routes.test.js
git commit -m "feat(seo): add route manifest as single source of truth"
```

---

### Task 3: Apply Seo to every page

**Files:**
- Modify: `frontend/src/pages/landing.jsx`
- Modify: `frontend/src/pages/dashboard.jsx`
- Modify: `frontend/src/pages/login.jsx`
- Modify: `frontend/src/pages/register.jsx`
- Modify: `frontend/src/pages/urls.jsx`
- Modify: `frontend/src/pages/oauthCallback.jsx`

**Interfaces:**
- Consumes: `Seo` from Task 1, `marketingRoutes` from Task 2
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Add Seo to the landing page**

In `frontend/src/pages/landing.jsx`, add imports at the top:

```jsx
import Seo from '../components/Seo';
import { marketingRoutes } from '../seo/routes';
```

Add this constant above the component:

```jsx
const HOME = marketingRoutes.find(r => r.path === '/');

const LANDING_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Shortlynk',
    applicationCategory: 'WebApplication',
    operatingSystem: 'Any',
    url: 'https://shortlynk.store',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Shortlynk',
    url: 'https://shortlynk.store',
  },
];
```

Then render `<Seo>` as the first child inside the outermost `<div>`:

```jsx
<Seo
  title={HOME.title}
  description={HOME.description}
  canonical="/"
  jsonLd={LANDING_JSONLD}
/>
```

- [ ] **Step 2: Add noindex Seo to each app page**

In each of `dashboard.jsx`, `login.jsx`, `register.jsx`, `urls.jsx`, and `oauthCallback.jsx`, add `import Seo from '../components/Seo';` and render as the first child of the page's outermost element, using the matching values below:

| File | title | description |
|---|---|---|
| `dashboard.jsx` | `Dashboard — Shortlynk` | `Manage your short links and view click analytics.` |
| `login.jsx` | `Log In — Shortlynk` | `Log in to your Shortlynk account.` |
| `register.jsx` | `Create Account — Shortlynk` | `Create a free Shortlynk account.` |
| `urls.jsx` | `Your Links — Shortlynk` | `Every short link you have created.` |
| `oauthCallback.jsx` | `Signing In — Shortlynk` | `Completing sign-in.` |

Each one takes the form:

```jsx
<Seo title="Dashboard — Shortlynk" description="Manage your short links and view click analytics." noindex />
```

The 120–158 character rule applies only to `marketingRoutes` and is not enforced for `noindex` pages.

- [ ] **Step 3: Run the full suite**

Run: `cd frontend && npm test`
Expected: PASS — existing page tests still green. If a test fails because a page now requires Helmet context, wrap that test's render in `<HelmetProvider>`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages
git commit -m "feat(seo): add per-page metadata and noindex on app routes"
```

---

### Task 4: index.html and favicon

**Files:**
- Modify: `frontend/index.html`
- Move: `frontend/src/assets/app-logo.png` → `frontend/public/favicon.png`

**Interfaces:**
- Consumes: nothing
- Produces: nothing

- [ ] **Step 1: Copy the logo into public/**

```bash
cd /home/leila/Desktop/shortlynk/frontend && cp src/assets/app-logo.png public/favicon.png
```

The original stays in `src/assets/` because other components may import it as a module.

- [ ] **Step 2: Update index.html**

Replace the `<head>` contents of `frontend/index.html`:

```html
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shortlynk — Free URL Shortener with Click Analytics</title>
    <meta name="description" content="Shorten any link in seconds and track every click by country, device and referrer. Free to use, no account needed to try it out today." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
```

- [ ] **Step 3: Verify the build produces a resolvable favicon**

Run: `cd frontend && npm run build && ls dist/favicon.png`
Expected: the file is listed

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/public/favicon.png
git commit -m "fix(seo): real title, description and working favicon in index.html"
```

---

### Task 5: robots and sitemap plumbing

**Files:**
- Create: `frontend/public/robots.txt`
- Modify: `app.js`
- Modify: `src/routes/redirect.js`
- Create: `src/tests/robots.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `GET /robots.txt` on the Express app; `X-Robots-Tag: noindex` on `GET /s/:shortCode`

- [ ] **Step 1: Create the frontend robots.txt**

Create `frontend/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /login
Disallow: /register
Disallow: /urls
Disallow: /oauth

Sitemap: https://shortlynk.store/sitemap.xml
```

- [ ] **Step 2: Write the failing backend test**

Create `src/tests/robots.test.js`:

```js
import request from 'supertest'
import app from '../../app.js'

describe('robots hygiene', () => {
  it('serves a blanket-disallow robots.txt', async () => {
    const res = await request(app).get('/robots.txt')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/plain/)
    expect(res.text).toContain('Disallow: /')
  })

  it('marks short-link redirects noindex', async () => {
    const res = await request(app).get('/s/definitely-not-a-real-code')
    expect(res.headers['x-robots-tag']).toBe('noindex')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- src/tests/robots.test.js`
Expected: FAIL — 404 on `/robots.txt`, and `x-robots-tag` undefined

- [ ] **Step 4: Add the robots route to app.js**

In `app.js`, immediately after `app.use(express.static(...))` and before `//API Routes`:

```js
// The API/redirect host must never be indexed.
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /\n')
})
```

- [ ] **Step 5: Add the noindex header to the redirect route**

In `src/routes/redirect.js`, replace the line `router.get('/:shortCode', getRedirectUrl)` with:

```js
router.get(
  '/:shortCode',
  (req, res, next) => {
    // Short links must not be indexed, even where robots.txt is not consulted.
    res.set('X-Robots-Tag', 'noindex')
    next()
  },
  getRedirectUrl
)
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm run test -- src/tests/robots.test.js`
Expected: PASS — 2 tests

- [ ] **Step 7: Commit**

```bash
git add frontend/public/robots.txt app.js src/routes/redirect.js src/tests/robots.test.js
git commit -m "feat(seo): robots.txt on both hosts and noindex on short-link redirects"
```

---

### Task 6: Prerender pipeline and code splitting

**Files:**
- Modify: `frontend/src/App.jsx`
- Create: `frontend/src/entry-server.jsx`
- Create: `frontend/scripts/prerender.js`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: `getAllPrerenderRoutes` from Task 2
- Produces: `AppRoutes` named export from `App.jsx`; `render(url)` default export from `entry-server.jsx` returning `{ html, helmet }`; `dist/<route>/index.html` files and `dist/sitemap.xml`

- [ ] **Step 1: Extract AppRoutes and lazy-load app routes**

Replace `frontend/src/App.jsx` entirely:

```jsx
// src/App.jsx
import "./App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing.jsx";

// App routes are lazy so marketing pages do not ship the dashboard bundle.
const Login = lazy(() => import("./pages/login.jsx"));
const Register = lazy(() => import("./pages/register.jsx"));
const Dashboard = lazy(() => import("./pages/dashboard.jsx"));
const OAuthCallback = lazy(() => import("./pages/oauthCallback.jsx"));
const UrlListPage = lazy(() => import("./pages/urls.jsx"));

export function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/urls" element={<UrlListPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Run the suite to confirm lazy loading broke nothing**

Run: `cd frontend && npm test`
Expected: PASS. If a test fails because a lazily-loaded page renders asynchronously, use `await screen.findBy...` instead of `getBy...` in that test.

- [ ] **Step 3: Create the server entry**

Create `frontend/src/entry-server.jsx`:

```jsx
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { AppRoutes } from './App.jsx';
import './index.css';

export default function render(url) {
  const helmetContext = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </HelmetProvider>
  );
  return { html, helmet: helmetContext.helmet };
}
```

- [ ] **Step 4: Create the prerender script**

Create `frontend/scripts/prerender.js`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

const SITE_URL = (process.env.VITE_SITE_URL || 'https://shortlynk.store').replace(/\/$/, '');

// pathToFileURL is required — import() of a bare absolute path is not portable.
const { default: render } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href);
const { getAllPrerenderRoutes } = await import(pathToFileURL(path.join(root, 'src/seo/routes.js')).href);

const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
const routes = getAllPrerenderRoutes();
const failures = [];

for (const route of routes) {
  const { html, helmet } = render(route.path);

  const head = [
    helmet.title.toString(),
    helmet.meta.toString(),
    helmet.link.toString(),
    helmet.script.toString(),
  ].join('\n    ');

  // Strip the template's static title/description so Helmet's win.
  let page = template
    .replace(/<title>.*?<\/title>\s*/s, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', `  ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);

  const outDir = route.path === '/' ? distDir : path.join(distDir, route.path);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), page);

  // Build assertion: every emitted page must carry real metadata.
  if (!/<title>[^<]+<\/title>/.test(page)) failures.push(`${route.path}: empty or missing <title>`);
  if (!/<meta name="description" content="[^"]+"/.test(page)) failures.push(`${route.path}: empty or missing description`);

  console.log(`prerendered ${route.path}`);
}

const today = new Date().toISOString().split('T')[0];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    r => `  <url>
    <loc>${SITE_URL}${r.path === '/' ? '/' : r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
console.log(`wrote sitemap.xml with ${routes.length} route(s)`);

if (failures.length) {
  console.error('\nPrerender assertions failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
```

- [ ] **Step 5: Wire the build**

In `frontend/package.json`, replace the `build` script:

```json
"build": "vite build && vite build --ssr src/entry-server.jsx --outDir dist-ssr && node scripts/prerender.js",
```

The SSR build emits only `entry-server.js`, so the prerender script reads the route manifest straight from source. In `frontend/scripts/prerender.js`, the manifest import written in Step 4 is:

```js
const { getAllPrerenderRoutes } = await import(path.join(root, 'src/seo/routes.js'));
```

This works because `src/seo/routes.js` is plain ES-module JavaScript with no JSX and no Vite-specific syntax, so Node imports it directly. `vite.config.js` needs no changes.

- [ ] **Step 6: Add dist-ssr to gitignore**

Append to `frontend/.gitignore` (create the file if absent):

```
dist-ssr
```

- [ ] **Step 7: Run the build and verify the output**

Run:
```bash
cd frontend && npm run build && grep -o '<title>[^<]*</title>' dist/index.html && grep -c 'Shorten. Share. Track.' dist/index.html
```
Expected: the real title prints, and the grep count is at least 1 — proving the hero rendered into static HTML rather than an empty root div.

- [ ] **Step 8: Verify the sitemap**

Run: `cd frontend && cat dist/sitemap.xml`
Expected: one `<url>` block with `https://shortlynk.store/`

- [ ] **Step 9: Commit**

```bash
git add frontend/src/App.jsx frontend/src/entry-server.jsx frontend/scripts/prerender.js frontend/package.json frontend/vite.config.js frontend/.gitignore
git commit -m "feat(seo): prerender marketing routes to static HTML and emit sitemap"
```

---

### Task 7: Footer redesign

**Files:**
- Modify: `frontend/src/components/Footer.jsx`
- Create: `frontend/src/components/__tests__/Footer.test.jsx`

**Interfaces:**
- Consumes: nothing
- Produces: nothing

The footer becomes a single centered column: logo, one-line descriptor, copyright. The `Features`, `Dashboard`, `Login`, and `Register` links are removed — three of the four point at `noindex` routes and pass no useful signal, and none of them belong in a landing-page footer.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/__tests__/Footer.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../Footer';

function renderFooter() {
  return render(<MemoryRouter><Footer /></MemoryRouter>);
}

describe('Footer', () => {
  it('shows the brand name and current year', () => {
    renderFooter();
    expect(screen.getByText(/Shortlynk/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it('does not render the removed nav links', () => {
    renderFooter();
    for (const label of ['Features', 'Dashboard', 'Login', 'Register']) {
      expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/components/__tests__/Footer.test.jsx`
Expected: FAIL — the four nav links are still present

- [ ] **Step 3: Rewrite the footer**

Replace `frontend/src/components/Footer.jsx` entirely:

```jsx
import { Link2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-dark)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '12px',
        marginTop: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link2 size={20} color="var(--color-yellow)" />
        <span style={{ color: 'var(--color-text-on-dark)', fontSize: '17px', fontWeight: 700 }}>
          Shortlynk
        </span>
      </div>

      <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '14px', maxWidth: '380px', lineHeight: 1.6 }}>
        Short links with click analytics, free to use.
      </p>

      <span style={{ color: 'var(--color-text-muted-dark)', fontSize: '13px', marginTop: '4px' }}>
        © {new Date().getFullYear()} Shortlynk
      </span>
    </footer>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/components/__tests__/Footer.test.jsx`
Expected: PASS — 2 tests

- [ ] **Step 5: Run the full suite**

Run: `cd frontend && npm test`
Expected: PASS. If `Landing.test.jsx` asserted on footer links, update it to match the new footer.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Footer.jsx frontend/src/components/__tests__/Footer.test.jsx
git commit -m "feat(ui): center footer and remove landing-inappropriate nav links"
```

---

### Task 8: Landing page spacing and clarity

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/pages/landing.jsx`

**Interfaces:**
- Consumes: `Seo` from Task 1
- Produces: nothing

Root cause of the cramped layout: `.responsive-section-pad` is defined **only** inside `@media (max-width: 768px)`, so desktop sections render with zero padding. Fixing it at the root fixes every section at once.

- [ ] **Step 1: Define the section padding utility for all viewports**

In `frontend/src/index.css`, insert immediately before the `@media (max-width: 768px)` block at line 108:

```css
/* Section rhythm. The mobile override below narrows these at <=768px. */
.responsive-section-pad {
  padding: 112px 32px;
}

.responsive-pad {
  padding-left: 32px;
  padding-right: 32px;
}

/* Section heading rhythm, shared by every landing section. */
.section-heading {
  text-align: center;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 16px;
}

.section-subheading {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 17px;
  line-height: 1.6;
  max-width: 560px;
  margin: 0 auto 64px;
}
```

- [ ] **Step 2: Verify the desktop padding is applied**

Run: `cd frontend && npm run dev` then open `http://localhost:5173` and confirm the white "Everything you need" section now has generous space above and below its heading. Stop the dev server afterward.

- [ ] **Step 3: Replace the stats row with honest trust signals**

In `frontend/src/pages/landing.jsx`, replace the `STATS` constant:

```jsx
const TRUST = [
  { label: 'No account needed to try' },
  { label: 'Free — no credit card' },
  { label: 'Spam-filtered links' },
];
```

Replace the stats row JSX (the `<div>` containing `STATS.map`) with:

```jsx
<div
  style={{
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '40px',
    paddingTop: '32px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    width: '100%',
    maxWidth: '640px',
  }}
>
  {TRUST.map(({ label }) => (
    <div
      key={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--color-text-muted-dark)',
        fontSize: '14px',
      }}
    >
      <Check size={16} color="var(--color-yellow)" />
      {label}
    </div>
  ))}
</div>
```

Add `Check` to the lucide import on line 1:

```jsx
import { Link2, BarChart2, ShieldCheck, Check } from 'lucide-react';
```

- [ ] **Step 4: Sharpen the hero copy**

Replace the `<h1>` text `Shorten. Share. Track.` with:

```jsx
Short links that tell you who clicked
```

Replace the paragraph below it with:

```jsx
Paste a long URL, get a short one instantly — then see every click by
country, device and referrer. Free, and no account needed to start.
```

Reduce the `<h1>` `marginBottom` from `'16px'` to `'20px'`, and the paragraph's `marginBottom` from `'40px'` to `'36px'`.

- [ ] **Step 5: Give each section a subheading so the page explains itself**

In the Features section, replace the `<h2>` element with:

```jsx
<h2 className="section-heading">Everything you need to share smarter</h2>
<p className="section-subheading">
  Every link comes with analytics built in. No setup, no tracking code, no extra tools.
</p>
```

In the How It Works section, replace its `<h2>` with:

```jsx
<h2 className="section-heading">Up and running in seconds</h2>
<p className="section-subheading">
  Three steps from a long URL to a short link you can measure.
</p>
```

Both `<h2>` elements previously carried `marginBottom: '56px'` inline; the `.section-heading` class replaces that with `16px`, and `.section-subheading` supplies the `64px` gap below.

- [ ] **Step 6: Fix the step separators on mobile**

The dashed `borderRight` on step cards produces a stray vertical line when steps wrap. In the How It Works section, replace the `borderRight` line with a `className` and handle it in CSS.

Change the step `<div>` style to drop the `borderRight` property entirely and add `className="step-card"`. Then append to `frontend/src/index.css`, before the `@media (max-width: 768px)` block:

```css
.step-card + .step-card {
  border-left: 2px dashed var(--color-border);
}

@media (max-width: 768px) {
  .step-card + .step-card {
    border-left: none;
    border-top: 2px dashed var(--color-border);
    padding-top: 32px;
    margin-top: 32px;
  }
}
```

The `i < STEPS.length - 1` conditional and the unused `i` map parameter are no longer needed — remove both.

- [ ] **Step 7: Tighten the CTA banner**

In the CTA section, add a subheading class to the `<h2>` and constrain the paragraph:

```jsx
<h2 style={{ color: 'var(--color-text-on-dark)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, marginBottom: '16px', lineHeight: 1.2 }}>
  Start shortening for free
</h2>
<p style={{ color: 'var(--color-text-muted-dark)', marginBottom: '36px', fontSize: '17px', maxWidth: '480px', margin: '0 auto 36px' }}>
  No credit card required. No account needed to try.
</p>
```

- [ ] **Step 8: Run the full suite**

Run: `cd frontend && npm test`
Expected: PASS. `Landing.test.jsx` asserts on hero copy that has changed — update its expected strings to the new headline and trust labels.

- [ ] **Step 9: Verify the rendered page**

Run: `cd frontend && npm run build && npm run preview`, open the preview URL, and confirm: sections have breathing room on desktop, the steps separator is vertical on wide screens and horizontal when stacked, the footer is a centered column, and no fabricated statistics appear.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/index.css frontend/src/pages/landing.jsx frontend/src/__tests__/Landing.test.jsx
git commit -m "feat(ui): fix desktop section padding, sharpen landing copy, drop fake stats"
```

---

### Task 9: Search Console setup (manual, post-deploy)

**Files:** none

- [ ] **Step 1: Deploy to production**

Push the branch and let Vercel deploy, or run `vercel --prod` from `frontend/`.

- [ ] **Step 2: Verify prerendering survived deployment**

Run: `curl -s https://shortlynk.store/ | grep -c 'Short links that tell you who clicked'`
Expected: at least `1`. A `0` means Vercel served the SPA shell instead of the prerendered file — check that `dist/index.html` contains the hero markup locally first.

- [ ] **Step 3: Confirm the noindex header on short links**

Run: `curl -sI https://shortlynk-production.up.railway.app/s/test | grep -i x-robots-tag`
Expected: `X-Robots-Tag: noindex`

- [ ] **Step 4: Add the property in Google Search Console**

Add `shortlynk.store` as a Domain property at https://search.google.com/search-console, verify via the DNS TXT record your registrar provides, then submit `https://shortlynk.store/sitemap.xml` under Sitemaps.

- [ ] **Step 5: Import into Bing Webmaster Tools**

At https://www.bing.com/webmasters, choose "Import from Google Search Console". This also covers ChatGPT search, which sources from Bing.

- [ ] **Step 6: Record the baseline**

Note today's date, indexed page count (0 at this point), and impressions (0). Per the spec's Strategic Rationale, this baseline is what makes "did the content pages work?" an answerable question later.

- [ ] **Step 7: Validate the social card**

Paste `https://shortlynk.store` into https://cards-dev.twitter.com/validator and into a Slack message. Confirm the title and description render. The card image will be missing until `public/og-default.png` is added — that is a known gap, tracked below.

---

## Known Gaps After This Plan

| Gap | Why deferred |
|---|---|
| `public/og-default.png` does not exist | Needs a designed 1200×630 image. `Seo.jsx` already references `/og-default.png`, so dropping the file in is the only remaining step. Social cards render with title and description but no image until then. |
| Spec §5 tool pages | Follow-up plan |
| Spec §6 use-case pages | Follow-up plan, optional |
| Short-link domain migration | Infrastructure, tracked in the spec's Out of Scope section |
