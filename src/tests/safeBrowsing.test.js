import { checkUrlSafety } from '../utils/safeBrowsing.js';

// checkUrlSafety calls URLhaus first, then Google Safe Browsing (if key set).
// Both use global.fetch. Mock returns are consumed in call order.

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  jest.restoreAllMocks();
});

describe('checkUrlSafety', () => {
  it('returns without throwing when URLhaus says URL is clean', async () => {
    // URLhaus → clean, no Google key set → done
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ query_status: 'no_results' }),
    });
    await expect(checkUrlSafety('https://example.com')).resolves.toBeUndefined();
  });

  it('throws UNSAFE_URL when URLhaus flags the URL', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ query_status: 'is_listed' }),
    });
    await expect(checkUrlSafety('https://evil.com')).rejects.toThrow('UNSAFE_URL');
  });

  it('returns without throwing when fetch fails entirely (fail-open)', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(checkUrlSafety('https://example.com')).resolves.toBeUndefined();
  });

  it('returns without throwing when URLhaus returns non-ok response (fail-open)', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await expect(checkUrlSafety('https://example.com')).resolves.toBeUndefined();
  });

  it('also checks Google Safe Browsing when key is set and URLhaus is clean', async () => {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key';
    // First call: URLhaus → clean
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ query_status: 'no_results' }) });
    // Second call: Google → matches (flagged)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ matches: [{ threatType: 'MALWARE' }] }),
    });
    await expect(checkUrlSafety('https://evil.com')).rejects.toThrow('UNSAFE_URL');
  });
});
