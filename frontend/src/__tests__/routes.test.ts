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

  it('gives every prerender route a priority and changefreq for the sitemap', () => {
    for (const route of getAllPrerenderRoutes()) {
      expect(typeof route.priority, `${route.path} priority`).toBe('number');
      expect(route.changefreq, `${route.path} changefreq`).toBeTruthy();
    }
  });
});
