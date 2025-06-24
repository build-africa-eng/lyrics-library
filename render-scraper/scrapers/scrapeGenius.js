// scrapers/scrapeGenius.js
import { getBrowser, initBrowser } from './browserManager.js';
import fs from 'fs/promises';

export async function scrapeGenius(url, retries = 2) {
  let browser;
  try {
    browser = getBrowser();
  } catch (e) {
    console.warn('⚠️ Browser not available. Re-initializing...');
    await initBrowser(true);
    browser = getBrowser();
  }

  const page = await browser.newPage();
  const timestamp = Date.now();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    const lyricsSelector = 'div[data-lyrics-container="true"]';
    await page.waitForSelector(lyricsSelector, { timeout: 20000 });

    const data = await page.evaluate((selector) => {
      const container = document.querySelector(selector);
      if (!container) return null;

      container.innerHTML = container.innerHTML.replace(/<br\s*\/?>/gi, '\n');
      const lyrics = container.innerText.trim();

      let title = document.querySelector('h1[class^="SongHeader__Title"], h1[class^="HeaderArtistAndTracklist__Title"]')?.innerText?.trim();
      let artist = document.querySelector('a[class^="SongHeader__Artist"], a[class^="HeaderArtistAndTracklist__Artist"]')?.innerText?.trim();

      if (!title || !artist) {
        const pageTitle = document.querySelector('title')?.textContent;
        if (pageTitle) {
          const parts = pageTitle.split(' – ');
          artist = artist || parts[0]?.trim();
          title = title || parts[1]?.split(' Lyrics')[0]?.trim();
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
      throw new Error('Incomplete scrape: Could not find title, artist, or lyrics.');
    }

    return data;

  } catch (err) {
    // Attempt debug snapshot
    try {
      if (!page.isClosed()) {
        await page.bringToFront();
        await page.screenshot({ path: `/tmp/genius-error-${timestamp}.png` });
        const html = await page.content();
        await fs.writeFile(`/tmp/genius-error-${timestamp}.html`, html);
        console.warn(`📸 Screenshot and HTML saved to /tmp/genius-error-${timestamp}.*`);
      }
    } catch (snapErr) {
      console.warn(`⚠️ Failed to save debug snapshot: ${snapErr.message}`);
    }

    if (retries > 0) {
      console.warn(`🔁 Retrying Genius scrape (${retries} retries left)...`);
      if (!page.isClosed()) await page.close();
      return await scrapeGenius(url, retries - 1);
    }

    throw new Error(`❌ Genius scrape failed for URL ${url}: ${err.message}`);
  } finally {
    if (!page.isClosed()) {
      await page.close();
    }
  }
}