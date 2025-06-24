// File: plugins/captchaSolver.js

import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import puppeteer from 'puppeteer-extra';

// Register CAPTCHA plugin before launching browser
export function useCaptchaSolver(apiKey) {
  const recaptcha = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: apiKey,
    },
    visualFeedback: true,
  });

  puppeteer.use(recaptcha);
}

// Usage:
// import { useCaptchaSolver } from './plugins/captchaSolver.js';
// useCaptchaSolver(process.env.TWOCAPTCHA_KEY);
