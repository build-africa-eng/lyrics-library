import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeGenius } from '../scrapers/genius.js';
import { scrapeAZLyrics } from '../scrapers/azlyrics.js';
import { scrapeLyricsCom } from '../scrapers/lyricscom.js';

const router = express.Router();

// 🎯 POST /scrape — for Cloudflare Worker integration
router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing required field: url' });

  try {
    if (url.includes('genius.com')) return res.json(await scrapeGenius(url));
    if (url.includes('azlyrics.com')) return res.json(await scrapeAZLyrics(url));
    if (url.includes('lyrics.com')) return res.json(await scrapeLyricsCom(url));
    return res.status(400).json({ error: 'Unsupported lyrics source URL' });
  } catch (err) {
    console.error('POST /scrape error:', err);
    return res.status(500).json({ error: err.message || 'Failed to scrape from provided URL' });
  }
});

// 🔍 GET /scrape — for browser/manual testing (with ?query= or ?url= + source)
router.get('/', async (req, res) => {
  const { query, url, source } = req.query;

  // Direct scrape from specified URL and source
  if (url && source) {
    try {
      if (source === 'genius') return res.json(await scrapeGenius(url));
      if (source === 'azlyrics') return res.json(await scrapeAZLyrics(url));
      if (source === 'lyricscom' || source === 'lyrics.com') return res.json(await scrapeLyricsCom(url));
      return res.status(400).json({ error: 'Unsupported source. Use genius, azlyrics, or lyricscom.' });
    } catch (err) {
      console.error('GET /scrape url+source error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Auto-discovery via Google search using query
  if (query) {
    try {
      const searchQuery = encodeURIComponent(`${query} site:azlyrics.com OR site:genius.com OR site:lyrics.com`);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
      const { data: html } = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36'
        }
      });

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
      if (topLink.includes('azlyrics.com')) return res.json(await scrapeAZLyrics(topLink));
      if (topLink.includes('genius.com')) return res.json(await scrapeGenius(topLink));
      if (topLink.includes('lyrics.com')) return res.json(await scrapeLyricsCom(topLink));

      return res.status(400).json({ error: 'Unsupported lyrics source in top result' });
    } catch (err) {
      console.error('GET /scrape query error:', err);
      return res.status(500).json({ error: err.message || 'Failed to auto-discover lyrics source' });
    }
  }

  return res.status(400).json({
    error: 'Missing required parameters. Use ?query= or ?url= and ?source='
  });
});

export default router;
