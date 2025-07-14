// scrapers/scrapeMetrolyrics.js
import { getBrowserPage } from './browserManager.js';
import sanitizeUrl from '../utils/sanitizeUrl.js';

export async function scrapeMetrolyrics(inputUrl, retries = 1) {
  const url = sanitizeUrl(inputUrl);
  let page = null;

  try {
    console.log(`🎤 Scraping MetroLyrics: ${url}`);
    page = await getBrowserPage();

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const isChallenge = await page.evaluate(() =>
      document.body.innerText.includes("Verifying") ||
      document.title.includes("Access denied")
    );
    if (isChallenge) throw new Error("CAPTCHA detected");

    const data = await page.evaluate(() => {
      const lyricsEls = document.querySelectorAll('.verse');
      const titleEl = document.querySelector('h1');
      const artistEl = document.querySelector('.banner-heading h2');

      if (!lyricsEls?.length) return null;

      const lyrics = Array.from(lyricsEls)
        .map(el => el.innerText.trim())
        .join('\n\n');

      const title = titleEl?.innerText?.trim() || 'Unknown';
      const artist = artistEl?.innerText?.trim() || 'Unknown';

      return {
        title,
        artist,
        lyrics,
        source: 'metrolyrics',
        source_url: location.href
      };
    });

    if (!data?.lyrics) throw new Error('No lyrics found');
    console.log(`✅ MetroLyrics: ${data.title} by ${data.artist}`);
    return data;

  } catch (err) {
    if (retries > 0 && !err.message.includes('CAPTCHA')) {
      console.warn(`🔁 Retrying MetroLyrics... (${retries} left)`);
      if (page) await page.close();
      return scrapeMetrolyrics(url, retries - 1);
    }
    throw new Error(`MetroLyrics scrape failed: ${err.message}`);
  } finally {
    if (page) await page.close().catch(() => {});
  }
}