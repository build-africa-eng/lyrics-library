/**
 * Remove trailing punctuation like colon, period, comma, semicolon, exclamation mark, and question mark.
 * Also trims extra whitespace just in case.
 * @param {string} url
 * @returns {string}
 */
export default function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  return url.replace(/[:.,;!?]+$/, '').trim();
}