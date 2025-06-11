import express from 'express';
import morgan from 'morgan';
import cors from 'cors'; // ✅ Import cors middleware
import scrapeRouter from './routes/scrape.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS for all routes (default allows any origin)
app.use(cors());

// Optional: if you want to restrict to specific origins:
// app.use(cors({ origin: 'https://lyrics-worker.afrcanfuture.workers.dev' }));

app.use(morgan('dev'));
app.use(express.json()); // ✅ Needed if you're parsing JSON POST bodies

// Modular route for /scrape
app.use('/scrape', scrapeRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Root welcome
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

// Global error handler
app.use((err, req, res, next) => {
  console.error(`Unhandled error in ${req.method} ${req.originalUrl}:`, err.stack || err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Scraper running on :${PORT}`);
});