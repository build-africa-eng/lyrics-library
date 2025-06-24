// browserManager.js

import puppeteer from 'puppeteer-core';

// This will hold the single browser instance.
let browserInstance = null;

/**
 * Initializes and returns a singleton Puppeteer browser instance.
 */
export async function initBrowser() {
  // If an instance already exists, just return it.
  if (browserInstance) return browserInstance;

  console.log('🚀 Initializing a new shared browser instance...');
  try {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      // Arguments required for running in a Docker/Render environment
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Prevent memory issues
        '--single-process' // Might help in resource-constrained environments
      ],
    });

    // Handle disconnection gracefully
    browserInstance.on('disconnected', () => {
      console.warn('👋 Browser instance disconnected.');
      browserInstance = null;
    });

    return browserInstance;
  } catch (err) {
    console.error("Could not create a browser instance => : ", err);
    throw err; // Throw error to prevent server from starting
  }
}

/**
 * Returns the existing browser instance. Throws an error if it's not initialized.
 */
export function getBrowser() {
  if (!browserInstance) {
    throw new Error('Browser not initialized. Call initBrowser() before using.');
  }
  return browserInstance;
}
