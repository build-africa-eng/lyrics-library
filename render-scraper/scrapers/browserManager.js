import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import BlockResourcesPlugin from 'puppeteer-extra-plugin-block-resources';

puppeteer.use(StealthPlugin());

const blockResourcesPlugin = BlockResourcesPlugin({
  blockedTypes: new Set(['image', 'media', 'font', 'stylesheet', 'xhr']),
  blockedUrls: [
    '*.doubleclick.net',
    '*.googlesyndication.com',
    '*.google-analytics.com',
    '*.adnxs.com',
    '*.adsafeprotected.com',
    '*.captcha-delivery.com',
    '*://*.cloudflare.com/cdn-cgi/*'
  ],
});
puppeteer.use(blockResourcesPlugin);