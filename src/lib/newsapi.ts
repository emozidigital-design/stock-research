const NEWSAPI_BASE = "https://newsapi.org/v2/everything";

export interface RawNewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
  publishedAt: string;
}

// Restrict to Indian financial/business sources — the default (all English news)
// picks up unrelated lifestyle/travel articles that merely mention a company name.
const FINANCE_DOMAINS = [
  "moneycontrol.com",
  "livemint.com",
  "economictimes.indiatimes.com",
  "business-standard.com",
  "thehindubusinessline.com",
  "reuters.com",
  "financialexpress.com",
  "businesstoday.in",
  "cnbctv18.com",
  "ndtv.com",
].join(",");

/** Fetches recent articles matching `query` (company name), exact-phrase + finance-domain restricted. Free tier: 100 req/day, articles delayed ~24h. */
export async function fetchNewsForQuery(query: string, fromIso: string): Promise<RawNewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error("NEWS_API_KEY is not set in .env.local");

  const url = new URL(NEWSAPI_BASE);
  url.searchParams.set("q", `"${query}"`);
  url.searchParams.set("domains", FINANCE_DOMAINS);
  url.searchParams.set("from", fromIso);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`NewsAPI request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return (data.articles ?? []) as RawNewsArticle[];
}
