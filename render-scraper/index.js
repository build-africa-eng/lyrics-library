// index.js
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import scrapeRouter from './routes/scrape.js';
import { initBrowser, closeBrowser } from './scrapers/browserManager.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS Configuration ---
const ALLOWED_ORIGINS = [
  'https://lyrics-worker.afrcanfuture.workers.dev', // Your production frontend
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser requests

    if (process.env.NODE_ENV === 'development') {
      return callback(null, true); // Allow all in dev
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS Blocked request from: ${origin}`);
    return callback(
      new Error('CORS policy does not allow access from the specified origin.'),
      false
    );
  },
};

// --- Middleware ---
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// --- Routes ---
app.use('/scrape', scrapeRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({
    message: '🎵 Welcome to the Lyrics Scraper API!',
    endpoints: {
      'GET /scrape?query=song+name': 'Scrape lyrics using a search query.',
      'POST /scrape (body: { query: "..." })': 'Scrape lyrics using a search query.',
      'POST /scrape (body: { url: "..." })': 'Scrape lyrics from a specific URL.',
    },
    status: 'running',
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(`❌ Global Error Handler Caught:\n${err.stack}`);
  res.status(500).json({
    error: 'An internal server error occurred. Please try again later.',
  });
});

// --- Start Server After Browser is Ready ---
initBrowser()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Scraper running at http://localhost:${PORT}`);
      console.log('✅ Browser instance is ready.');
    });
  })
  .catch((err) => {
    console.error('💥 Failed to initialize browser! Exiting.', err);
    process.exit(1);
  });

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Closing browser...');
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Closing browser...');
  await closeBrowser();
  process.exit(0);
});