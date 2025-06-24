import fs from 'fs/promises';
import { getBrowser } from './browserManager.js';
import sanitizeUrl from '../utils/sanitizeUrl.js';
// Optional WebSocket logger
import { logToClients } from '../logger/webSocketLogger.js'; // optional

export async function scrapeGenius(inputUrl, retries = 2) {
  const url = sanitizeUrl(inputUrl);
  if (!url) throw new Error(`Invalid or unsupported URL provided to scrapeGenius: ${inputUrl}`);

  let browser;
  try {
    browser = await getBrowser();
  } catch (e) {
    throw new Error(`❌ Failed to get browser instance: ${e.message}`);
  }

  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });

    // 🔍 CAPTCHA / Cloudflare detection
    const isChallenge = await page.evaluate(() =>
      document.body.innerText.includes("Verifying you are human") ||
      document.title.includes("Just a moment...") ||
      document.querySelector('iframe[src*="captcha"]')
    );
    if (isChallenge) {
      const message = '🤖 CAPTCHA detected — skipping further retries due to zero-cost constraint.';
      console.warn(message);
      await fs.writeFile(`/tmp/genius-captcha-${Date.now()}.html`, await page.content());
      logToClients?.('log', message);
      throw new Error("Blocked by CAPTCHA. Cannot bypass without paid API.");
    }

    // ✅ Cookie consent
    try {
      const consentButton = 'button[id="onetrust-accept-btn-handler"]';
      await page.waitForSelector(consentButton, { timeout: 7000 });
      await page.click(consentButton);
      console.log('✅ Cookie consent accepted.');
    } catch {
      console.log('ℹ️ No cookie banner found.');
    }

    const isNotFound = await page.evaluate(() =>
      document.body.innerText.includes("Page not found")
    );
    if (isNotFound) throw new Error("❌ Genius 404 - Page not found");

    // 🎯 Try known lyrics selectors
    const selectors = [
      'div[data-lyrics-container="true"]',
      '[class^="Lyrics__Container-"]',
      'div.lyrics'
    ];
    let foundSelector = null;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 15000 });
        foundSelector = selector;
        break;
      } catch {}
    }

    if (!foundSelector) {
      throw new Error("❌ No lyrics container found — site structure changed or blocked.");
    }

    const data = await page.evaluate((selector) => {
      const container = document.querySelector(selector);
      if (!container) return null;

      container.innerHTML = container.innerHTML.replace(/<br\s*\/?>/gi, '\n');
      const lyrics = container.innerText.trim();

      let title = document.querySelector('h1[class*="Title"], h1[class*="SongHeader__Title"]')?.innerText;
      let artist = document.querySelector('a[class*="Artist"], a[class*="SongHeader__Artist"]')?.innerText;

      if (!title || !artist) {
        const pageTitle = document.querySelector('title')?.textContent || '';
        const parts = pageTitle.split(' – Lyrics | Genius');
        if (parts.length > 0) {
          const [t, a] = parts[0].split(' by ');
          title = title || t?.trim();
          artist = artist || a?.trim();
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
      throw new Error("❌ Incomplete lyrics data.");
    }

    return data;

  } catch (err) {
    const ts = Date.now();
    try {
      const screenshotPath = `/tmp/genius-error-${ts}.png`;
      const htmlPath = `/tmp/genius-error-${ts}.html`;
      await page.screenshot({ path: screenshotPath });
      await fs.writeFile(htmlPath, await page.content());
      console.warn(`📸 Snapshot: ${screenshotPath} & ${htmlPath}`);
    } catch (e) {
      console.warn('⚠️ Snapshot failed:', e.message);
    }

    if (retries > 0 && !err.message.includes('CAPTCHA')) {
      console.warn(`🔁 Retrying scrape (${retries} left)...`);
      await page.close();
      return await scrapeGenius(url, retries - 1);
    }

    throw new Error(`Genius scrape failed for ${url}: ${err.message}`);
  } finally {
    if (!page.isClosed()) await page.close();
  }
}
