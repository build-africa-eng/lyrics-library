// /worker/src/routes/addLyrics.js
export async function addLyrics(req, db) {
  const { title, artist, body, source_url } = await req.json();
  const id = crypto.randomUUID();
  await db.prepare(`INSERT INTO lyrics (id, title, artist, body, source_url) VALUES (?, ?, ?, ?, ?)`)
         .bind(id, title.trim(), artist.trim(), body.trim(), source_url || null).run();
  return new Response(JSON.stringify({ id }), { status: 201 });
}
