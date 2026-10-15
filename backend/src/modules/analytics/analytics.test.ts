import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../shared/prisma.js', () => ({
  default: {
    url: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    clickLog: {
      create: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('../../config/index.js', () => ({
  config: { BASE_URL: 'http://localhost:4000' },
}));

vi.mock('geoip-lite', () => ({
  default: { lookup: vi.fn(() => null) },
}));

vi.mock('ua-parser-js', () => ({
  UAParser: vi.fn(() => ({
    getDevice: () => ({ type: '' }),
    getBrowser: () => ({ name: 'Chrome' }),
  })),
}));

import prisma from '../../shared/prisma.js';
import { handleRedirect, getUrlStats, getClickSources } from './analytics.service.js';

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleRedirect', () => {
    it('returns not_found for unknown shortCode', async () => {
      vi.mocked(prisma.url.findUnique).mockResolvedValue(null);

      const req = { get: vi.fn(() => ''), ip: '127.0.0.1' } as any;
      const result = await handleRedirect('nope', req);
      expect(result.status).toBe('not_found');
    });

    it('returns expired for expired URL', async () => {
      vi.mocked(prisma.url.findUnique).mockResolvedValue({
        id: 'url-1', shortCode: 'abc', longUrl: 'https://example.com',
        shortUrl: 'http://localhost:4000/s/abc', clickCount: 0,
        createdAt: new Date(), expireAt: new Date('2020-01-01'),
        userId: 'user-1', updatedAt: new Date(),
      });

      const req = { get: vi.fn(() => ''), ip: '127.0.0.1' } as any;
      const result = await handleRedirect('abc', req);
      expect(result.status).toBe('expired');
    });

    it('redirects and logs click for valid URL', async () => {
      vi.mocked(prisma.url.findUnique).mockResolvedValue({
        id: 'url-1', shortCode: 'abc', longUrl: 'https://example.com',
        shortUrl: 'http://localhost:4000/s/abc', clickCount: 5,
        createdAt: new Date(), expireAt: null,
        userId: 'user-1', updatedAt: new Date(),
      });
      vi.mocked(prisma.url.update).mockResolvedValue({} as any);
      vi.mocked(prisma.clickLog.create).mockResolvedValue({} as any);

      const req = { get: vi.fn(() => ''), ip: '127.0.0.1' } as any;
      const result = await handleRedirect('abc', req);

      expect(result.status).toBe('ok');
      expect(result.redirectTo).toBe('https://example.com');
      expect(result.clicks).toBe(6);
      expect(prisma.url.update).toHaveBeenCalledWith({
        where: { id: 'url-1' },
        data: { clickCount: { increment: 1 } },
      });
      expect(prisma.clickLog.create).toHaveBeenCalled();
    });
  });

  describe('getUrlStats', () => {
    it('returns stats for owned URL', async () => {
      vi.mocked(prisma.url.findFirst).mockResolvedValue({
        longUrl: 'https://example.com', clickCount: 10,
        createdAt: new Date('2024-01-01'), expireAt: null,
      } as any);

      const result = await getUrlStats('abc', 'user-1');
      expect(result).toMatchObject({
        longUrl: 'https://example.com',
        clickCount: 10,
        shortUrl: 'http://localhost:4000/s/abc',
      });
    });

    it('returns null for unowned URL', async () => {
      vi.mocked(prisma.url.findFirst).mockResolvedValue(null);

      const result = await getUrlStats('abc', 'user-1');
      expect(result).toBeNull();
    });
  });

  describe('getClickSources', () => {
    it('returns null for unowned URL', async () => {
      vi.mocked(prisma.url.findFirst).mockResolvedValue(null);

      const result = await getClickSources('abc', 'user-1');
      expect(result).toBeNull();
    });

    it('returns aggregated click sources', async () => {
      vi.mocked(prisma.url.findFirst).mockResolvedValue({ id: 'url-1' } as any);
      vi.mocked(prisma.clickLog.groupBy)
        .mockResolvedValueOnce([{ referrer: 'google.com', _count: { referrer: 5 } }] as any)
        .mockResolvedValueOnce([{ country: 'US', _count: { country: 3 } }] as any)
        .mockResolvedValueOnce([{ device: 'Desktop', _count: { device: 4 } }] as any)
        .mockResolvedValueOnce([{ browser: 'Chrome', _count: { browser: 6 } }] as any);

      const result = await getClickSources('abc', 'user-1');
      expect(result).toEqual({
        referrers: [{ name: 'google.com', count: 5 }],
        countries: [{ name: 'US', count: 3 }],
        devices: [{ name: 'Desktop', count: 4 }],
        browsers: [{ name: 'Chrome', count: 6 }],
      });
    });
  });
});
