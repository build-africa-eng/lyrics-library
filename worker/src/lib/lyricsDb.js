import { normalizeQuery } from '../utils/normalize.js';

export async function getLyricsByTitleAndArtist(db, title, artist) {
  const result = await db.prepare(
    `SELECT title, artist, lyrics FROM lyrics WHERE title = ? AND artist = ? LIMIT 1`
  ).bind(title, artist).first();

  return result || null;
}

export async function saveLyrics(db, { title, artist, lyrics }) {
  const query = normalizeQuery(`${title} ${artist}`);

  await db.prepare(
    `INSERT INTO lyrics (query, title, artist, lyrics) VALUES (?, ?, ?, ?)`
  ).bind(query, title, artist, lyrics).run();
}
