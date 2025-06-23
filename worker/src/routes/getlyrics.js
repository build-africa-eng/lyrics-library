// /worker/src/routes/getlyrics.js
import { normalizeQuery } from "../utils/normalize";

export async function getLyrics(req, db) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    const scrapeURL = url.searchParams.get('url'); // optional: source URL

    if (!query) {
      const results = await db.prepare(`
        SELECT * FROM lyrics 
        ORDER BY created_at DESC 
        LIMIT 100
      `).all();

      return new Response(JSON.stringify({ 
        lyrics: results.results || [],
        total: results.results?.length || 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const normalizedQuery = normalizeQuery(query);
    const now = Math.floor(Date.now() / 1000);

    // 1. Try DB first
    let result = await db.prepare(`
      SELECT * FROM lyrics 
      WHERE query = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(normalizedQuery).first();

    // 2. If not in DB, try scrape
    if (!result && scrapeURL) {
      const res = await fetch("https://lyrics-library-hnz7.onrender.com/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeURL })
      });

      if (res.ok) {
        const scraped = await res.json();

        if (scraped.lyrics && scraped.title && scraped.artist) {
          // Normalize and save
          const queryKey = normalizeQuery(`${scraped.title} ${scraped.artist}`);

          await db.prepare(`
            INSERT OR REPLACE INTO lyrics (query, title, artist, lyrics, source_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            queryKey,
            scraped.title,
            scraped.artist,
            scraped.lyrics,
            scraped.source_url,
            now
          ).run();

          return new Response(JSON.stringify({
            scraped: true,
            ...scraped
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }

    // 3. If still not found
    if (!result) {
      return new Response(JSON.stringify({ 
        error: "Lyrics not found",
        query: normalizedQuery,
        suggestion: "Try a valid URL or check your spelling."
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      found: true,
      ...result
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Error in getLyrics:', error);

    return new Response(JSON.stringify({ 
      error: "Database error", 
      detail: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
