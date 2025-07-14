import { searchGenius, getGeniusSong } from '../utils/geniusApi.js';
import { getBrowserPage } from './browserManager.js';

export async function tryGeniusFallback(query) {
  try {
    const hits = await searchGenius(query);
    if (!hits.length) return null;

    const song = hits[0].result;
    const fullSong = await getGeniusSong(song.id);
    const url = fullSong.url;

    const page = await getBrowserPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const lyrics = await page.evaluate(() => {
      const container = document.querySelector('[data-lyrics-container]');
      if (!container) return null;
      return Array.from(container.querySelectorAll('br'))
        .forEach(br => br.replaceWith('\n'));
    });

    const rawText = await page.evaluate(() => {
      const el = document.querySelector('[data-lyrics-container]');
      return el ? el.innerText.trim() : null;
    });

    await page.close();

    if (!rawText) return null;

    return {
      title: fullSong.full_title,
      artist: fullSong.primary_artist.name,
      thumbnail: fullSong.song_art_image_thumbnail_url,
      lyrics_url: url,
      lyrics: rawText,
    };
  } catch (err) {
    console.warn('❌ Genius API fallback failed:', err.message);
    return null;
  }
}
