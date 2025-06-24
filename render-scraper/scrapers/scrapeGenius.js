import fs from 'fs/promises';
import { getBrowser } from './browserManager.js';
import sanitizeUrl from '../utils/sanitizeUrl.js'; // This import is correct

export async function scrapeGenius(inputUrl, retries = 2) {
  const url = sanitizeUrl(inputUrl);
  if (!url) {
    // SanitizeUrl can return '', so we stop here if the URL is invalid.
    throw new Error(`Invalid or unsupported URL provided to scrapeGenius: ${inputUrl}`);
  }

  const browser = getBrowser();
  const page = await browser.newPage();

  try {
    // 1. Use a more modern and common User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 90000, // Increased global timeout
    });

    // 2. Add a check for Cloudflare/CAPTCHA challenges
    const isChallenge = await page.evaluate(() =>
        document.body.innerText.includes("Verifying you are human") || document.title.includes("Just a moment...")
    );
    if (isChallenge) {
        console.warn("🤖 Genius is presenting a CAPTCHA/challenge page.");
        // Wait for potential automatic redirection after challenge solves
        await page.waitForNavigation({ timeout: 25000 }).catch(() => console.log("Timeout waiting for challenge navigation."));
    }

    // 3. Handle Cookie Consent Banners (add this block)
    try {
      const consentButtonSelector = 'button[id="onetrust-accept-btn-handler"]';
      await page.waitForSelector(consentButtonSelector, { timeout: 7000 });
      await page.click(consentButtonSelector);
      console.log('✅ Clicked cookie consent button.');
    } catch (e) {
      console.log('ℹ️ Cookie consent banner not found or already accepted.');
    }

    // Check for "Page Not Found" after handling potential overlays
    const isNotFound = await page.evaluate(() =>
      document.body.innerText.includes("Page not found")
    );
    if (isNotFound) {
      throw new Error("❌ Genius 404 - Page not found");
    }

    // 4. Update Selectors and increase wait timeout
    const selectors = [
      'div[data-lyrics-container="true"]', // Primary modern selector
      '[class^="Lyrics__Container-"]',      // Styled-components class selector
      'div.lyrics'                           // Legacy selector
    ];
    let foundSelector = null;

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 15000 }); // Increased timeout
        foundSelector = selector;
        break;
      } catch {}
    }

    if (!foundSelector) {
      throw new Error("❌ No known lyrics selector found on page. The page structure may have changed or is blocked.");
    }

    const data = await page.evaluate((selector) => {
      // Find the container and replace <br> with newlines for proper text extraction
      const container = document.querySelector(selector);
      if (!container) return null;

      // Replace all <br> tags with a newline character within the container's HTML
      container.innerHTML = container.innerHTML.replace(/<br\s*\/?>/gi, '\n');

      // Now, extract the innerText, which will respect the newlines
      const lyrics = container.innerText.trim();

      // Scrape title and artist
      let title = document.querySelector('h1[class*="Title"], h1[class*="SongHeader__Title"]') ?.innerText;
      let artist = document.querySelector('a[class*="Artist"], a[class*="SongHeader__Artist"]') ?.innerText;

      // Fallback to page title if specific selectors fail
      if (!title || !artist) {
        const pageTitle = document.querySelector('title')?.textContent || '';
        const parts = pageTitle.split(' – Lyrics | Genius');
        if (parts.length > 0) {
            const songInfo = parts[0].split(' by ');
            artist = artist || songInfo[1]?.trim();
            title = title || songInfo[0]?.trim();
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
      const screenshotPath = `/tmp/genius-error-${ts}.png`;
      const htmlPath = `/tmp/genius-error-${ts}.html`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const html = await page.content();
      await fs.writeFile(htmlPath, html);
      console.warn(`📸 Snapshot saved: ${screenshotPath} & ${htmlPath}`);
    } catch (e) {
      console.warn('⚠️ Snapshot save failed:', e.message);
    }

    if (retries > 0) {
      console.warn(`🔁 Retrying Genius scrape (${retries} retries left)...`);
      await page.close();
      return await scrapeGenius(url, retries - 1);
    }

    // Provide a more detailed final error message
    throw new Error(`Genius scrape failed for URL ${url} after all retries: ${err.message}`);
  } finally {
    if (!page.isClosed()) await page.close();
  }
}