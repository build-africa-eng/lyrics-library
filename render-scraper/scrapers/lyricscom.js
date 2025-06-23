import puppeteer from "puppeteer";

export async function scrapeLyricsCom(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const data = await page.evaluate(() => {
      const title = document.querySelector("h1")?.textContent?.trim();
      const artist = document.querySelector("h3 a")?.textContent?.trim();
      const lyrics = document.querySelector(".lyric-body")?.innerText?.trim();

      return {
        title,
        artist,
        lyrics,
        source_url: location.href,
        source: 'lyricscom',
      };
    });

    if (!data.lyrics || !data.title || !data.artist) {
      throw new Error("Incomplete scrape result from Lyrics.com");
    }

    return data;
  } catch (err) {
    console.error("Lyrics.com scrape failed:", err.message);
    throw new Error(`Lyrics.com error: ${err.message}`);
  } finally {
    await browser.close();
  }
}
