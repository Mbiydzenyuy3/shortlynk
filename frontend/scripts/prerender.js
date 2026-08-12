// Renders each marketing route to static HTML after `vite build`, then writes
// sitemap.xml. App routes are never prerendered — they stay client-only and
// noindex.
//
// Metadata handling: React 19 hoists <title>, <meta> and <link> to the front
// of the renderToString output. We split that prefix off and inject it into
// <head>, leaving the page markup for <div id="root">.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

const SITE_URL = (process.env.VITE_SITE_URL || 'https://shortlynk.store').replace(/\/$/, '');

// pathToFileURL is required — import() of a bare absolute path is not portable.
const { default: render } = await import(
  pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href
);
const { getAllPrerenderRoutes } = await import(
  pathToFileURL(path.join(root, 'src/seo/routes.js')).href
);

// React emits hoistable tags contiguously at the start of the output.
const HOISTED = /^(?:<title>[\s\S]*?<\/title>|<meta\b[^>]*?\/?>|<link\b[^>]*?\/?>)+/;

const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
const routes = getAllPrerenderRoutes();
const failures = [];

for (const route of routes) {
  const rendered = render(route.path);

  const match = rendered.match(HOISTED);
  const head = match ? match[0] : '';
  const body = match ? rendered.slice(match[0].length) : rendered;

  if (!head) {
    failures.push(`${route.path}: no hoisted metadata found in rendered output`);
  }

  // Drop the template's static title/description so the per-route ones win.
  const page = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', `  ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const outDir = route.path === '/' ? distDir : path.join(distDir, route.path);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), page);

  // Build assertions: an empty-metadata page must never ship.
  if (!/<title>[^<]+<\/title>/.test(page)) {
    failures.push(`${route.path}: empty or missing <title>`);
  }
  if (!/<meta name="description" content="[^"]+"/.test(page)) {
    failures.push(`${route.path}: empty or missing meta description`);
  }
  if (/<div id="root"><\/div>/.test(page)) {
    failures.push(`${route.path}: root element is empty — nothing was prerendered`);
  }

  console.log(`prerendered ${route.path}`);
}

const today = new Date().toISOString().split('T')[0];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    r => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
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
