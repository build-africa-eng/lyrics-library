// /render-scraper/scrapers/azlyrics.js
import fetch from "node-fetch";
import cheerio from "cheerio";

export async function scrapeAZLyrics(url) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  const lyricsDiv = $(".col-xs-12.col-lg-8.text-center > div").eq(6);
  const lyrics = lyricsDiv.text().trim();
  const title = $("b").first().text().replace(/"/g, '').trim();
  const artist = $(".lyricsh > h2").text().replace("Lyrics", '').trim();
  return { title, artist, lyrics, source_url: url };
}