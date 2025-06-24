// browserManager.js

// 1. Import from 'puppeteer-extra'
import puppeteer from 'puppeteer-extra';

// 2. Import the Stealth plugin
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// 3. Apply the stealth plugin. This should be done before launching the browser.
puppeteer.use(StealthPlugin());

let browserInstance = null;

/**
 * Initializes and returns a singleton Puppeteer browser instance.
 */
export async function initBrowser() {
  if (browserInstance) return browserInstance;

  // I've updated the log message to confirm stealth mode is active.
  console.log('🚀 Initializing a new stealth browser instance...');
  try {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-networking',
        '--disable-default-apps',
        '--hide-scrollbars',
        '--mute-audio',
      ],
    });

    browserInstance.on('disconnected', async () => {
      console.warn('👋 Browser instance disconnected. Attempting auto-restart...');
      browserInstance = null;
      try {
        await initBrowser();
        console.log('✅ Browser successfully restarted.');
      } catch (e) {
        console.error('❌ Failed to restart browser after disconnect:', e);
      }
    });

    return browserInstance;
  } catch (err) {
    console.error('💥 Could not create a browser instance:', err);
    throw err;
  }
}

/**
 * Returns the current browser instance. Throws if not initialized.
 */
export function getBrowser() {
  if (!browserInstance) {
    throw new Error('❌ Browser not initialized. Call initBrowser() first.');
  }
  return browserInstance;
}

/**
 * Closes the browser instance cleanly, if it exists.
 */
export async function closeBrowser() {
  if (browserInstance) {
    console.log('🛑 Closing browser instance...');
    await browserInstance.close();
    browserInstance = null;
  }
}