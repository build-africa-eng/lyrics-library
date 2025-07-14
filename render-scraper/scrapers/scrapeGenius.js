// scrapeGenius.js - Memory optimized version
import fs from 'fs/promises';
import { getBrowser } from './browserManager.js';
import sanitizeUrl from '../utils/sanitizeUrl.js';
import { logToClients as sendWsMessage } from '../logger/webSocketLogger.js';

export async function scrapeGenius(inputUrl, retries = 1) { // Reduced retries
  const url = sanitizeUrl(inputUrl);
  if (!url) throw new Error(`Invalid URL: ${inputUrl}`);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Aggressive resource blocking to save memory
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Minimal user agent
    await page.setUserAgent('Mozilla/5.0 (compatible; LyricsBot/1.0)');
    
    // Navigate with shorter timeout
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000, // Reduced timeout
    });

    // Quick CAPTCHA check
    const isChallenge = await page.evaluate(() => 
      document.body.innerText.includes("Verifying you are human") ||
      document.title.includes("Just a moment")
    );
    
    if (isChallenge) {
      throw new Error("CAPTCHA detected - cannot proceed");
    }

    // Skip cookie consent for speed
    try {
      await page.click('button[id="onetrust-accept-btn-handler"]', { timeout: 3000 });
    } catch {
      // Ignore if not found
    }

    // Check for 404
    const isNotFound = await page.evaluate(() =>
      document.body.innerText.includes("Page not found")
    );
    if (isNotFound) throw new Error("Page not found");

    // Streamlined selector search
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

          // Clean up HTML and extract text
          const lyrics = container.innerText
            .replace(/<br\s*\/?>/gi, '\n')
            .trim();

          // Extract title and artist
          const titleEl = document.querySelector('h1[class*="Title"], h1');
          const artistEl = document.querySelector('a[class*="Artist"]');
          
          let title = titleEl?.innerText?.trim();
          let artist = artistEl?.innerText?.trim();

          // Fallback to page title parsing
          if (!title || !artist) {
            const pageTitle = document.title || '';
            const match = pageTitle.match(/^(.+?)\s+(?:by|–)\s+(.+?)\s+(?:–|Lyrics)/);
            if (match) {
              title = title || match[1]?.trim();
              artist = artist || match[2]?.trim();
            }
          }

          return { title, artist, lyrics, source: 'genius', source_url: location.href };
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
    // Minimal error handling to save resources
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
