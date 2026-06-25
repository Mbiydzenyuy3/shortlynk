// src/services/url.service.js
import { pool } from "../config/db.js";
import generateShortCode from "../utils/shortCodeGen.js";
import { checkUrlSafety } from "../utils/safeBrowsing.js";

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

export const handleRedirectService = async (shortCode) => {
  const result = await pool.query(
    `SELECT id, long_url, expire_at, click_count FROM urls WHERE short_code = $1`,
    [shortCode]
  );
  if (result.rowCount === 0) return { status: "not_found" };

  const { long_url, expire_at, click_count, id } = result.rows[0];
  if (expire_at && new Date() > new Date(expire_at))
    return { status: "expired" };

  // Update click count
  await pool.query(
    `UPDATE urls SET click_count = click_count + 1 WHERE id = $1`,
    [id]
  );
  await pool.query(`INSERT INTO click_logs (url_id) VALUES ($1)`, [id]);

  return { status: "ok", redirectTo: long_url, clicks: click_count + 1 };
};
