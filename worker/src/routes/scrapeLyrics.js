// /worker/src/routes/scrapeLyrics.js
export async function scrapeLyrics(req, db) {
  const { url } = await req.json();
  const res = await fetch("https://your-render-scraper.onrender.com/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });
  if (!res.ok) return new Response("Scrape failed", { status: 500 });
  const scraped = await res.json();
  const id = crypto.randomUUID();
  await db.prepare(`INSERT INTO lyrics (id, title, artist, body, source_url) VALUES (?, ?, ?, ?, ?)`)
         .bind(id, scraped.title, scraped.artist, scraped.lyrics, scraped.source_url).run();
  return new Response(JSON.stringify({ id }), { status: 201 });
}
