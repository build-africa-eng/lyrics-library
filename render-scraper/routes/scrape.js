import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
// ++ ADD a caching library
import NodeCache from 'node-cache';

import { scrapeGenius } from '../scrapers/genius.js';
import { scrapeAZLyrics } from '../scrapers/azlyrics.js';
import { scrapeLyricsCom } from '../scrapers/lyricscom.js';

const router = express.Router();
// ++ Create a cache instance. Cache results for 24 hours (86400 seconds).
const lyricsCache = new NodeCache({ stdTTL: 86400 });

// ++ IMPROVEMENT 1: Prioritize the official Genius API
const searchGeniusAPI = async (query) => {
  const accessToken = process.env.GENIUS_API_TOKEN;
  if (!accessToken) {
    console.warn('Genius API token not found. Skipping API search.');
    return null;
  }
  const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(query)}`;
  try {
    const { data } = await axios.get(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Find the first result that has a URL
    const hit = data.response.hits.find(h => h.result.url);
    if (hit) {
      console.log(`Genius API hit: ${hit.result.url}`);
      return scrapeGenius(hit.result.url);
    }
    return null;
  } catch (err) {
    console.error(`Genius API search failed: ${err.message}`);
    return null; // Don't throw, so we can proceed to other methods
  }
};


// REFACTORED searchAndScrape function
const searchAndScrape = async (query) => {
  // ++ Check cache first
  const cachedResult = lyricsCache.get(query);
  if (cachedResult) {
    console.log(`Cache hit for query: ${query}`);
    return { ...cachedResult, source: 'cache' };
  }

  // ++ 1. First, try the reliable Genius API
  try {
    const geniusApiResult = await searchGeniusAPI(query);
    if (geniusApiResult) {
      lyricsCache.set(query, geniusApiResult); // Cache the success
      return geniusApiResult;
    }
  } catch(err) {
    console.warn(`Genius API scrape failed: ${err.message}`);
  }

  // ++ 2. Fallback to scraping Google search for other sites
  const searchQuery = encodeURIComponent(`${query} site:azlyrics.com OR site:lyrics.com`);
  const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' };

  const { data: html } = await axios.get(searchUrl, { headers });
  const $ = cheerio.load(html);
  const links = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href?.includes('/url?q=')) {
      const url = decodeURIComponent(href.split('/url?q=')[1].split('&')[0]);
      if ((url.includes('azlyrics.com') || url.includes('lyrics.com')) && !url.includes('google')) {
        links.push(url);
      }
    }
  });

  if (links.length === 0) {
    throw new Error('No relevant links found in search results.');
  }

  // ++ IMPROVEMENT 2: Use Promise.any to scrape concurrently
  const scrapePromises = links.map(link => {
    if (link.includes('azlyrics.com')) return scrapeAZLyrics(link);
    if (link.includes('lyrics.com')) return scrapeLyricsCom(link);
    return Promise.reject(new Error('Invalid link type')); // Should not happen
  });

  try {
    const result = await Promise.any(scrapePromises);
    lyricsCache.set(query, result); // Cache the success
    return result;
  } catch (err) {
    // Promise.any throws an AggregateError if all promises reject
    console.error('All concurrent scrape attempts failed.', err);
    throw new Error('All scrape attempts failed.');
  }
};


// REFACTORED router handlers to be cleaner
const handleScrapeRequest = async (req, res) => {
  const { query, url, source } = { ...req.body, ...req.query };

  // ++ Check cache for URL-based requests
  if (url) {
    const cachedResult = lyricsCache.get(url);
    if (cachedResult) {
      console.log(`Cache hit for URL: ${url}`);
      return res.json({ ...cachedResult, source: 'cache' });
    }
  }

  try {
    let result;
    if (url) {
      // Logic for direct URL scraping
      const targetSource = source || (url.includes('genius.com') ? 'genius' : url.includes('azlyrics.com') ? 'azlyrics' : url.includes('lyrics.com') ? 'lyricscom' : null);
      
      switch (targetSource) {
        case 'genius':
          result = await scrapeGenius(url);
          break;
        case 'azlyrics':
          result = await scrapeAZLyrics(url);
          break;
        case 'lyricscom':
          result = await scrapeLyricsCom(url);
          break;
        default:
          return res.status(400).json({ error: 'Unsupported or missing URL source' });
      }
      lyricsCache.set(url, result); // Cache the result
      return res.json(result);

    } else if (query) {
      // Logic for query-based searching
      result = await searchAndScrape(query);
      return res.json(result);

    } else {
      return res.status(400).json({ error: 'Missing `query` or `url` parameter.' });
    }
  } catch (err) {
    console.error(`Scrape request failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
};

router.post('/', handleScrapeRequest);
router.get('/', handleScrapeRequest);

export default router;
