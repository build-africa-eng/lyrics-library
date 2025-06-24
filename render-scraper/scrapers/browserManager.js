// browserManager.js - Fixed version with better error handling
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

let browserInstance = null;
let isInitializing = false;

export async function initBrowser() {
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    console.log('⏳ Browser initialization already in progress...');
    // Wait for current initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return browserInstance;
  }

  if (browserInstance && !browserInstance.isConnected()) {
    console.warn('🔌 Browser disconnected, resetting instance...');
    browserInstance = null;
  }

  if (browserInstance) {
    console.log('♻️ Reusing existing browser instance');
    return browserInstance;
  }

  isInitializing = true;
  console.log('🚀 Initializing new browser instance...');
  
  try {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-networking',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--no-zygote',
        '--single-process',
        '--mute-audio',
        '--hide-scrollbars',
        '--memory-pressure-off',
        '--max_old_space_size=256',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
      ],
      defaultViewport: {
        width: 800,
        height: 600,
      },
    });

    // Set up disconnect handler
    browserInstance.on('disconnected', () => {
      console.warn('👋 Browser disconnected unexpectedly');
      browserInstance = null;
    });

    // Verify the browser instance is valid
    if (!browserInstance || typeof browserInstance.newPage !== 'function') {
      throw new Error('Browser instance is invalid - newPage method not available');
    }

    console.log('✅ Browser launched successfully');
    return browserInstance;

  } catch (err) {
    console.error('💥 Failed to launch browser:', err.message);
    browserInstance = null;
    throw new Error(`Browser initialization failed: ${err.message}`);
  } finally {
    isInitializing = false;
  }
}

export async function getBrowser() {
  // Always validate the browser instance before returning
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('🔄 Browser needs (re)initialization...');
    await initBrowser();
  }

  // Double-check the instance is valid
  if (!browserInstance || typeof browserInstance.newPage !== 'function') {
    throw new Error('Browser instance is invalid after initialization');
  }

  return browserInstance;
}

export async function getBrowserPage() {
  const browser = await getBrowser();
  
  try {
    const page = await browser.newPage();
    
    // Set up basic page configuration
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent('Mozilla/5.0 (compatible; ScraperBot/1.0)');
    
    return page;
  } catch (err) {
    console.error('❌ Failed to create new page:', err.message);
    // Reset browser instance if page creation fails
    browserInstance = null;
    throw new Error(`Page creation failed: ${err.message}`);
  }
}

export async function closeBrowser() {
  if (browserInstance) {
    try {
      console.log('🛑 Closing browser instance...');
      await browserInstance.close();
    } catch (err) {
      console.warn('⚠️ Error closing browser:', err.message);
    } finally {
      browserInstance = null;
    }
  }
}

// Utility function to check browser health
export async function checkBrowserHealth() {
  if (!browserInstance) {
    return { healthy: false, reason: 'No browser instance' };
  }

  if (!browserInstance.isConnected()) {
    return { healthy: false, reason: 'Browser disconnected' };
  }

  if (typeof browserInstance.newPage !== 'function') {
    return { healthy: false, reason: 'Invalid browser instance' };
  }

  try {
    // Try to get browser version as a health check
    const version = await browserInstance.version();
    return { healthy: true, version };
  } catch (err) {
    return { healthy: false, reason: `Health check failed: ${err.message}` };
  }
}

// Fixed scrape function using the new page helper
export async function scrapeGenius(inputUrl, retries = 1) {
  const url = inputUrl; // Assuming sanitizeUrl is handled elsewhere
  let page = null;

  try {
    console.log(`🎵 Scraping Genius: ${url}`);
    
    // Use the new helper function
    page = await getBrowserPage();
    
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Quick CAPTCHA check
    const isChallenge = await page.evaluate(() => 
      document.body.innerText.includes("Verifying you are human") ||
      document.title.includes("Just a moment") ||
      document.querySelector('iframe[src*="captcha"]')
    );
    
    if (isChallenge) {
      throw new Error("CAPTCHA detected - cannot proceed");
    }

    // Cookie consent
    try {
      await page.click('button[id="onetrust-accept-btn-handler"]', { timeout: 3000 });
      console.log('✅ Cookie consent accepted');
    } catch {
      console.log('ℹ️ No cookie banner found');
    }

    // Check for 404
    const isNotFound = await page.evaluate(() =>
      document.body.innerText.includes("Page not found")
    );
    if (isNotFound) throw new Error("Page not found");

    // Find lyrics
    const selectors = [
      'div[data-lyrics-container="true"]',
      '[class*="Lyrics__Container"]',
      'div.lyrics'
    ];

    let data = null;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        
        data = await page.evaluate((sel) => {
          const container = document.querySelector(sel);
          if (!container) return null;

          const lyrics = container.innerText.trim();
          const titleEl = document.querySelector('h1[class*="Title"], h1');
          const artistEl = document.querySelector('a[class*="Artist"]');
          
          let title = titleEl?.innerText?.trim();
          let artist = artistEl?.innerText?.trim();

          // Fallback to page title parsing
          if (!title || !artist) {
            const pageTitle = document.title || '';
            const match = pageTitle.match(/^(.+?)\s+(?:by|–)\s+(.+?)\s+(?:–|Lyrics)/);
            if (match) {
              title = title || match[1]?.trim();
              artist = artist || match[2]?.trim();
            }
          }

          return { 
            title: title || 'Unknown', 
            artist: artist || 'Unknown', 
            lyrics, 
            source: 'genius', 
            source_url: location.href 
          };
        }, selector);

        if (data?.lyrics) break;
      } catch {
        continue;
      }
    }

    if (!data?.lyrics) {
      throw new Error("No lyrics found");
    }

    console.log(`✅ Successfully scraped: ${data.title} by ${data.artist}`);
    return data;

  } catch (err) {
    console.error(`❌ Genius scrape error: ${err.message}`);
    
    if (retries > 0 && !err.message.includes('CAPTCHA')) {
      console.warn(`🔁 Retrying... (${retries} left)`);
      if (page) await page.close();
      return scrapeGenius(url, retries - 1);
    }
    
    throw new Error(`Genius scrape failed: ${err.message}`);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        console.warn('⚠️ Error closing page:', err.message);
      }
    }
  }
}
