import { getLyrics } from './getlyrics';
import { addLyrics as addLyricsHandler } from './addlyrics';
import { scrapeLyrics as scrapeLyricsHandler } from './scrapelyrics';

// CORS config
const ALLOWED_ORIGINS = [
  "https://lyrics-library.pages.dev",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://your-preview-domain.pages.dev"
];

function getCorsHeaders(origin) {
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || (origin && origin.endsWith(".pages.dev"));
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
  const { pathname, searchParams } = url;
  const method = req.method;
  const origin = req.headers.get("Origin") || "*";

  // Handle preflight CORS
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  console.log(`[${method}] ${pathname}`);

  try {
    // GET /
    if (method === "GET" && pathname === "/") {
      return withCors(new Response(JSON.stringify({
        message: "Lyrics Worker is running.",
        endpoints: {
          "GET /lyrics?query=...": "Search or fetch lyrics (auto scrape fallback)",
          "POST /lyrics": "Add lyrics manually",
          "POST /scrape": "Scrape lyrics from a URL"
        }
      }), {
        headers: { "Content-Type": "application/json" }
      }), origin);
    }

    // GET /lyrics with optional fallback to /scrape
    if (method === "GET" && pathname === "/lyrics") {
      const query = searchParams.get('query');

      // 1. Attempt to get lyrics from DB
      const resp = await getLyrics(req, db);
      const data = await resp.clone().json();

      // 2. If found, return normally
      if (resp.status === 200 && (data?.lyrics || data?.found)) {
        return withCors(resp, origin);
      }

      // 3. If not found and query present, auto-fallback to scrape
      if (query) {
        const scrapeReq = new Request(`${req.url.replace(/\/lyrics.*$/, "/scrape")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query })
        });

        const scraped = await scrapeLyricsHandler(scrapeReq, db);
        return withCors(scraped, origin);
      }

      // 4. If no query and nothing found, return original
      return withCors(resp, origin);
    }

    // POST /lyrics - Manual add
    if (method === "POST" && pathname === "/lyrics") {
      return withCors(await addLyricsHandler(req, db), origin);
    }

    // POST /scrape - Scrape directly
    if (method === "POST" && pathname === "/scrape") {
      return withCors(await scrapeLyricsHandler(req, db), origin);
    }

    // Fallback 404
    return withCors(new Response(JSON.stringify({
      error: "Not found",
      method,
      path: pathname
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    }), origin);

  } catch (err) {
    console.error("Router error:", err);
    return withCors(new Response(JSON.stringify({
      error: "Internal server error",
      detail: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }), origin);
  }
}
