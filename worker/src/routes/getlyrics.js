// /worker/src/routes/getlyrics.js
import { normalizeQuery } from "../utils/normalize";

export async function getLyrics(req, db) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query');

    // If no query parameter, return all lyrics
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

    // Search for specific lyrics
    const normalizedQuery = normalizeQuery(query);
    
    if (!normalizedQuery || normalizedQuery.trim() === '') {
      return new Response(JSON.stringify({ 
        error: "Invalid query parameter" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Try exact match first
    let result = await db.prepare(`
      SELECT * FROM lyrics 
      WHERE query = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(normalizedQuery).first();

    // If no exact match, try partial match
    if (!result) {
      const searchPattern = `%${normalizedQuery}%`;
      result = await db.prepare(`
        SELECT * FROM lyrics 
        WHERE query LIKE ? OR title LIKE ? OR artist LIKE ?
        ORDER BY created_at DESC 
        LIMIT 1
      `).bind(searchPattern, searchPattern, searchPattern).first();
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

    return new Response(JSON.stringify({ 
      found: true,
      ...result 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Error in getLyrics:', error);
    
    return new Response(JSON.stringify({ 
      error: "Database error", 
      detail: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
