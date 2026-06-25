# Dashboard Table Redesign

> **Reference:** short.io dashboard screenshot provided by user (2026-06-25)

## Goal

Replace the current card-grid dashboard with a short.io-style table layout: full-width ShortenBar at top, followed by a white panel containing a searchable, paginated table of links with inline expiry editing.

## Brand Constraints

- Dark: `#1A1A1A` (`var(--color-dark)`)
- Accent: `#D4860B` (`var(--color-yellow)`)
- All existing CSS tokens (`var(--color-border)`, `var(--color-surface)`, `var(--shadow-card)`, etc.) remain unchanged
- No new design tokens required

## Excluded Features

- Domain management (not in this app)
- Tags / Conversions columns
- Server-side pagination (client-side only)
- "Per page" dropdown (fixed at 20 rows per page)

---

## Component Architecture

### New components

| File | Responsibility |
|------|---------------|
| `frontend/src/components/LinkTable.jsx` | Owns `<table>`, column headers, search filter, pagination, passes rows to `LinkRow` |
| `frontend/src/components/LinkRow.jsx` | Single `<tr>`; has `editMode` state for inline expiry editor |
| `frontend/src/components/SkeletonRow.jsx` | Placeholder `<tr>` shown during loading (3 rows) |

### Retired components

| File | Status |
|------|--------|
| `frontend/src/components/LinkCard.jsx` | Retired — no longer used anywhere |
| `frontend/src/components/SkeletonCard.jsx` | Retired — replaced by `SkeletonRow` |

### Modified files

| File | Change |
|------|--------|
| `frontend/src/components/ShortenBar.jsx` | Restyle to full-width pill input (no logic change) |
| `frontend/src/pages/dashboard.jsx` | Replace card grid with `<LinkTable>`, wire `onEdit` handler |
| `src/routes/url.js` | Add `PATCH /:shortCode` route |
| `src/controllers/urlUpdate.controller.js` | New controller for expiry update |

---

## ShortenBar Restyled

Visual changes only — no logic changes:

- Container: full-width, height 52px, `background: white`, `border: 1px solid var(--color-border)`, `border-radius: 10px`, `display: flex`, `align-items: center`, `padding: 0 8px 0 16px`
- Text input: flex-grow 1, no border, no outline, font-size 15px, placeholder "Paste URL here" in `var(--color-text-secondary)`
- Submit button: `btn btn--primary`, fixed to right side inside container, height 36px
- Result line (short URL output after shorten): shown below the bar, same as now

---

## Table Panel

### Panel container

- `background: white`, `border: 1px solid var(--color-border)`, `border-radius: 12px`, `box-shadow: var(--shadow-card)`, `overflow: hidden`

### Panel header (inside panel, above table)

- Left: `"All links"` in 15px 600-weight + `(N)` count in `var(--color-text-secondary)` where N = total filtered count
- Right: search `<input>` using existing `.input-field` class, width 240px, placeholder "Search or filter..."
- Padding: 16px 20px, `border-bottom: 1px solid var(--color-border)`

### Table structure

```
<table style="width:100%; border-collapse:collapse">
  <thead>  ← var(--color-surface) bg, 12px uppercase, letter-spacing 0.05em
    <tr>
      <th>Created</th>
      <th>Short link</th>
      <th>Original link</th>
      <th>Clicks</th>
      <th></th>   ← actions column, no label
    </tr>
  </thead>
  <tbody>
    <LinkRow /> × N   ← or <SkeletonRow /> × 3 during loading
  </tbody>
</table>
```

- `<thead>` row height: 40px, color: `var(--color-text-secondary)`
- `<tbody>` row height: 56px, `border-bottom: 1px solid var(--color-border)`, hover: `background: var(--color-surface)`
- All cells: `padding: 0 16px`, `vertical-align: middle`

### Column specs

| Column | Width | Render |
|--------|-------|--------|
| Created | 120px | `"Jun 25, 10:40 AM"` — `toLocaleDateString` + `toLocaleTimeString` |
| Short link | 180px | `var(--color-yellow)` 14px semibold text + inline `Copy` icon; clicking icon copies to clipboard and flips to `Check` for 2s |
| Original link | auto (flex) | Truncated with `text-overflow: ellipsis`, `white-space: nowrap`, `overflow: hidden`, `max-width: 320px`; full URL in `title` attribute |
| Clicks | 80px, centered | Plain number |
| Actions | 140px, right-aligned | Icon buttons — see below |

