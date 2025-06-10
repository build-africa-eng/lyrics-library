import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

export async function scrapeAZLyrics(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract lyrics (robust fallback if structure changes)
    let lyrics = $('div[class*="ringtone"] + div').text().trim();

    // Fallback (rare cases)
    if (!lyrics) {
      lyrics = $('div:not([class])').filter(function () {
        return $(this).text().length > 100;
      }).first().text().trim();
    }

    if (!lyrics) throw new Error('Lyrics not found');

    // Extract title
    const title = $('h1').text().replace(' Lyrics', '').trim();
    if (!title) throw new Error('Title not found');

    // Extract artist from .lyricsh h2 > b
    const artist = $('.lyricsh h2 b').text().replace(' Lyrics', '').trim();
    if (!artist) throw new Error('Artist not found');

    return {
      title,
      artist,
      lyrics: lyrics.replace(/\r?\n\s*\r?\n/g, '\n\n'), // normalize blank lines
      source_url: url,
      source: 'azlyrics',
    };
  } catch (error) {
    console.error(`AZLyrics scrape failed for ${url}:`, error.message);
    return null;
  }
}