
import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeGenius } from '../scrapers/genius.js';
import { scrapeAZLyrics } from '../scrapers/azlyrics.js';
import { scrapeLyricsCom } from '../scrapers/lyricscom.js';

const router = express.Router();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.google.com/',
};

/**
 * Attempts to scrape lyrics based on Google search
 */
async function searchAndScrape(query) {
  const searchQuery = encodeURIComponent(`${query} site:azlyrics.com OR site:genius.com OR site:lyrics.com`);
  const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
  const { data: html } = await axios.get(googleSearchUrl, { headers: HEADERS });

  const $ = cheerio.load(html);
  const links = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href?.includes('/url?q=')) {
      const cleanUrl = decodeURIComponent(href.split('/url?q=')[1].split('&')[0]);
      if (
        (cleanUrl.includes('azlyrics.com') ||
         cleanUrl.includes('genius.com') ||
         cleanUrl.includes('lyrics.com')) &&
        !cleanUrl.includes('google')
      ) {
        links.push(cleanUrl);
      }
    }
  });

  if (links.length === 0) throw new Error('No lyrics sources found.');

  const topLink = links[0];
  if (topLink.includes('azlyrics.com')) return await scrapeAZLyrics(topLink);
  if (topLink.includes('genius.com')) return await scrapeGenius(topLink);
  if (topLink.includes('lyrics.com')) return await scrapeLyricsCom(topLink);

  throw new Error('Unsupported lyrics source in Google result.');
}

// POST /scrape — used by Cloudflare Worker
router.post('/', async (req, res) => {
  const { url, query } = req.body;
  if (!url && !query) {
    return res.status(400).json({ error: 'Missing required field: url or query' });
  }

  try {
    if (url) {
      if (url.includes('genius.com')) return res.json(await scrapeGenius(url));
      if (url.includes('azlyrics.com')) return res.json(await scrapeAZLyrics(url));
      if (url.includes('lyrics.com')) return res.json(await scrapeLyricsCom(url));
      return res.status(400).json({ error: 'Unsupported lyrics source URL' });
    } else {
      // fallback search mode
      const scraped = await searchAndScrape(query);
      return res.json(scraped);
    }
  } catch (err) {
    console.error('POST /scrape error:', err);
    return res.status(500).json({ error: err.message || 'Failed to scrape' });
  }
});

// GET /scrape — manual access
router.get('/', async (req, res) => {
  const { query, url, source } = req.query;

  try {
    if (url && source) {
      if (source === 'genius') return res.json(await scrapeGenius(url));
      if (source === 'azlyrics') return res.json(await scrapeAZLyrics(url));
      if (source === 'lyricscom') return res.json(await scrapeLyricsCom(url));
      return res.status(400).json({ error: 'Unsupported source. Use genius, azlyrics, or lyricscom.' });
    }

    if (query) {
      const scraped = await searchAndScrape(query);
      return res.json(scraped);
    }

    return res.status(400).json({ error: 'Missing ?query= or ?url= and ?source=' });
  } catch (err) {
    console.error('GET /scrape query error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
