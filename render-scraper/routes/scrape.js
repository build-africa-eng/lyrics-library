import express from 'express';
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import * as cheerio from 'cheerio';
import axios from 'axios';

const router = express.Router();

// --- Genius scraper ---
async function scrapeGenius(url) {
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

// --- AZLyrics scraper ---
async function scrapeAZLyrics(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    let lyrics = $('div[class*="ringtone"] + div').text().trim();

    if (!lyrics) {
      lyrics = $('div:not([class])').filter(function () {
        return $(this).text().length > 100;
      }).first().text().trim();
    }

    if (!lyrics) throw new Error('Lyrics not found');

    const title = $('h1').text().replace(' Lyrics', '').trim();
    if (!title) throw new Error('Title not found');

    const artist = $('.lyricsh h2 b').text().replace(' Lyrics', '').trim();
    if (!artist) throw new Error('Artist not found');

    return {
      title,
      artist,
      lyrics: lyrics.replace(/\r?\n\s*\r?\n/g, '\n\n'),
      source_url: url,
      source: 'azlyrics',
    };
  } catch (error) {
    console.error(`AZLyrics scrape failed for ${url}:`, error.message);
    return null;
  }
}

// --- Scrape handler for both search and direct URL ---
router.get('/', async (req, res) => {
  const { query, url, source } = req.query;

  // Direct URL Mode
  if (url && source) {
    try {
      if (source === 'genius') {
        const result = await scrapeGenius(url);
        return res.json(result);
      }
      if (source === 'azlyrics') {
        const result = await scrapeAZLyrics(url);
        return res.json(result);
      }
      return res.status(400).json({ error: 'Unsupported source. Use genius or azlyrics.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Failed to scrape lyrics from URL.' });
    }
  }

  // Search Mode
  if (query) {
    try {
      const searchQuery = encodeURIComponent(`${query} site:azlyrics.com OR site:genius.com`);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}`;

      const { data: html } = await axios.get(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36',
        },
      });

      const $ = cheerio.load(html);
      const links = [];

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href?.includes('/url?q=')) {
          const cleanUrl = decodeURIComponent(href.split('/url?q=')[1].split('&')[0]);
          if (
            (cleanUrl.includes('azlyrics.com') || cleanUrl.includes('genius.com')) &&
            !cleanUrl.includes('google')
          ) {
            links.push(cleanUrl);
          }
        }
      });

      if (links.length === 0) throw new Error('No lyrics sources found.');

      const directUrl = links[0];
      if (directUrl.includes('azlyrics.com')) {
        const result = await scrapeAZLyrics(directUrl);
        return res.json(result);
      }
      if (directUrl.includes('genius.com')) {
        const result = await scrapeGenius(directUrl);
        return res.json(result);
      }
      throw new Error('Unsupported lyrics site.');
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Failed to scrape lyrics' });
    }
  }

  return res.status(400).json({ error: 'Missing ?query= or ?url= and ?source= parameters.' });
});

export default router;