import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockConfig = vi.hoisted(() => ({
  GOOGLE_SAFE_BROWSING_API_KEY: '',
}));

vi.mock('../../config/index.js', () => ({
  config: mockConfig,
}));

vi.mock('./logger.js', () => ({
  default: { warn: vi.fn() },
}));

import { checkUrlSafety } from './safe-browsing.js';

describe('checkUrlSafety', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.GOOGLE_SAFE_BROWSING_API_KEY = '';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns without throwing when URLhaus says URL is clean', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ query_status: 'no_results' }),
    });

    await expect(checkUrlSafety('https://safe.com')).resolves.toBeUndefined();
  });

  it('throws when URLhaus flags the URL', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ query_status: 'is_listed' }),
    });

    await expect(checkUrlSafety('https://bad.com')).rejects.toThrow(
      'This URL has been flagged as unsafe',
    );
  });

  it('returns without throwing when fetch fails entirely (fail-open)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));

    await expect(checkUrlSafety('https://example.com')).resolves.toBeUndefined();
  });

  it('returns without throwing when URLhaus returns non-ok response (fail-open)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });

    await expect(checkUrlSafety('https://example.com')).resolves.toBeUndefined();
  });

  it('also checks Google Safe Browsing when key is set and URLhaus is clean', async () => {
    mockConfig.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key';

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ query_status: 'no_results' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ matches: [{ threatType: 'MALWARE' }] }),
      });

    await expect(checkUrlSafety('https://malware.com')).rejects.toThrow(
      'This URL has been flagged as unsafe',
    );
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
