import prisma from '../../shared/prisma.js';
import { config } from '../../config/index.js';
import generateShortCode from '../../shared/utils/short-code-gen.js';
import { checkUrlSafety } from '../../shared/utils/safe-browsing.js';

export async function createShortUrl({
  longUrl,
  shortCode,
  expireAt,
  userId,
}: {
  longUrl: string;
  shortCode?: string | null;
  expireAt?: string | null;
  userId: string | null;
}) {
  await checkUrlSafety(longUrl);

  // Deduplication for authenticated users
  if (userId) {
    const existing = await prisma.url.findFirst({
      where: { longUrl, userId },
    });

    if (existing) {
      if (shortCode || expireAt) {
        const newCode = shortCode ?? existing.shortCode;

        // Prevent stealing another row's short_code
        if (shortCode && shortCode !== existing.shortCode) {
          const conflict = await prisma.url.findUnique({ where: { shortCode } });
          if (conflict) {
            const err = new Error('Custom Code conflict') as Error & { status?: number };
            err.status = 409;
            throw err;
          }
        }

        const newExpiry = expireAt ? new Date(expireAt) : existing.expireAt;
        const newShortUrl = `${config.BASE_URL}/s/${newCode}`;

        return prisma.url.update({
          where: { id: existing.id },
          data: {
            shortCode: newCode,
            expireAt: newExpiry,
            shortUrl: newShortUrl,
          },
          select: { shortCode: true, shortUrl: true, longUrl: true, createdAt: true, expireAt: true },
        });
      }

      return existing;
    }
  }

  // New entry (guests always reach here)
  const code = shortCode ?? generateShortCode();

  if (shortCode) {
    const conflict = await prisma.url.findUnique({ where: { shortCode } });
    if (conflict) {
      const err = new Error('Custom Code conflict') as Error & { status?: number };
      err.status = 409;
      throw err;
    }
  }

  const shortUrl = `${config.BASE_URL}/s/${code}`;
  const expireDate = expireAt ? new Date(expireAt) : null;

  return prisma.url.create({
    data: {
      longUrl,
      shortCode: code,
      expireAt: expireDate,
      userId,
      shortUrl,
      clickCount: 0,
    },
    select: { shortCode: true, shortUrl: true, longUrl: true, createdAt: true, expireAt: true },
  });
}

export async function getUserUrls(userId: string) {
  return prisma.url.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateUrlExpiry(shortCode: string, userId: string, expireAt: string | null) {
  const expiry = expireAt ? new Date(expireAt) : null;

  const url = await prisma.url.findFirst({
    where: { shortCode, userId },
  });

  if (!url) return null;

  return prisma.url.update({
    where: { id: url.id },
    data: { expireAt: expiry },
    select: {
      shortCode: true, shortUrl: true, longUrl: true,
      expireAt: true, clickCount: true, createdAt: true,
    },
  });
}

export async function deleteUrl(shortCode: string, userId: string): Promise<boolean> {
  const url = await prisma.url.findFirst({
    where: { shortCode, userId },
  });

  if (!url) return false;

  await prisma.url.delete({ where: { id: url.id } });
  return true;
}
