# PRD: Indian Stock Analysis Dashboard
**Version:** 1.0 | **Date:** July 27, 2026 | **Owner:** Gaurav | **Build target:** Claude Code

---

## 1. Product Summary

A watchlist-driven dashboard for Indian equities (NSE/BSE/MCX) that surfaces price, fundamentals, ownership, F&O, and categorized news per stock — plus a twice-daily automated email digest (9:30 AM pre-market / 3:30 PM post-close).

**Non-goals (v1):** order execution/trading, portfolio P&L tracking, backtesting, mobile app.

---

## 2. Users

- Primary: Gaurav — active F&O + equity trader, needs institutional-grade data density, plain-text/actionable output, no fluff.

---

## 3. Core Requirements

### 3.1 Dashboard (Watchlist View)

| Field | Source | Refresh |
|---|---|---|
| CMP, day change %, volume vs 20D avg | Market data API | Real-time (15s–1min) |
| 52W high/low | Market data API | EOD |
| RSI(14), 20/50/200 DMA position | Computed | EOD |
| News flag badge (icon per category, see 3.3) | News pipeline | Intraday polling |
| F&O: OI change direction, PCR | Options API | EOD (or real-time if licensed) |
| Risk alert badge | Rule engine | Event-triggered |

Watchlist must support: add/remove stock, sort by any column, filter by sector/flag/F&O-only.

### 3.2 Stock Detail Page (per-stock deep dive)

| Section | Contents |
|---|---|
| Snapshot | CMP, range, mcap, sector, P/E, P/B, div yield, mgmt (CEO/CFO/Promoter) |
| Price history | 5Y chart; revenue/EBITDA/PAT 3–5Y trend; last 4Q table (Revenue/EBITDA/PAT/EPS/Margin) |
| Balance sheet | Debt, D/E, cash, OCF/FCF trend, ROE/ROCE, credit rating |
| Valuation | P/E, P/B, EV/EBITDA vs 3Y/5Y historical band; peer comp table (4–5 peers); broker target table + consensus |
| Technicals | Support/resistance (3 each), DMA status, RSI, MACD, 52W distance |
| Volume/liquidity | Volume vs avg, delivery %, avg daily turnover |
| F&O (if applicable) | OI calls/puts, 5-session OI trend, PCR, max pain, IV percentile |
| Ownership | Shareholding pattern (3Q trend): Promoter (+pledge), FII, DII, Retail; bulk/block deals; insider (SAST) trades |
| Institutional tracker | Broker ratings table (Buy/Hold/Sell count), target price list, consensus TP, smart-money signal (🟢🟡🔴) |
| News feed | Chronological, tagged per taxonomy (3.3), source + date on every item |
| Corporate actions | Dividend/split/bonus/buyback history + upcoming |
| Risk matrix | Table: Risk category / specific risk / severity / probability / impact |
| Verdict strip | Rule-based tag (Bullish/Neutral/Bearish) + 1-line reason — **not a fabricated AI claim, must trace to underlying data** |

### 3.3 News Taxonomy (tags applied to every news item — feeds both dashboard badges and email digest sections)

| Tag | Examples |
|---|---|
| `RESULTS` | Quarterly/annual results, guidance |
| `CORP_ACTION` | IPO, buyback, split, bonus, dividend, QIP, rights issue, M&A |
| `COMPLIANCE` | SEBI action, audit qualification, auditor change, related-party disclosure |
| `ANNOUNCEMENT` | NSE/BSE filings, new orders/contracts, capex, board decisions |
| `GOVT_POLICY` | Regulatory/policy change, tax, sector-specific govt action |
| `GLOBAL` | Global macro/geopolitical events affecting the company/sector |
| `MARKET_TREND` | Sector rotation, index rebalancing, broad market moves |
| `BROKER_CALL` | Rating change, target price revision |
| `INSIDER_BULK` | Insider/promoter trades, bulk/block deals |

Every item: `{tag(s), headline, source, date, stock(s) affected}`.

### 3.4 Email Digest (9:30 AM & 3:30 PM IST)

| Section | 9:30 AM | 3:30 PM |
|---|---|---|
| Global/overnight cues | Yes | Recap |
| Stock news (tagged, last 12h) | Yes | Yes |
| Results/announcements | Yes | Yes |
| Broker rating changes | Yes | Yes |
| Price/volume | Opening levels | Close, volume, delivery % |
| F&O OI shift | — | Yes |
| Risk alerts | Yes | Yes |

