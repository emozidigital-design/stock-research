import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { fetchNewsForQuery } from "@/lib/newsapi";
import { tagHeadline } from "@/lib/openrouter-tagger";
import { stocks } from "@/lib/mock-data";

export const maxDuration = 60;

/** Deterministic doc ID from URL so re-fetching the same article is a no-op write, not a duplicate. */
function articleDocId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (Math.imul(31, hash) + url.charCodeAt(i)) | 0;
  }
  return `a${(hash >>> 0).toString(36)}`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const newsCollection = adminDb.collection("news");

  let fetched = 0;
  let written = 0;
  let skipped = 0;
  let discarded = 0;
  const errors: string[] = [];

  for (const stock of stocks) {
    try {
      const articles = await fetchNewsForQuery(stock.name, sinceIso);
      fetched += articles.length;

      for (const article of articles) {
        const docId = articleDocId(article.url);
        const docRef = newsCollection.doc(docId);
        const existing = await docRef.get();

        if (existing.exists) {
          const data = existing.data();
          const stockSymbols: string[] = data?.stockSymbols ?? [];
          if (!stockSymbols.includes(stock.symbol)) {
            await docRef.update({ stockSymbols: [...stockSymbols, stock.symbol] });
          }
          skipped++;
          continue;
        }

        const tags = await tagHeadline(article.title, article.description);
        if (tags.length === 0) {
          discarded++;
          continue;
        }

        await docRef.set({
          headline: article.title,
          source: article.source?.name ?? "Unknown",
          url: article.url,
          date: article.publishedAt,
          tags,
          stockSymbols: [stock.symbol],
          createdAt: new Date().toISOString(),
        });
        written++;
      }
    } catch (err) {
      errors.push(`${stock.symbol}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ fetched, written, skipped, discarded, errors });
}
