import { getLyrics } from './getlyrics';
import { addLyrics as addLyricsHandler } from './addlyrics';
import { scrapeLyrics as scrapeLyricsHandler } from './scrapelyrics';

// Config
const ALLOWED_ORIGINS = [
  "https://lyrics-library.pages.dev",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://your-preview-domain.pages.dev",
];

function getCorsHeaders(origin) {
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || 
                    (origin && origin.endsWith(".pages.dev"));
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function withCors(resp, origin) {
  const headers = new Headers(resp.headers || {});
  for (const [key, value] of Object.entries(getCorsHeaders(origin))) {
    headers.set(key, value);
  }
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers,
  });
}

export async function router(req, db) {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method;
  const origin = req.headers.get("Origin") || "*";

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  // Basic logging (optional)
  console.log(`[${method}] ${pathname}`);

  try {
    // Root: Health check
    if (method === "GET" && pathname === "/") {
      return withCors(new Response(JSON.stringify({
        message: "Lyrics Worker is running.",
        endpoints: {
          "GET /lyrics?query=...": "Search or fetch lyrics",
          "POST /lyrics": "Add lyrics manually",
          "POST /scrape": "Scrape lyrics from a URL"
        }
      }), { headers: { "Content-Type": "application/json" } }), origin);
    }

    // Handle known routes
    if (method === "GET" && pathname === "/lyrics") {
      return withCors(await getLyrics(req, db), origin);
    }

    if (method === "POST" && pathname === "/lyrics") {
      return withCors(await addLyricsHandler(req, db), origin);
    }

    if (method === "POST" && pathname === "/scrape") {
      return withCors(await scrapeLyricsHandler(req, db), origin);
    }

    // Fallback for unknown endpoints
    return withCors(new Response(JSON.stringify({
      error: "Not found",
      method,
      path: pathname
    }), { status: 404, headers: { "Content-Type": "application/json" } }), origin);

  } catch (err) {
    console.error("Router error:", err);
    return withCors(new Response(JSON.stringify({
      error: "Internal server error",
      detail: err.message
    }), { status: 500, headers: { "Content-Type": "application/json" } }), origin);
  }
}
