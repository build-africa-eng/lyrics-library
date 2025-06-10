import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

// Logger
app.use(morgan('dev'));

// 🔍 Scrape lyrics from search result
async function scrapeLyrics(query) {
  const searchQuery = encodeURIComponent(`${query} site:azlyrics.com OR site:genius.com`);
  const searchUrl = `https://www.google.com/search?q=${searchQuery}`;

  const { data: html } = await axios.get(searchUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36',
    },
  });

  const $ = cheerio.load(html);
  const links = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href?.includes('/url?q=')) {
      const cleanUrl = decodeURIComponent(href.split('/url?q=')[1].split('&')[0]);
      if (
        (cleanUrl.includes('azlyrics.com') || cleanUrl.includes('genius.com')) &&
        !cleanUrl.includes('google')
      ) {
        links.push(cleanUrl);
      }
    }
  });

  if (links.length === 0) throw new Error('No lyrics sources found.');

  // Fetch the first result
  const lyricsPage = await axios.get(links[0]);
  const $$ = cheerio.load(lyricsPage.data);

  if (links[0].includes('azlyrics.com')) {
    const lyrics = $$('.col-xs-12.col-lg-8.text-center > div:not([class])')
      .text()
      .trim();
    return { source: links[0], lyrics };
  } else if (links[0].includes('genius.com')) {
    const lyrics = $$('[data-lyrics-container]').text().trim();
    return { source: links[0], lyrics };
  }

  throw new Error('Unsupported lyrics site.');
}

// 🎯 /scrape endpoint
app.get('/scrape', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Missing ?query=' });
  }

  try {
    const result = await scrapeLyrics(query);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to scrape lyrics' });
  }
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// ❌ Fallback error handler
app.use((err, req, res, next) => {
  console.error(`Unhandled error in ${req.method} ${req.originalUrl}: ${err.stack || err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// 🔥 Start server
app.listen(PORT, () => {
  console.log(`✅ Scraper running on :${PORT}`);
});