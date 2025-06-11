// /worker/src/utils/normalize.js
export function normalizeQuery(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')       // collapse multiple spaces
    .replace(/[^\w\s]/g, '')    // remove non-word characters
    .replace(/\s/g, '-')        // replace spaces with hyphens
    .replace(/-+/g, '-');       // collapse multiple hyphens
}
