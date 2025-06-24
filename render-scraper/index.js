// index.js

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import scrapeRouter from './routes/scrape.js';
import { initBrowser } from './scrapers/browserManager.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS Configuration ---
// In production, only allow requests from your frontend's domain.
// In development, allow all origins for easy testing.
const ALLOWED_ORIGINS = [
  'https://lyrics-worker.afrcanfuture.workers.dev' // Your production frontend
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};

// --- Middleware ---
app.use(cors(corsOptions));
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
      'POST /scrape (body: { url: "..." })': 'Scrape lyrics from a specific URL.'
    },
    status: 'running'
  });
});

// --- Global Error Handler ---
// This should be the last middleware
app.use((err, req, res, next) => {
  console.error(`❌ Global Error Handler Caught: ${err.stack}`);
  res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
});

// --- Server Initialization ---
// Initialize the browser first, then start the server.
initBrowser()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Scraper running at http://localhost:${PORT}`);
      console.log('✅ Browser instance is ready.');
    });
  })
  .catch(err => {
    console.error('💥 Failed to initialize browser! The application cannot start.', err);
    process.exit(1);
  });
