// /worker/src/index.js
import { getLyrics } from "./routes/getlyrics";
import { addLyrics } from "./routes/addlyrics";
import { scrapeLyrics } from "./routes/scrapelyrics";
import { getDB } from "./db";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const db = getDB(env);

    if (req.method === "GET" && url.pathname === "/lyrics") return getLyrics(req, db);
    if (req.method === "POST" && url.pathname === "/lyrics") return addLyrics(req, db);
    if (req.method === "POST" && url.pathname === "/scrape") return scrapeLyrics(req, db);

    return new Response("Not found", { status: 404 });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('GET /health');
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error in ${req.method} ${req.originalUrl}: ${err.stack || err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Scraper running on :${PORT}`);
});
