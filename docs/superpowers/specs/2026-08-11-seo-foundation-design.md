# Spec: SEO Foundation, Tool Pages, and Capped Use-Case Pages

**Date:** 2026-08-11
**Branch:** development

---

## Overview

Shortlynk currently has no SEO surface at all. The frontend is a client-rendered Vite + React SPA whose only `<title>` is `URL SHORTENER API`, with no description, no canonical, no Open Graph tags, no `robots.txt`, and no sitemap. Every link ever shared from the product previews as an untitled, description-less card.

This spec covers four things, in descending order of confidence:

1. **Rendering** — build-time prerendering so marketing pages ship real HTML.
2. **Foundation** — per-route meta, canonical, OG/Twitter, JSON-LD, `robots.txt`, `sitemap.xml`, `noindex` on app routes.
3. **Tool pages** — `/tools/qr-code` and `/tools/utm-builder`, client-side, prerendered with real prose.
4. **Use-case pages** — `/for/:slug`, templated, **hard-capped at 20**, build-gated on uniqueness. Explicitly optional.

Backend changes are limited to two lines of robots hygiene.

---

## Strategic Rationale (read before extending §6)

Programmatic SEO was evaluated and **rejected as a strategy**. The reasoning is recorded here because the conclusion is not obvious from the artifact it produced.

pSEO wins by coverage: a large dataset that exists independently of the SEO ambition, with search demand distributed across its rows. Shortlynk has no such dataset. The only large dataset it owns is users' links, which are private and would be spam to index. The entity list behind §6 is invented, not discovered — the diagnostic that this is templated content marketing, not pSEO.

Three further constraints:

- **Demand is concentrated, not distributed.** URL shortening has a violently steep demand curve; nearly all volume sits in head terms owned by incumbents with 15+ years of backlinks.
- **The binding constraint is authority, not page count.** Pages do not produce links. Volume compounds only on a domain that already has standing; shortlynk.store has none.
- **On a shortener domain, volume carries downside.** This is the category Google already associates with spam. Thin generated pages here are expected-value-negative, not neutral.

§6 survives only because its marginal cost is near zero once §1–§3 exist, and because answer engines (AI Overviews, Perplexity, ChatGPT search) cite narrow, factually specific pages while weighting domain authority far less than a classic SERP does. That is a real but modest bet.

**The failure mode to guard against is not building §6. It is building §6, observing that it does little, and concluding the fix is more pages.** The 20-page cap is enforced in the build for this reason. Raising it is a strategy decision, not a content decision.

---

## Out of Scope

| Item | Why deferred |
|---|---|
| Competitor comparison pages (`bitly alternative`, etc.) | High commercial intent but unrankable on a zero-authority domain. Revisit once §5 pages have indexed and earned links. |
| Blog / informational content | Ongoing writing commitment, not a one-time build. |
| Link expander / safety checker | Requires a backend endpoint fetching arbitrary user URLs — SSRF surface needing allowlisting, hop caps, timeouts, and dedicated rate limiting. Deserves its own spec. |
| Bulk shortener | Product surface, negligible SEO upside. |
| **Short-link domain migration** | See below. Not SEO, but higher leverage than this entire spec. |

### Flagged: short links are not on the brand domain

`BASE_URL` is `https://shortlynk-production.up.railway.app`, so a generated link reads `shortlynk-production.up.railway.app/s/abc123` — 45 characters before the code, longer than most URLs it shortens, on a shared PaaS subdomain that spam filters treat with suspicion.

A shortener's growth loop is the links themselves: every share is a brand impression. This severs that loop. Moving short links to `shortlynk.store` (or a dedicated short domain) is plausibly higher leverage than everything in this spec combined. It is infrastructure work and is **not** included here, but no page built below will convert well until it is done.

---

## 1. Rendering Architecture

Stay on Vite. Use Vite's documented SSR primitives directly rather than a prerender plugin — the popular plugins are thinly maintained and fail by silently emitting empty HTML.

### New files

| File | Purpose |
|---|---|
| `frontend/src/entry-server.jsx` | Renders `<App>` inside `StaticRouter` for a given URL; returns `{ html, helmetContext }` |
| `frontend/scripts/prerender.js` | Post-build Node script: renders each manifest route, injects head tags, writes `dist/<route>/index.html`, then emits `sitemap.xml` |

### Changes to existing files

- `frontend/src/App.jsx` — extract the `<Routes>` tree into a `<AppRoutes />` component so both `BrowserRouter` (client) and `StaticRouter` (server) can wrap it. `App.jsx` keeps `BrowserRouter`.
- `frontend/src/main.jsx` — wrap in `<HelmetProvider>`.
- `frontend/package.json` — `"build": "node scripts/validate-use-cases.js && vite build && vite build --ssr src/entry-server.jsx --outDir dist-ssr && node scripts/prerender.js"`

  Validation runs **first** so a data error fails in seconds rather than after two full builds.

