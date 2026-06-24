# Shortlynk UI Redesign — Design Spec

**Date:** 2026-06-24
**Goal:** Elevate the UI from 0/10 to 9.8/10
**Inspiration:** short.io (primary), bitly.com, rebrandly.com
**Approach:** Approach A — Dark hero, white body

---

## 1. Design System

### Colors

| Token | Value | Usage |
|---|---|---|
| `color-dark` | `#1A1A1A` | Hero bg, nav on dark, footer |
| `color-white` | `#FFFFFF` | Body bg, cards, auth form |
| `color-surface` | `#F8F8F8` | Alternating sections, input bg |
| `color-border` | `#E5E5E5` | Card borders, input borders, dividers |
| `color-yellow` | `#D4860B` | Primary CTA, short URL text, active states |
| `color-yellow-hover` | `#B8720A` | Button hover state |
| `color-yellow-tint` | `#FEF3E2` | Icon backgrounds, badge chips |
| `color-text-primary` | `#1A1A1A` | Body headings, card titles |
| `color-text-secondary` | `#6B7280` | Descriptions, muted labels |
| `color-text-on-dark` | `#FFFFFF` | Text on dark hero/footer |
| `color-text-muted-dark` | `#A0A0A0` | Stat labels on dark sections |
| `color-error` | `#EF4444` | Form validation errors |

### Typography

Font family: **Inter** (Google Fonts). Applied globally via `index.css`.

| Scale | Size | Weight | Usage |
|---|---|---|---|
| Hero headline | 64px | 700 | Landing page H1 |
| Section heading | 36px | 700 | Feature/how-it-works H2 |
| Card heading | 20px | 600 | Card titles, form headings |
| Body | 16px | 400 | Paragraphs, descriptions |
| Small / label | 14px | 500 | Stats labels, badges, form hints |

Line height: `1.25` for headings, `1.6` for body.

### Spacing

8px base grid: `8 · 16 · 24 · 32 · 48 · 64 · 96px`.

### Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)` | Default card |
| `shadow-card-hover` | `0 4px 16px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.08)` | Card on hover |
| `shadow-button` | `0 2px 8px rgba(212,134,11,0.35)` | Burnt yellow CTA buttons |

### Border Radius

- Cards: `12px`
- Inputs, buttons: `8px`
- Small badges/chips: `6px`

### Icon Library

**Lucide React** — all icons use this library. No emoji in the UI. Key icons:

| Icon | Component | Usage |
|---|---|---|
| Link | `<Link2 />` | Logo, empty state |
| Analytics | `<BarChart2 />` | Click count, features section |
| Shield | `<ShieldCheck />` | Security feature card |
| Copy | `<Copy />` | Copy short URL button |
| Check | `<Check />` | Copy success feedback (2s) |
| External | `<ExternalLink />` | Open link in new tab |
| Delete | `<Trash2 />` | Delete link |
| Logout | `<LogOut />` | Logout button |
| Search | `<Search />` | Search input icon |
| Calendar | `<Calendar />` | Expiry date |
| Zap | `<Zap />` | Speed stat |
| ChevronRight | `<ChevronRight />` | Navigation arrows |

---

## 2. Landing Page (`/`)

### Navigation Bar

- Position: sticky top, `z-50`
- Background: `#1A1A1A` (inherits hero dark)
- Left: `<Link2 />` icon in burnt yellow + "Shortlynk" in white bold `20px`
- Right: "Login" ghost button (white border, white text, `8px 20px` padding) + "Get Started" filled burnt yellow button
- On scroll past hero: nav gains `backdrop-blur` and subtle bottom border

### Hero Section

- Background: `#1A1A1A`, full viewport height (`100vh`)
- Content centered vertically and horizontally
- Headline: "Shorten. Share. Track." — `64px`, `700`, white
- Subheadline: "Turn long, ugly URLs into powerful short links you can manage and measure." — `20px`, `400`, `#A0A0A0`, max-width `560px`
- Input row: white background input (`border-radius: 8px`, `height: 56px`) + burnt yellow "Shorten" button (`height: 56px`, `shadow-button`)
- Input placeholder: "Paste your long URL here..."
- Below input, hint text: "No account needed to try it" — `14px`, `#A0A0A0`

**Result state (after anonymous shorten):**
- A result card appears below the input with a `300ms` fade-in
- `4px` burnt yellow left border, white background, `border-radius: 8px`, `shadow-card`
- Short URL displayed in burnt yellow bold `18px`
- `<Copy />` button — switches to `<Check />` for 2 seconds on click, then reverts
- `<ExternalLink />` icon button to open in new tab
- Below the card: "Want to track clicks & manage all your links? Sign up free →" — `14px`, `#A0A0A0`, yellow arrow `<ChevronRight />`

