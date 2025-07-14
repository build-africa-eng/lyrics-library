// utils/allowedDomains.js

const ALLOWED_DOMAINS = [
  'genius.com',
  'www.genius.com',
  'azlyrics.com',
  'www.azlyrics.com',
  'lyrics.com',
  'www.lyrics.com',
  'musixmatch.com',
  'www.musixmatch.com',
  'metrolyrics.com',
  'www.metrolyrics.com'
];

/**
 * Checks if a URL belongs to an allowed lyrics domain
 * @param {string} url - Full URL to check
 * @returns {boolean}
 */
export function isAllowedDomain(url) {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.includes(hostname.toLowerCase());
  } catch {
    return false;
  }
}
