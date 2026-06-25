import { createShortUrlService } from '../services/urls.service.js';
import { pool } from '../config/db.js';

// Mock checkUrlSafety so tests don't need a real Safe Browsing key
jest.mock('../utils/safeBrowsing.js', () => ({
  checkUrlSafety: jest.fn().mockResolvedValue(undefined),
}));

const TEST_USER_A = '00000000-0000-0000-0000-000000000001';
const TEST_USER_B = '00000000-0000-0000-0000-000000000002';
const TEST_URL = 'https://example.com/dedup-test-' + Date.now();

beforeAll(async () => {
  // Insert test users to satisfy the FK constraint on urls.user_id
  await pool.query(
    `INSERT INTO users (id, username, email, password)
     VALUES ($1, 'testuser_a', 'testa@test.local', 'x'),
            ($2, 'testuser_b', 'testb@test.local', 'x')
     ON CONFLICT (id) DO NOTHING`,
    [TEST_USER_A, TEST_USER_B]
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM urls WHERE long_url = $1', [TEST_URL]);
  await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [TEST_USER_A, TEST_USER_B]);
  await pool.end();
});

describe('URL deduplication', () => {
  it('creates a new short URL for first-time submission', async () => {
    const result = await createShortUrlService({
      longUrl: TEST_URL,
      shortCode: null,
      expireAt: null,
      userId: TEST_USER_A,
    });
    expect(result.short_code).toBeDefined();
    expect(result.long_url).toBe(TEST_URL);
  });

  it('returns the same short_code when same authenticated user submits same URL again', async () => {
    const first = await createShortUrlService({
      longUrl: TEST_URL,
      shortCode: null,
      expireAt: null,
      userId: TEST_USER_A,
    });
    const second = await createShortUrlService({
      longUrl: TEST_URL,
      shortCode: null,
      expireAt: null,
      userId: TEST_USER_A,
    });
    expect(second.short_code).toBe(first.short_code);
  });

  it('updates expiry when same user resubmits with a new expireAt', async () => {
    const expireAt = new Date(Date.now() + 86400000).toISOString(); // +1 day
    const result = await createShortUrlService({
      longUrl: TEST_URL,
      shortCode: null,
      expireAt,
      userId: TEST_USER_A,
    });
    expect(new Date(result.expire_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('gives a different short_code to a different authenticated user for the same URL', async () => {
    const resultA = await createShortUrlService({
      longUrl: TEST_URL,
      shortCode: null,
      expireAt: null,
      userId: TEST_USER_A,
    });
    const resultB = await createShortUrlService({
      longUrl: TEST_URL,
      shortCode: null,
      expireAt: null,
      userId: TEST_USER_B,
    });
    expect(resultB.short_code).not.toBe(resultA.short_code);
  });

  it('always creates a new short_code for guest users (userId null)', async () => {
    const first = await createShortUrlService({
      longUrl: TEST_URL,
      shortCode: null,
      expireAt: null,
      userId: null,
    });
    const second = await createShortUrlService({
      longUrl: TEST_URL,
      shortCode: null,
      expireAt: null,
      userId: null,
    });
    expect(second.short_code).not.toBe(first.short_code);
  });
});
