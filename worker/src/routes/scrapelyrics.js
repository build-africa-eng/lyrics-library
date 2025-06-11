// /worker/src/routes/scrapeLyrics.js
import { normalizeQuery } from "../utils/normalize";

export async function scrapeLyrics(req, db) {
  const body = await req.json();
  const { url, query: overrideQuery } = body;

  if (!url) {
    return new Response(JSON.stringify({ error: "Missing required field: url" }), { status: 400 });
  }

  // Use override query or defer
  let normalizedQuery = overrideQuery ? normalizeQuery(overrideQuery) : null;

  // 1. If override query provided, check cache first
  if (normalizedQuery) {
    const cached = await db.prepare("SELECT * FROM lyrics WHERE query = ?")
      .bind(normalizedQuery)
      .first();

    if (cached) {
      return new Response(JSON.stringify({ cached: true, ...cached }), { status: 200 });
    }
  }

  // 2. Scrape from backend
  const res = await fetch("https://lyrics-library-hnz7.onrender.com/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    return new Response("Scrape failed", { status: 500 });
  }

  const scraped = await res.json();

  // If query not provided, build it from title + artist
  if (!normalizedQuery && scraped.title && scraped.artist) {
    normalizedQuery = normalizeQuery(`${scraped.title} ${scraped.artist}`);
  }

  if (!scraped.lyrics || !normalizedQuery) {
    return new Response(JSON.stringify({ error: "Incomplete scrape result" }), { status: 500 });
  }

  // 3. Save to cache
  await db.prepare(`
    INSERT OR REPLACE INTO lyrics (query, title, artist, lyrics, source_url)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    normalizedQuery,
    scraped.title,
    scraped.artist,
    scraped.lyrics,
    scraped.source_url
  ).run();

  return new Response(JSON.stringify({ cached: false, ...scraped }), { status: 201 });
}