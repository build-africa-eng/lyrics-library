// browserManager.js - Optimized for low resources
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// Remove heavy plugins to save memory
puppeteer.use(StealthPlugin());

let browserInstance = null;

export async function initBrowser() {
  if (browserInstance) return browserInstance;
  console.log('🚀 Initializing minimal browser instance...');
  
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
        '--disable-images', // Save bandwidth and memory
        '--disable-javascript', // We'll enable selectively if needed
        '--no-zygote',
        '--single-process',
        '--mute-audio',
        '--hide-scrollbars',
        '--memory-pressure-off',
        '--max_old_space_size=256', // Limit V8 heap
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
      ],
      defaultViewport: {
        width: 800,  // Smaller viewport
        height: 600,
      },
    });

    browserInstance.on('disconnected', async () => {
      console.warn('👋 Browser disconnected. Cleaning up...');
      browserInstance = null;
    });

    console.log('✅ Minimal browser launched successfully.');
    return browserInstance;
  } catch (err) {
    console.error('💥 Could not launch browser:', err);
    browserInstance = null;
    throw err;
  }
}

export async function getBrowser() {
  if (!browserInstance) {
    console.warn('📭 Browser instance missing. Reinitializing...');
    browserInstance = await initBrowser();
  }
  return browserInstance;
}

export async function closeBrowser() {
  if (browserInstance) {
    console.log('🛑 Closing browser instance...');
    await browserInstance.close();
    browserInstance = null;
  }
}
