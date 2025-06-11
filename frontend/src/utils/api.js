// Centralized API helper for lyrics library frontend
const BASE_URL = 'https://lyrics-worker.afrcanfuture.workers.dev';

export async function fetchLyrics(query) {
  const normalizedQuery = normalizeQuery(query);
  const res = await fetch(`${BASE_URL}/lyrics?query=${encodeURIComponent(normalizedQuery)}`);
  if (!res.ok) throw new Error('Could not fetch lyrics');
  return res.json();
}

export async function fetchAllLyrics() {
  const res = await fetch(`${BASE_URL}/lyrics`);
  if (!res.ok) throw new Error('Could not fetch lyrics');
  return res.json();
}

export async function addLyrics({ title, artist, lyrics }) {
  const res = await fetch(`${BASE_URL}/lyrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, artist, lyrics }),
  });
  if (!res.ok) throw new Error('Could not add lyrics');
  return res.json();
}

export async function scrapeLyrics(url) {
  const res = await fetch(`${BASE_URL}/scrapelyrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error('Could not scrape lyrics');
  return res.json();
}