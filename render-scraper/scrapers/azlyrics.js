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

    // Extract lyrics
    let lyrics = $('div[class*="ringtone"] + div').text().trim();

    // Fallback: longest <div> without class
    if (!lyrics) {
      lyrics = $('div:not([class])').filter(function () {
        return $(this).text().length > 100;
      }).first().text().trim();
    }

    if (!lyrics) throw new Error('Lyrics not found');

    // Extract title
    const title = $('div.lyricsh h1').text().replace(' Lyrics', '').trim()
      || $('title').text().split('-')[1]?.trim();

    // Extract artist
    const artist = $('.lyricsh > h2 > b').text().replace(' Lyrics', '').trim()
      || $('title').text().split('-')[0]?.trim();

    if (!title || !artist) throw new Error('Title or artist not found');

    return {
      title,
      artist,
      lyrics: lyrics.replace(/\r?\n\s*\r?\n/g, '\n\n'),
      source_url: url,
      source: 'azlyrics',
    };
  } catch (error) {
    console.error(`AZLyrics scrape failed for ${url}:`, error.message);
    throw new Error(`AZLyrics error: ${error.message}`);
  }
}