Delivery: automated (no manual trigger). Plain-text-first email body (per Gaurav's stated preference against heavy formatted files), optional HTML version with tables.

---

## 4. Data Sourcing — Requirements & Constraints

| Data type | Requirement | Notes |
|---|---|---|
| Real-time/EOD price, OHLCV | NSE/BSE licensed feed | See §4.1 for vendor options |
| F&O (OI, option chain, Greeks) | NFO/BFO/MCX feed | Needed for §3.2 F&O section |
| Fundamentals (financials, ratios) | Screener.in-style data or vendor API | Cross-check 2 sources per Gaurav's existing workflow |
| Shareholding/bulk-block/insider | BSE/NSE corporate filings | Often only scrapeable, not API'd cleanly |
| News | NewsAPI/RSS + broker research aggregation | Needs NLP tagging layer (§3.3) |
| Broker target prices | Manual/aggregator (no clean public API exists) | Consider a lightweight internal tracker fed by news parsing |

### 4.1 Market Data API Options (as of mid-2026)

| Provider | Coverage | Cost model | Best for |
|---|---|---|---|
| **Zerodha Kite Connect** | NSE/BSE/NFO/MCX | <cite index="12-1">Free personal API tier launched by Zerodha in 2026 for individual use</cite>; ~₹2,000/mo for full commercial data | If Gaurav already has a Zerodha account — reuses existing login, F&O + equity in one feed |
| **Dhan (DhanHQ)** | NSE/BSE/NFO/MCX | <cite index="9-1">Positioned as API-first and automation-friendly, commonly compared against Kite/Upstox/Fyers</cite> | Best documented rate limits, good for a coded pipeline |
| **Upstox Developer API** | NSE/BSE/NFO | <cite index="8-1">₹10 per executed order via API (extended through March 2026); read-only market data typically free/cheap</cite> | Fine if only pulling data, not trading |
| **TrueData** | NSE/BSE/NFO/MCX + Greeks | Paid, tiered | <cite index="5-1">Dedicated market-data-only vendor with WebSocket feeds, full option chain and Greeks (IV, Delta, Theta, Vega, Gamma) in one call</cite> — best fit for the F&O deep-dive section without needing a trading account |
| **Global Datafeeds (GFDL)** | NSE/BSE/MCX/NCDEX | Paid | <cite index="3-1">Authorized realtime data vendor since 2010, offers 10ms latency DotNet/COM APIs across all Indian exchanges Gaurav trades</cite> |
| **Indian Stock Exchange API (indianapi.in)** | NSE/BSE | Paid, simpler REST | <cite index="7-1">Bundles company profiles, prices, technicals, financials, shareholding patterns, corporate actions, and news in one API</cite> — good for the fundamentals/ownership sections specifically |

**Recommendation:** Dhan or Kite Connect for live price + F&O (reuse Gaurav's existing broker relationship, lowest incremental cost) + indianapi.in or Screener.in scraping for fundamentals/shareholding, since no single vendor cleanly covers both real-time trading data and deep fundamentals.

⚠️ **Compliance note:** NSE data terms restrict redistribution/display outside licensed use — confirm the chosen vendor's license permits a personal dashboard (not a concern for solo use, becomes one if ever shared/sold).

---

## 5. Tech Stack (recommended, as of mid-2026)

| Layer | Recommendation | Why |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + React 19 + TypeScript** | Server components reduce client bundle for data-dense tables; best-supported by Claude Code |
| UI components | **shadcn/ui + Tailwind CSS** | Fast to build data tables, badges, cards; no heavy design system overhead |
| Charts | **Recharts** or **TradingView Lightweight Charts** (for candlestick/technical overlays) | Lightweight Charts is purpose-built for OHLC/volume/DMA overlays |
| Backend/API | **Next.js API routes** or a separate **Node/Express (or Python/FastAPI)** service if doing heavy scraping/scheduled jobs | FastAPI preferred if fundamentals scraping is Python-based (pandas, BeautifulSoup) |
| Database | **Supabase (Postgres)** | Already in your connected tools; handles auth, storage, and scheduled jobs (pg_cron) in one place |
| Scheduled jobs (digest emails, EOD data pulls) | **Supabase Edge Functions + pg_cron**, or **Make.com/n8n** for lower-code orchestration | n8n if you want visual workflow control without writing job schedulers |
| Real-time price updates | **WebSocket** (native from Kite/Dhan/TrueData) → pushed to frontend via **Supabase Realtime** or **Server-Sent Events** | Avoid polling for live price; use WS from the data vendor |
| News ingestion + tagging | **Cron-based fetch (NewsAPI/RSS) → LLM tagging call (OpenRouter, cheap model e.g. Haiku/Llama/Gemini Flash) → Postgres** | OpenRouter gives model flexibility/redundancy and competitive per-token pricing to tag every news item against the §3.3 taxonomy in real time |
| Email delivery | **Resend** or **SendGrid** via scheduled function | Resend has the cleanest API/React-email templating |
| Hosting | **Vercel** (frontend) + **Supabase** (backend/db) | Matches your connected Vercel/Supabase MCP tools already available in this environment |
| Auth | **Supabase Auth** | Single-user now, extensible if ever multi-user |

**Data flow:** Market data vendor (WebSocket) → Postgres (time-series table) → Next.js frontend (Realtime subscription) for live dashboard; separate cron pipeline → News fetch → OpenRouter LLM tagging → Postgres → digest generator → Resend at 09:30/15:30 IST.

---

## 6. Non-Functional Requirements

- **Latency:** dashboard price refresh ≤ 1 min during market hours (real-time WS preferred over polling)
- **Accuracy:** every fundamental/ownership figure must be traceable to source + date; no fabricated numbers — mirrors Gaurav's existing "state 'not found' rather than fabricate" standard
- **Timezone:** all timestamps IST; market-hours-aware (9:15 AM–3:30 PM IST, NSE holiday calendar)
- **Circuit breaker handling:** flag when a stock is frozen at upper/lower circuit — feed can go quiet, don't show stale price as live
- **Data retention:** min 3Y OHLCV history for technical/valuation-band charts

---

## 7. Build Phases

| Phase | Scope |
|---|---|
| 1 | Watchlist + live price + basic technicals (DMA, RSI) |
| 2 | Stock detail page: fundamentals, valuation, peer comp |
| 3 | Ownership/shareholding + news tagging pipeline |
| 4 | F&O module (OI, PCR, max pain, IV) |
| 5 | Email digest automation (9:30/3:30) |
| 6 | Risk matrix + smart-money signal + verdict engine |

---

## 8. Open Questions (resolve before Phase 1 build)

1. Fixed watchlist size, or full NSE/BSE searchable universe?
2. Which market data vendor account does Gaurav already hold (Zerodha/Dhan/Upstox) — reuse that for API access?
3. Solo-user only, or eventual multi-user/shared access?
4. Budget ceiling for paid data feeds (TrueData/GFDL run into thousands/month for full F&O + Greeks)?
