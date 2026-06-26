// src/services/url.service.js
import { pool } from "../config/db.js";
import generateShortCode from "../utils/shortCodeGen.js";
import { checkUrlSafety } from "../utils/safeBrowsing.js";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";

export const createShortUrlService = async ({
  longUrl,
  shortCode,
  expireAt,
  userId,
}) => {
  // 1. Safety check first
  await checkUrlSafety(longUrl);

  // 2. Deduplication for authenticated users only
  if (userId) {
    const existing = await pool.query(
      'SELECT * FROM urls WHERE long_url = $1 AND user_id = $2',
      [longUrl, userId]
    );

    if (existing.rowCount > 0) {
      const row = existing.rows[0];

      if (shortCode || expireAt) {
        // User provided new options — update the existing record
        const newCode = shortCode || row.short_code;

        // Prevent stealing another row's short_code
        if (shortCode && shortCode !== row.short_code) {
          const conflict = await pool.query(
            'SELECT 1 FROM urls WHERE short_code = $1',
            [shortCode]
          );
          if (conflict.rowCount > 0) throw new Error('Custom Code conflict');
        }

        const newExpiry = expireAt ? new Date(expireAt) : row.expire_at;
        const newShortUrl = `${process.env.BASE_URL}/s/${newCode}`;

        const updated = await pool.query(
          `UPDATE urls
           SET short_code = $1, expire_at = $2, short_url = $3, updated_at = NOW()
           WHERE id = $4
           RETURNING short_code, short_url, long_url, created_at, expire_at`,
          [newCode, newExpiry, newShortUrl, row.id]
        );
        return updated.rows[0];
      }

      // No new options — return existing record as-is
      return row;
    }
  }

  // 3. Fall through: new entry (guests always reach here)
  const customCode = shortCode || generateShortCode(6);

  // Check for custom code conflict
  if (shortCode) {
    const conflict = await pool.query(
      'SELECT 1 FROM urls WHERE short_code=$1',
      [shortCode]
    );
    if (conflict.rowCount > 0) {
      throw new Error('Custom Code conflict');
    }
  }

  const baseUrl = process.env.BASE_URL;
  const shortUrl = `${baseUrl}/s/${customCode}`;
  const expireDate = expireAt ? new Date(expireAt) : null;

  const insertQuery = `
    INSERT INTO urls (long_url, short_code, expire_at, user_id, short_url, click_count)
    VALUES ($1, $2, $3, $4, $5, 0)
    RETURNING short_code, short_url, long_url, created_at, expire_at
  `;
  const result = await pool.query(insertQuery, [longUrl, customCode, expireDate, userId, shortUrl]);
  return result.rows[0];
};

export const getUserUrlsService = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM urls WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const getUrlStatsService = async (shortCode, userId) => {
  const result = await pool.query(
    `SELECT long_url, click_count, created_at, expire_at FROM urls WHERE short_code = $1 AND user_id = $2`,
    [shortCode, userId]
  );
  if (result.rowCount === 0) return null;

  const url = result.rows[0];
  const shortUrl = `${process.env.BASE_URL}/s/${shortCode}`;
  return { ...url, short_url: shortUrl };
};

export const handleRedirectService = async (shortCode, req) => {
  const result = await pool.query(
    `SELECT id, long_url, expire_at, click_count FROM urls WHERE short_code = $1`,
    [shortCode]
  );
  if (result.rowCount === 0) return { status: "not_found" };

  const { long_url, expire_at, click_count, id } = result.rows[0];
  if (expire_at && new Date() > new Date(expire_at))
    return { status: "expired" };

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
    const cleanIp = ip?.replace('::ffff:', '');
    const geo = geoip.lookup(cleanIp);
    if (geo && geo.country) {
      country = geo.country;
    }

    // Device and browser from User-Agent
    const ua = req.get('User-Agent') || '';
    const parser = new UAParser(ua);
    const parsedDevice = parser.getDevice();
    const parsedBrowser = parser.getBrowser();
    device = parsedDevice.type || 'Desktop';
    // Capitalize first letter
    device = device.charAt(0).toUpperCase() + device.slice(1);
    browser = parsedBrowser.name || 'Unknown';
  } catch {
    // Silently continue with defaults if parsing fails
  }

  // Update click count
  await pool.query(
    `UPDATE urls SET click_count = click_count + 1 WHERE id = $1`,
    [id]
  );
  await pool.query(
    `INSERT INTO click_logs (url_id, referrer, country, device, browser) VALUES ($1, $2, $3, $4, $5)`,
    [id, referrer, country, device, browser]
  );

  return { status: "ok", redirectTo: long_url, clicks: click_count + 1 };
};

export const getClickSourcesService = async (shortCode, userId) => {
  // Verify URL belongs to the user
  const urlResult = await pool.query(
    `SELECT id FROM urls WHERE short_code = $1 AND user_id = $2`,
    [shortCode, userId]
  );
  if (urlResult.rowCount === 0) return null;

  const urlId = urlResult.rows[0].id;

  // Aggregate referrers
  const referrers = await pool.query(
    `SELECT referrer AS name, COUNT(*)::int AS count
     FROM click_logs WHERE url_id = $1 AND referrer IS NOT NULL
     GROUP BY referrer ORDER BY count DESC LIMIT 10`,
    [urlId]
  );

  // Aggregate countries
  const countries = await pool.query(
    `SELECT country AS name, COUNT(*)::int AS count
     FROM click_logs WHERE url_id = $1 AND country IS NOT NULL
     GROUP BY country ORDER BY count DESC LIMIT 10`,
    [urlId]
  );

  // Aggregate devices
  const devices = await pool.query(
    `SELECT device AS name, COUNT(*)::int AS count
     FROM click_logs WHERE url_id = $1 AND device IS NOT NULL
     GROUP BY device ORDER BY count DESC LIMIT 10`,
    [urlId]
  );

  // Aggregate browsers
  const browsers = await pool.query(
    `SELECT browser AS name, COUNT(*)::int AS count
     FROM click_logs WHERE url_id = $1 AND browser IS NOT NULL
     GROUP BY browser ORDER BY count DESC LIMIT 10`,
    [urlId]
  );

  return {
    referrers: referrers.rows,
    countries: countries.rows,
    devices: devices.rows,
    browsers: browsers.rows,
  };
};

