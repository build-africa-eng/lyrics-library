// /worker/routes/getlyrics.js
import { normalizeQuery } from '../utils/normalize';

export async function getLyrics(req, db) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('query');

  if (!rawQuery) {
    return new Response(JSON.stringify({ error: "Missing ?query=" }), { status: 400 });
  }

  const query = normalizeQuery(rawQuery);

  const cached = await db.prepare('SELECT * FROM lyrics WHERE query = ?').bind(query).first();

  if (cached) {
    return Response.json({
      cached: true,
      ...cached,
    });
  }

  return new Response(JSON.stringify({ error: "Lyrics not found in cache" }), { status: 404 });
}