**Stats row** (bottom of hero, above the white section break):
- Three stats: `10M+ Links Created` · `99.9% Uptime` · `< 50ms Redirect Speed`
- Number: `32px`, `700`, white
- Label: `14px`, `#A0A0A0`
- Separated by vertical dividers

### Features Section

- Background: `#FFFFFF`
- Section heading: "Everything you need to share smarter" — `36px`, `700`, centered
- 3-column card grid (`gap: 32px`, collapses to 1-col on mobile)
- Each card: `border: 1px solid #E5E5E5`, `border-radius: 12px`, `padding: 32px`, hover lifts with `shadow-card-hover`
- Icon: Lucide icon in `#FEF3E2` circle (`48px` circle, `24px` icon in `#D4860B`)
- Card title: `20px`, `600`, `#1A1A1A`
- Card description: `16px`, `400`, `#6B7280`

Cards:
1. `<Link2 />` — **Custom Short Links** — "Create branded, memorable short URLs that represent you."
2. `<BarChart2 />` — **Click Analytics** — "Track clicks, countries, devices, and referrers in real time."
3. `<ShieldCheck />` — **Secure & Reliable** — "Every link is spam-filtered and served over HTTPS."

### How It Works Section

- Background: `#F8F8F8`
- Section heading: "Up and running in seconds" — `36px`, `700`, centered
- 3 horizontal steps connected by a dashed line (`border-top: 2px dashed #E5E5E5`)
- Step number: `40px` burnt yellow circle, white number inside, `700`
- Step title: `20px`, `600`
- Step description: `16px`, `#6B7280`

Steps:
1. **Paste your URL** — "Drop any long URL into the input field above."
2. **Click Shorten** — "We generate a clean, compact link instantly."
3. **Share & Track** — "Copy it anywhere. Sign up to see who's clicking."

### CTA Banner

- Background: `#1A1A1A`
- Heading: "Start shortening for free" — `36px`, `700`, white, centered
- Subtext: "No credit card required. No account needed to try." — `#A0A0A0`
- Button: "Get Started Free" — burnt yellow, large (`56px` height), `shadow-button`

### Footer

- Background: `#1A1A1A`
- Left: Logo + copyright `© 2026 Shortlynk`
- Right: Links — Features · Dashboard · Login · Register
- Top border: `1px solid rgba(255,255,255,0.1)`
- Text: `#A0A0A0`, links lighten to white on hover

---

## 3. Auth Pages (`/login`, `/register`)

### Layout

- Full viewport, two-column split: left `#1A1A1A` (45%), right white (55%)
- White form card (`480px` wide) floats centered across the split with `shadow-card-hover`
- On mobile (`< 768px`): full white background, card is full-width with `24px` padding

### Left Dark Panel

- Shortlynk logo (large, `32px`, white)
- Tagline: "The smart way to share links"
- Two trust stats: `10M+ Links Created` · `99.9% Uptime`
- Stats in white number + `#A0A0A0` label

### Right Form Card

- Logo top-center: `<Link2 />` burnt yellow + "Shortlynk"
- Page title: "Welcome back" (login) / "Create your account" (register) — `24px`, `700`
- Input fields: `1px solid #E5E5E5` border, `8px` radius, `48px` height, on focus → burnt yellow border + `box-shadow: 0 0 0 3px rgba(212,134,11,0.15)`
- Error state: `color-error` border + small error text below field (`14px`, red)
- Primary button: full-width burnt yellow, `48px` height, `shadow-button`
- Divider: `── or ──` with horizontal lines
- Google OAuth button: white background, `1px solid #E5E5E5`, Google SVG icon, "Continue with Google" — full-width
- Toggle link: "Don't have an account? Register →" / "Already have an account? Login →"

### Register-specific

- Extra field: Username (above email)
- Password confirmation field below password

---

## 4. Dashboard (`/dashboard`)

### Navigation

- Background: `#FFFFFF`, `1px solid #E5E5E5` bottom border, sticky
- Left: `<Link2 />` burnt yellow + "Shortlynk" bold
- Right: User initials avatar (burnt yellow circle, `36px`, white initials) + "Logout" ghost button with `<LogOut />` icon

### Shorten Bar

