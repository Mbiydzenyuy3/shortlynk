import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../shared/prisma.js', () => ({
  default: {
    url: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../../config/index.js', () => ({
  config: {
    BASE_URL: 'http://localhost:4000',
  },
}));

vi.mock('../../shared/utils/safe-browsing.js', () => ({
  checkUrlSafety: vi.fn(),
}));

vi.mock('../../shared/utils/short-code-gen.js', () => ({
  default: vi.fn(() => 'abc123'),
}));

import prisma from '../../shared/prisma.js';
import { createShortUrl, getUserUrls, deleteUrl } from './urls.service.js';

describe('URLs Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createShortUrl', () => {
    it('should create a new short URL for a guest', async () => {
      vi.mocked(prisma.url.create).mockResolvedValue({
        id: 'url-uuid',
        shortCode: 'abc123',
        shortUrl: 'http://localhost:4000/s/abc123',
        longUrl: 'https://example.com',
        createdAt: new Date(),
        expireAt: null,
        userId: null,
        clickCount: 0,
        updatedAt: new Date(),
      });

      const result = await createShortUrl({
        longUrl: 'https://example.com',
        shortCode: null,
        expireAt: null,
        userId: null,
      });

      expect(result.shortCode).toBe('abc123');
      expect(result.shortUrl).toBe('http://localhost:4000/s/abc123');
    });

    it('should deduplicate for authenticated users', async () => {
      const existing = {
        id: 'existing-id',
        shortCode: 'exist1',
        shortUrl: 'http://localhost:4000/s/exist1',
        longUrl: 'https://example.com',
        createdAt: new Date(),
        expireAt: null,
        userId: 'user-1',
        clickCount: 5,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.url.findFirst).mockResolvedValue(existing);

      const result = await createShortUrl({
        longUrl: 'https://example.com',
        shortCode: null,
        expireAt: null,
        userId: 'user-1',
      });

      expect(result).toEqual(existing);
      expect(prisma.url.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserUrls', () => {
    it('should return user URLs ordered by creation date', async () => {
      const urls = [
        { id: '1', shortCode: 'a', longUrl: 'https://a.com', shortUrl: 'http://localhost:4000/s/a', clickCount: 0, createdAt: new Date(), expireAt: null, userId: 'user-1', updatedAt: new Date() },
      ];
      vi.mocked(prisma.url.findMany).mockResolvedValue(urls);

      const result = await getUserUrls('user-1');
      expect(result).toEqual(urls);
    });
  });

  describe('deleteUrl', () => {
    it('should delete a URL owned by the user', async () => {
      vi.mocked(prisma.url.findFirst).mockResolvedValue({
        id: 'url-1',
        shortCode: 'abc',
        longUrl: 'https://example.com',
        shortUrl: 'http://localhost:4000/s/abc',
        clickCount: 0,
        createdAt: new Date(),
        expireAt: null,
        userId: 'user-1',
        updatedAt: new Date(),
      });
      vi.mocked(prisma.url.delete).mockResolvedValue({} as any);

      const result = await deleteUrl('abc', 'user-1');
      expect(result).toBe(true);
    });

    it('should return false for non-existent URL', async () => {
      vi.mocked(prisma.url.findFirst).mockResolvedValue(null);

      const result = await deleteUrl('nope', 'user-1');
      expect(result).toBe(false);
    });
  });
});
