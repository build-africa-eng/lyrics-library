import { normalizeQuery } from "../utils/normalize.js";

export async function getLyrics(req, db) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query");

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
    if (!normalizedQuery || normalizedQuery.trim() === '') {
      return new Response(JSON.stringify({ error: "Invalid query parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Try exact match
    let result = await db.prepare(`
      SELECT * FROM lyrics 
      WHERE query = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(normalizedQuery).first();

    // Try fuzzy fallback
    if (!result) {
      const pattern = `%${normalizedQuery}%`;
      result = await db.prepare(`
        SELECT * FROM lyrics 
        WHERE query LIKE ? OR title LIKE ? OR artist LIKE ?
        ORDER BY created_at DESC 
        LIMIT 1
      `).bind(pattern, pattern, pattern).first();
    }

    if (!result) {
      return new Response(JSON.stringify({
        error: "Lyrics not found",
        query: normalizedQuery,
        suggestion: "Try adding the lyrics first or check your spelling"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ found: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Database error", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
