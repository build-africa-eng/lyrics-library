limport express from 'express';
import NodeCache from 'node-cache';
import { getBrowserPage, checkBrowserHealth } from '../scrapers/browserManager.js';
import { tryGeniusFallback } from '../scrapers/scrapeGenius.js';
import { scrapeAZLyrics } from '../scrapers/scrapeAZLyrics.js';
import { scrapeLyricsCom } from '../scrapers/scrapeLyricsCom.js';
import { scrapeMusixmatch } from '../scrapers/scrapeMusixmatch.js';
import { scrapeMetrolyrics } from '../scrapers/scrapeMetrolyrics.js';
import sanitizeUrl from '../utils/sanitizeUrl.js';
import { isAllowedDomain } from '../utils/allowedDomains.js';

const router = express.Router();
const lyricsCache = new NodeCache({ stdTTL: 43200 }); // 12h cache

// Helper: Google Search
const searchOnGoogle = async (query) => {
  let page = null;
  try {
    console.log(`🔍 Searching Google for: ${query}`);
    page = await getBrowserPage();
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      query + ' site:genius.com OR site:azlyrics.com OR site:lyrics.com OR site:musixmatch.com OR site:metrolyrics.com'
    )}`;

    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    try {
      await page.click('button[id="L2AGLb"]', { timeout: 3000 });
    } catch {}

    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(Boolean)
    );

    return [...new Set(links.map(sanitizeUrl))].filter(isAllowedDomain).slice(0, 5);
  } catch (err) {
    console.error(`❌ Google search failed: ${err.message}`);
    return [];
  } finally {
    if (page) await page.close().catch(() => {});
  }
};

// Orchestrator
const searchAndScrape = async (query) => {
  console.log(`🎵 Search and scrape: ${query}`);
  const links = await searchOnGoogle(query);
  if (!links.length) throw new Error('No relevant links found in search results');

  for (const link of links) {
    try {
      console.log(`🎯 Trying: ${link}`);
      if (link.includes('genius.com')) return await scrapeGenius(link);
      if (link.includes('azlyrics.com')) return await scrapeAZLyrics(link);
      if (link.includes('lyrics.com')) return await scrapeLyricsCom(link);
      if (link.includes('musixmatch.com')) return await scrapeMusixmatch(link);
      if (link.includes('metrolyrics.com')) return await scrapeMetrolyrics(link);
    } catch (err) {
      console.warn(`⚠️ Failed: ${link}: ${err.message}`);
    }
  }

  throw new Error('All scrape attempts failed');
};

// Main handler
const handleScrapeRequest = async (req, res) => {
  const { query, url } = { ...req.body, ...req.query };
  const cacheKey = query || url;

  if (!cacheKey) {
    return res.status(400).json({
      error: 'Missing required parameter: query or url',
      usage: {
        search: '/scrape?query=artist song',
        direct: '/scrape?url=https://genius.com/...'
      }
    });
  }

  const cached = lyricsCache.get(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit: ${cacheKey}`);
    return res.json({ ...cached, cached: true });
  }

  console.log(`🔥 Cache miss: ${cacheKey}`);

  try {
    let result;

    if (url) {
      const cleanedUrl = sanitizeUrl(url);
      if (!cleanedUrl || !isAllowedDomain(cleanedUrl)) {
        return res.status(400).json({
          error: 'Invalid or unsupported URL provided',
          provided_url: url,
          supported_sites: ['genius.com', 'azlyrics.com', 'lyrics.com', 'musixmatch.com', 'metrolyrics.com']
        });
      }

      if (cleanedUrl.includes('genius.com')) {
        result = await scrapeGenius(cleanedUrl);
      } else if (cleanedUrl.includes('azlyrics.com')) {
        result = await scrapeAZLyrics(cleanedUrl);
      } else if (cleanedUrl.includes('lyrics.com')) {
        result = await scrapeLyricsCom(cleanedUrl);
      } else if (cleanedUrl.includes('musixmatch.com')) {
        result = await scrapeMusixmatch(cleanedUrl);
      } else if (cleanedUrl.includes('metrolyrics.com')) {
        result = await scrapeMetrolyrics(cleanedUrl);
      }
    } else {
      result = await searchAndScrape(query);
    }

    result.timestamp = new Date().toISOString();
    result.scraped_via = url ? 'direct' : 'search';
    result.cached = false;
    lyricsCache.set(cacheKey, result);

    console.log(`✅ Scraped: ${result.title} by ${result.artist}`);
    return res.json(result);

  } catch (err) {
    console.error(`❌ Failed: ${cacheKey}: ${err.message}`);

    // 🧠 Genius API fallback
    if (query) {
      try {
        const fallback = await tryGeniusFallback(query);
        if (fallback) {
          fallback.timestamp = new Date().toISOString();
          fallback.scraped_via = 'genius-api';
          fallback.cached = false;
          lyricsCache.set(cacheKey, fallback);

          console.log(`✅ Fallback via Genius API: ${fallback.title} by ${fallback.artist}`);
          return res.json(fallback);
        }
      } catch (apiErr) {
        console.warn('⚠️ Genius API fallback also failed:', apiErr.message);
      }
    }

    const errorResponse = {
      error: 'Scrape failed',
      message: err.message,
      query: query || null,
      url: url || null,
      timestamp: new Date().toISOString()
    };

    if (err.message.includes('CAPTCHA')) {
      errorResponse.error_code = 'CAPTCHA_BLOCKED';
      errorResponse.suggestion = 'Try again later';
    } else if (err.message.includes('not found')) {
      errorResponse.error_code = 'NOT_FOUND';
    } else if (err.message.includes('timeout')) {
      errorResponse.error_code = 'TIMEOUT';
    }

    return res.status(500).json(errorResponse);
  }
};

// Health route
const handleHealthCheck = async (req, res) => {
  try {
    const health = await checkBrowserHealth();
    res.json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      browser: health,
      cache: {
        keys: lyricsCache.keys().length,
        stats: lyricsCache.getStats()
      },
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Register routes
router.get('/', handleScrapeRequest);
router.post('/', handleScrapeRequest);
router.get('/health', handleHealthCheck);

export default router;