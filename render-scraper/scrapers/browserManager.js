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

/**
 * Initializes and returns a singleton Puppeteer browser instance.
 */
export async function initBrowser() {
  if (browserInstance) return browserInstance;

  console.log('🚀 Initializing a new stealth browser instance...');
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
        '--no-zygote',
        '--single-process',
        '--mute-audio',
        '--hide-scrollbars',
      ],
      defaultViewport: {
        width: 1280,
        height: 800,
      },
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
    return browserInstance;
  } catch (err) {
    console.error('💥 Could not launch Puppeteer:', err);
    browserInstance = null;
    throw err;
  }
}

/**
 * Returns the current browser instance. Re-initializes if needed.
 */
export async function getBrowser() {
  if (!browserInstance) {
    console.warn('📭 Browser instance missing. Attempting to (re)initialize...');
    browserInstance = await initBrowser();
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
