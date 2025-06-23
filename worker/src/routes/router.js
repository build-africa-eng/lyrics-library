import { getLyrics } from './getlyrics';
import { addLyrics as addLyricsHandler } from './addlyrics';
import { scrapeLyrics as scrapeLyricsHandler } from './scrapelyrics';

// Allow multiple origins for development and production
const ALLOWED_ORIGINS = [
  "https://lyrics-library.pages.dev",
  "http://localhost:3000", 
  "http://localhost:5173", // Vite dev server
  "https://your-preview-domain.pages.dev" // Add your preview domains
];

function getCorsHeaders(origin) {
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || 
                   (origin && origin.includes('.pages.dev')); // Allow all Pages.dev subdomains
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
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

  try {
    // Welcome/health endpoint
    if (method === "GET" && pathname === "/") {
      const resp = new Response(
        JSON.stringify({
          message: "Lyrics Worker is running!",
          endpoints: {
            "GET /lyrics?query=...": "Search for lyrics",
            "GET /lyrics": "Get all lyrics", 
            "POST /lyrics": "Add new lyrics",
            "POST /scrape": "Scrape lyrics from URL"
          }
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
    if (method === 'POST' && pathname === '/scrape') {
      const resp = await scrapeLyricsHandler(req, db);
      return withCors(resp, origin);
    }

    // Not found (404)
    const resp = new Response(
      JSON.stringify({ error: "Endpoint not found", path: pathname, method }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
    return withCors(resp, origin);

  } catch (error) {
    console.error('Router error:', error);
    const resp = new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        detail: error.message,
        path: pathname,
        method 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    return withCors(resp, origin);
  }
}
