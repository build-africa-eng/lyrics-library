// scrapers/scrapeGenius.js

import { getBrowser } from '../browserManager.js';

export async function scrapeGenius(url) {
  const browser = getBrowser();
  const page = await browser.newPage();
  try {
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // This is the specific selector for the container Genius uses.
    const lyricsSelector = 'div[data-lyrics-container="true"]';
    await page.waitForSelector(lyricsSelector, { timeout: 15000 });

    const data = await page.evaluate((selector) => {
      const container = document.querySelector(selector);
      if (!container) return null;
      
      // Replace <br> tags with newlines for proper formatting
      container.innerHTML = container.innerHTML.replace(/<br\s*\/?>/gi, '\n');
      const lyrics = container.innerText;
      
      // Primary selectors for title and artist
      let title = document.querySelector('h1[class^="SongHeader__Title"], h1[class^="HeaderArtistAndTracklist__Title"]')?.innerText;
      let artist = document.querySelector('a[class^="SongHeader__Artist"], a[class^="HeaderArtistAndTracklist__Artist"]')?.innerText;

      // Fallback to page title if primary selectors fail
      if (!title || !artist) {
        const pageTitle = document.querySelector('title')?.textContent;
        if (pageTitle) {
          const parts = pageTitle.split(' – ');
          artist = artist || parts[0]?.trim();
          title = title || parts[1]?.split(' Lyrics | Genius')[0]?.trim();
        }
      }

      return {
        title,
        artist,
        lyrics,
        source_url: location.href,
        source: 'genius',
      };
    }, lyricsSelector);

    if (!data?.lyrics || !data?.title || !data?.artist) {
      throw new Error("Incomplete scrape: Could not find title, artist, or lyrics.");
    }
    return data;
  } catch (err) {
    // Re-throw the error with more context for better debugging
    throw new Error(`Genius scrape failed for URL ${url}: ${err.message}`);
  } finally {
    // IMPORTANT: Only close the page, not the entire browser
    await page.close();
  }
}
