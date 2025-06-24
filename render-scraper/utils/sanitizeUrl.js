const ALLOWED_DOMAINS = ['genius.com', 'azlyrics.com', 'lyrics.com'];

/**
 * Clean and sanitize a lyrics-related URL.
 * - Converts mobile subdomains (e.g., m.genius.com → genius.com)
 * - Strips query params and fragments
 * - Removes trailing punctuation
 * - Normalizes path
 * - Enforces domain whitelist
 *
 * @param {string} input
 * @returns {string} cleaned URL or '' if invalid/unsupported
 */
export default function sanitizeUrl(input) {
  if (typeof input !== 'string') return '';

  try {
    let url = new URL(input.trim());

    // Normalize domain
    let hostname = url.hostname.toLowerCase().replace(/^www\.|^m\./, '');

    // Only allow known domains
    if (!ALLOWED_DOMAINS.includes(hostname)) {
      console.warn(`❌ Domain not allowed: ${hostname}`);
      return '';
    }

    // Normalize path: remove duplicate slashes and trailing punctuation
    let pathname = url.pathname
      .replace(/\/+/g, '/')                // dedupe slashes
      .replace(/[:.,;!?]+$/, '')           // strip trailing punctuation
      .trim();

    return `${url.protocol}//${hostname}${pathname}`;
  } catch (err) {
    console.warn(`⚠️ Failed to sanitize URL: ${input}`);
    return '';
  }
}