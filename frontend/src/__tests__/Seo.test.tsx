import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import Seo, { SITE_URL } from '../components/Seo';

// Assert on the server-rendered string: this is exactly what the prerender
// script consumes, so testing it here also guards the prerender pipeline.
function renderSeo(props) {
  return renderToString(<Seo {...props} />);
}

describe('Seo', () => {
  it('renders title and description', () => {
    const html = renderSeo({ title: 'Test Title', description: 'Test description.' });
    expect(html).toContain('<title>Test Title</title>');
    expect(html).toContain('Test description.');
  });

  it('renders an absolute canonical from a relative path', () => {
    const html = renderSeo({ title: 'T', description: 'D', canonical: '/tools/qr-code' });
    expect(html).toContain(`rel="canonical"`);
    expect(html).toContain(`${SITE_URL}/tools/qr-code`);
  });

  it('renders Open Graph and Twitter tags', () => {
    const html = renderSeo({ title: 'OG Title', description: 'OG description.' });
    expect(html).toContain('og:title');
    expect(html).toContain('og:description');
    expect(html).toContain('og:image');
    expect(html).toContain('twitter:card');
    expect(html).toContain('summary_large_image');
  });

  it('emits robots noindex and omits canonical when noindex is set', () => {
    const html = renderSeo({ title: 'T', description: 'D', canonical: '/dashboard', noindex: true });
    expect(html).toContain('noindex,nofollow');
    expect(html).not.toContain('rel="canonical"');
  });

  it('serializes jsonLd into a ld+json script tag', () => {
    const html = renderSeo({
      title: 'T', description: 'D',
      jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: 'Shortlynk' },
    });
    expect(html).toContain('application/ld+json');
    expect(html).toContain('Shortlynk');
  });

  it('accepts an array of jsonLd blocks', () => {
    const html = renderSeo({
      title: 'T', description: 'D',
      jsonLd: [
        { '@type': 'Organization', name: 'Shortlynk' },
        { '@type': 'SoftwareApplication', name: 'Shortlynk App' },
      ],
    });
    expect(html.match(/application\/ld\+json/g)).toHaveLength(2);
  });

  it('hoists metadata ahead of page markup for the prerenderer', () => {
    // React 19 emits hoistable tags first; prerender.js relies on this.
    const html = renderToString(
      <div>
        <Seo title="Hoisted" description="D" />
        <h1>Hero</h1>
      </div>
    );
    expect(html.indexOf('<title>')).toBeLessThan(html.indexOf('<h1>'));
    expect(html.startsWith('<title>')).toBe(true);
  });
});
