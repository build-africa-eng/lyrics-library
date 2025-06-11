import { normalizeQuery } from "../utils/normalize.js";

export async function getLyrics(req, db) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing ?query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const normalizedQuery = normalizeQuery(query);

  const result = await db.prepare(`SELECT * FROM lyrics WHERE query = ?`)
    .bind(normalizedQuery)
    .first();

  if (!result) {
    return new Response(JSON.stringify({ error: "Lyrics not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ cached: true, ...result }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}