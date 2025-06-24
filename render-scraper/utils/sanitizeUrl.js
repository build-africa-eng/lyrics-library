/**
 * Clean and sanitize a URL by removing:
 * - trailing punctuation (:.,;!?)
 * - query parameters
 * - hash fragments
 * - extra whitespace
 * @param {string} url
 * @returns {string}
 */
export default function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';

  try {
    const parsed = new URL(url.trim());
    // Reconstruct without search params or hash
    return parsed.origin + parsed.pathname.replace(/[:.,;!?]+$/, '');
  } catch {
    // If it's not a valid URL, fallback to manual clean
    return url
      .replace(/[?#].*$/, '')        // Remove query string or fragment
      .replace(/[:.,;!?]+$/, '')     // Remove trailing punctuation
      .trim();
  }
}