# System Architecture — Stock Analysis Dashboard
**Stack:** Claude Code (build) · Supabase (DB/Auth/Functions) · Cloudflare (CDN) · Vercel (hosting)

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
                  ┌───────────────┐           ┌───────────────┐          ┌───────────────┐
                  │   Supabase    │           │   Supabase    │          │  External APIs │
                  │   Postgres    │◀─────────▶│  Edge Funcs   │◀────────▶│  (market data, │
                  │  (data store) │           │  (cron jobs)  │          │  news, email)   │
                  └───────────────┘           └───────────────┘          └───────────────┘
                          ▲
                          │
                  ┌───────────────┐
                  │ Supabase Auth │
                  │ (user + email │
                  │  opt-in)      │
                  └───────────────┘
```

**Flow:** Cloudflare fronts DNS/CDN/caching for static assets → Vercel serves Next.js app (frontend + API routes) → Supabase handles Postgres (data), Auth (user/email opt-in), and Edge Functions (scheduled jobs: price sync, news fetch/tag, email digest).

---

## 2. Component Responsibilities

| Layer | Tool | Role |
|---|---|---|
| DNS + CDN | **Cloudflare** | Domain routing, edge caching of static assets/images, DDoS/bot protection, faster global load |
| Hosting | **Vercel** | Deploys Next.js (frontend + serverless API routes), preview deployments per Claude Code commit |
| Database | **Supabase Postgres** | Stores stocks, price history, news, shareholding, F&O snapshots, user subscriptions |
| Auth | **Supabase Auth** | Manages "Get daily emails" opt-in — ties email address to watchlist stock |
| Scheduled jobs | **Supabase Edge Functions + pg_cron** | Price/news sync jobs, digest builder, email dispatch at 9:30/15:30 IST |
| Realtime | **Supabase Realtime** | Pushes live price updates to dashboard without polling |
| Email delivery | **Resend** (via Edge Function) | Sends digest emails to opted-in users |
| Build | **Claude Code** | Scaffolds Next.js app, writes API routes, Supabase schema/migrations, Edge Functions |

---

## 3. Build Phases

### Phase 0 — Foundation Setup
- Claude Code scaffolds Next.js 15 project (App Router, TypeScript, Tailwind, shadcn/ui)
- Connect repo to Vercel (auto-deploy on push)
- Provision Supabase project: Postgres schema (stocks, price_history, news, shareholding, fo_data, users, subscriptions)
- Point domain DNS through Cloudflare → Vercel
- **Exit criteria:** blank deployed app reachable via custom domain, Supabase connected

### Phase 1 — Core Dashboard (Watchlist + Search)
- Build watchlist grid UI (per design)
- Integrate market data API (price, day change, volume) → Supabase table → frontend via Supabase Realtime
- Search bar: search any NSE/BSE stock (not just watchlist)
- **Exit criteria:** live price grid working, search returns stock detail page

### Phase 2 — Stock Detail Page
- Fundamentals, valuation, technicals, ownership sections built as per functionality file
- Data pipelines: scheduled Edge Function pulls EOD fundamentals/shareholding into Postgres
- **Exit criteria:** clicking any stock shows full detail page with real data

### Phase 3 — News Pipeline + Tagging
- Edge Function: cron fetch news (RSS/NewsAPI) → OpenRouter (cheap model, e.g. Haiku/Llama/Gemini Flash via OpenRouter) tags per taxonomy → store in Postgres
- News feed component on stock detail page, filterable by tag
- **Exit criteria:** news auto-refreshes and shows correctly tagged items

### Phase 4 — F&O Module
- Integrate options data (OI, PCR, max pain, IV) — EOD or real-time depending on vendor tier
- Build F&O panel UI
- **Exit criteria:** F&O data visible for all F&O-eligible stocks in watchlist

### Phase 5 — Email Opt-In + Digest System
- Add **"Get daily emails"** CTA on stock detail page (post-search) → Supabase Auth captures email + stock, stores in `subscriptions` table
- Build digest assembly function (per stock, per subscribed user)
- Two Edge Function cron triggers: 9:30 AM IST (pre-market) and 3:30 PM IST (post-close)
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

## 4. Email Opt-In Flow ("Get daily emails")

```
User searches stock → Stock Detail page loads
        │
        ▼
"Get daily emails" button visible on page
        │
        ▼
User clicks → modal: enter email (or use logged-in Supabase Auth email)
        │
        ▼
Supabase Auth: create/match user → insert row in `subscriptions`
  { user_id, stock_symbol, subscribed_at, active: true }
        │
        ▼
Confirmation: "You'll get [Stock] updates at 9:30 AM & 3:30 PM"
        │
        ▼
──── Twice daily (Edge Function cron) ────
        │
        ▼
Query `subscriptions` → group by user → for each user's stock list:
  pull latest price/news/F&O/risk data (from Postgres, already synced)
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

**Subscription table schema:**

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → Supabase Auth user |
| stock_symbol | text | e.g. `RELIANCE.NS` |
| subscribed_at | timestamp | |
| active | boolean | toggle without deleting row |
| frequency | text | `both` / `am_only` / `pm_only` (future flexibility) |

---

## 5. Data Sync Schedule (Supabase Edge Functions / pg_cron)

| Job | Frequency | Purpose |
|---|---|---|
| Live price sync | Every 1 min (market hours) | Dashboard real-time updates |
| EOD fundamentals/shareholding | Daily, post 4 PM IST | Balance sheet, ownership refresh |
| News fetch + tag | Every 30 min | Keeps news feed + email digest current |
| F&O snapshot | EOD (or intraday if licensed) | OI/PCR/max pain refresh |
| Email digest — AM | 9:30 AM IST | Pre-market subscriber email |
| Email digest — PM | 3:30 PM IST | Post-close subscriber email |

---

## 6. Environment/Secrets (Claude Code to scaffold `.env`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MARKET_DATA_API_KEY=
NEWS_API_KEY=
RESEND_API_KEY=
OPENROUTER_API_KEY=    # for news tagging (LLM via OpenRouter)
CLOUDFLARE_ZONE_ID=
```
