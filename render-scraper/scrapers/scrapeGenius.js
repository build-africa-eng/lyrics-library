import fs from 'fs/promises';
import { getBrowser } from './browserManager.js';
import sanitizeUrl from '../utils/sanitizeUrl.js'; // helper

export async function scrapeGenius(inputUrl, retries = 2) {
  const url = sanitizeUrl(inputUrl);
  const browser = getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    const isNotFound = await page.evaluate(() =>
      document.body.innerText.includes("Page not found")
    );
    if (isNotFound) {
      throw new Error("❌ Genius 404 - Page not found");
    }

    // Wait for any possible lyrics container variant
    const selectors = [
      'div[data-lyrics-container="true"]',
      '[class^="Lyrics__Container"]',
      'div.lyrics'
    ];
    let foundSelector = null;

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 4000 });
        foundSelector = selector;
        break;
      } catch {}
    }

    if (!foundSelector) {
      throw new Error("❌ No known lyrics selector found on page.");
    }

    const data = await page.evaluate((selector) => {
      const container = document.querySelector(selector);
      if (!container) return null;

      container.innerHTML = container.innerHTML.replace(/<br\s*\/?>/gi, '\n');
      const lyrics = container.innerText.trim();

      let title = document.querySelector('h1[class*="Title"]')?.innerText;
      let artist = document.querySelector('a[class*="Artist"]')?.innerText;

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
    }, foundSelector);

    if (!data?.lyrics || !data?.title || !data?.artist) {
      throw new Error("❌ Incomplete scrape: Missing title, artist, or lyrics.");
    }

    return data;
  } catch (err) {
    const ts = Date.now();
    try {
      await page.screenshot({ path: `/tmp/genius-error-${ts}.png` });
      const html = await page.content();
      await fs.writeFile(`/tmp/genius-error-${ts}.html`, html);
      console.warn(`📸 Snapshot saved: /tmp/genius-error-${ts}.*`);
    } catch (e) {
      console.warn('⚠️ Snapshot save failed:', e.message);
    }

    if (retries > 0) {
      console.warn(`🔁 Retrying Genius scrape (${retries} retries left)...`);
      await page.close();
      return await scrapeGenius(url, retries - 1);
    }

    throw new Error(`Genius scrape failed for URL ${url}: ${err.message}`);
  } finally {
    if (!page.isClosed()) await page.close();
  }
}