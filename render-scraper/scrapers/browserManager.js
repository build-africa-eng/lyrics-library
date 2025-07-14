// browserManager.js - Final optimized version
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

let browserInstance = null;
let isInitializing = false;

// --- Initialize Browser ---
export async function initBrowser() {
  if (isInitializing) {
    console.log('⏳ Browser initialization in progress...');
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return browserInstance;
  }

  if (browserInstance && !browserInstance.isConnected()) {
    console.warn('🔌 Disconnected browser found. Resetting...');
    browserInstance = null;
  }

  if (browserInstance) {
    console.log('♻️ Reusing existing browser instance');
    return browserInstance;
  }

  isInitializing = true;
  console.log('🚀 Launching browser...');

  try {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-images',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--mute-audio',
        '--single-process',
        '--no-zygote',
        '--hide-scrollbars',
        '--memory-pressure-off',
        '--max_old_space_size=256',
      ],
      defaultViewport: {
        width: 800,
        height: 600,
      },
    });

    browserInstance.on('disconnected', () => {
      console.warn('👋 Browser disconnected');
      browserInstance = null;
    });

    console.log('✅ Browser launched');
    return browserInstance;

  } catch (err) {
    console.error('💥 Browser launch failed:', err.message);
    browserInstance = null;
    throw new Error(`Browser initialization failed: ${err.message}`);
  } finally {
    isInitializing = false;
  }
}

// --- Get Browser Instance ---
export async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('🔄 (Re)initializing browser...');
    await initBrowser();
  }

  if (!browserInstance || typeof browserInstance.newPage !== 'function') {
    throw new Error('Invalid browser instance');
  }

  return browserInstance;
}

// --- Get New Page with Interception ---
export async function getBrowserPage() {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/115.0.0.0 Safari/537.36'
    );

    return page;
  } catch (err) {
    console.error('❌ Failed to open new page:', err.message);
    browserInstance = null;
    throw new Error(`Page creation failed: ${err.message}`);
  }
}

// --- Close Browser Instance ---
export async function closeBrowser() {
  if (browserInstance) {
    try {
      console.log('🛑 Closing browser...');
      await browserInstance.close();
    } catch (err) {
      console.warn('⚠️ Browser close error:', err.message);
    } finally {
      browserInstance = null;
    }
  }
}

// --- Health Check Utility ---
export async function checkBrowserHealth() {
  if (!browserInstance) {
    return { healthy: false, reason: 'No browser instance' };
  }
  if (!browserInstance.isConnected()) {
    return { healthy: false, reason: 'Browser disconnected' };
  }
  if (typeof browserInstance.newPage !== 'function') {
    return { healthy: false, reason: 'Invalid browser API' };
  }

  try {
    const version = await browserInstance.version();
    return { healthy: true, version };
  } catch (err) {
    return { healthy: false, reason: `Health check failed: ${err.message}` };
  }
}