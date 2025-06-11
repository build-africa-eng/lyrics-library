// /worker/routes/addlyrics.js
import { normalizeQuery } from '../utils/normalize';

export async function addLyrics(req, db) {
  const body = await req.json();
  const { query, title, artist, lyrics, source_url } = body;

  if (!query || !lyrics) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  const normalizedQuery = normalizeQuery(query);

  try {
    await db
      .prepare(
        `INSERT OR REPLACE INTO lyrics (query, title, artist, lyrics, source_url) VALUES (?, ?, ?, ?, ?)`
      )
      .bind(normalizedQuery, title, artist, lyrics, source_url)
      .run();

    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}