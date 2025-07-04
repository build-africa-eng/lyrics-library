import { normalizeQuery } from "../utils/normalize.js";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function scrapeLyrics(req, db) {
  try {
    const body = await req.json();
    const { url, query: overrideQuery } = body;

    if (!url) {
      return new Response(JSON.stringify({ error: "Missing required field: url" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    let normalizedQuery = overrideQuery ? normalizeQuery(overrideQuery) : null;
    const now = Math.floor(Date.now() / 1000);

    // Check cache by normalized query if available
    if (normalizedQuery) {
      const cached = await db.prepare(`
        SELECT * FROM lyrics 
        WHERE query = ? AND created_at >= ?
      `).bind(normalizedQuery, now - MAX_AGE_SECONDS).first();

      if (cached) {
        return new Response(JSON.stringify({ cached: true, ...cached }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Cache": "HIT"
          }
        });
      }
    }

    // Scrape from backend (Render)
    const res = await fetch("https://lyrics-library-hnz7.onrender.com/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: "Scrape failed", detail: errText }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const scraped = await res.json();

    // Rebuild normalized query if not passed in
    if (!normalizedQuery && scraped.title && scraped.artist) {
      normalizedQuery = normalizeQuery(`${scraped.title} ${scraped.artist}`);
    }

    if (!scraped.lyrics || !normalizedQuery) {
      return new Response(JSON.stringify({ error: "Incomplete scrape result" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Save to database
    await db.prepare(`
      INSERT OR REPLACE INTO lyrics (
        query, title, artist, lyrics, source_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      normalizedQuery,
      scraped.title,
      scraped.artist,
      scraped.lyrics,
      scraped.source_url,
      now
    ).run();

    return new Response(JSON.stringify({
      cached: false,
      query: normalizedQuery,
      ...scraped
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