### Row actions

All action buttons: 28×28px icon-only buttons, transparent background, `var(--color-text-secondary)` color, `border-radius: 6px`; opacity 0.3 at rest, 1 on row hover (CSS transition).

| Icon | Lucide | Behaviour |
|------|--------|-----------|
| Copy | `Copy` | Copies `short_url` to clipboard; briefly shows `Check` icon |
| Open | `ExternalLink` | Opens `short_url` in new tab |
| Edit | `Pencil` | Switches row to edit mode (see below) |
| Delete | `Trash2` | Red hover; calls `onDelete(shortCode)` |

### Inline edit mode (`LinkRow`)

Triggered by clicking the pencil icon. The row expands:

- All data cells hidden; a single `<td colSpan={5}>` takes the full width
- Contents: short URL label (read-only) + `<input type="date">` pre-filled with current `expire_at` (or empty if null) + **Save** (`btn--primary`, 32px height) + **Cancel** (`btn--ghost-light`, 32px height)
- **Save** calls `PATCH /api/shorten/:shortCode` with `{ expireAt: inputValue || null }`; on success, updates local row state and exits edit mode; on error, shows inline error text
- **Cancel** exits edit mode with no change

---

## Backend: PATCH Endpoint

### Route

```
PATCH /api/shorten/:shortCode
Authorization: Bearer <token>
Content-Type: application/json
Body: { "expireAt": "2026-07-01" }   ← ISO date string, or null to clear
```

### Controller: `src/controllers/urlUpdate.controller.js`

```
1. Extract shortCode from req.params, expireAt from req.body, userId from req.user.id
2. UPDATE urls SET expire_at=$1, updated_at=NOW()
   WHERE short_code=$2 AND user_id=$3
   RETURNING short_code, short_url, long_url, expire_at, click_count, created_at
3. If rowCount === 0 → 404 (not found or not owned)
4. Return 200 with updated row
```

### Route wiring (`src/routes/url.js`)

```js
router.patch('/:shortCode', authMiddleware, updateUrl);
```

No schema changes — `expire_at` column already exists.

---

## Pagination

- Client-side only, fixed 20 rows per page
- `LinkTable` manages `currentPage` state (integer, 1-indexed)
- Slices `filteredUrls` as `filteredUrls.slice((page-1)*20, page*20)`
- Pagination bar: right-aligned below table, 14px; `< prev` and `next >` arrows + numbered page buttons; active page button uses `var(--color-yellow)` background with white text

---

## Search / Filter

- Single text input in the panel header
- Filters both `short_url` and `long_url` (case-insensitive substring match)
- Resetting search resets `currentPage` to 1
- Existing filter logic in `dashboard.jsx` moves into `LinkTable`

---

## Empty & Loading States

- **Loading:** 3 `<SkeletonRow>` elements inside `<tbody>` — each row has shimmer-animated `<td>` cells matching column widths
- **Empty (no links):** existing `<EmptyState>` component rendered inside a `<tbody><tr><td colSpan={5}>` cell
- **Empty search:** inline "No links match your search" message in the same pattern

---

## Data Flow

```
dashboard.jsx
  ├── state: urls[], loading, (search moved to LinkTable)
  ├── fetchUrls() → GET /api/shorten/my-urls
  ├── handleDelete(shortCode) → DELETE /api/shorten/:shortCode → filter state
  ├── handleEdit(shortCode, expireAt) → PATCH /api/shorten/:shortCode → update state in-place
  └── renders: <Navbar> + <ShortenBar onShortened={fetchUrls}> + <LinkTable urls={urls} loading={loading} onDelete={handleDelete} onEdit={handleEdit}>

LinkTable.jsx
  ├── props: urls, loading, onDelete, onEdit
  ├── state: search, currentPage
  ├── derived: filteredUrls (search filter applied), pagedUrls (slice), totalPages
  └── renders: panel header + <table> + pagination bar

LinkRow.jsx
  ├── props: url object, onDelete, onEdit
  ├── state: editMode (bool), editDate (string), editError (string), copyDone (bool)
  └── renders: normal <tr> OR edit <tr> depending on editMode
```

---

## Out of Scope

- Analytics deep-dive page (clicks chart, referrers) — future feature
- Custom short code editing — only expiry date is editable
- Bulk select / bulk delete
- Sorting by column header
- Mobile responsive breakpoints (table scrolls horizontally on small screens)
