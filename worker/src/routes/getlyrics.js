// routes/getlyrics.js
import { normalizeQuery } from "../utils/normalize";

export async function getLyrics(req, db) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get("query");

    if (!rawQuery) {
      return new Response(JSON.stringify({ error: "Missing 'query' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const query = normalizeQuery(rawQuery);
    const row = await db.prepare("SELECT * FROM lyrics WHERE query = ?").bind(query).first();

    if (!row) {
      return new Response(JSON.stringify({ error: "Lyrics not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(row), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
