import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import scrapeRouter from './routes/scrape.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Only allow your Cloudflare Worker to access this backend
const allowedOrigin = 'https://lyrics-worker.afrcanfuture.workers.dev';

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no Origin) or your Worker domain
    if (!origin || origin === allowedOrigin) {
      return callback(null, true);
    }
    callback(new Error('CORS policy violation'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// ✅ Handle CORS errors gracefully
app.use((err, req, res, next) => {
  if (err.message === 'CORS policy violation') {
    return res.status(403).json({ error: 'Access denied: invalid origin' });
  }
  next(err);
});

// ✅ Logger and JSON parser
app.use(morgan('dev'));
app.use(express.json());

// ✅ Scraper endpoint
app.use('/scrape', scrapeRouter);

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// ✅ Root welcome
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

// ✅ Final fallback error handler
app.use((err, req, res, next) => {
  console.error(`Unhandled error in ${req.method} ${req.originalUrl}:`, err.stack || err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Scraper running on :${PORT}`);
});