import { getLyrics } from './getlyrics';
import { addLyrics } from './addlyrics';
import { scrapeLyrics } from './scrapelyrics';

export async function router(req, db) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;

  if (method === 'GET' && pathname === '/lyrics') return getLyrics(req, db);
  if (method === 'POST' && pathname === '/lyrics') return addLyrics(req, db);
  if (method === 'POST' && pathname === '/scrape') return scrapeLyrics(req, db);

  return new Response('Not found', { status: 404 });
}