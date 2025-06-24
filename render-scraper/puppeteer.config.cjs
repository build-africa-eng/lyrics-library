// puppeteer.config.cjs
const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // This is crucial for Render and other ephemeral filesystems.
  // It ensures Puppeteer downloads the browser to a location within your project.
  cacheDirectory: join(process.cwd(), '.cache', 'puppeteer'),
};
