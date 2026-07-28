import type { NewsTag } from "@/types/stock";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const TAGGING_MODEL = "google/gemini-2.5-flash";

const TAXONOMY: { tag: NewsTag; hint: string }[] = [
  { tag: "RESULTS", hint: "Quarterly/annual results, guidance" },
  { tag: "CORP_ACTION", hint: "IPO, buyback, split, bonus, dividend, QIP, rights issue, M&A" },
  { tag: "COMPLIANCE", hint: "SEBI action, audit qualification, auditor change, related-party disclosure" },
  { tag: "ANNOUNCEMENT", hint: "NSE/BSE filings, new orders/contracts, capex, board decisions" },
  { tag: "GOVT_POLICY", hint: "Regulatory/policy change, tax, sector-specific govt action" },
  { tag: "GLOBAL", hint: "Global macro/geopolitical events affecting the company/sector" },
  { tag: "MARKET_TREND", hint: "Sector rotation, index rebalancing, broad market moves" },
  { tag: "BROKER_CALL", hint: "Rating change, target price revision" },
  { tag: "INSIDER_BULK", hint: "Insider/promoter trades, bulk/block deals" },
];

const SYSTEM_PROMPT = `You are a tagging engine for an Indian stock market news feed. Given a headline and optional description, assign one or more tags from this fixed taxonomy:
${TAXONOMY.map((t) => `- ${t.tag}: ${t.hint}`).join("\n")}

Rules:
- Only use tags from the list above, exact spelling.
- Assign the smallest set of tags that accurately describes the news item (usually 1, at most 2).
- If nothing fits, return an empty array.
- Respond with strict JSON only: {"tags": ["TAG1", "TAG2"]}`;

interface TagResult {
  tags: NewsTag[];
}

const VALID_TAGS = new Set(TAXONOMY.map((t) => t.tag));

export async function tagHeadline(headline: string, description?: string | null): Promise<NewsTag[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set in .env.local");

  const userContent = description ? `Headline: ${headline}\nDescription: ${description}` : `Headline: ${headline}`;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/emozidigital-design/stock-research",
      "X-Title": "Stock Research Dashboard - News Tagger",
    },
    body: JSON.stringify({
      model: TAGGING_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 100,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return [];

  let parsed: TagResult;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed.tags)) return [];
  return parsed.tags.filter((t): t is NewsTag => VALID_TAGS.has(t as NewsTag));
}
