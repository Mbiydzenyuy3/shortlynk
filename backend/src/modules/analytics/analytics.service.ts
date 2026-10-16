import type { Request } from 'express';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import prisma from '../../shared/prisma.js';
import { config } from '../../config/index.js';

interface RedirectResult {
  status: 'ok' | 'not_found' | 'expired';
  redirectTo?: string;
  clicks?: number;
}

export async function handleRedirect(shortCode: string, req: Request): Promise<RedirectResult> {
  const url = await prisma.url.findUnique({ where: { shortCode } });

  if (!url) return { status: 'not_found' };

  if (url.expireAt && new Date() > new Date(url.expireAt)) {
    return { status: 'expired' };
  }

  // Extract click source metadata
  let referrer = 'Direct';
  let country = 'Unknown';
  let device = 'Unknown';
  let browser = 'Unknown';

  try {
    const rawReferer = req.get('Referer') || req.get('Referrer') || '';
    if (rawReferer) {
      try {
        const refUrl = new URL(rawReferer);
        referrer = refUrl.hostname || 'Direct';
      } catch {
        referrer = rawReferer.slice(0, 200);
      }
    }

    // Country from IP
    const forwarded = req.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
    const cleanIp = ip?.replace('::ffff:', '') ?? '';
    const geo = geoip.lookup(cleanIp);
    if (geo?.country) {
      try {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        country = regionNames.of(geo.country) ?? geo.country;
      } catch {
        country = geo.country;
      }
    }

    // Device and browser from User-Agent
    const ua = req.get('User-Agent') || '';
    const parser = new UAParser(ua);
    const parsedDevice = parser.getDevice();
    const parsedBrowser = parser.getBrowser();
    device = parsedDevice.type || 'Desktop';
    device = device.charAt(0).toUpperCase() + device.slice(1);
    browser = parsedBrowser.name || 'Unknown';
  } catch {
    // Silently continue with defaults if parsing fails
  }

  // Update click count and create click log in parallel
  await Promise.all([
    prisma.url.update({
      where: { id: url.id },
      data: { clickCount: { increment: 1 } },
    }),
    prisma.clickLog.create({
      data: {
        urlId: url.id,
        referrer,
        country,
        device,
        browser,
      },
    }),
  ]);

  return { status: 'ok', redirectTo: url.longUrl, clicks: url.clickCount + 1 };
}

export async function getUrlStats(shortCode: string, userId: string) {
  const url = await prisma.url.findFirst({
    where: { shortCode, userId },
    select: { longUrl: true, clickCount: true, createdAt: true, expireAt: true },
  });

  if (!url) return null;

  const shortUrl = `${config.BASE_URL}/s/${shortCode}`;
  return { ...url, shortUrl };
}

export async function getClickSources(shortCode: string, userId: string) {
  const url = await prisma.url.findFirst({
    where: { shortCode, userId },
    select: { id: true },
  });

  if (!url) return null;

  // Run all 4 aggregations in parallel using Prisma groupBy
  const [referrers, countries, devices, browsers] = await Promise.all([
    prisma.clickLog.groupBy({
      by: ['referrer'],
      where: { urlId: url.id, referrer: { not: null } },
      _count: { referrer: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 10,
    }),
    prisma.clickLog.groupBy({
      by: ['country'],
      where: { urlId: url.id, country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    }),
    prisma.clickLog.groupBy({
      by: ['device'],
      where: { urlId: url.id, device: { not: null } },
      _count: { device: true },
      orderBy: { _count: { device: 'desc' } },
      take: 10,
    }),
    prisma.clickLog.groupBy({
      by: ['browser'],
      where: { urlId: url.id, browser: { not: null } },
      _count: { browser: true },
      orderBy: { _count: { browser: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    referrers: referrers.map(r => ({ name: r.referrer!, count: r._count.referrer })),
    countries: countries.map(c => ({ name: c.country!, count: c._count.country })),
    devices: devices.map(d => ({ name: d.device!, count: d._count.device })),
    browsers: browsers.map(b => ({ name: b.browser!, count: b._count.browser })),
  };
}
