import express from 'express';
import { scrapeGenius } from '../scrapers/genius.js';
import { scrapeAZLyrics } from '../scrapers/azlyrics.js';
import { scrapeLyricsCom } from '../scrapers/lyricscom.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

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
      if (source === 'lyricscom' || source === 'lyrics.com') {
        const result = await scrapeLyricsCom(url);
        return res.json(result);
      }
      return res.status(400).json({ error: 'Unsupported source. Use genius, azlyrics, or lyricscom.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Failed to scrape lyrics from URL.' });
    }
  }

  // Search Mode
  if (query) {
    try {
      const searchQuery = encodeURIComponent(`${query} site:azlyrics.com OR site:genius.com OR site:lyrics.com`);
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

      const directUrl = links[0];
      if (directUrl.includes('azlyrics.com')) {
        const result = await scrapeAZLyrics(directUrl);
        return res.json(result);
      }
      if (directUrl.includes('genius.com')) {
        const result = await scrapeGenius(directUrl);
        return res.json(result);
      }
      if (directUrl.includes('lyrics.com')) {
        const result = await scrapeLyricsCom(directUrl);
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