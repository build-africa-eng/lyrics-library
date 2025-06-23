import { createContext, useContext, useState, useCallback } from 'react';
import * as api from '@/utils/api';

const LyricsContext = createContext();

export function LyricsProvider({ children }) {
  const [lyricsList, setLyricsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchLyrics = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchLyrics(query);

      // If backend returns an array (all lyrics) or a found match
      if (Array.isArray(data.lyrics)) {
        setLyricsList(data.lyrics);
      } else if (data.found) {
        setLyricsList([data]);
      } else {
        // Not found: fallback to scrape
        const scrapeUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}+site:azlyrics.com`;
        const scraped = await api.scrapeLyrics(scrapeUrl);
        setLyricsList([scraped]);
      }
    } catch (err) {
      setError(err.message);
      setLyricsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLyrics = useCallback(async (newLyricData) => {
    setLoading(true);
    setError(null);
    try {
      const addedLyric = await api.addLyrics(newLyricData);
      setLyricsList((prevList) => [addedLyric, ...prevList]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    lyricsList,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    searchLyrics,
    addLyrics,
  };

  return (
    <LyricsContext.Provider value={value}>
      {children}
    </LyricsContext.Provider>
  );
}

export function useLyrics() {
  const context = useContext(LyricsContext);
  if (!context) {
    throw new Error('useLyrics must be used within a LyricsProvider');
  }
  return context;
}
