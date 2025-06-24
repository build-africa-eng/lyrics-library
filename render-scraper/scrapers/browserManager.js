// render-scraper/scrapers/browserManager.js

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';

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
let initializing = false;
let waitingResolvers = [];

async function waitForBrowserReady() {
  if (browserInstance) return browserInstance;

  return new Promise((resolve, reject) => {
    waitingResolvers.push(resolve);
    // Optional timeout fallback
    setTimeout(() => reject(new Error('Browser failed to initialize in time.')), 15000);
  });
}

async function resolveAllWaiters(instance) {
  waitingResolvers.forEach((resolve) => resolve(instance));
  waitingResolvers = [];
}

export async function initBrowser() {
  if (browserInstance) return browserInstance;
  if (initializing) return waitForBrowserReady();

  initializing = true;
  console.log('🚀 Initializing a new stealth browser instance...');
  try {
    browserInstance = await puppeteer.launch({
      headless: true,
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
        '--disable-software-rasterizer',
      ],
      defaultViewport: { width: 1280, height: 800 },
      protocolTimeout: 60000,
    });

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

    console.log('✅ Browser launched successfully.');
    resolveAllWaiters(browserInstance);
    return browserInstance;
  } catch (err) {
    console.error('💥 Could not launch Puppeteer:', err);
    resolveAllWaiters(null); // Prevent hanging
    throw err;
  } finally {
    initializing = false;
  }
}

export async function getBrowser() {
  if (browserInstance) return browserInstance;
  return waitForBrowserReady();
}

export async function closeBrowser() {
  if (browserInstance) {
    console.log('🛑 Closing browser instance...');
    await browserInstance.close();
    browserInstance = null;
  }
}
