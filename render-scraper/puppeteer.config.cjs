// puppeteer.config.js
import { join } from 'path';

/**
 * @type {import("puppeteer").Configuration}
 */
export default {
  // This is crucial for Render and other ephemeral filesystems.
  // It ensures Puppeteer downloads the browser to a location within your project.
  cacheDirectory: join(process.cwd(), '.cache', 'puppeteer'),
};
