// File: render-scraper/scrapers/browserManager.js

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';

// 🧠 Configure plugins BEFORE launch
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.CAPTCHA_API_KEY || 'DUMMY_NO_KEY',
    },
    visualFeedback: true,
  })
);

let browserInstance = null;

/**
 * Initializes and returns a singleton Puppeteer browser instance.
 */
export async function initBrowser() {
  if (browserInstance) return browserInstance;

  console.log('🚀 Initializing a new stealth browser instance...');
  try {
    browserInstance = await puppeteer.launch({
      headless: true, // Safer than "new" on Render
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-networking',
        '--disable-extensions',
        '--no-zygote',
        '--single-process',
        '--mute-audio',
        '--hide-scrollbars',
        '--disable-software-rasterizer', // ✅ Helps in headless environments
      ],
      defaultViewport: {
        width: 1280,
        height: 800,
      },
      protocolTimeout: 60000, // ✅ Prevent Network.enable timeout
    });

    console.log('✅ Browser launched successfully.');

    browserInstance.on('disconnected', async () => {
      console.warn('👋 Browser disconnected. Attempting to auto-restart...');
      browserInstance = null;
      try {
        await initBrowser();
        console.log('✅ Browser restarted successfully.');
      } catch (e) {
        console.error('❌ Failed to restart browser:', e);
      }
    });

    return browserInstance;
  } catch (err) {
    console.error('💥 Could not launch Puppeteer:', err);
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
 * Cleanly closes the browser.
 */
export async function closeBrowser() {
  if (browserInstance) {
    console.log('🛑 Closing browser instance...');
    await browserInstance.close();
    browserInstance = null;
  }
}
