// /worker/src/routes/getLyrics.js
export async function getLyrics(req, db) {
  const { results } = await db.prepare("SELECT * FROM lyrics ORDER BY created_at DESC").all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
}
