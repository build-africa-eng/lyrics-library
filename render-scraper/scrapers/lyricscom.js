// /render-scraper/scrapers/lyricscom.js
import puppeteer from "puppeteer";

export async function scrapeLyricsCom(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  const data = await page.evaluate(() => {
    const title = document.querySelector("h1")?.textContent?.trim();
    const artist = document.querySelector("h3 a")?.textContent?.trim();
    const lyrics = document.querySelector(".lyric-body")?.innerText?.trim();
    return { title, artist, lyrics, source_url: location.href };
  });
  await browser.close();
  return data;
}