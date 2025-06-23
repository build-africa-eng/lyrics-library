import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeGenius } from '../scrapers/genius.js';
import { scrapeAZLyrics } from '../scrapers/azlyrics.js';
import { scrapeLyricsCom } from '../scrapers/lyricscom.js';

const router = express.Router();

// Tries direct search → fallback search → hardcoded Genius URL format
const searchAndScrape = async (query) => {
  const searchQuery = encodeURIComponent(`${query} site:genius.com OR site:azlyrics.com OR site:lyrics.com`);
  const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0',
  };

  const { data: html } = await axios.get(searchUrl, { headers });
  const $ = cheerio.load(html);
  const links = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href?.includes('/url?q=')) {
      const url = decodeURIComponent(href.split('/url?q=')[1].split('&')[0]);
      if (
        (url.includes('genius.com') || url.includes('azlyrics.com') || url.includes('lyrics.com')) &&
        !url.includes('google')
      ) {
        links.push(url);
      }
    }
  });

  for (const link of links) {
    try {
      if (link.includes('genius.com')) return await scrapeGenius(link);
      if (link.includes('azlyrics.com')) return await scrapeAZLyrics(link);
      if (link.includes('lyrics.com')) return await scrapeLyricsCom(link);
    } catch (err) {
      console.warn(`Scrape failed for ${link}: ${err.message}`);
    }
  }

  // Final fallback: Try generating Genius URL
  const slug = query.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
  const fallbackUrl = `https://genius.com/${slug}-lyrics`;
  try {
    const fallbackResult = await scrapeGenius(fallbackUrl);
    return fallbackResult;
  } catch (err) {
    throw new Error('All scrape attempts failed.');
  }
};

// POST /scrape (JSON body)
router.post('/', async (req, res) => {
  const { url, query } = req.body;
  if (!url && !query) return res.status(400).json({ error: 'Missing query or url.' });

  try {
    if (url) {
      if (url.includes('genius.com')) return res.json(await scrapeGenius(url));
      if (url.includes('azlyrics.com')) return res.json(await scrapeAZLyrics(url));
      if (url.includes('lyrics.com')) return res.json(await scrapeLyricsCom(url));
      return res.status(400).json({ error: 'Unsupported URL' });
    }

    const result = await searchAndScrape(query);
    return res.json(result);
  } catch (err) {
    console.error(`POST /scrape error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// GET /scrape?query=... or /scrape?url=...&source=...
router.get('/', async (req, res) => {
  const { query, url, source } = req.query;

  if (url && source) {
    try {
      if (source === 'genius') return res.json(await scrapeGenius(url));
      if (source === 'azlyrics') return res.json(await scrapeAZLyrics(url));
      if (source === 'lyricscom') return res.json(await scrapeLyricsCom(url));
      return res.status(400).json({ error: 'Unsupported source param' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (query) {
    try {
      const result = await searchAndScrape(query);
      return res.json(result);
    } catch (err) {
      console.error(`GET /scrape query error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Missing query or url+source' });
});

export default router;
