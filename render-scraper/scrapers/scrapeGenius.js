// scrapeGenius.js
import fs from 'fs/promises';
import { getBrowser } from './browserManager.js';
import sanitizeUrl from '../utils/sanitizeUrl.js';
import { logToClients as sendWsMessage } from '../logger/webSocketLogger.js';

const blockedUrls = new Set(); // Prevent retrying known CAPTCHA pages

export async function scrapeGenius(inputUrl, retries = 1) {
  const url = sanitizeUrl(inputUrl);
  if (!url) throw new Error(`Invalid URL: ${inputUrl}`);
  if (blockedUrls.has(url)) throw new Error(`Previously failed CAPTCHA - skipping ${url}`);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Aggressive resource blocking
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Realistic desktop User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/115.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Catch empty/403 pages
    if (!response || response.status() === 403) {
      throw new Error("403 Forbidden - possibly CAPTCHA or bot block");
    }

    const html = await page.content();
    if (!html || html.length < 1000) {
      throw new Error("Page is blank or too short to be valid");
    }

    // Detect CAPTCHA
    const isChallenge = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      const title = document.title || '';
      return (
        body.includes("Verifying you are human") ||
        title.includes("Just a moment") ||
        title.includes("Attention Required") ||
        body.includes("Cloudflare")
      );
    });

    if (isChallenge) {
      blockedUrls.add(url);
      throw new Error("CAPTCHA detected - cannot proceed");
    }

    // Accept cookies if present
    try {
      await page.click('button[id="onetrust-accept-btn-handler"]', { timeout: 3000 });
    } catch { /* ignore */ }

    // Detect 404
    const isNotFound = await page.evaluate(() =>
      document.body?.innerText?.includes("Page not found")
    );
    if (isNotFound) throw new Error("Page not found");

    // Try multiple selectors for lyrics
    const selectors = [
      'div[data-lyrics-container="true"]',
      '[class*="Lyrics__Container"]',
      'div.lyrics'
    ];

    let data = null;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });

        data = await page.evaluate((sel) => {
          const container = document.querySelector(sel);
          if (!container) return null;

          const lyrics = container.innerText?.trim();

          const titleEl = document.querySelector('h1[class*="Title"], h1');
          const artistEl = document.querySelector('a[class*="Artist"]');

          let title = titleEl?.innerText?.trim();
          let artist = artistEl?.innerText?.trim();

          if (!title || !artist) {
            const match = document.title.match(/^(.+?)\s+(?:by|–)\s+(.+?)\s+(?:–|Lyrics)/);
            if (match) {
              title = title || match[1]?.trim();
              artist = artist || match[2]?.trim();
            }
          }

          return {
            title,
            artist,
            lyrics,
            source: 'genius',
            source_url: location.href
          };
        }, selector);

        if (data?.lyrics && data?.title && data?.artist) break;
      } catch {
        continue;
      }
    }

    if (!data?.lyrics) {
      throw new Error("No lyrics found");
    }

    return data;

  } catch (err) {
    if (retries > 0 && !err.message.includes('CAPTCHA')) {
      console.warn(`🔁 Retrying... (${retries} left)`);
      await page.close();
      return scrapeGenius(url, retries - 1);
    }

    throw new Error(`Scrape failed: ${err.message}`);
  } finally {
    await page.close();
  }
}