# System Architecture — Stock Analysis Dashboard
**Stack:** Claude Code (build) · Firebase (DB/Auth/Functions) · Cloudflare (CDN) · Vercel (hosting)

---

## 1. High-Level Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Cloudflare │─────▶│    Vercel    │─────▶│  Next.js App     │
│  (CDN/DNS)  │      │  (hosting)   │      │  (frontend+API)  │
└─────────────┘      └──────────────┘      └────────┬─────────┘
                                                      │
                          ┌───────────────────────────┼───────────────────────────┐
                          ▼                           ▼                           ▼
                  ┌───────────────┐           ┌────────────────┐          ┌───────────────┐
                  │   Firestore   │           │ Cloud Functions │          │  External APIs │
                  │  (data store) │◀─────────▶│ + Cloud Scheduler│◀───────▶│  (market data, │
                  │               │           │  (cron jobs)    │          │  news, email)   │
                  └───────────────┘           └────────────────┘          └───────────────┘
                          ▲
                          │
                  ┌───────────────┐
                  │ Firebase Auth │
                  │ (user + email │
                  │  opt-in)      │
                  └───────────────┘
```

**Flow:** Cloudflare fronts DNS/CDN/caching for static assets → Vercel serves Next.js app (frontend + API routes) → Firebase handles Firestore (data), Auth (user/email opt-in), and Cloud Functions on a Cloud Scheduler cadence (scheduled jobs: price sync, news fetch/tag, email digest).

---

## 2. Component Responsibilities

| Layer | Tool | Role |
|---|---|---|
| DNS + CDN | **Cloudflare** | Domain routing, edge caching of static assets/images, DDoS/bot protection, faster global load |
| Hosting | **Vercel** | Deploys Next.js (frontend + serverless API routes), preview deployments per Claude Code commit |
| Database | **Firebase Firestore** | Stores stocks, price history, news, shareholding, F&O snapshots, user subscriptions |
| Auth | **Firebase Auth** | Manages "Get daily emails" opt-in — ties email address to watchlist stock |
| Scheduled jobs | **Cloud Scheduler + Cloud Functions (2nd gen)** | Price/news sync jobs, digest builder, email dispatch at 9:30/15:30 IST |
| Realtime | **Firestore `onSnapshot` listeners** | Pushes live price updates to dashboard without polling |
| Email delivery | **Resend** (via Cloud Function) | Sends digest emails to opted-in users |
| Build | **Claude Code** | Scaffolds Next.js app, writes API routes, Firestore data model, Cloud Functions |

**Why Firebase over Supabase:** Supabase's free tier caps at 2 organizations/active projects, already consumed by other projects on this account. Firebase's free (Spark) tier is unused and sufficient for a solo-user dashboard. The tradeoff: Firestore is a document store, not relational Postgres — schema below is denormalized accordingly (see §3 note on news fan-out), and scheduled jobs move from in-database `pg_cron` to Cloud Scheduler-triggered Cloud Functions.

---

## 3. Data Model (Firestore)

Firestore has no joins, so the relational shape in `src/types/stock.ts` is denormalized into collections/subcollections rather than normalized tables:

| Collection | Shape | Notes |
|---|---|---|
| `stocks/{symbol}` | One doc per stock — snapshot, ratios, technicals, F&O snapshot (latest), ownership trend, verdict, risk flags, broker calls, corporate actions | Matches the `Stock` type closely; read as a single doc per dashboard panel load |
| `stocks/{symbol}/priceHistory/{date}` | OHLCV per day (subcollection) | Time series, queried by date range for charts/DMA/RSI computation |
| `news/{newsId}` | `{tags[], headline, source, date, stockSymbols[]}` | Top-level collection (not per-stock) since one item can tag multiple stocks; queried via `array-contains` on `stockSymbols` to avoid duplicating documents per stock |
| `subscriptions/{id}` | `{userId, stockSymbol, subscribedAt, active, frequency}` | Mirrors the PRD's subscription table exactly; `frequency` = `both` / `am_only` / `pm_only` |
| `symbolMaster/{symbol}` | `{symbol, name, exchange, sector, isFo}` | Full NSE/BSE searchable universe (per user decision — not just the fixed watchlist), synced periodically from the exchange instrument list, decoupled from live detail data |

**Full-universe search implication:** the search bar resolves against `symbolMaster` (thousands of rows, refreshed occasionally), while `stocks/{symbol}` detail docs are only populated/synced for whatever the user actually watches or opens — no need to pre-sync live data for the entire exchange.

---

## 4. Build Phases

### Phase 0 — Foundation Setup
- Claude Code scaffolds Next.js 15 project (App Router, TypeScript, Tailwind, shadcn/ui)
- Connect repo to Vercel (auto-deploy on push)
- Provision Firebase project: Firestore data model (`stocks`, `news`, `subscriptions`, `symbolMaster`), enable Auth, enable Cloud Functions
- Point domain DNS through Cloudflare → Vercel
- **Exit criteria:** blank deployed app reachable via custom domain, Firebase connected

### Phase 1 — Core Dashboard (Watchlist + Search)
- Build watchlist grid UI (per design)
- Integrate market data API (price, day change, volume) → Firestore `stocks/{symbol}` → frontend via Firestore `onSnapshot`
- Search bar: search full NSE/BSE universe via `symbolMaster`, not just watchlist
- **Exit criteria:** live price grid working, search returns stock detail page for any listed symbol

### Phase 2 — Stock Detail Page
- Fundamentals, valuation, technicals, ownership sections built as per functionality file
- Data pipelines: scheduled Cloud Function pulls EOD fundamentals/shareholding into Firestore
- **Exit criteria:** clicking any stock shows full detail page with real data

### Phase 3 — News Pipeline + Tagging
- Cloud Function (Cloud Scheduler cron): fetch news (RSS/NewsAPI) → OpenRouter (cheap model, e.g. Haiku/Llama/Gemini Flash via OpenRouter) tags per taxonomy → store in Firestore `news` collection
- News feed component on stock detail page, filterable by tag
- **Exit criteria:** news auto-refreshes and shows correctly tagged items
- **Note:** fully decoupled from live price/market data — safe to build and ship before Phase 1's live feed is wired up

### Phase 4 — F&O Module
- Integrate options data (OI, PCR, max pain, IV) — EOD or real-time depending on vendor tier
- Build F&O panel UI
- **Exit criteria:** F&O data visible for all F&O-eligible stocks in watchlist

### Phase 5 — Email Opt-In + Digest System
- Add **"Get daily emails"** CTA on stock detail page (post-search) → Firebase Auth captures email + stock, stores in `subscriptions` collection
- Build digest assembly function (per stock, per subscribed user)
- Two Cloud Scheduler-triggered Cloud Functions: 9:30 AM IST (pre-market) and 3:30 PM IST (post-close)
- Resend integration for delivery
- **Exit criteria:** test subscription receives correctly formatted email at both times

### Phase 6 — Risk Matrix + Verdict Engine
- Rule-based logic: pledge %, auditor change, valuation band position → auto-flag risk severity
- Verdict strip (Bullish/Neutral/Bearish) computed from technicals + valuation + news sentiment tags
- **Exit criteria:** every stock detail page shows populated risk matrix + verdict

### Phase 7 — Polish + Performance
- Cloudflare caching rules tuned for static/semi-static content (logos, historical charts)
- Vercel edge config for API route caching where safe (e.g., fundamentals, not live price)
- Load testing, error states, empty states
- **Exit criteria:** production-ready, sub-2s load time on dashboard

---

## 5. Email Opt-In Flow ("Get daily emails")

```
User searches stock → Stock Detail page loads
        │
        ▼
