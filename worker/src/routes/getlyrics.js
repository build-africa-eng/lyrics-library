// /worker/src/routes/getlyrics.js
import { normalizeQuery } from "../utils/normalize";
import { scrapeLyrics } from "./scrapelyrics"; // Import your internal fallback

export async function getLyrics(req, db) {
  try {
    const urlObj = new URL(req.url);
    const query = urlObj.searchParams.get('query');
    const url = urlObj.searchParams.get('url'); // optional scrape url

    if (!query) {
      const results = await db.prepare(`SELECT * FROM lyrics ORDER BY created_at DESC LIMIT 100`).all();
      return new Response(JSON.stringify({ lyrics: results.results || [], total: results.results?.length || 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const normalizedQuery = normalizeQuery(query);

    let result = await db.prepare(`SELECT * FROM lyrics WHERE query = ? ORDER BY created_at DESC LIMIT 1`)
      .bind(normalizedQuery)
      .first();

    if (!result && url) {
      // Auto fallback to scrape
      const scrapeReq = new Request("http://worker.internal/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, query }),
      });

      const scrapeResp = await scrapeLyrics(scrapeReq, db);
      const data = await scrapeResp.json();
      if (scrapeResp.ok) {
        return new Response(JSON.stringify({ found: true, ...data }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ error: "Scrape failed", detail: data.detail }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (!result) {
      return new Response(JSON.stringify({
        error: "Lyrics not found",
        query: normalizedQuery,
        suggestion: "Try adding the lyrics first or check your spelling"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ found: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Database error", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
