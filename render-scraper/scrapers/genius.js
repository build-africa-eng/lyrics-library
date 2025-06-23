import puppeteer from "puppeteer";

export async function scrapeGenius(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const data = await page.evaluate(() => {
      const title = document.querySelector(".header_with_cover_art-primary_info-title")?.textContent?.trim();
      const artist = document.querySelector(".header_with_cover_art-primary_info-primary_artist")?.textContent?.trim();

      const lyrics = [...document.querySelectorAll(".Lyrics__Container, .lyrics")]
        .map(el => el.innerText.trim()).join("\n\n");

      return {
        title,
        artist,
        lyrics,
        source_url: location.href,
        source: 'genius',
      };
    });

    if (!data.lyrics || !data.title || !data.artist) {
      throw new Error("Incomplete scrape result from Genius");
    }

    return data;
  } catch (err) {
    console.error("Genius scrape failed:", err.message);
    throw new Error(`Genius error: ${err.message}`);
  } finally {
    await browser.close();
  }
}
