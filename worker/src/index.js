import { router } from './routes/router.js';
import { getDB } from './db.js';

export default {
  async fetch(req, env, ctx) {
    const db = getDB(env);
    return router(req, db);
  }
};