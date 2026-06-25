# Spec: Malicious URL Detection + URL Deduplication

**Date:** 2026-06-25
**Branch:** development

---

## Overview

Two backend features added to `createShortUrlService`:

1. **Malicious URL Detection** — check every URL against Google Safe Browsing before saving it; reject flagged URLs with a clear 400 error.
2. **URL Deduplication** — authenticated users who submit the same URL twice get their existing shortcode back (with optional update); guests always get a new shortcode.

---

## Feature 1: Malicious URL Detection

### New File: `src/utils/safeBrowsing.js`

Exports a single async function:

```js
checkUrlSafety(url: string): Promise<void>
```

- Calls Google Safe Browsing Lookup API v4:
  `POST https://safebrowsing.googleapis.com/v4/threatMatches:find?key=<API_KEY>`
- Threat types checked: `MALWARE`, `SOCIAL_ENGINEERING`, `UNWANTED_SOFTWARE`, `POTENTIALLY_HARMFUL_APPLICATION`
- Platform: `ANY_PLATFORM`
- Entry type: `URL`

### Behaviour

| Condition | Action |
|---|---|
| `GOOGLE_SAFE_BROWSING_API_KEY` not set | Log `[WARN] Safe Browsing key missing — skipping check` and return (fail open) |
| Google API returns matches | Throw `Error('UNSAFE_URL')` |
| Google API errors / times out | Log `[WARN] Safe Browsing check failed` and return (fail open — do not block users when external service is down) |
| URL is clean | Return normally |

### Integration Point

Called at the top of `createShortUrlService`, before the deduplication lookup and before any INSERT — applies to both authenticated and guest flows.

### Error surfaced to user

HTTP `400`:
```json
{
  "success": false,
  "message": "This URL has been flagged as unsafe by Google Safe Browsing and cannot be shortened."
}
```

### New Environment Variable

`GOOGLE_SAFE_BROWSING_API_KEY` — backend only (Railway env var + `.env` template). Never exposed to the frontend.

---

## Feature 2: URL Deduplication

### Rules

| User type | Same URL exists for this user? | customCode / expireAt provided? | Result |
|---|---|---|---|
| Authenticated | No | — | INSERT new row, new shortcode |
| Authenticated | Yes | Neither | Return existing row as-is |
| Authenticated | Yes | One or both | UPDATE existing row, return updated row |
| Guest (`userId = null`) | — | — | Always INSERT new row, new shortcode |

### Implementation in `createShortUrlService`

After the safe browsing check, before the INSERT:

```
IF userId is not null:
  SELECT * FROM urls WHERE long_url = $1 AND user_id = $2
  IF row found:
    IF customCode or expireAt provided:
      UPDATE urls SET short_code = $newCode, expire_at = $expireAt, updated_at = NOW()
      WHERE id = $existingId
      RETURN updated row
    ELSE:
      RETURN existing row
  ENDIF
ENDIF
-- fall through to INSERT
```

**Guest shortcode:** guests always fall through to the INSERT path. No lookup is performed for `userId = null` because guests have no persistent identity — two different guests submitting the same URL must each get their own trackable entry.

### No schema changes required

The existing `urls` table already has all required columns: `long_url TEXT`, `user_id UUID`, `short_code`, `expire_at`, `updated_at`.

---

## Files Changed

| File | Change |
|---|---|
| `src/utils/safeBrowsing.js` | **Create** — Safe Browsing API wrapper |
| `src/services/urls.service.js` | **Modify** — call `checkUrlSafety`, add deduplication lookup before INSERT |
| `src/controllers/guestUrl.controller.js` | **Modify** — surface `UNSAFE_URL` error as 400 |
| `src/controllers/url-controller.js` | **Modify** — surface `UNSAFE_URL` error as 400 |
| `.env` | **Modify** — add `GOOGLE_SAFE_BROWSING_API_KEY=` placeholder |

---

## Testing

- Unit test `safeBrowsing.js`: mock `fetch`, assert throws on matches, returns on empty, returns on API error (fail-open)
- Integration tests on `POST /api/shorten/guest` and `POST /api/shorten`:
  - Flagged URL → 400 with correct message
  - Safe URL → 201
- Deduplication tests on `POST /api/shorten` (authenticated):
  - Same URL second time → 200 with same `short_code`
  - Same URL + new `expireAt` → 200 with updated expiry
  - Two different users, same URL → different `short_code`
  - Guest same URL twice → different `short_code` each time
