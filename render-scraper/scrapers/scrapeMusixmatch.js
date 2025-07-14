// scrapers/scrapeMusixmatch.js
import { getBrowserPage } from './browserManager.js';
import sanitizeUrl from '../utils/sanitizeUrl.js';

export async function scrapeMusixmatch(inputUrl, retries = 1) {
  const url = sanitizeUrl(inputUrl);
  let page = null;

  try {
    console.log(`🎼 Scraping Musixmatch: ${url}`);
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
      const lyricsEl = document.querySelector('[class*="lyrics__content__"]');
      const titleEl = document.querySelector('h1');
      const artistEl = document.querySelector('a[href*="/artist/"]');

      if (!lyricsEl) return null;

      const lyrics = Array.from(document.querySelectorAll('[class*="lyrics__content__"]'))
        .map(el => el.innerText.trim())
        .filter(Boolean)
        .join('\n');

      const title = titleEl?.innerText?.trim() || 'Unknown';
      const artist = artistEl?.innerText?.trim() || 'Unknown';

      return {
        title,
        artist,
        lyrics,
        source: 'musixmatch',
        source_url: location.href
      };
    });

    if (!data?.lyrics) throw new Error('No lyrics found');
    console.log(`✅ Musixmatch: ${data.title} by ${data.artist}`);
    return data;

  } catch (err) {
    if (retries > 0 && !err.message.includes('CAPTCHA')) {
      console.warn(`🔁 Retrying Musixmatch... (${retries} left)`);
      if (page) await page.close();
      return scrapeMusixmatch(url, retries - 1);
    }
    throw new Error(`Musixmatch scrape failed: ${err.message}`);
  } finally {
    if (page) await page.close().catch(() => {});
  }
}