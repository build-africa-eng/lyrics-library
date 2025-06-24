// scrapers/scrapeAZLyrics.js

import * as cheerio from 'cheerio';

// This scraper uses node-fetch and Cheerio because AZLyrics is a simple,
// static HTML site, making a full browser like Puppeteer unnecessary and inefficient.

export async function scrapeAZLyrics(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Primary selector for lyrics
    let lyrics = $('div:not([class]):not([id])').text().trim();
    if (!lyrics) {
        throw new Error('Lyrics container not found.');
    }

    // Extract title and artist from the h1 and h2 tags
    const title = $('h1').text().replace(/"/g, '').replace(' lyrics', '').trim();
    const artist = $('div.lyricsh > h2 > b').text().replace(' Lyrics', '').trim();

    if (!title || !artist) {
        throw new Error('Title or artist not found.');
    }

    return {
      title,
      artist,
      lyrics,
      source_url: url,
      source: 'azlyrics',
    };
  } catch (error) {
    throw new Error(`AZLyrics scrape failed for ${url}: ${error.message}`);
  }
}
