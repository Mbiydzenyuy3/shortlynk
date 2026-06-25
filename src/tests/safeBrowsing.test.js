import { checkUrlSafety } from '../utils/safeBrowsing.js';

const SAFE_BROWSING_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

beforeEach(() => {
  process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key';
  global.fetch = jest.fn();
});

afterEach(() => {
  delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  jest.restoreAllMocks();
});

describe('checkUrlSafety', () => {
  it('returns without throwing when URL is clean (empty matches)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await expect(checkUrlSafety('https://example.com')).resolves.toBeUndefined();
  });

  it('throws UNSAFE_URL when Google returns matches', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [{ threatType: 'MALWARE', threat: { url: 'https://evil.com' } }],
      }),
    });
    await expect(checkUrlSafety('https://evil.com')).rejects.toThrow('UNSAFE_URL');
  });

  it('returns without throwing when API call fails (fail-open)', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(checkUrlSafety('https://example.com')).resolves.toBeUndefined();
  });

  it('returns without throwing when API key is not set (fail-open)', async () => {
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    await expect(checkUrlSafety('https://example.com')).resolves.toBeUndefined();
  });

  it('sends correct request body to Google Safe Browsing API', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await checkUrlSafety('https://example.com');

    const [calledUrl, calledOptions] = global.fetch.mock.calls[0];
    expect(calledUrl).toContain('safebrowsing.googleapis.com');
    expect(calledUrl).toContain('test-key');

    const body = JSON.parse(calledOptions.body);
    expect(body.threatInfo.threatEntries[0].url).toBe('https://example.com');
    expect(body.threatInfo.threatTypes).toContain('MALWARE');
    expect(body.threatInfo.threatTypes).toContain('SOCIAL_ENGINEERING');
  });
});
