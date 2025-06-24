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

// Alternative lightweight approach using HTTP requests
import https from 'https';
import { JSDOM } from 'jsdom';

export async function scrapeGeniusLightweight(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LyricsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'close' // Don't keep connections open
      }
    };

    const req = https.get(url, options, (res) => {
      let html = '';
      
      res.on('data', (chunk) => {
        html += chunk;
        // Abort if response gets too large (memory protection)
        if (html.length > 2 * 1024 * 1024) { // 2MB limit
          req.destroy();
          reject(new Error('Response too large'));
        }
      });

      res.on('end', () => {
        try {
          const dom = new JSDOM(html);
          const doc = dom.window.document;

          // Look for lyrics container
          const lyricsContainer = doc.querySelector(
            'div[data-lyrics-container="true"], [class*="Lyrics__Container"], div.lyrics'
          );

          if (!lyricsContainer) {
            throw new Error('No lyrics found');
          }

          const lyrics = lyricsContainer.textContent.trim();
          const title = doc.querySelector('h1')?.textContent?.trim();
          const artist = doc.querySelector('a[class*="Artist"]')?.textContent?.trim();

          resolve({
            title: title || 'Unknown',
            artist: artist || 'Unknown',
            lyrics,
            source: 'genius',
            source_url: url
          });

        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}
