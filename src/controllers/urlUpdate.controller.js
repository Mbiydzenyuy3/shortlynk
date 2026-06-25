import { pool } from '../config/db.js';

export const updateUrl = async (req, res) => {
  const { shortCode } = req.params;
  const { expireAt } = req.body;
  const userId = req.user.id;

  const expiry = expireAt == null ? null : new Date(expireAt);

  const result = await pool.query(
    `UPDATE urls
     SET expire_at = $1, updated_at = NOW()
     WHERE short_code = $2 AND user_id = $3
     RETURNING short_code, short_url, long_url, expire_at, click_count, created_at`,
    [expiry, shortCode, userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, message: 'URL not found.' });
  }

  return res.status(200).json({ success: true, data: result.rows[0] });
};

export const deleteUrl = async (req, res) => {
  const { shortCode } = req.params;
  const userId = req.user.id;

  const result = await pool.query(
    'DELETE FROM urls WHERE short_code = $1 AND user_id = $2',
    [shortCode, userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, message: 'URL not found.' });
  }

  return res.status(200).json({ success: true, message: 'URL deleted.' });
};
