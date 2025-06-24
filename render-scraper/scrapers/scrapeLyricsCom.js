// scrapers/scrapeLyricsCom.js

import { getBrowser } from './browserManager.js';

export async function scrapeLyricsCom(url) {
  const browser = getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 600000 });

    const lyricsSelector = '#lyric-body-text';
    await page.waitForSelector(lyricsSelector, { timeout: 120000 });

    const data = await page.evaluate((selector) => {
      const lyricsBody = document.querySelector(selector);
      if (!lyricsBody) return null;

      const lyrics = lyricsBody.innerText;
      const title = document.querySelector("h1.lyric-title")?.innerText?.trim();
      const artist = document.querySelector("h3.lyric-artist a")?.innerText?.trim();

      return {
        title,
        artist,
        lyrics,
        source_url: location.href,
        source: 'lyricscom',
      };
    }, lyricsSelector);

    if (!data?.lyrics || !data?.title || !data?.artist) {
      throw new Error("Incomplete scrape: Could not find title, artist, or lyrics.");
    }
    return data;
  } catch (err) {
    throw new Error(`Lyrics.com scrape failed for URL ${url}: ${err.message}`);
  } finally {
    await page.close();
  }
}
