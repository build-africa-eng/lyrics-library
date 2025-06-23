import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeGenius } from '../scrapers/genius.js';
import { scrapeAZLyrics } from '../scrapers/azlyrics.js';
import { scrapeLyricsCom } from '../scrapers/lyricscom.js';

const router = express.Router();

const searchAndScrape = async (query) => {
  const searchQuery = encodeURIComponent(`${query} site:genius.com OR site:azlyrics.com OR site:lyrics.com`);
  const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114 Safari/537.36',
  };

  const { data: html } = await axios.get(searchUrl, { headers });
  const $ = cheerio.load(html);
  const links = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href?.includes('/url?q=')) {
      const cleanUrl = decodeURIComponent(href.split('/url?q=')[1].split('&')[0]);
      if (
        (cleanUrl.includes('genius.com') ||
          cleanUrl.includes('azlyrics.com') ||
          cleanUrl.includes('lyrics.com')) &&
        !cleanUrl.includes('google')
      ) {
        links.push(cleanUrl);
      }
    }
  });

  if (links.length === 0) throw new Error('No lyrics sources found.');

  const topLink = links[0];
  if (topLink.includes('genius.com')) return await scrapeGenius(topLink);
  if (topLink.includes('azlyrics.com')) return await scrapeAZLyrics(topLink);
  if (topLink.includes('lyrics.com')) return await scrapeLyricsCom(topLink);

  throw new Error('Unsupported lyrics source in Google result.');
};

// POST /scrape — used by Cloudflare Worker or frontend
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
    }

    if (query) {
      const result = await searchAndScrape(query);
      return res.json(result);
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    console.error('POST /scrape error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /scrape — for manual test or dev use
router.get('/', async (req, res) => {
  const { query, url, source } = req.query;

  if (url && source) {
    try {
      if (source === 'genius') return res.json(await scrapeGenius(url));
      if (source === 'azlyrics') return res.json(await scrapeAZLyrics(url));
      if (source === 'lyricscom' || source === 'lyrics.com') return res.json(await scrapeLyricsCom(url));
      return res.status(400).json({ error: 'Unsupported source. Use genius, azlyrics, or lyricscom.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (query) {
    try {
      const result = await searchAndScrape(query);
      return res.json(result);
    } catch (err) {
      console.error('GET /scrape query error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Missing ?query= or ?url= and ?source=' });
});

export default router;
