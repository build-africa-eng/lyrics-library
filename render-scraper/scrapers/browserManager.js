// new file: browserManager.js
import puppeteer from 'puppeteer';

let browserInstance = null;

export async function initBrowser() {
  if (browserInstance) return browserInstance;

  console.log('🚀 Initializing new browser instance...');
  browserInstance = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  browserInstance.on('disconnected', () => {
    console.log('Browser disconnected. Clearing instance.');
    browserInstance = null;
  });

  return browserInstance;
}

export function getBrowser() {
  if (!browserInstance) {
    throw new Error('Browser not initialized. Call initBrowser() first.');
  }
  return browserInstance;
}