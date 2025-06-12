import { getLyrics } from './getlyrics';
import { addLyrics as addLyricsHandler } from './addlyrics'; // Renamed to avoid conflict
import { scrapeLyrics as scrapeLyricsHandler } from './scrapelyrics'; // Renamed to avoid conflict

const ALLOWED_ORIGIN = "https://lyrics-library.pages.dev";

function getCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function withCors(resp, origin) {
  const headers = new Headers(resp.headers);
  for (const [k, v] of Object.entries(getCorsHeaders(origin))) {
    headers.set(k, v);
  }
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers,
  });
}

export async function router(req, db) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;
  const origin = req.headers.get("Origin");

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  // Welcome/health endpoint
  if (method === "GET" && pathname === "/") {
    const resp = new Response(
      JSON.stringify({
        message: "Lyrics Worker is running!",
        usage: "POST /scrape with { url } in the body" // Updated usage message
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    return withCors(resp, origin);
  }

  // GET /lyrics - Retrieve lyrics
  if (method === 'GET' && pathname === '/lyrics') {
    const resp = await getLyrics(req, db);
    return withCors(resp, origin);
  }

  // POST /lyrics - Add lyrics
  if (method === 'POST' && pathname === '/lyrics') {
    const resp = await addLyricsHandler(req, db);
    return withCors(resp, origin);
  }

  // POST /scrape - Scrape lyrics from external source
  // Corrected path from /scrapelyrics to /scrape to match the frontend
  if (method === 'POST' && pathname === '/scrape') {
    const resp = await scrapeLyricsHandler(req, db);
    return withCors(resp, origin);
  }

  // Not found (404)
  const resp = new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
  return withCors(resp, origin);
}