# Safe Browsing + URL Deduplication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block malicious URLs via Google Safe Browsing before saving, and return existing shortcodes to authenticated users who re-submit the same URL.

**Architecture:** Both features live entirely in the backend service layer. `checkUrlSafety` is a standalone utility called at the top of `createShortUrlService`. Deduplication is a `SELECT`-before-`INSERT` guard in the same service function. No schema changes, no frontend changes.

**Tech Stack:** Node.js ESM, PostgreSQL (pg pool), Google Safe Browsing Lookup API v4, Jest + `node --experimental-vm-modules`

## Global Constraints

- ES module syntax (`import`/`export`) throughout — no `require()`
- Jest runs via: `node --experimental-vm-modules node_modules/.bin/jest <testfile>` (install dev deps locally with `npm install --include=dev` if needed)
- `logError` / `logWarn` imported from `../utils/logger.js`
- `GOOGLE_SAFE_BROWSING_API_KEY` is a backend-only env var — never referenced in frontend code
- Do not modify any frontend files
- Keep all error message strings exactly as specified — the frontend displays them verbatim

---

## Task 1: Safe Browsing Utility + Controller Integration

**Files:**
- Create: `src/utils/safeBrowsing.js`
- Create: `src/tests/safeBrowsing.test.js`
- Modify: `src/controllers/guestUrl.controller.js`
- Modify: `src/controllers/url-controller.js`
- Modify: `src/services/urls.service.js`
- Modify: `.env`

**Interfaces:**
- Produces: `checkUrlSafety(url: string): Promise<void>` — throws `Error('UNSAFE_URL')` if flagged, returns `undefined` if safe or if check is skipped

---

- [ ] **Step 1: Write failing tests for `safeBrowsing.js`**

Create `src/tests/safeBrowsing.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node --experimental-vm-modules node_modules/.bin/jest src/tests/safeBrowsing.test.js 2>&1 | tail -15
```

Expected: `FAIL` — `Cannot find module '../utils/safeBrowsing.js'`

- [ ] **Step 3: Create `src/utils/safeBrowsing.js`**

```js
import { logWarn, logError } from './logger.js';

const SAFE_BROWSING_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

export async function checkUrlSafety(url) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    logWarn('Safe Browsing key missing — skipping check');
    return;
  }

  try {
    const response = await fetch(`${SAFE_BROWSING_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'shortlynk', clientVersion: '1.0' },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
    });

    const data = await response.json();

    if (data.matches && data.matches.length > 0) {
      throw new Error('UNSAFE_URL');
    }
  } catch (err) {
    if (err.message === 'UNSAFE_URL') throw err;
    logWarn('Safe Browsing check failed — skipping:', err.message);
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
node --experimental-vm-modules node_modules/.bin/jest src/tests/safeBrowsing.test.js 2>&1 | tail -10
```

Expected: `5 passed`

- [ ] **Step 5: Check that `logWarn` exists in logger.js**

```bash
grep -n "logWarn\|exports\|export" src/utils/logger.js
```

If `logWarn` is not exported, add it. Open `src/utils/logger.js` and add:
```js
export const logWarn = (msg, ...args) => console.warn(`${timestamp()} [WARN] ${msg}`, ...args);
```
(match the style of existing `logInfo`/`logError` exports in that file)

- [ ] **Step 6: Integrate `checkUrlSafety` into `createShortUrlService`**

Open `src/services/urls.service.js`. Add the import at the top:
```js
import { checkUrlSafety } from './safeBrowsing.js';
```

Wait — `safeBrowsing.js` is in `src/utils/`, not `src/services/`. The correct import path from `src/services/urls.service.js` is:
```js
import { checkUrlSafety } from '../utils/safeBrowsing.js';
```

Add this as the first line of `createShortUrlService`, before any existing logic:
```js
export const createShortUrlService = async ({
  longUrl,
  shortCode,
  expireAt,
  userId,
}) => {
  // Reject malicious URLs before doing anything else
  await checkUrlSafety(longUrl);

  const customCode = shortCode || generateShortCode(6);
  // ... rest of existing function unchanged
```

- [ ] **Step 7: Surface `UNSAFE_URL` error as 400 in `guestUrl.controller.js`**

Open `src/controllers/guestUrl.controller.js`. Replace the catch block:

```js
  } catch (err) {
    if (err.message === 'UNSAFE_URL') {
      return res.status(400).json({
        success: false,
        message: 'This URL has been flagged as unsafe by Google Safe Browsing and cannot be shortened.',
      });
    }
    logError('Error creating guest short URL:', err);
    res.status(500).json({ message: 'Server error creating short URL' });
  }
```

- [ ] **Step 8: Surface `UNSAFE_URL` error as 400 in `url-controller.js`**

Open `src/controllers/url-controller.js`. In `createShortUrl`, add the `UNSAFE_URL` case to the existing catch block:

```js
  } catch (err) {
    if (err.message === 'UNSAFE_URL') {
      return res.status(400).json({
        success: false,
        message: 'This URL has been flagged as unsafe by Google Safe Browsing and cannot be shortened.',
      });
    }
    if (err.message.includes('short Code conflict')) {
      return res.status(409).json({ message: 'Custom code already in use' });
    }
    logError('Error creating short URL:', err);
    res.status(500).json({ message: 'Server error creating short URL' });
  }
