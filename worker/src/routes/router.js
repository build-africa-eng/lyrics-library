import { getLyrics } from './getlyrics';
import { addLyrics } from './addlyrics';
import { scrapeLyrics } from './scrapelyrics';

export async function router(req, db) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;

  // Welcome/health endpoint
  if (method === "GET" && pathname === "/") {
    return new Response(
      JSON.stringify({
        message: "Lyrics Worker is running!",
        usage: "POST /scrapelyrics with { url } in the body"
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // GET /lyrics - Retrieve lyrics
  if (method === 'GET' && pathname === '/lyrics') {
    return getLyrics(req, db);
  }

  // POST /lyrics - Add lyrics
  if (method === 'POST' && pathname === '/lyrics') {
    return addLyrics(req, db);
  }

  // POST /scrapelyrics - Scrape lyrics from external source
  if (method === 'POST' && pathname === '/scrapelyrics') {
    return scrapeLyrics(req, db);
  }

  // Not found (404)
  return new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}