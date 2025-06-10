// /worker/src/db.js
export function getDB(env) {
  return env.DB; // `DB` must match your binding in wrangler.toml
}