### Code splitting

The five app routes become `React.lazy` imports with a `<Suspense>` fallback:

`dashboard`, `login`, `register`, `urls`, `oauth/callback`

Marketing pages then ship only their own JS. This addresses prerendering's one genuine weakness versus Astro — a prerendered SPA route otherwise loads the entire app bundle, hurting LCP and INP.

### Deploy note (verify explicitly)

`frontend/vercel.json` rewrites `/(.*)` → `/index.html`. Vercel applies `rewrites` **after** the filesystem check, so `dist/for/instagram-bio/index.html` is served directly and the rewrite only catches genuine misses. This is correct as-is and `vercel.json` needs no change — but it is a subtle failure mode, so §7 includes an explicit post-deploy verification that a prerendered route returns its own HTML and not the SPA shell.

### New dependencies

- `react-helmet-async` (runtime)
- `qrcode` (runtime, §5 only)

---

## 2. Route Manifest — Single Source of Truth

**`frontend/src/seo/routes.js`**

```js
export const marketingRoutes = [
  {
    path: '/',
    title: 'Shortlynk — Free URL Shortener with Click Analytics',
    description: '...',
    priority: 1.0,
    changefreq: 'weekly',
  },
  // /tools/qr-code, /tools/utm-builder, /for
];

export const appRoutes = ['/dashboard', '/login', '/register', '/urls', '/oauth/callback'];

// Expands use-case entries into routes; concatenated with marketingRoutes
export function getAllPrerenderRoutes() { /* ... */ }
```

This file has **three consumers**: `scripts/prerender.js`, the sitemap generator inside it, and the `Footer` internal-link block. This is the design's load-bearing decision — it makes "sitemap out of sync with what actually exists" structurally impossible rather than something we remember to check.

`appRoutes` exists so the `noindex` list and the `robots.txt` disallow list are derived from one place too.

---

## 3. SEO Foundation

### `frontend/src/components/Seo.jsx`

One wrapper over `react-helmet-async`. Every page uses it; no page hand-writes head tags.

```jsx
<Seo
  title="..."           // required
  description="..."     // required
  canonical="/for/x"    // path; component prepends SITE_URL
  ogImage="/og/x.png"   // optional, defaults to site-wide OG image
  noindex={false}       // app routes pass true
  jsonLd={{...}}        // optional object or array, serialized to ld+json
/>
```

`SITE_URL` is read from `import.meta.env.VITE_SITE_URL`, defaulting to `https://shortlynk.store`. The prerender script sets it in the SSR environment so canonicals and `og:url` are absolute in the emitted HTML. It is the site's public origin and is unrelated to `BASE_URL` (the backend redirect host).

Emits: `<title>`, `meta[description]`, `link[rel=canonical]`, `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`, and `<script type="application/ld+json">` when `jsonLd` is supplied. When `noindex` is true, emits `meta[name=robots][content="noindex,nofollow"]` and omits canonical.

### `frontend/index.html` fixes

- `<title>` → `Shortlynk — Free URL Shortener with Click Analytics`
- Add `<meta name="description">` as the fallback for any non-prerendered route
- Favicon currently points at `/src/assets/app-logo.png`, which does not resolve in a production build. Move the asset to `frontend/public/favicon.png` and reference `/favicon.png`.

### `frontend/public/robots.txt`

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

### `sitemap.xml`

Generated by `scripts/prerender.js` from `getAllPrerenderRoutes()`. Absolute URLs, `lastmod` set to build date, `priority` and `changefreq` from the manifest. App routes are never included.

### JSON-LD

| Page | Schema |
|---|---|
| `/` | `SoftwareApplication` (with `applicationCategory: WebApplication`, `offers.price: 0`) + `Organization` |
| `/tools/*` | `FAQPage` from the page's own FAQ content |
| `/for/*` | `FAQPage` + `BreadcrumbList` |
| `/for` | `BreadcrumbList` |

FAQ JSON-LD must be generated from the same data that renders the visible FAQ. Structured data that does not match visible page content is a manual-action risk.

### Footer internal linking

`Footer.jsx` currently links only `Features`, `Dashboard`, `Login`, `Register` — three of four are `noindex` routes, so it passes almost no useful signal. Add a `Tools` column and a `Use cases` column sourced from the route manifest.

---

## 4. Backend Changes

The Railway host is an API and redirect service that should never appear in an index.

1. **`app.js`** — serve a blanket-disallow `robots.txt`:
   ```
   User-agent: *
   Disallow: /
   ```
2. **`src/routes/redirect.js`** — set `X-Robots-Tag: noindex` on the `GET /:shortCode` response, so short links are not indexed even where robots.txt is not consulted.

That is the entire backend delta. No new endpoints, no schema changes.

---

## 5. Tool Pages

Two pages, both fully client-side, both using the existing guest shorten endpoint (`POST /api/shorten/guest`) for their "now shorten it" call to action.

