// /worker/src/lib/lyricsDb.js
import { normalizeQuery } from '../utils/normalize.js';

/**
 * Get lyrics by normalized title and artist (exact match)
 */
export async function getLyricsByTitleAndArtist(db, title, artist) {
  const query = normalizeQuery(`${title} ${artist}`);
  const result = await db.prepare(
    `SELECT * FROM lyrics WHERE query = ? LIMIT 1`
  ).bind(query).first();

  return result || null;
}

/**
 * Save lyrics to DB with normalized query
 */
export async function saveLyrics(db, { title, artist, lyrics, source_url = null }) {
  const query = normalizeQuery(`${title} ${artist}`);
  const now = Math.floor(Date.now() / 1000);

  await db.prepare(`
    INSERT OR REPLACE INTO lyrics (query, title, artist, lyrics, source_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(query, title, artist, lyrics, source_url, now).run();
}
