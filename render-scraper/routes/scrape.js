import express from 'express';
import NodeCache from 'node-cache';
import { getBrowser } from '../scrapers/browserManager.js';
import { scrapeGenius } from '../scrapers/scrapeGenius.js';
import { scrapeAZLyrics } from '../scrapers/scrapeAZLyrics.js';
import { scrapeLyricsCom } from '../scrapers/scrapeLyricsCom.js';

const router = express.Router();
const lyricsCache = new NodeCache({ stdTTL: 43200 }); // 12h cache

// --- Genius API Search ---
const searchGeniusAPI = async (query) => {
  const accessToken = process.env.GENIUS_API_TOKEN;
  if (!accessToken) return null;

  try {
    const response = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;

    const data = await response.json();
    const hit = data.response.hits.find(h => h.result?.url);
    return hit?.result?.url || null;
  } catch (err) {
    console.error(`❌ Genius API error: ${err.message}`);
    return null;
  }
};

// --- Google Fallback ---
const searchOnGoogle = async (query) => {
  const browser = getBrowser();
  const page = await browser.newPage();
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' site:genius.com OR site:azlyrics.com OR site:lyrics.com')}`;
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 600000
    });

    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a')).map(a => a.href);
      return anchors.filter(href =>
        href.includes('genius.com') || href.includes('azlyrics.com') || href.includes('lyrics.com')
      );
    });

    return [...new Set(links)].slice(0, 5); // deduplicate, limit to 5
  } catch (err) {
    console.error(`❌ Google search failed: ${err.message}`);
    return [];
  } finally {
    await page.close();
  }
};

// --- Orchestrator ---
const searchAndScrape = async (query) => {
  const geniusUrl = await searchGeniusAPI(query);
  if (geniusUrl) {
    try {
      const result = await scrapeGenius(geniusUrl);
      if (result) return result;
    } catch (err) {
      console.warn(`⚠️ Genius scrape failed: ${err.message}`);
    }
  }

  const links = await searchOnGoogle(query);
  if (!links.length) {
    throw new Error('No relevant links found in search results.');
  }

  const scrapePromises = links.map(link => {
    if (link.includes('genius.com')) return scrapeGenius(link);
    if (link.includes('azlyrics.com')) return scrapeAZLyrics(link);
    if (link.includes('lyrics.com')) return scrapeLyricsCom(link);
    return Promise.reject(new Error('Unsupported link'));
  });

  try {
    const result = await Promise.any(scrapePromises.map(p => p.catch(e => e)));
    if (result instanceof Error) throw result;
    return result;
  } catch (err) {
    throw new Error('All scrape attempts failed.');
  }
};

// --- Main Handler ---
const handleScrapeRequest = async (req, res, next) => {
  const { query, url } = { ...req.body, ...req.query };
  const cacheKey = query || url;

  if (!cacheKey) {
    return res.status(400).json({ error: 'Missing `query` or `url` parameter.' });
  }

  const cached = lyricsCache.get(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit: ${cacheKey}`);
    return res.json({ ...cached, source: 'cache' });
  }

  console.log(`🔥 Cache miss: ${cacheKey}`);

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

    lyricsCache.set(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error(`❌ Scrape failed: ${err.message}`);
    next(err);
  }
};

router.get('/', handleScrapeRequest);
router.post('/', handleScrapeRequest);

export default router;