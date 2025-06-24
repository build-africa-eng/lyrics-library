import express from 'express';
import NodeCache from 'node-cache';
import { getBrowserPage, checkBrowserHealth } from '../scrapers/browserManager.js';
import { scrapeGenius } from '../scrapers/scrapeGenius.js';
import { scrapeAZLyrics } from '../scrapers/scrapeAZLyrics.js';
import { scrapeLyricsCom } from '../scrapers/scrapeLyricsCom.js';
import sanitizeUrl from '../utils/sanitizeUrl.js';

const router = express.Router();
const lyricsCache = new NodeCache({ stdTTL: 43200 }); // 12h cache

// --- Genius API Search ---
const searchGeniusAPI = async (query) => {
  const accessToken = process.env.GENIUS_API_TOKEN;
  if (!accessToken) {
    console.log('ℹ️ No Genius API token configured');
    return null;
  }

  try {
    console.log(`🎤 Searching Genius API for: ${query}`);
    const response = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(query)}`, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'LyricsScraper/1.0'
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.ok) {
      console.warn(`⚠️ Genius API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const hit = data.response?.hits?.find(h => h.result?.url);
    const url = hit?.result?.url;
    
    if (url) {
      console.log(`✅ Found Genius URL via API: ${url}`);
    } else {
      console.log('ℹ️ No results from Genius API');
    }
    
    return url || null;
  } catch (err) {
    console.error(`❌ Genius API error: ${err.message}`);
    return null;
  }
};

