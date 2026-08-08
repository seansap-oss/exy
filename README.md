# EXY — Visual Classifieds Platform

A universal visual classifieds marketplace and social commerce aggregator. EXY categorises goods, services,
materials and businesses advertised on visual social media (Instagram Reels, YouTube Shorts, Facebook Reels,
TikTok) using lightweight embedded video players alongside traditional photo galleries and natively hosted media.

Edge-to-edge fluid web app — no phone frame simulator. The layout adapts to desktop browser windows and
collapses to a mobile view with a sticky bottom navigation bar.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production bundle
npm run verify       # lint + type-check + build  (CI gate)
npm run build:watch  # Module 7.1 — rebuild + verify on every file change
npm run preview      # serve the production build
```

Without environment variables the platform runs in a fully-functional **demo mode** backed by `localStorage`.
Add Supabase credentials to `.env.local` to switch every module to live persistence.

| Demo account         | Result                                        |
| -------------------- | --------------------------------------------- |
| `admin@exy.in`       | Super-Admin portal unlocked                   |
| anything@example.com | Standard user account                         |

Sign-up requires full name, unique username, email and an 8+ character password; phone is optional. The
account must be activated via the email link (in demo mode a "Simulate email confirmation" button stands in
for the Supabase mail).

---

## Module map

### 1 · Authentication & User Profiles — Supabase

`src/lib/supabase.ts`, `src/lib/auth.ts`, `src/components/AuthModal.tsx`

- Sign-up: full name, unique username (`^[a-z0-9_]{3,20}$`), email (primary login), password, optional phone
  with no OTP at MVP.
- Supabase Auth handles password hashing and email verification; the account activates through the emailed link.
- Roles: `user` (view, post, buy) and `admin` (Super-Admin portal). Enforced in SQL via `public.is_admin()`.
- Roadmap-ready: the driver interface in `auth.ts` accepts a phone-OTP implementation without touching callers.

### 1.4 · Seller Profiling (admin-side)

`src/components/AdminPanel.tsx → SellerProfiling`

Takes any existing user account and upgrades it with a verification badge (Verified Business / Verified
Inspector), a business description, and a generated custom storefront URL (`brand.exy.com` / `brand.exy.in`)
resolving to the in-PWA route `/store/:handle`.

### 2 · Visual Content Aggregation & Database Seeding

`src/components/AdminPanel.tsx → VisualSeeder`, `NativeUploaderPanel`, `src/lib/embeds.ts`, `src/lib/media.ts`

**2.1 Visual Database Seeder** — Story/Ad title, category, subcategory, location tag, seller assignment, plus
separate URL fields for Instagram Reels, YouTube Shorts and Facebook video with a poster/thumbnail override.
Includes a bulk reel importer (one URL per line).

| Platform  | Accepted input                           | Resolved embed                          |
| --------- | ---------------------------------------- | --------------------------------------- |
| YouTube   | `/shorts/ID`, `/watch?v=ID`, `youtu.be/` | `youtube.com/embed/ID`                  |
| Instagram | `/reel/ID`, `/p/ID`, `/tv/ID`            | `instagram.com/p/ID/embed/`             |
| Facebook  | `/reel/ID`, `/videos/ID`, `fb.watch/`    | `facebook.com/plugins/video.php?href=…` |
| TikTok    | `/@user/video/ID`                        | `tiktok.com/embed/v2/ID`                |

**2.2 Native Content Uploader** — direct file hosting with:

- **MP4 video** transcoded to **480p in the background** via canvas capture + `MediaRecorder`, with a live
  progress bar, automatic poster extraction and a compression-saving readout. Falls back to passthrough when
  the browser cannot record.
- **JPG / PNG** gallery images.
- **MP3 audio** producing an audio banner paired with a still poster.

Files upload to Supabase Storage buckets `exy-video`, `exy-image`, `exy-audio`; in demo mode they stay as
object URLs in the browser.

### 3 · Comprehensive Taxonomy

`src/data/categories.ts` — 10 top-level categories, 60+ subcategories, 240+ tags, each with a hand-drawn SVG
vector icon. Circular category action icons render their glyph at **200% scale** inside the orb container.

**3.2 Clone engine** (`CategoryCloner`) duplicates a whole category — or a single subcategory into any other
category — with optional subcategory and tag inheritance and a live tree preview.

### 4 · Global Ticker Tape Manager

`src/lib/ticker.ts`, `src/components/TickerTape.tsx`, `AdminPanel.tsx → TickerManager`

Horizontal scrolling bar between the header and hero, with a full admin module:

- **Playback** — start/pause, speed slider (1–100), loop toggle, visibility toggle. Hover always pauses.
- **Segments** — an ordered list of independently styled text segments; add, delete, reorder.
- **Per-segment styling** — bold, slanted/italic, custom text colour, *colour-head* (first word in an accent
  colour), and forced new lines.
- **Inline icon library** — 24 emojis across Trending / Awards / Commerce / Signals, insertable before or
  after any segment's text.
- **Global styling** — 4 font families, font size, default colour, 9 background presets.
- **Monetisation binding** — a minimum-tier selector (Standard / Comprehensive / Dealer). Free-tier ads can
  never enter the global rotation.

Both a live scrolling preview and a stacked multi-line preview render inside the editor.

### 5 · Monetisation & Payments

`src/lib/payments.ts`, `src/components/CheckoutModal.tsx`, `AdminPanel.tsx → DealerPricing`

| Tier | Name          | Price      | Ads   | Photos    | Video           |
| ---- | ------------- | ---------- | ----- | --------- | --------------- |
| 1    | Free          | ₹0         | 1/mo  | 3         | —               |
| 2    | Standard      | ₹200       | 3     | 4         | 1 embed, ticker |
| 3    | Comprehensive | ₹1,000/qtr | 10    | Unlimited | Full multimedia |
| 4    | Dealer        | Admin-set  | ∞     | ∞         | Bulk ingestion  |

Checkout supports **UPI (Google Pay, PhonePe, Paytm, custom VPA)**, **Net Banking** (6 banks) and **Cards**,
with 18% GST and a Razorpay-shaped order → payment → signature flow. Tier 4 pricing is issued per dealer from
the admin **Dealer Pricing** module and surfaces on that dealer's packages page.

> Production note: `processPayment()` is a client-side mock. Move `razorpay.orders.create` and signature
> verification server-side before going live — the secret key must never reach the browser.

### 6 · User Workflow, Feed, Messaging & Analytics

**6.1 Save Ad** — the heart icon requires sign-in; saves bind to `userId` and appear under Profile → Saved Ads.

**6.2 Visual Feed** (`src/components/VisualFeed.tsx`) — a cascading card stack showing 3–4 slides for depth.
Native video autoplays **muted**; one interaction starts embedded players. The **mute toggle sits bottom-right**
— tapping it (rather than swiping) activates audio. A second interaction opens the immersive **9:16 fullscreen
overlay** supporting Reels, Shorts and hosted MP4. Drag, arrow keys and `M` all work.

**6.3 Urgency badges** — a floating pill renders at ≥14 views today: *"🔥 Popular Ad! 14 buyers viewed this
today — contact seller before it's gone."*

**6.4 Phone privacy** — the Sell Flow "Hide Phone Number" toggle masks the number and routes every contact
button exclusively through in-app messaging. When disabled, the reveal button becomes a direct `tel:` call.

**6.5 In-app messenger** (`src/components/Messenger.tsx`) — Instagram/Marketplace-style threads with an
inbox list, unread counters, text and image sharing, and **private callback requests** that keep the buyer's
number masked until the seller taps "Approve & reveal".

**6.6 Seller analytics** (`src/lib/analytics.ts`) — an event log records `impression`, `view`, `click`,
`save`, `unsave` and `lead`. **A view only counts after 10 seconds of dwell**, measured both on the listing
page and per-card in the feed. The dashboard shows impressions, qualified views, saves, save-rate, leads and
conversation count, with a per-ad performance chart.

### 7 · Build & Deployment

- **7.1** `npm run build:watch` — a debounced watcher over `src/`, `public/`, `index.html` and the configs
  that re-runs the full build on every change and prints pass/fail with bundle size. `npm run verify` is the
  single CI gate (lint → type-check → build).
- **7.2** `vercel.json` — SPA rewrite `/(.*) → /index.html`, immutable asset caching, no-cache `sw.js`, and
  security headers.
- **7.3** PWA — `public/manifest.json` (standalone display, maskable icon, 3 app shortcuts) plus
  `public/sw.js` (network-first navigation, cache-first assets, third-party embeds never cached).

---

## Architecture

```
src/
  Prototype.tsx        App shell, routing, header, hero, browse, detail, storefront,
                       feed, messages, packages, profile, footer, sticky bottom nav
  prototype.css        Design system — Bright & Airy + Gold Black, responsive rules
  types/index.ts       Domain models for every module
  data/                categories.ts · sellers.ts · listings.ts (seed dataset)
  lib/
    supabase.ts        Client + table/bucket registry, live-or-demo detection
    auth.ts            Sign-up validation, email verification, roles, profile mapping
    media.ts           480p transcoding, poster extraction, Storage upload
    analytics.ts       Event log, 10s dwell rule, urgency thresholds
    messaging.ts       Threads, messages, unread counts, callback masking
    ticker.ts          Segment model, icon library, fonts, tier eligibility
    payments.ts        Package catalogue, tier limits, Razorpay mock
    embeds.ts          Social URL → iframe parser
    search.ts          Universal cross-category query engine
    format.ts          INR, compact counts, time-ago, phone masking
    storage.ts         Namespaced localStorage
  components/
    AdminPanel.tsx     8 modules: Ticker · Visual Seeder · Native Uploader ·
                       Seller Profiling · Category Cloner · Dealer Pricing ·
                       Listing Registry · Platform Metrics
    TickerTape.tsx     Scrolling + stacked ticker renderers
    VisualFeed.tsx     Cascading stack, mute control, 9:16 fullscreen player
    Messenger.tsx      Threaded chat with images and callback requests
    MediaUploader.tsx  Drag-drop uploader with compression progress
    SearchModal.tsx    Universal search with every mandatory filter
    SellFlow.tsx       4-step wizard with tier quotas and phone masking
    CheckoutModal.tsx  UPI / Net Banking / Card checkout
    AuthModal.tsx      Sign-in, sign-up and email verification
    VideoEmbed.tsx     Lazy click-to-play social embed
    Ui.tsx             Modal, ListingCard, CategoryOrb, Switch, Toast, Empty
    Icons.tsx          Stroke SVG icon set
supabase/schema.sql    Tables, enums, triggers, RLS policies, storage buckets
scripts/build-watch.mjs Automated build verification watcher
```

## Deployment

```bash
# 1. Provision the database
#    Paste supabase/schema.sql into the Supabase SQL editor and run it.

# 2. Configure the environment
cp .env.example .env.local   # add VITE_SUPABASE_URL / ANON_KEY / RAZORPAY_KEY_ID

# 3. Ship
npm run verify
vercel --prod
```
