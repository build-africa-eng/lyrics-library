// index.js
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import scrapeRouter from './routes/scrape.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Allow only Cloudflare Worker origin (production)
const ALLOWED_ORIGIN = 'https://lyrics-worker.afrcanfuture.workers.dev';

app.use(cors({ origin: ALLOWED_ORIGIN }));

app.use(morgan('dev'));
app.use(express.json());

app.use('/scrape', scrapeRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({
    message: '🎵 Welcome to the Lyrics Scraper API!',
    endpoints: {
      'GET /scrape?query=your+song+name': 'Scrape lyrics using search (auto-detect)',
      'GET /scrape?url=https://...&source=genius': 'Scrape from Genius (force)',
      'GET /scrape?url=https://...&source=azlyrics': 'Scrape from AZLyrics (force)',
      'GET /health': 'Health check endpoint'
    },
    status: 'running'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`❌ Error in ${req.method} ${req.originalUrl}:`, err.stack || err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper running at http://localhost:${PORT}`);
});
