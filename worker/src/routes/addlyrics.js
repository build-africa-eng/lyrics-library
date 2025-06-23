import { normalizeQuery } from "../utils/normalize.js";

export async function addLyrics(req, db) {
  try {
    const body = await req.json();
    const { title, artist, lyrics, source_url = "" } = body;

    if (!title || !artist || !lyrics) {
      return new Response(JSON.stringify({ error: "Missing required fields: title, artist, lyrics" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const query = normalizeQuery(`${title} ${artist}`);
    const now = Math.floor(Date.now() / 1000);

    await db.prepare(
      `INSERT OR REPLACE INTO lyrics 
       (query, title, artist, lyrics, source_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(query, title, artist, lyrics, source_url, now).run();

    // Return full object for client
    return new Response(JSON.stringify({
      success: true,
      query,
      title,
      artist,
      lyrics,
      source_url,
      created_at: now
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "Unexpected error",
      detail: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
