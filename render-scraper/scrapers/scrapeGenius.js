import { getBrowser } from './browserManager.js';
import fs from 'fs';

export async function scrapeGenius(url) {
  const browser = getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for visible lyrics content
    await page.waitForSelector('div[data-lyrics-container]', { timeout: 25000 });

    const data = await page.evaluate(() => {
      const containers = document.querySelectorAll('div[data-lyrics-container]');
      const lyrics = Array.from(containers)
        .map(div => div.innerText.trim())
        .join('\n\n')
        .trim();

      let title = document.querySelector('h1[class*="Title"]')?.innerText?.trim();
      let artist = document.querySelector('a[class*="Artist"]')?.innerText?.trim();

      if (!title || !artist) {
        const titleParts = document.title.split(' – ');
        artist = artist || titleParts[0]?.trim();
        title = title || titleParts[1]?.replace(/Lyrics\s*\|.*$/, '')?.trim();
      }

      return {
        title,
        artist,
        lyrics,
        source_url: location.href,
        source: 'genius',
      };
    });

    if (!data.lyrics || !data.title || !data.artist) {
      throw new Error('Incomplete scrape: lyrics/title/artist missing');
    }

    return data;

  } catch (err) {
    // 📸 Take a screenshot and log
    const screenshotPath = `/tmp/genius-error-${Date.now()}.png`;
    const htmlPath = `/tmp/genius-error-${Date.now()}.html`;

    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const content = await page.content();
      fs.writeFileSync(htmlPath, content);
      console.error(`📸 Screenshot saved to ${screenshotPath}`);
      console.error(`🧾 HTML snapshot saved to ${htmlPath}`);
    } catch (screenshotErr) {
      console.error(`⚠️ Failed to save screenshot or HTML: ${screenshotErr.message}`);
    }

    throw new Error(`Genius scrape failed for URL ${url}: ${err.message}`);
  } finally {
    await page.close();
  }
}