"Get daily emails" button visible on page
        │
        ▼
User clicks → modal: enter email (or use logged-in Firebase Auth email)
        │
        ▼
Firebase Auth: create/match user → create doc in `subscriptions`
  { userId, stockSymbol, subscribedAt, active: true }
        │
        ▼
Confirmation: "You'll get [Stock] updates at 9:30 AM & 3:30 PM"
        │
        ▼
──── Twice daily (Cloud Scheduler → Cloud Function) ────
        │
        ▼
Query `subscriptions` → group by user → for each user's stock list:
  pull latest price/news/F&O/risk data (from Firestore, already synced)
        │
        ▼
Build digest (per §3.4 of prior PRD — tagged news, price, risk, F&O)
        │
        ▼
Resend API → send email
        │
        ▼
User can unsubscribe per-stock from email footer link → updates
`subscriptions.active = false`
```

**Subscription document schema (`subscriptions/{id}`):**

| Field | Type | Notes |
|---|---|---|
| id | string (doc ID) | auto-generated |
| userId | string | FK → Firebase Auth UID |
| stockSymbol | string | e.g. `RELIANCE.NS` |
| subscribedAt | timestamp | |
| active | boolean | toggle without deleting doc |
| frequency | string | `both` / `am_only` / `pm_only` (future flexibility) |

---

## 6. Data Sync Schedule (Cloud Scheduler → Cloud Functions)

| Job | Frequency | Purpose |
|---|---|---|
| Live price sync | Every 1 min (market hours) | Dashboard real-time updates |
| EOD fundamentals/shareholding | Daily, post 4 PM IST | Balance sheet, ownership refresh |
| News fetch + tag | Every 30 min | Keeps news feed + email digest current |
| F&O snapshot | EOD (or intraday if licensed) | OI/PCR/max pain refresh |
| Symbol master sync | Weekly (or on-demand) | Keeps full NSE/BSE search universe current |
| Email digest — AM | 9:30 AM IST | Pre-market subscriber email |
| Email digest — PM | 3:30 PM IST | Post-close subscriber email |

---

## 7. Environment/Secrets (Claude Code to scaffold `.env`)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=   # for Admin SDK in Cloud Functions / server routes
MARKET_DATA_API_KEY=
NEWS_API_KEY=
RESEND_API_KEY=
OPENROUTER_API_KEY=    # for news tagging (LLM via OpenRouter)
CLOUDFLARE_ZONE_ID=
```