| Route | Component | Dependency |
|---|---|---|
| `/tools/qr-code` | `frontend/src/pages/tools/QrCode.jsx` | `qrcode` |
| `/tools/utm-builder` | `frontend/src/pages/tools/UtmBuilder.jsx` | none |

### Critical constraint

**The prerendered HTML must contain the page's real content** — explainer prose, usage steps, and FAQ — with only the interactive widget hydrating afterward. A page whose server HTML is an empty `<div>` plus a heading ranks for nothing.

Concretely: the widget is the conversion mechanism, the prose is the ranking mechanism, and each page needs both. Minimum 400 words of static copy per tool page, present in the prerendered output.

### QR generator

Input a URL → optionally shorten it via the guest endpoint → render QR to `<canvas>` → download as PNG. Size and error-correction level selectable. No upload, no server round-trip for generation.

### UTM builder

Form over the five standard parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`), live-assembled URL, copy button, and a "shorten this" action into the guest endpoint. Static copy explains what each parameter means and how the values surface in analytics.

---

## 6. Use-Case Pages (Optional, Hard-Capped)

**This section is optional and capped. Read §"Strategic Rationale" before extending it.**

- Route: `/for/:slug`, single template component `frontend/src/pages/UseCase.jsx`
- Hub: `/for` lists all entries
- Data: `frontend/src/seo/useCases.js`

### Entry shape

```js
{
  slug: 'instagram-bio',            // kebab-case, unique
  platform: 'Instagram',
  title: '...',                     // <60 chars
  description: '...',               // 120-158 chars
  intro: '...',                     // 2-3 paragraphs, platform-specific
  constraints: [...],               // character limits, preview behaviour,
                                    // whether the platform strips or wraps URLs
  painPoints: [...],                // 3 items, platform-specific
  faq: [{ q, a }, ...],             // 3-5 pairs, platform-specific
}
```

Entries must share a layout and almost no sentences. "Instagram bio" and "email campaigns" are different pages, not one page with a noun swapped.

### Build-enforced quality gate

**`frontend/scripts/validate-use-cases.js`**, run as part of `npm run build`. The build **fails** — not warns — on any of:

| Check | Threshold |
|---|---|
| Entry count | **≤ 20**. Build fails at 21. |
| Required fields present | All fields in the shape above, non-empty |
| Slug format | `^[a-z0-9]+(-[a-z0-9]+)*$`, unique across entries |
| Unique body copy | ≥ 250 words across `intro` + `painPoints` + `faq` answers |
| Sibling similarity | Jaccard similarity over word trigrams ≤ 0.4 against every other entry |
| Title length | ≤ 60 characters |
| Description length | 120–158 characters |

This gate is the entire reason §6 is defensible. Enforcing it mechanically is the only version that survives contact with a deadline.

### Staleness

Platform constraints change. Each entry carries a `reviewed` date; the validator warns (does not fail) on entries older than 12 months. Twenty pages asserting stale facts is a liability, and nobody notices because nobody visits them.

---

## 7. Testing

### Vitest (`frontend/src/__tests__/`)

| Test | Asserts |
|---|---|
| `Seo.test.jsx` | Renders title, description, canonical, OG and Twitter tags; `noindex` emits robots meta and omits canonical; `jsonLd` serializes correctly |
| `routes.test.js` | Every `marketingRoutes` entry has non-empty title and description; no path appears in both `marketingRoutes` and `appRoutes` |
| `useCases.test.js` | Runs the §6 validator against real data; fails on cap, missing fields, duplicate slugs, similarity breach |
| `UseCase.test.jsx` | Template renders a given entry's platform-specific fields; FAQ JSON-LD matches visible FAQ content |
| Tool page tests | QR canvas renders for a valid URL; UTM builder assembles the expected query string |

### Build assertions (`scripts/prerender.js`)

After writing output, assert for **every** manifest route that the emitted file exists and contains a non-empty `<title>` and a non-empty `meta[description]`. Exit non-zero otherwise. This is what stops a silently broken prerender from shipping.

### Manual verification (post-deploy, once)

1. `curl -s https://shortlynk.store/for/<slug> | grep -c '<h1'` — confirms Vercel serves the prerendered file rather than the SPA shell (see §1 deploy note).
2. View source on `/` and one tool page; confirm content is present without JS.
3. Google Rich Results Test on `/`, one tool page, one use-case page.
4. Paste a link into Slack or X; confirm the OG card renders with title, description, and image.
5. `curl -I https://shortlynk-production.up.railway.app/s/<code>` — confirm `X-Robots-Tag: noindex`.

---

## Implementation Order

1. §1 rendering + §2 manifest + §3 foundation — the unambiguous, highest-confidence work
2. §4 backend robots hygiene — two lines
3. §5 tool pages — the one real traffic bet
4. §6 use-case pages — optional; skip without consequence if scope tightens

Sections 1–4 are independently valuable and ship on their own. Nothing in 5 or 6 blocks them.
