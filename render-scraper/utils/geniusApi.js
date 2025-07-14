import fetch from 'node-fetch';

const BASE_URL = 'https://api.genius.com';
const ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

export async function searchGenius(query) {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Genius search failed: ${data.meta.message || res.status}`);
  }

  return data.response.hits;
}

export async function getGeniusSong(songId) {
  const url = `${BASE_URL}/songs/${songId}?text_format=plain`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Genius song fetch failed: ${data.meta.message || res.status}`);
  }

  return data.response.song;
}