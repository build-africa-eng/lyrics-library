// routes/scrape.js

import express from 'express';
import NodeCache from 'node-cache';
import { getBrowser } from '../browserManager.js';
import { scrapeGenius } from '../scrapers/scrapeGenius.js';
import { scrapeAZLyrics } from '../scrapers/scrapeAZLyrics.js';
import { scrapeLyricsCom } from '../scrapers/scrapeLyricsCom.js';

const router = express.Router();
// Cache results for 12 hours.
const lyricsCache = new NodeCache({ stdTTL: 43200 });

// --- Helper Functions ---

/**
 * Uses the official Genius API to find a song URL.
 * Requires GENIUS_API_TOKEN environment variable.
 */
const searchGeniusAPI = async (query) => {
  const accessToken = process.env.GENIUS_API_TOKEN;
  if (!accessToken) return null;

  try {
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const hit = data.response.hits.find(h => h.result.url);
    return hit ? hit.result.url : null;
  } catch (err) {
    console.error(`Genius API search failed: ${err.message}`);
    return null;
  }
};

/**
 * Scrapes Google search results using Puppeteer to find lyric page URLs.
 */
const searchOnGoogle = async (query) => {
  const browser = getBrowser();
  const page = await browser.newPage();
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

    // This selector targets the <a> tag within the main search result heading (<h3>).
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('div.g a'));
      return anchors
        .map(a => a.href)
        .filter(href => href.startsWith('http') && (href.includes('genius.com') || href.includes('azlyrics.com') || href.includes('lyrics.com')));
    });

    return links;
  } finally {
    await page.close();
  }
};


/**
 * The main search and scrape orchestration function.
 */
const searchAndScrape = async (query) => {
  // 1. First, try the Genius API for a direct hit.
  const geniusUrl = await searchGeniusAPI(query);
  if (geniusUrl) {
    try {
      const result = await scrapeGenius(geniusUrl);
      if (result) return result;
    } catch (err) {
      console.warn(`Scrape failed for Genius API URL (${geniusUrl}): ${err.message}`);
    }
  }

  // 2. If Genius API fails, search on Google.
  const links = await searchOnGoogle(query);
  if (links.length === 0) {
    throw new Error('No relevant links found in search results.');
  }

  // 3. Try scraping the found links concurrently.
  const scrapePromises = links.map(link => {
    if (link.includes('genius.com')) return scrapeGenius(link);
    if (link.includes('azlyrics.com')) return scrapeAZLyrics(link);
    if (link.includes('lyrics.com')) return scrapeLyricsCom(link);
    // Return a rejected promise for unsupported links
    return Promise.reject(new Error('Unsupported link'));
  });

  // Use Promise.any to get the first successful result.
  try {
    const result = await Promise.any(scrapePromises.map(p => p.catch(e => e))); // wrap to prevent one rejection from killing all
    if (result instanceof Error) throw result; // rethrow if the first resolved promise was an error
    return result;
  } catch (err) {
    throw new Error('All scrape attempts failed.');
  }
};


// --- Main Route Handler ---

const handleScrapeRequest = async (req, res, next) => {
  // Combine body and query for flexibility (supports GET and POST)
  const { query, url } = { ...req.body, ...req.query };
  const cacheKey = query || url;

  if (!cacheKey) {
    return res.status(400).json({ error: 'Missing `query` or `url` parameter.' });
  }

  // Check cache first
  const cachedResult = lyricsCache.get(cacheKey);
  if (cachedResult) {
    console.log(`✅ Cache hit for: ${cacheKey}`);
    return res.json({ ...cachedResult, source: 'cache' });
  }

  console.log(`🔥 Cache miss. Scraping for: ${cacheKey}`);

  try {
    let result;
    if (url) {
      if (url.includes('genius.com')) result = await scrapeGenius(url);
      else if (url.includes('azlyrics.com')) result = await scrapeAZLyrics(url);
      else if (url.includes('lyrics.com')) result = await scrapeLyricsCom(url);
      else return res.status(400).json({ error: 'Unsupported URL. Must be from Genius, AZLyrics, or Lyrics.com' });
    } else {
      result = await searchAndScrape(query);
    }
    
    // Cache the successful result
    lyricsCache.set(cacheKey, result);
    return res.json(result);

  } catch (err) {
    // Pass error to the global error handler
    next(err);
  }
};

router.get('/', handleScrapeRequest);
router.post('/', handleScrapeRequest);

export default router;
