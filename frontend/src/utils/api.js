// src/utils/api.js

const BASE_URL = 'https://lyrics-worker.afrcanfuture.workers.dev';

export function normalizeQuery(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchLyrics(query) {
  const normalizedQuery = normalizeQuery(query);
  const res = await fetch(`${BASE_URL}/lyrics?query=${encodeURIComponent(normalizedQuery)}`);
  if (!res.ok) throw new Error('Lyrics not found');
  return res.json();
}

export async function scrapeLyrics(url, query = null) {
  const payload = { url };
  if (query) payload.query = normalizeQuery(query);

  const res = await fetch(`${BASE_URL}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Scrape failed: ${detail}`);
  }

  return res.json();
}

/**
 * Combined helper: try fetchLyrics, fallback to scrapeLyrics
 * @param {string} query - title + artist or plain search term
 * @param {string} url - external URL to scrape if not found
 */
export async function fetchLyricsWithFallback(query, url) {
  try {
    return await fetchLyrics(query);
  } catch {
    if (!url) throw new Error('Lyrics not found and no fallback URL provided');
    return await scrapeLyrics(url, query);
  }
}
