import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import scrapeRouter from './routes/scrape.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Only allow requests from the Cloudflare Worker
app.use(cors({
  origin: 'https://lyrics-worker.afrcanfuture.workers.dev'
}));

app.use(morgan('dev'));
app.use(express.json());

app.use('/scrape', scrapeRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Lyrics Scraper API!',
    endpoints: [
      '/scrape?query=your+song+name',
      '/scrape?url=https://genius.com/...&source=genius',
      '/scrape?url=https://www.azlyrics.com/...&source=azlyrics',
      '/health'
    ],
    status: 'running'
  });
});

app.use((err, req, res, next) => {
  console.error(`Unhandled error in ${req.method} ${req.originalUrl}:`, err.stack || err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Scraper running on :${PORT}`);
});