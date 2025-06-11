// src/routes/getlyrics.js
import { getLyricsByTitleAndArtist } from "../lib/lyricsDb.js";

export async function getLyrics(req, db) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");

  if (!title || !artist) {
    return new Response(JSON.stringify({ error: "Missing title or artist" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const result = await getLyricsByTitleAndArtist(db, title, artist);

  if (!result) {
    return new Response(JSON.stringify({ error: "Lyrics not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}