- Full-width white card, `shadow-card`, `24px` padding, `12px` radius
- Label: "Shorten a new link" — `16px`, `600`
- Input (`flex-1`, `48px` height) + burnt yellow "Shorten" button side by side
- Result state (inline, `300ms` fade-in): same result card as landing — burnt yellow left border, short URL, copy + open buttons

### Links Grid

- Section header row: "My Links (n)" left · search input right
- Search input: `<Search />` icon inside, `border: 1px solid #E5E5E5`, filters cards live
- 2-column grid on desktop (`gap: 24px`), 1-column on mobile

**Link card:**
- Short URL: `18px`, `700`, burnt yellow — top of card
- Long URL: `14px`, `#6B7280`, truncated with ellipsis — below short URL
- Stats row: `<BarChart2 />` + click count · `<Calendar />` + expiry date or "Never"
- Action row: `[Copy]` (burnt yellow outline button) · `[Open <ExternalLink />]` (ghost) · `[Delete <Trash2 />]` (ghost red, turns solid on hover)
- Hover: `translateY(-2px)` + `shadow-card-hover`, `200ms` ease transition

**Empty state:**
- Large `<Link2 />` icon in `#FEF3E2` `80px` circle, centered
- Heading: "No links yet" — `20px`, `600`
- Subtext: "Paste a URL above to create your first short link."

**Loading state:**
- 4 skeleton cards with animated shimmer (`background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)`, `background-size: 200% 100%`, `animation: shimmer 1.5s infinite`)

---

## 5. All Links Page (`/urls`)

Same as dashboard card grid but:
- No shorten bar at top
- Full page heading row: "All Links" left · "＋ Shorten New" burnt yellow button right (routes to dashboard)
- Controls row below heading: search input (left) + sort dropdown (right): Newest · Oldest · Most Clicks · Expiring Soon
- Link count shown: "12 links" in muted grey beside the sort
- Cards show creation date alongside click count

**Skeleton loading:** 6 skeleton cards (2 rows of 3 on desktop).

---

## 6. Guest Shortening — Backend Requirement

The landing page allows anonymous URL shortening. This requires a new backend endpoint:

- `POST /api/shorten/guest` — no auth middleware
- Accepts `{ longUrl }` in body
- Validates URL format
- Creates short code and returns `{ shortened_URL }` same as the authenticated endpoint
- Guest links are not tied to any user — they will not appear in any dashboard
- Apply the existing rate limiter to this route

The existing authenticated `POST /api/shorten` endpoint remains unchanged.

---

## 7. Component Breakdown

| Component | File | Responsibility |
|---|---|---|
| `Navbar` | `components/Navbar.jsx` | Replaces `Header.jsx` + `LandingHeader.jsx` — one component, two variants (dark/light) via prop |
| `Footer` | `components/Footer.jsx` | Updated dark footer |
| `HeroInput` | `components/HeroInput.jsx` | Anonymous shorten input + result card (landing page) |
| `ShortenBar` | `components/ShortenBar.jsx` | Authenticated shorten input + inline result (dashboard) |
| `LinkCard` | `components/LinkCard.jsx` | Single link card — used in both dashboard and /urls |
| `SkeletonCard` | `components/SkeletonCard.jsx` | Shimmer loading card |
| `EmptyState` | `components/EmptyState.jsx` | Reusable empty state with icon + text + optional CTA |
| `AuthLayout` | `components/AuthLayout.jsx` | Split dark/white wrapper used by login + register |

Pages remain as-is (`landing.jsx`, `login.jsx`, `register.jsx`, `dashboard.jsx`, `urls.jsx`) — they become thin wrappers composing the above components.

---

## 8. CSS Strategy

- All design tokens defined as CSS custom properties in `index.css` under `:root`
- Tailwind CSS utility classes used for layout, spacing, flexbox/grid
- Component-specific styles in co-located `.module.css` files only when Tailwind is insufficient (e.g. shimmer animation, focus ring glow)
- No inline styles except dynamic values (e.g. user-generated content truncation)
- Inter font loaded via `<link>` in `index.html`

---

## 9. Responsive Breakpoints

| Breakpoint | Behaviour |
|---|---|
| `< 480px` (small mobile) | Single column everything, hero headline `28px`, input + button stack vertically, auth card no padding sides, stats row stacks vertically, footer links stack |
| `480px–640px` (mobile) | 1-col card grid, full-width inputs, auth card full-width, hero headline `36px`, stats row stays horizontal |
| `640px–1024px` (tablet) | 2-col feature cards, 1-col link grid |
| `> 1024px` (desktop) | Full 3-col features, 2-col link grid, split auth layout |
