import { getBrowser } from './browserManager.js';

export async function scrapeGenius(url) {
  const browser = getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for the lyrics container to appear (allow longer)
    await page.waitForSelector('div[data-lyrics-container]', { timeout: 25000 });

    const data = await page.evaluate(() => {
      const containers = document.querySelectorAll('div[data-lyrics-container]');
      const lyrics = Array.from(containers)
        .map(div => div.innerText.trim())
        .join('\n\n')
        .trim();

      let title = document.querySelector('h1[class^="SongHeader__Title"]')?.innerText?.trim() ||
                  document.querySelector('h1[class^="HeaderArtistAndTracklist__Title"]')?.innerText?.trim();

      let artist = document.querySelector('a[class^="SongHeader__Artist"]')?.innerText?.trim() ||
                   document.querySelector('a[class^="HeaderArtistAndTracklist__Artist"]')?.innerText?.trim();

      // Fallback via <title>
      if (!title || !artist) {
        const pageTitle = document.title;
        const parts = pageTitle.split(' – ');
        artist = artist || parts[0]?.trim();
        title = title || parts[1]?.replace(/Lyrics\s*\|.*$/, '')?.trim();
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
      throw new Error('Incomplete scrape: lyrics/title/artist not found.');
    }

    return data;

  } catch (err) {
    // Screenshot for debugging if it fails
    await page.screenshot({ path: 'genius-error.png' });
    throw new Error(`Genius scrape failed for URL ${url}: ${err.message}`);
  } finally {
    await page.close();
  }
}