```

- [ ] **Step 9: Add env var placeholder to `.env`**

Open `.env` (the root backend `.env`). Add to the Google OAuth section:
```
# ─── Google Safe Browsing ─────────────────────────────────
# Get a key at: https://developers.google.com/safe-browsing/v4/get-started
GOOGLE_SAFE_BROWSING_API_KEY=
```

- [ ] **Step 10: Run full test suite to confirm no regressions**

```bash
node --experimental-vm-modules node_modules/.bin/jest 2>&1 | tail -10
```

Expected: all existing tests pass + 5 new safeBrowsing tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/utils/safeBrowsing.js src/tests/safeBrowsing.test.js \
        src/services/urls.service.js \
        src/controllers/guestUrl.controller.js \
        src/controllers/url-controller.js \
        src/utils/logger.js \
        .env
git commit -m "feat: reject malicious URLs via Google Safe Browsing API"
```

---

## Task 2: URL Deduplication for Authenticated Users

**Files:**
- Modify: `src/services/urls.service.js`
- Create: `src/tests/deduplication.test.js`

**Interfaces:**
- Consumes: `checkUrlSafety` from Task 1 (already integrated)
- `createShortUrlService` signature unchanged: `({ longUrl, shortCode, expireAt, userId })`
- New behaviour: when `userId` is non-null and the same `longUrl` already exists for that user, return existing row (or update it) instead of inserting

---

- [ ] **Step 1: Write failing deduplication tests**

Create `src/tests/deduplication.test.js`:

```js
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
```

> **Note:** These tests hit a real database. They require `DB_NAME_TEST` (or `DATABASE_URL`) to be set and the schema to be applied. Run them in CI or locally with a configured test DB.

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node --experimental-vm-modules node_modules/.bin/jest src/tests/deduplication.test.js 2>&1 | tail -15
```

Expected: tests fail — deduplication logic does not exist yet, second call inserts a duplicate.

- [ ] **Step 3: Add deduplication logic to `createShortUrlService`**

Open `src/services/urls.service.js`. After the `await checkUrlSafety(longUrl)` call and after the `const customCode = shortCode || generateShortCode(6)` line, add:

```js
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
```

> **Important:** This replaces the entire `createShortUrlService` function. Remove the old version completely — do not keep both.

- [ ] **Step 4: Run deduplication tests**

```bash
node --experimental-vm-modules node_modules/.bin/jest src/tests/deduplication.test.js 2>&1 | tail -15
```

Expected: 5 passed (requires real DB — skip if no test DB configured locally; these will run in CI).

- [ ] **Step 5: Run full test suite**

```bash
node --experimental-vm-modules node_modules/.bin/jest 2>&1 | tail -10
```

Expected: all tests pass including safeBrowsing tests from Task 1.

- [ ] **Step 6: Commit**

```bash
git add src/services/urls.service.js src/tests/deduplication.test.js
git commit -m "feat: deduplicate URLs per authenticated user, guests always get new code"
```
