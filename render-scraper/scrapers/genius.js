// /render-scraper/scrapers/genius.js
import puppeteer from "puppeteer";

export async function scrapeGenius(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  const data = await page.evaluate(() => {
    const title = document.querySelector(".header_with_cover_art-primary_info-title")?.textContent?.trim();
    const artist = document.querySelector(".header_with_cover_art-primary_info-primary_artist")?.textContent?.trim();
    const lyrics = [...document.querySelectorAll(".Lyrics__Container")]
      .map(el => el.innerText.trim()).join("\n\n");
    return { title, artist, lyrics, source_url: location.href };
  });
  await browser.close();
  return data;
}