// --- Google Fallback ---
const searchOnGoogle = async (query) => {
  let page = null;
  
  try {
    console.log(`🔍 Searching Google for: ${query}`);
    
    // Use the new getBrowserPage helper instead of getBrowser().newPage()
    page = await getBrowserPage();
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' site:genius.com OR site:azlyrics.com OR site:lyrics.com')}`;
    
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000 // Reduced timeout for low-resource environment
    });

    // Handle Google cookie consent
    try {
      await page.click('button[id="L2AGLb"]', { timeout: 3000 });
      console.log('✅ Google cookies accepted');
    } catch {
      console.log('ℹ️ No Google cookie banner found');
    }

    // Extract links from search results
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors
        .map(a => a.href)
        .filter(href => 
          href && (
            href.includes('genius.com') || 
            href.includes('azlyrics.com') || 
            href.includes('lyrics.com')
          )
        );
    });
    
    // Sanitize and deduplicate URLs
    const sanitizedLinks = [...new Set(links.map(sanitizeUrl))]
      .filter(link => link) // Remove empty strings from failed sanitization
      .slice(0, 5); // Limit to 5 results
    
    console.log(`📋 Found ${sanitizedLinks.length} valid lyrics URLs from Google`);
    return sanitizedLinks;
    
  } catch (err) {
    console.error(`❌ Google search failed: ${err.message}`);
    return [];
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        console.warn('⚠️ Error closing Google search page:', err.message);
      }
    }
  }
};

// --- Orchestrator ---
const searchAndScrape = async (query) => {
  console.log(`🎵 Starting search and scrape for: ${query}`);
  
  // Try Genius API first (fastest)
  const geniusUrl = await searchGeniusAPI(query);
  if (geniusUrl) {
    const cleanedUrl = sanitizeUrl(geniusUrl);
    
    if (!cleanedUrl) {
      console.warn(`⚠️ Genius API returned an invalid URL: ${geniusUrl}`);
    } else {
      try {
        console.log(`🎯 Trying Genius API result: ${cleanedUrl}`);
        const result = await scrapeGenius(cleanedUrl);
        if (result && result.lyrics) {
          console.log(`✅ Success via Genius API: ${result.title} by ${result.artist}`);
          return result;
        }
      } catch (err) {
        console.warn(`⚠️ Genius API URL scrape failed: ${err.message}`);
      }
    }
  }

  // Fallback to Google search
  const links = await searchOnGoogle(query);
  if (!links.length) {
    throw new Error('No relevant links found in search results');
  }
  
  console.log(`🔄 Attempting to scrape ${links.length} URLs from Google results`);

  // Try each link sequentially (better for low-resource environment)
  for (const link of links) {
    try {
      console.log(`🎯 Trying: ${link}`);
      
      let result;
      if (link.includes('genius.com')) {
        result = await scrapeGenius(link);
      } else if (link.includes('azlyrics.com')) {
        result = await scrapeAZLyrics(link);
      } else if (link.includes('lyrics.com')) {
        result = await scrapeLyricsCom(link);
      } else {
        console.warn(`⚠️ Unsupported site: ${link}`);
        continue;
      }
      
      if (result && result.lyrics) {
        console.log(`✅ Success: ${result.title} by ${result.artist} from ${result.source}`);
        return result;
      }
    } catch (err) {
      console.warn(`⚠️ Failed to scrape ${link}: ${err.message}`);
      continue; // Try next URL
    }
  }

  throw new Error('All scrape attempts failed');
};

// --- Health Check Handler ---
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

// --- Main Handler ---
const handleScrapeRequest = async (req, res, next) => {
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

  // Check cache first
  const cached = lyricsCache.get(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit: ${cacheKey}`);
    return res.json({ 
      ...cached, 
      cached: true,
      cache_timestamp: cached.timestamp || 'unknown'
    });
  }

  console.log(`🔥 Cache miss: ${cacheKey}`);

  try {
    let result;

    if (url) {
      // Direct URL scraping
      const cleanedUrl = sanitizeUrl(url);
      if (!cleanedUrl) {
        return res.status(400).json({ 
          error: 'Invalid or unsupported URL provided',
          provided_url: url 
        });
      }

      console.log(`🎯 Direct scrape requested: ${cleanedUrl}`);

      if (cleanedUrl.includes('genius.com')) {
        result = await scrapeGenius(cleanedUrl);
      } else if (cleanedUrl.includes('azlyrics.com')) {
        result = await scrapeAZLyrics(cleanedUrl);
      } else if (cleanedUrl.includes('lyrics.com')) {
        result = await scrapeLyricsCom(cleanedUrl);
      } else {
        return res.status(400).json({ 
          error: 'Unsupported URL. Must be from Genius, AZLyrics, or Lyrics.com',
          supported_sites: ['genius.com', 'azlyrics.com', 'lyrics.com']
        });
      }
    } else {
      // Search and scrape
      result = await searchAndScrape(query);
    }

    // Add metadata
    result.timestamp = new Date().toISOString();
    result.scraped_via = url ? 'direct' : 'search';
    result.cached = false;

    // Cache the result
    lyricsCache.set(cacheKey, result);
    
    console.log(`✅ Scrape successful: ${result.title} by ${result.artist}`);
    return res.json(result);

  } catch (err) {
    console.error(`❌ Scrape failed for "${cacheKey}": ${err.message}`);
    
    // Return detailed error information
    const errorResponse = {
      error: 'Scrape failed',
      message: err.message,
      query: query || null,
      url: url || null,
      timestamp: new Date().toISOString()
    };

    // Add specific error codes for common issues
    if (err.message.includes('CAPTCHA')) {
      errorResponse.error_code = 'CAPTCHA_BLOCKED';
      errorResponse.suggestion = 'Try again later or use a different query';
    } else if (err.message.includes('not found')) {
      errorResponse.error_code = 'NOT_FOUND';
      errorResponse.suggestion = 'Check spelling or try different search terms';
    } else if (err.message.includes('timeout')) {
      errorResponse.error_code = 'TIMEOUT';
      errorResponse.suggestion = 'Server is busy, try again in a moment';
    }

    res.status(500).json(errorResponse);
  }
};

// Routes
router.get('/', handleScrapeRequest);
router.post('/', handleScrapeRequest);
router.get('/health', handleHealthCheck);

export default router;
