import { normalizeQuery } from '../utils/normalize.js';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function getLyrics(req, db) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('query');

  if (!rawQuery) {
    // Return all lyrics (optional behavior)
    const all = await db.prepare(`SELECT * FROM lyrics ORDER BY created_at DESC`).all();
    return new Response(JSON.stringify({ lyrics: all.results || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const query = normalizeQuery(rawQuery);
  const now = Math.floor(Date.now() / 1000);

  // 1. Try cache first
  const cached = await db.prepare(
    `SELECT * FROM lyrics WHERE query = ? AND created_at >= ? LIMIT 1`
  ).bind(query, now - MAX_AGE_SECONDS).first();

  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "HIT"
      }
    });
  }

  // 2. Not in DB → Try scraping
  try {
    const scrapeRes = await fetch("https://lyrics-library-hnz7.onrender.com/scrape", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // We use query-based scrape here, not URL
      body: null,
      // Send query as param
    });

    const scrapeUrl = `https://lyrics-library-hnz7.onrender.com/scrape?query=${encodeURIComponent(query)}`;
    const res = await fetch(scrapeUrl);
    if (!res.ok) throw new Error("Scrape failed");

    const scraped = await res.json();
    if (!scraped.title || !scraped.artist || !scraped.lyrics) {
      throw new Error("Incomplete scrape result");
    }

    const normalizedScrapeQuery = normalizeQuery(`${scraped.title} ${scraped.artist}`);

    await db.prepare(`
      INSERT OR REPLACE INTO lyrics 
      (query, title, artist, lyrics, source_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      normalizedScrapeQuery,
      scraped.title,
      scraped.artist,
      scraped.lyrics,
      scraped.source_url || "",
      now
    ).run();

    return new Response(JSON.stringify({ ...scraped, cached: false }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "Lyrics not found",
      detail: err.message || "Scrape failed"
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
}
