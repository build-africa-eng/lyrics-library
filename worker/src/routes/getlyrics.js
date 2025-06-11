import { normalizeQuery } from "../utils/normalize.js";

export async function addLyrics(req, db) {
  try {
    const { query, title, artist, lyrics, source_url } = await req.json();

    if (!query || !lyrics || !title || !artist) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const normalizedQuery = normalizeQuery(query);
    const timestamp = Math.floor(Date.now() / 1000);

    await db.prepare(`
      INSERT OR REPLACE INTO lyrics (query, title, artist, lyrics, source_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(normalizedQuery, title, artist, lyrics, source_url || null, timestamp).run();

    return new Response(JSON.stringify({ success: true, message: "Lyrics added" }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON or server error", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}