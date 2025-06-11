export async function getLyricsByTitleAndArtist(db, title, artist) {
  const result = await db.prepare(
    `SELECT title, artist, lyrics FROM lyrics WHERE title = ? AND artist = ? LIMIT 1`
  ).bind(title, artist).first();

  return result || null;
}

export async function saveLyrics(db, { title, artist, lyrics }) {
  await db.prepare(
    `INSERT INTO lyrics (title, artist, lyrics) VALUES (?, ?, ?)`
  ).bind(title, artist, lyrics).run();
}