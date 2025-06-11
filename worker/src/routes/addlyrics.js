// src/routes/addlyrics.js
import { saveLyrics } from "../lib/lyricsDb.js";

export async function addLyrics(req, db) {
  try {
    const { title, artist, lyrics } = await req.json();

    if (!title || !artist || !lyrics) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await saveLyrics(db, { title, artist, lyrics });

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON", detail: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}